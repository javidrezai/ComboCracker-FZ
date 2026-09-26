"""زمان‌بندِ داخلی مغز ستایش — کارهای دوره‌ای را خودکار انجام می‌دهد.

سه کار پس‌زمینه (هر کدام مستقل و مقاوم به خطا):
  ۱. سلامت اولاما: اتصال را دوره‌ای بررسی و در صورت افت، دوباره برقرار می‌کند.
  ۲. همگام‌سازی والت: pull/push دوره‌ای (اتصال دو مغز).
  ۳. داشبورد: بازسازی دوره‌ای داشبورد زنده.

بازه‌ها از تنظیمات والت خوانده می‌شوند (بدون ری‌استارت قابل تغییر). یک خطا در یک
کار هرگز کار دیگر یا کل مغز را متوقف نمی‌کند.
"""
import time
import threading

import dashboard as dash
from ollama_setup import ensure_ollama


class BrainScheduler:
    def __init__(self, vault, llm, bridge, on_log=None):
        self.vault = vault
        self.llm = llm
        self.bridge = bridge
        self.on_log = on_log or (lambda m: print(m, flush=True))
        self._stop = threading.Event()
        self._threads = []
        self.last = {"health": 0, "sync": 0, "dashboard": 0}

    def _interval(self, key, default):
        try:
            return max(15, int(self.vault.read_settings().get(key, default)))
        except Exception:
            return default

    def _loop(self, name, interval_key, default, fn):
        while not self._stop.is_set():
            interval = self._interval(interval_key, default)
            # خواب تکه‌تکه تا توقفِ سریع ممکن باشد
            for _ in range(interval):
                if self._stop.wait(1):
                    return
            try:
                fn()
                self.last[name] = time.time()
            except Exception as e:
                self.on_log(f"⚠️  زمان‌بند [{name}] خطا: {e}")

    # --- کارها ---
    def _task_health(self):
        s = self.vault.read_settings()
        if not self.llm.is_available():
            self.on_log("▸ زمان‌بند: اتصال اولاما افتاده — تلاش برای برقراری دوباره...")
            ensure_ollama(self.llm, model=s.get("model", self.llm.model),
                          auto_start=str(s.get("auto_start_ollama", "true")).lower() not in ("false", "0", "no"),
                          auto_pull=False, quiet=True)

    def _task_sync(self):
        if self.bridge:
            self.bridge.pull()
            self.bridge.push("brain: scheduled sync")

    def _task_dashboard(self):
        dash.build(self.vault, self.llm, self.vault.read_settings(), self.bridge)

    def start(self):
        enabled = str(self.vault.read_settings().get("scheduler", "true")).lower() not in ("false", "0", "no")
        if not enabled:
            self.on_log("▸ زمان‌بند خاموش است (scheduler: false).")
            return self
        specs = [
            ("health", "health_interval", 300, self._task_health),
            ("sync", "sync_interval", 120, self._task_sync),
            ("dashboard", "dashboard_interval", 60, self._task_dashboard),
        ]
        for name, key, default, fn in specs:
            t = threading.Thread(target=self._loop, args=(name, key, default, fn),
                                 name=f"setayesh-{name}", daemon=True)
            t.start()
            self._threads.append(t)
        self.on_log(f"⏱  زمان‌بند داخلی فعال شد ({len(specs)} کار پس‌زمینه).")
        return self

    def stop(self):
        self._stop.set()
        for t in self._threads:
            t.join(timeout=2)
