"""پل اتصال دو مغز — همگام‌سازی مغز سرور با والت ابسیدین (که در مکانی جدا زندگی می‌کند).

دو مغز در دو نقطهٔ جدا هستند ولی به هم متصل‌اند:
- قبل از هر اجرا: pull تا ویرایش‌های کاربر در Obsidian خوانده شود (کارایی بیشتر).
- بعد از هر اجرا: push تا لاگ/درس/داشبوردِ نوشته‌شده به والت برگردد.

اگر والت یک مخزن git نباشد یا شبکه نباشد، بی‌صدا به حالت فقط‌محلی برمی‌گردد
(هیچ‌وقت اجرای مغز را متوقف نمی‌کند).
"""
import subprocess
from pathlib import Path


class VaultBridge:
    def __init__(self, vault_path, remote=None, auto_sync=True, branch="main"):
        self.path = Path(vault_path).resolve()
        self.remote = remote
        self.auto_sync = str(auto_sync).lower() not in ("false", "0", "no", "off")
        self.branch = branch
        self.status = "local-only"

    def _git(self, *args, timeout=60):
        return subprocess.run(
            ["git", "-C", str(self.path), *args],
            capture_output=True, text=True, timeout=timeout,
        )

    def _is_git_repo(self):
        if not (self.path / ".git").exists():
            return False
        return self._git("rev-parse", "--is-inside-work-tree").returncode == 0

    def pull(self):
        """آخرین ویرایش‌های کاربر را از مکان والت می‌کشد."""
        if not (self.auto_sync and self._is_git_repo() and self.remote_configured()):
            return False
        try:
            r = self._git("pull", "--ff-only", "origin", self.branch)
            self.status = "synced" if r.returncode == 0 else "pull-conflict"
            return r.returncode == 0
        except Exception:
            self.status = "offline"
            return False

    def push(self, message="brain: update memory (logs/lessons/dashboard)"):
        """نوشته‌های مغز را به مکان والت برمی‌گرداند."""
        if not (self.auto_sync and self._is_git_repo() and self.remote_configured()):
            return False
        try:
            self._git("add", "-A")
            st = self._git("status", "--porcelain")
            if not st.stdout.strip():
                return True  # چیزی برای commit نیست
            c = self._git("commit", "-m", message)
            if c.returncode != 0:
                return False
            r = self._git("push", "origin", self.branch)
            self.status = "synced" if r.returncode == 0 else "push-failed"
            return r.returncode == 0
        except Exception:
            self.status = "offline"
            return False

    def remote_configured(self):
        """آیا remote تنظیم شده؟ (از تنظیمات یا از خود مخزن)."""
        if self.remote:
            return True
        try:
            r = self._git("remote", "get-url", "origin")
            return r.returncode == 0 and bool(r.stdout.strip())
        except Exception:
            return False

    def state(self):
        """وضعیت اتصال برای داشبورد."""
        if not self._is_git_repo():
            return "📁 محلی (والت مخزن git نیست)"
        if not self.remote_configured():
            return "📁 محلی (remote تنظیم نشده)"
        if not self.auto_sync:
            return "⏸ همگام‌سازی خاموش"
        return {"synced": "🔗 متصل و همگام", "offline": "🔌 آفلاین",
                "pull-conflict": "⚠️ تعارض در pull",
                "push-failed": "⚠️ push ناموفق"}.get(self.status, "🔗 آمادهٔ همگام‌سازی")
