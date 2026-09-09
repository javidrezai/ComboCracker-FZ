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


if __name__ == "__main__":
    unittest.main(verbosity=2)
