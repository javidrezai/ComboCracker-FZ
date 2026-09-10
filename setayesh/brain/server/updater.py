"""به‌روزرسانی درون‌برنامه‌ای ستایش — «مغز خودش را به‌روز می‌کند».

اگر ستایش داخل یک مخزن git باشد، آخرین نسخه را می‌کشد (fast-forward) و شمارهٔ
نسخه را قبل/بعد گزارش می‌دهد. اگر مخزن git نباشد، راهنمایی می‌دهد.
"""
import subprocess
from pathlib import Path


def _find_repo(start):
    p = Path(start).resolve()
    for d in [p, *p.parents]:
        if (d / ".git").exists():
            return d
    return None


def _read_version(setayesh_root):
    f = Path(setayesh_root) / "VERSION"
    try:
        return f.read_text(encoding="utf-8").strip()
    except Exception:
        return "?"


def self_update(setayesh_root, timeout=120):
    """آخرین نسخه را می‌کشد و وضعیت را برمی‌گرداند."""
    root = Path(setayesh_root)
    old = _read_version(root)
    res = {"ok": False, "old": old, "new": old, "message": "", "changed": False}

    repo = _find_repo(root)
    if repo is None:
        res["message"] = ("این نسخه مخزن git نیست. برای به‌روزرسانی، بستهٔ جدید را با "
                          "install.sh نصب کنید یا از bootstrap.sh استفاده کنید.")
        return res

    try:
        # شاخهٔ فعلی
        branch = subprocess.run(
            ["git", "-C", str(repo), "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, timeout=20).stdout.strip() or "HEAD"
        r = subprocess.run(
            ["git", "-C", str(repo), "pull", "--ff-only", "origin", branch],
            capture_output=True, text=True, timeout=timeout)
        out = (r.stdout + "\n" + r.stderr).strip()
        new = _read_version(root)
        res["new"] = new
        if r.returncode != 0:
            res["message"] = f"به‌روزرسانی ناموفق بود:\n{out}"
            return res
        res["ok"] = True
        if "Already up to date" in out or "up-to-date" in out:
            res["message"] = f"هم‌اکنون به‌روز است (نسخهٔ {new})."
        else:
            res["changed"] = True
            res["message"] = (f"به‌روزرسانی شد: {old} → {new}" if old != new
                              else f"کد به‌روزرسانی شد (نسخهٔ {new}).")
        return res
    except Exception as e:
        res["message"] = f"خطا در به‌روزرسانی: {e}"
        return res
