#!/usr/bin/env python3
"""نقطهٔ ورود مغز ستایش — CLI، وبهوک، و دستورهای کاربر.

اجرا:
  python main.py "سوال شما"        # یک پرسش
  python main.py                    # حالت تعاملی (REPL)
  python main.py --serve            # وبهوک HTTP روی پورت 8787
  python main.py --dashboard        # ساخت داشبورد
  python main.py --files            # لیست فایل‌های والت
  python main.py --transparency     # نمایش استدلال آخرین اجرا
  python main.py --doctor           # بررسی سلامت اتصال‌ها (اولاما/والت)
  python main.py --daemon           # فقط زمان‌بند پس‌زمینه (بدون وبهوک)
  python main.py --update           # به‌روزرسانی خودکار ستایش به آخرین نسخه
  python main.py --version          # نمایش نسخه
"""
import os
import sys
import json
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer

from llm import OllamaClient
from local_llm import LocalFallbackLLM
from memory import Vault
from loop import AgentLoop
from bridge import VaultBridge
from ollama_setup import ensure_ollama, connection_summary
from scheduler import BrainScheduler
import dashboard as dash

VAULT_PATH = os.environ.get(
    "SETAYESH_VAULT",
    str(Path(__file__).resolve().parents[2] / "vault"),
)


def version():
    f = Path(__file__).resolve().parents[2] / "VERSION"
    try:
        return f.read_text(encoding="utf-8").strip()
    except Exception:
        return "0.0.0"


def make_brain():
    vault = Vault(VAULT_PATH)
    s = vault.read_settings()
    llm = OllamaClient(
        host=os.environ.get("OLLAMA_HOST", s.get("ollama_host", "http://localhost:11434")),
        model=s.get("model", "qwen2.5:7b"),
        temperature=float(s.get("temperature", 0.4)),
    )
    bridge = VaultBridge(
        VAULT_PATH,
        remote=os.environ.get("SETAYESH_VAULT_REMOTE", s.get("vault_remote")),
        auto_sync=s.get("auto_sync", "true"),
    )
    # بازیابی برداری (اگر Ollama + مدل embedding در دسترس باشد)
    vault.embedder = llm
    vault.retrieval_mode = s.get("retrieval", "auto")
    vault.emb_model = s.get("embeddings_model", "nomic-embed-text")
    fallback = LocalFallbackLLM()
    loop = AgentLoop(llm, vault, max_steps=int(s.get("max_steps", 6)), bridge=bridge, fallback=fallback)
    return vault, llm, loop, bridge


def auto_connect(vault, llm, quiet=False):
    """اتصال خودکار اولاما به ستایش بر اساس تنظیمات والت."""
    s = vault.read_settings()
    return ensure_ollama(
        llm,
        model=s.get("model", llm.model),
        auto_start=str(s.get("auto_start_ollama", "true")).lower() not in ("false", "0", "no"),
        auto_pull=str(s.get("auto_pull_model", "true")).lower() not in ("false", "0", "no"),
        quiet=quiet,
    )


def cmd_doctor(vault, llm, bridge):
    """بررسی سلامت کامل اتصال‌ها."""
    print(f"🩺 بررسی سلامت مغز ستایش — نسخهٔ {version()}\n" + "=" * 40)
    st = auto_connect(vault, llm)
    print(f"اولاما: {connection_summary(st)}")
    print(f"میزبان اولاما: {llm.host}")
    print(f"مدل: {vault.read_settings().get('model', llm.model)}")
    print(f"مدل‌های نصب‌شده: {', '.join(llm.list_models()) or '(هیچ)'}")
    print(f"والت: {vault.root}")
    print(f"اتصال والت: {bridge.state() if bridge else '—'}")
    print(f"فایل‌های والت: {len(vault.list_files())}")


def cmd_dashboard(vault, llm, bridge=None):
    dash.build(vault, llm, vault.read_settings(), bridge)
    print("✅ داشبورد به‌روزرسانی شد: vault/dashboard/DASHBOARD.md")


def cmd_files(vault):
    for f in vault.list_files():
        print(f)


