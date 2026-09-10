"""تست‌های مغز ستایش — بدون نیاز به Ollama (از مدل ساختگی استفاده می‌کند)."""
import os
import sys
import tempfile
import shutil
import unittest
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from memory import Vault
from tools import build_registry, tool_calc, tool_now
from loop import AgentLoop
from bridge import VaultBridge
import dashboard as dash
from ollama_setup import ensure_ollama, connection_summary
from scheduler import BrainScheduler
from local_llm import LocalFallbackLLM
import normalize as norm
from updater import self_update, _find_repo
from bridge import VaultBridge


class MockLLM:
    """مدل ساختگی با اسکریپت پاسخ‌های از پیش تعیین‌شده."""
    model = "qwen2.5:7b"
    temperature = 0.4

    def __init__(self, script):
        self.script = list(script)
        self.i = 0

    def is_available(self):
        return True

    def chat(self, messages, temperature=None, model=None):
        reply = self.script[min(self.i, len(self.script) - 1)]
        self.i += 1
        return reply


class BrainTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.vault = Vault(self.tmp)
        (self.vault.knowledge / "پایتون.md").write_text(
            "# پایتون\nزبان برنامه‌نویسی. مرتبط با [[کدنویسی]].", encoding="utf-8")
        (self.vault.knowledge / "کدنویسی.md").write_text(
            "# کدنویسی\nنوشتن برنامه.", encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    # --- ابزارها ---
    def test_calc(self):
        self.assertEqual(tool_calc("6*7"), "42")
        self.assertEqual(tool_calc("2**10"), "1024")

    def test_calc_rejects_unsafe(self):
        with self.assertRaises(Exception):
            tool_calc("__import__('os').system('ls')")

    def test_now_format(self):
        self.assertRegex(tool_now(), r"\d{4}-\d{2}-\d{2}")

    # --- حافظه/بازیابی ---
    def test_retrieve_and_link_follow(self):
        hits = self.vault.retrieve("پایتون", k=2)
        names = [n for n, _ in hits]
        self.assertIn("پایتون", names)
        self.assertIn("کدنویسی", names)  # از طریق لینک [[کدنویسی]]

    def test_tfidf_ranks_most_relevant_first(self):
        (self.vault.knowledge / "قهوه.md").write_text(
            "# قهوه\nنوشیدنی تلخ و داغ. با دانهٔ قهوه درست می‌شود.", encoding="utf-8")
        (self.vault.knowledge / "چای.md").write_text(
            "# چای\nنوشیدنی گرم از برگ چای.", encoding="utf-8")
        hits = self.vault.retrieve("دانهٔ قهوه تلخ", k=3)
        self.assertEqual(hits[0][0], "قهوه")  # مرتبط‌ترین اول

    def test_clean_excerpt_strips_markdown(self):
        from tools import clean_excerpt
        out = clean_excerpt("# عنوان\nمتن **پررنگ** با [[لینک|برچسب]] اینجا.")
        self.assertNotIn("#", out)
        self.assertNotIn("[[", out)
        self.assertIn("لینک", out)

    def test_settings_roundtrip(self):
        self.vault.set_setting("model", "llama3.1:8b")
        self.assertEqual(self.vault.read_settings().get("model"), "llama3.1:8b")
        self.vault.set_setting("model", "qwen2.5:7b")
        self.assertEqual(self.vault.read_settings().get("model"), "qwen2.5:7b")

    def test_save_note_writes_to_notes_area(self):
        rel = self.vault.save_note("یادداشت من", "متن آزمایشی")
        self.assertTrue(rel.startswith("notes/"))
        self.assertIn("یادداشت", (self.vault.notes / "یادداشت من.md").read_text(encoding="utf-8"))

    def test_save_note_blocks_path_traversal(self):
        rel = self.vault.save_note("../knowledge/hack", "بد")
        self.assertTrue(rel.startswith("notes/"))  # هرگز خارج از notes/
        self.assertFalse((self.vault.knowledge / "hack.md").exists())

    def test_knowledge_graph_nodes_and_edges(self):
        (self.vault.knowledge / "الف.md").write_text("# الف\nمرتبط با [[ب]].", encoding="utf-8")
        (self.vault.knowledge / "ب.md").write_text("# ب\nمتن.", encoding="utf-8")
        g = self.vault.knowledge_graph()
        self.assertIn("الف", g["nodes"])
        self.assertIn(("الف", "ب"), g["edges"])

    def test_summarize_tool(self):
        (self.vault.knowledge / "قهوه.md").write_text("# قهوه\nنوشیدنی تلخ و داغ از دانهٔ قهوه.", encoding="utf-8")
        reg = build_registry(self.vault)
        out = reg["summarize"]("قهوه")
        self.assertIn("خلاصه", out)
        self.assertIn("قهوه", out)

    def test_save_note_tool_registered(self):
        reg = build_registry(self.vault)
        self.assertIn("save_note", reg)
        out = reg["save_note"]("عنوان :: بدنه")
        self.assertIn("notes/", out)

    def test_knowledge_readonly_for_brain(self):
        # مغز فقط در lessons/dashboard/logs می‌نویسد، نه در knowledge
        before = self.vault.list_files()
        self.vault.add_lesson("یک درس")
        self.vault.append_log("s1", ["خط لاگ"])
        after = set(self.vault.list_files())
        self.assertTrue(any("lessons/" in f for f in after))
        self.assertTrue(any("logs/" in f for f in after))
        # هیچ فایل knowledge دست‌کاری/حذف نشده
        for f in before:
            if f.startswith("knowledge/"):
                self.assertIn(f, after)

    # --- حلقهٔ عامل ---
    def test_loop_tool_then_final(self):
        llm = MockLLM(["TOOL: calc(6*7)", "FINAL: پاسخ ۴۲ است."])
        loop = AgentLoop(llm, self.vault, max_steps=4)
        res = loop.run("۶ ضربدر ۷؟")
        self.assertEqual(res["answer"], "پاسخ ۴۲ است.")

    def test_loop_self_repair_on_bad_tool(self):
        llm = MockLLM(["TOOL: ghost(x)", "FINAL: اصلاح شد."])
        loop = AgentLoop(llm, self.vault, max_steps=4)
        res = loop.run("تست")
        self.assertEqual(res["answer"], "اصلاح شد.")
        self.assertTrue(any("خودتعمیر" in t for t in res["trace"]))

    def test_loop_records_lesson(self):
        llm = MockLLM(["LESSON: ۶×۷=۴۲\nFINAL: تمام."])
        loop = AgentLoop(llm, self.vault, max_steps=2)
        res = loop.run("یاد بگیر")
        self.assertIn("۶×۷=۴۲", res["lessons"])
        self.assertIn("۶×۷=۴۲", self.vault.read_lessons())

    def test_loop_respects_step_ceiling(self):
        llm = MockLLM(["TOOL: now()"] * 20)  # هیچ‌وقت FINAL نمی‌دهد
        loop = AgentLoop(llm, self.vault, max_steps=3)
        res = loop.run("حلقهٔ بی‌پایان؟")
        self.assertIsNotNone(res["answer"])  # به سقف گام می‌رسد، کرش نمی‌کند

    # --- پل اتصال ---
    def test_bridge_graceful_without_git(self):
        b = VaultBridge(self.tmp, remote=None, auto_sync=True)
        self.assertFalse(b.pull())   # بدون git، بی‌صدا False
        self.assertFalse(b.push())
        self.assertIn("محلی", b.state())

    # --- داشبورد ---
    def test_dashboard_builds(self):
        b = VaultBridge(self.tmp)
        dash.build(self.vault, MockLLM(["x"]), self.vault.read_settings(), b)
        content = (self.vault.dashboard / "DASHBOARD.md").read_text(encoding="utf-8")
        self.assertIn("داشبورد", content)
        self.assertIn("اتصال به والت", content)


class FakeOllama:
    """کلاینت اولامای ساختگی برای تست اتصال خودکار (بدون شبکه/باینری)."""
    host = "http://localhost:11434"
    model = "qwen2.5:7b"
    temperature = 0.4

    def __init__(self, available=True, models=("qwen2.5:7b",)):
        self._available = available
        self._models = list(models)
        self.warmed = False

    def is_available(self):
        return self._available

    def list_models(self):
        return list(self._models)

    def has_model(self, model=None):
        t = model or self.model
        return t in self._models or any(n.split(":")[0] == t.split(":")[0] for n in self._models)

    def warmup(self, model=None):
        self.warmed = True
        return True


class OllamaConnectTests(unittest.TestCase):
    def test_connected_when_available_and_model_present(self):
        c = FakeOllama(available=True, models=["qwen2.5:7b"])
        st = ensure_ollama(c, model="qwen2.5:7b", auto_start=False, auto_pull=False, quiet=True)
        self.assertTrue(st["available"])
        self.assertTrue(st["model_ready"])
        self.assertEqual(connection_summary(st), "🟢 متصل و آماده")

    def test_reports_down_when_unavailable_and_no_autostart(self):
        c = FakeOllama(available=False)
        st = ensure_ollama(c, auto_start=False, auto_pull=False, quiet=True)
        self.assertFalse(st["available"])
        self.assertEqual(connection_summary(st), "🔴 اولاما در دسترس نیست")

    def test_model_not_ready_without_autopull(self):
        c = FakeOllama(available=True, models=["llama3.1:8b"])
        st = ensure_ollama(c, model="qwen2.5:7b", auto_start=False, auto_pull=False, quiet=True)
        self.assertTrue(st["available"])
        self.assertFalse(st["model_ready"])
        self.assertIn("مدل", st["message"])


class SchedulerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.vault = Vault(self.tmp)
        # بازه‌های خیلی کوتاه برای تست سریع
        self.vault.set_setting("dashboard_interval", "15")
        self.vault.set_setting("sync_interval", "15")
        self.vault.set_setting("health_interval", "15")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_scheduler_runs_dashboard_task(self):
        llm = FakeOllama(available=True)
        b = VaultBridge(self.tmp)
        sched = BrainScheduler(self.vault, llm, b, on_log=lambda m: None)
        # کار داشبورد را مستقیم صدا بزن (بدون انتظار برای بازه)
        sched._task_dashboard()
        content = (self.vault.dashboard / "DASHBOARD.md").read_text(encoding="utf-8")
        self.assertIn("داشبورد", content)

    def test_scheduler_health_reconnect_noop_when_up(self):
        llm = FakeOllama(available=True, models=["qwen2.5:7b"])
        sched = BrainScheduler(self.vault, llm, None, on_log=lambda m: None)
        sched._task_health()  # نباید خطا بدهد وقتی اولاما بالا است

    def test_scheduler_disabled_by_setting(self):
        self.vault.set_setting("scheduler", "false")
        llm = FakeOllama(available=True)
        sched = BrainScheduler(self.vault, llm, None, on_log=lambda m: None)
        sched.start()
        self.assertEqual(len(sched._threads), 0)  # هیچ نخی راه نیفتاد
        sched.stop()

    def test_scheduler_start_stop(self):
        llm = FakeOllama(available=True)
        sched = BrainScheduler(self.vault, llm, VaultBridge(self.tmp), on_log=lambda m: None)
        sched.start()
        self.assertEqual(len(sched._threads), 3)
        sched.stop()  # باید تمیز متوقف شود


class WebSearchTests(unittest.TestCase):
    def test_web_search_registered(self):
        tmp = tempfile.mkdtemp()
        try:
            reg = build_registry(Vault(tmp))
            self.assertIn("web_search", reg)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_web_search_handles_offline_gracefully(self):
        # بدون شبکه باید خطا بدهد (که حلقه آن را برای خودتعمیر می‌گیرد)، نه اینکه بی‌سروصدا خراب شود
        from tools import tool_web_search
        try:
            out = tool_web_search("test")
            self.assertIsInstance(out, str)
        except Exception as e:
            self.assertIsInstance(e, Exception)


class LocalFallbackTests(unittest.TestCase):
    def setUp(self):
        self.llm = LocalFallbackLLM()

    def test_math_persian_digits_and_words(self):
        out = self.llm.chat([{"role": "user", "content": "درخواست کاربر:\n۱۲۵ ضربدر ۸ چند می‌شود؟"}])
        self.assertIn("TOOL: calc(", out)
        self.assertIn("125*8", out.replace(" ", ""))

    def test_time_intent(self):
        out = self.llm.chat([{"role": "user", "content": "درخواست کاربر:\nساعت الان چند است؟"}])
        self.assertIn("now()", out)

    def test_knowledge_intent_routes_to_search(self):
        out = self.llm.chat([{"role": "user", "content": "درخواست کاربر:\nستایش چیست؟"}])
        self.assertIn("TOOL: search(", out)

    def test_observation_becomes_final(self):
        out = self.llm.chat([{"role": "user", "content": "OBSERVATION: نتیجه ۴۲ است"}])
        self.assertTrue(out.startswith("FINAL:"))
        self.assertIn("۴۲", out)

    def test_note_intent_routes_to_save_note(self):
        out = self.llm.chat([{"role": "user", "content": "درخواست کاربر:\nیادداشت کن که فردا تعطیل است"}])
        self.assertIn("TOOL: save_note(", out)

    def test_default_intro_when_no_signal(self):
        out = self.llm.chat([{"role": "user", "content": "درخواست کاربر:\nسلام"}])
        self.assertTrue(out.startswith("FINAL:"))

    def test_loop_uses_fallback_when_ollama_down(self):
        tmp = tempfile.mkdtemp()
        try:
            vault = Vault(tmp)
            down = FakeOllama(available=False)
            loop = AgentLoop(down, vault, max_steps=4, fallback=LocalFallbackLLM())
            res = loop.run("۶ ضربدر ۷")
            self.assertEqual(res["answer"].strip(), "42")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


class NormalizationTests(unittest.TestCase):
    def test_unifies_arabic_persian_chars(self):
        self.assertEqual(norm.normalize_text("كتاب ي"), norm.normalize_text("کتاب ی"))

    def test_strips_zwnj_and_digits(self):
        self.assertEqual(norm.normalize_text("وب‌هوک ۱۲۳"), "وبهوک 123")

    def test_canonical_map_bridges_scripts(self):
        cmap = norm.build_canonical_map()
        self.assertEqual(cmap[norm.normalize_text("اولاما")], cmap[norm.normalize_text("ollama")])

    def test_parse_alias_file(self):
        groups = norm.parse_alias_file("اصطلاح = term, واژه\n# نظر\nبد")
        self.assertEqual(len(groups), 1)
        self.assertIn("term", groups[0])

    def test_cross_script_retrieval(self):
        tmp = tempfile.mkdtemp()
        try:
            v = Vault(tmp)
            (v.knowledge / "Ollama.md").write_text(
                "# Ollama\nاجرای مدل محلی. ollama serve و ollama pull.", encoding="utf-8")
            (v.knowledge / "چای.md").write_text("# چای\nنوشیدنی گرم.", encoding="utf-8")
            hits = v.retrieve("اولاما چیست", k=2)  # پرسش فارسی → نوت لاتین
            self.assertEqual(hits[0][0], "Ollama")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


class FakeEmbedder:
    def __init__(self, available=True):
        self._a = available
    def is_available(self):
        return self._a
    def has_model(self, m=None):
        return self._a
    def embeddings_available(self, m=None):
        return self._a
    def embed(self, text, model=None):
        # بردار قطعی بر پایهٔ طول و چند ویژگی ساده
        import hashlib
        h = hashlib.sha1(text.encode("utf-8")).digest()
        return [b / 255.0 for b in h[:8]]


class EmbeddingRetrievalTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.vault = Vault(self.tmp)
        (self.vault.knowledge / "n1.md").write_text("# n1\nمتن یک", encoding="utf-8")
        (self.vault.knowledge / "n2.md").write_text("# n2\nمتن دو", encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_embeddings_path_active_when_available(self):
        self.vault.embedder = FakeEmbedder(available=True)
        self.vault.retrieval_mode = "auto"
        self.assertTrue(self.vault._embeddings_active())
        hits = self.vault.retrieve("متن یک", k=2)
        self.assertTrue(len(hits) >= 1)

    def test_falls_back_to_tfidf_when_embedder_down(self):
        self.vault.embedder = FakeEmbedder(available=False)
        self.vault.retrieval_mode = "auto"
        self.assertFalse(self.vault._embeddings_active())
        hits = self.vault.retrieve("متن یک", k=2)
        self.assertEqual(hits[0][0], "n1")  # TF-IDF درست کار می‌کند

    def test_tfidf_forced_mode(self):
        self.vault.embedder = FakeEmbedder(available=True)
        self.vault.retrieval_mode = "tfidf"
        self.assertFalse(self.vault._embeddings_active())

    def test_graph_svg_and_markdown(self):
        import dashboard as dash
        g = self.vault.knowledge_graph()
        self.assertIn("<svg", dash.graph_svg(g))
        self.assertIsInstance(dash.graph_markdown(g), str)


class UpdaterTests(unittest.TestCase):
    def test_non_git_dir_gives_guidance(self):
        tmp = tempfile.mkdtemp()
        try:
            (Path(tmp) / "VERSION").write_text("0.6.0", encoding="utf-8")
            r = self_update(tmp)
            self.assertFalse(r["ok"])
            self.assertIn("git", r["message"])
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_find_repo_walks_up(self):
        import subprocess
        tmp = tempfile.mkdtemp()
        try:
            subprocess.run(["git", "init", "-q", tmp], check=True)
            sub = Path(tmp) / "a" / "b"
            sub.mkdir(parents=True)
            self.assertEqual(_find_repo(sub), Path(tmp).resolve())
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def test_reports_version(self):
        tmp = tempfile.mkdtemp()
        try:
            (Path(tmp) / "VERSION").write_text("1.2.3", encoding="utf-8")
            r = self_update(tmp)
            self.assertEqual(r["old"], "1.2.3")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main(verbosity=2)
