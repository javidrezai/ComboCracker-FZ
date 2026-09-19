"""خوددانلودِ کتابخانه‌ها — مغز خودش تشخیص می‌دهد چه لازم دارد.

هر وقت کدِ مغز به کتابخانه‌ای نیاز داشته باشد که نصب نیست، همین‌جا خودکار آن را
**فقط در پوشهٔ مخصوص خودش** (setayesh/pybrain/libs) دانلود می‌کند و ادامه می‌دهد.
هیچ‌جای دیگر سیستم دست نمی‌خورد. برای خاموش‌کردن: SETAYESH_AUTO_LIBS=0.

دو راه:
  - ensure("requests")            → مطمئن شو کتابخانه هست (و اگر نه، دانلودش کن)
  - install_hook()                → قلابِ خودکار: هر import ناموفقِ سطح‌بالا را
                                     یک‌بار تلاش می‌کند نصب کند و دوباره وارد کند.
"""
import importlib
import importlib.util
import os
import subprocess
import sys
from pathlib import Path

# پوشهٔ مخصوص کتابخانه‌ها — تنها جایی که چیزی نصب می‌شود.
LIBS_DIR = Path(__file__).resolve().parents[2] / "libs"
try:
    LIBS_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass
if str(LIBS_DIR) not in sys.path:
    sys.path.insert(0, str(LIBS_DIR))

_ENABLED = os.environ.get("SETAYESH_AUTO_LIBS", "1").strip().lower() not in ("0", "false", "off", "no")
_tried = set()                                   # هر نام فقط یک‌بار تلاش می‌شود
_STDLIB = set(getattr(sys, "stdlib_module_names", set()))
# ماژول‌های داخلیِ خودِ مغز — هیچ‌وقت نباید از pip گرفته شوند.
_INTERNAL = {
    "llm", "local_llm", "memory", "loop", "bridge", "ollama_setup",
    "scheduler", "dashboard", "tools", "normalize", "retrieval", "main", "autolibs",
}


def _pip_install(pkg):
    """نصب یک بسته فقط داخل LIBS_DIR."""
    try:
        r = subprocess.run(
            [sys.executable, "-m", "pip", "install", "--target", str(LIBS_DIR), pkg],
            capture_output=True, text=True, timeout=180,
        )
        return r.returncode == 0
    except Exception:
        return False


def ensure(pkg, import_name=None):
    """کتابخانه را برگردان؛ اگر نبود، در پوشهٔ مخصوص دانلودش کن و برگردان."""
    name = import_name or pkg.replace("-", "_")
    try:
        return importlib.import_module(name)
    except Exception:
        pass
    if not _ENABLED or pkg in _tried:
        return None
    _tried.add(pkg)
    if _pip_install(pkg):
        importlib.invalidate_caches()
        try:
            return importlib.import_module(name)
        except Exception:
            return None
    return None


class _AutoInstallFinder:
    """آخرین‌چاره: وقتی همهٔ راه‌های عادیِ import شکست خوردند، یک‌بار نصب کن."""

    def find_spec(self, fullname, path=None, target=None):
        if not _ENABLED:
            return None
        if "." in fullname:            # فقط بسته‌های سطح‌بالا، نه زیرماژول‌ها
            return None
        if fullname in _tried or fullname in _STDLIB or fullname in _INTERNAL:
            return None
        if fullname.startswith("_"):
            return None
        _tried.add(fullname)
        if _pip_install(fullname):
            importlib.invalidate_caches()
            try:
                return importlib.util.find_spec(fullname)
            except Exception:
                return None
        return None


def install_hook():
    """قلاب خوددانلود را نصب کن (ته زنجیرهٔ جست‌وجوی import، به‌عنوان آخرین‌چاره)."""
    if _ENABLED and not any(isinstance(f, _AutoInstallFinder) for f in sys.meta_path):
        sys.meta_path.append(_AutoInstallFinder())