def cmd_transparency(vault):
    # جدیدترین فایل لاگِ اجرا (README راهنما را نادیده بگیر)
    logs = [p for p in vault.logs.glob("*.md") if p.name != "README.md"]
    if not logs:
        print("هنوز لاگی ثبت نشده.")
        return
    latest = max(logs, key=lambda p: p.stat().st_mtime)
    print(latest.read_text(encoding="utf-8"))


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

    def do_GET(self):
        vault, llm, loop, bridge = self.brain
        dash.build(vault, llm, vault.read_settings(), bridge)
        md = (vault.dashboard / "DASHBOARD.md").read_text(encoding="utf-8")
        svg = dash.graph_svg(vault.knowledge_graph())
        html = ("<!doctype html><html lang=fa dir=rtl><meta charset=utf-8>"
                "<meta http-equiv=refresh content=10>"
                "<title>داشبورد مغز ستایش</title>"
                "<style>body{font-family:system-ui,Tahoma;max-width:760px;margin:2rem auto;"
                "padding:0 1rem;background:#0f1420;color:#e6e9ef;line-height:1.8}"
                "code{background:#1c2333;padding:2px 6px;border-radius:4px}"
                "table{border-collapse:collapse;width:100%}td,th{border:1px solid #2a3550;padding:6px}"
                "a{color:#6ea8fe}h2{color:#e8b64a}"
                ".graph{background:#0c111d;border:1px solid #26324c;border-radius:12px;padding:10px;margin:0 0 16px;text-align:center}"
                "</style>"
                "<h2>گراف دانش</h2><div class=graph>" + svg + "</div>"
                "<pre style='white-space:pre-wrap'>" +
                md.replace("&", "&amp;").replace("<", "&lt;") + "</pre></html>")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))

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
    print(f"🌐 وبهوک مغز روی http://localhost:{port}  (POST با {{\"input\": \"...\"}} · داشبورد وب: GET /)")
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()


def main():
    args = sys.argv[1:]
    vault, llm, loop, bridge = make_brain()

    if args and args[0] == "--serve":
        auto_connect(vault, llm)
        BrainScheduler(vault, llm, bridge).start()
        return serve((vault, llm, loop, bridge))
    if args and args[0] == "--dashboard":
        return cmd_dashboard(vault, llm, bridge)
    if args and args[0] == "--files":
        return cmd_files(vault)
    if args and args[0] == "--transparency":
        return cmd_transparency(vault)
    if args and args[0] == "--doctor":
        return cmd_doctor(vault, llm, bridge)
    if args and args[0] == "--daemon":
        auto_connect(vault, llm)
        BrainScheduler(vault, llm, bridge).start()
        print("🧠 مغز در حالت پس‌زمینه (daemon) — Ctrl+C برای خروج")
        try:
            while True:
                __import__("time").sleep(3600)
        except KeyboardInterrupt:
            print("\nخداحافظ 👋")
        return
    if args and args[0] == "--model":
        if len(args) < 2:
            print(f"مدل فعلی: {vault.read_settings().get('model', llm.model)}")
            print("استفاده: python main.py --model qwen2.5:7b")
        else:
            vault.set_setting("model", args[1])
            print(f"✅ مدل به «{args[1]}» تغییر کرد (در vault/config/brain-settings.md).")
        return
    if args and args[0] in ("--version", "-v"):
        print(f"ستایش نسخهٔ {version()}")
        return
    if args and args[0] == "--update":
        from updater import self_update
        root = Path(__file__).resolve().parents[2]
        print(f"🔄 به‌روزرسانی ستایش (نسخهٔ فعلی {version()})...")
        r = self_update(root)
        print(("✅ " if r["ok"] else "⚠️  ") + r["message"])
        if r.get("changed"):
            print("برای اعمال کامل، اجرای دوباره کافی است.")
        return
    if args and args[0] in ("--help", "-h"):
        print(__doc__)
        return

    # اتصال خودکار اولاما به ستایش (بدون دخالت دستی)
    auto_connect(vault, llm)

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
