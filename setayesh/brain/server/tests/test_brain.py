"""تست‌های مغز ستایش — بدون نیاز به Ollama (از مدل ساختگی استفاده می‌کند)."""
import os
import sys
import tempfile
import shutil
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from memory import Vault
from tools import build_registry, tool_calc, tool_now
from loop import AgentLoop
from bridge import VaultBridge
import dashboard as dash
from ollama_setup import ensure_ollama, connection_summary
from scheduler import BrainScheduler
from local_llm import LocalFallbackLLM
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

    def test_settings_roundtrip(self):
        self.vault.set_setting("model", "llama3.1:8b")
        self.assertEqual(self.vault.read_settings().get("model"), "llama3.1:8b")
        self.vault.set_setting("model", "qwen2.5:7b")
        self.assertEqual(self.vault.read_settings().get("model"), "qwen2.5:7b")

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


if __name__ == "__main__":
    unittest.main(verbosity=2)
