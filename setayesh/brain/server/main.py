#!/usr/bin/env python3
"""نقطهٔ ورود مغز ستایش — CLI، وبهوک، و دستورهای کاربر.

اجرا:
  python main.py "سوال شما"        # یک پرسش
  python main.py                    # حالت تعاملی (REPL)
  python main.py --serve            # وبهوک HTTP روی پورت 8787
  python main.py --dashboard        # ساخت داشبورد
  python main.py --files            # لیست فایل‌های والت
  python main.py --transparency     # نمایش استدلال آخرین اجرا
"""
import os
import sys
import json
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer

from llm import OllamaClient
from memory import Vault
from loop import AgentLoop
from bridge import VaultBridge
import dashboard as dash

VAULT_PATH = os.environ.get(
    "SETAYESH_VAULT",
    str(Path(__file__).resolve().parents[2] / "vault"),
)


def make_brain():
    vault = Vault(VAULT_PATH)
    s = vault.read_settings()
    llm = OllamaClient(
        host=os.environ.get("OLLAMA_HOST", "http://localhost:11434"),
        model=s.get("model", "qwen2.5:7b"),
        temperature=float(s.get("temperature", 0.4)),
    )
    bridge = VaultBridge(
        VAULT_PATH,
        remote=os.environ.get("SETAYESH_VAULT_REMOTE", s.get("vault_remote")),
        auto_sync=s.get("auto_sync", "true"),
    )
    loop = AgentLoop(llm, vault, max_steps=int(s.get("max_steps", 6)), bridge=bridge)
    return vault, llm, loop, bridge


def cmd_dashboard(vault, llm, bridge=None):
    dash.build(vault, llm, vault.read_settings(), bridge)
    print("✅ داشبورد به‌روزرسانی شد: vault/dashboard/DASHBOARD.md")


def cmd_files(vault):
    for f in vault.list_files():
        print(f)


def cmd_transparency(vault):
    logs = sorted(vault.logs.glob("*.md"))
    if not logs:
        print("هنوز لاگی ثبت نشده.")
        return
    print(logs[-1].read_text(encoding="utf-8"))


def ask(loop, vault, llm, text, bridge=None):
    res = loop.run(text)
    print("\n" + "=" * 50)
    print("🧠 پاسخ ستایش:\n" + res["answer"])
    if res["lessons"]:
        print("\n📚 درس‌های تازه: " + " | ".join(res["lessons"]))
    print(f"\n(اجرا {res['session_id']} · مدل {res['model']} · شفافیت: --transparency)")
    dash.build(vault, llm, vault.read_settings(), bridge)
    return res


class Handler(BaseHTTPRequestHandler):
    brain = None  # (vault, llm, loop, bridge)

    def _send(self, code, obj):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(obj, ensure_ascii=False).encode("utf-8"))

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        try:
            data = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            return self._send(400, {"error": "JSON نامعتبر"})
        text = data.get("input", "").strip()
        if not text:
            return self._send(400, {"error": "فیلد input لازم است"})
        vault, llm, loop, bridge = self.brain
        res = loop.run(text)
        dash.build(vault, llm, vault.read_settings(), bridge)
        self._send(200, {"answer": res["answer"], "session_id": res["session_id"],
                         "lessons": res["lessons"]})

    def log_message(self, *a):
        pass


def serve(brain, port=8787):
    Handler.brain = brain
    print(f"🌐 وبهوک مغز روی http://localhost:{port}  (POST با {{\"input\": \"...\"}})")
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()


def main():
    args = sys.argv[1:]
    vault, llm, loop, bridge = make_brain()

    if args and args[0] == "--serve":
        return serve((vault, llm, loop, bridge))
    if args and args[0] == "--dashboard":
        return cmd_dashboard(vault, llm, bridge)
    if args and args[0] == "--files":
        return cmd_files(vault)
    if args and args[0] == "--transparency":
        return cmd_transparency(vault)
    if args and args[0] == "--model":
        print("برای تغییر مدل، فایل vault/config/brain-settings.md را ویرایش کنید (خط model:).")
        return
    if args and args[0] in ("--help", "-h"):
        print(__doc__)
        return

    if not llm.is_available():
        print("⚠️  Ollama در دسترس نیست. مغز اجرا می‌شود ولی پاسخ مدل نمی‌آید.")
        print("    راه‌اندازی: `ollama serve` و `ollama pull qwen2.5:7b`")

    if args:
        return ask(loop, vault, llm, " ".join(args), bridge) and None

    # حالت تعاملی
    print("🧠 مغز ستایش — حالت تعاملی (برای خروج: exit)")
    while True:
        try:
            text = input("\nشما ▸ ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nخداحافظ 👋")
            break
        if text.lower() in ("exit", "quit", "خروج"):
            break
        if not text:
            continue
        if text.startswith("--"):
            cmd = text.split()[0]
            {"--dashboard": lambda: cmd_dashboard(vault, llm, bridge),
             "--files": lambda: cmd_files(vault),
             "--transparency": lambda: cmd_transparency(vault)}.get(
                cmd, lambda: print("دستور ناشناخته."))()
            continue
        ask(loop, vault, llm, text, bridge)


if __name__ == "__main__":
    main()
