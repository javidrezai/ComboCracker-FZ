"""به‌روزرسانی درون‌برنامه‌ای ستایش — «مغز خودش را به‌روز می‌کند».

اگر ستایش داخل یک مخزن git باشد، آخرین نسخه را می‌کشد (fast-forward) و شمارهٔ
نسخه را قبل/بعد گزارش می‌دهد. اگر مخزن git نباشد، راهنمایی می‌دهد.
"""
import json
import time
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


def check_for_update(setayesh_root, timeout=10):
    """بدون تغییرِ کد، بررسی می‌کند نسخهٔ جدیدی روی origin هست یا نه."""
    root = Path(setayesh_root)
    cur = _read_version(root)
    res = {"available": False, "current": cur, "latest": cur, "behind": 0, "reason": ""}
    repo = _find_repo(root)
    if repo is None:
        res["reason"] = "not-git"
        return res
    try:
        branch = subprocess.run(
            ["git", "-C", str(repo), "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, timeout=15).stdout.strip() or "HEAD"
        f = subprocess.run(["git", "-C", str(repo), "fetch", "-q", "origin", branch],
                           capture_output=True, text=True, timeout=timeout)
        if f.returncode != 0:
            res["reason"] = "offline"
            return res
        behind = subprocess.run(
            ["git", "-C", str(repo), "rev-list", "--count", f"HEAD..origin/{branch}"],
            capture_output=True, text=True, timeout=15).stdout.strip()
        res["behind"] = int(behind or "0")
        # نسخهٔ راه دور (اگر VERSION تغییر کرده باشد)
        try:
            rel = (root / "VERSION").resolve().relative_to(repo.resolve()).as_posix()
            latest = subprocess.run(
                ["git", "-C", str(repo), "show", f"origin/{branch}:{rel}"],
                capture_output=True, text=True, timeout=15).stdout.strip()
            if latest:
                res["latest"] = latest
        except Exception:
            pass
        res["available"] = res["behind"] > 0
        return res
    except Exception as e:
        res["reason"] = f"error: {e}"
        return res


def check_for_update_cached(setayesh_root, cache_path, interval_hours=6, timeout=10):
    """مثل check_for_update ولی نتیجه را کش می‌کند تا هر بار شبکه نزند."""
    cache = Path(cache_path)
    now = time.time()
    try:
        if cache.exists():
            data = json.loads(cache.read_text(encoding="utf-8"))
            if now - data.get("ts", 0) < interval_hours * 3600:
                data["cached"] = True
                return data
    except Exception:
        pass
    res = check_for_update(setayesh_root, timeout=timeout)
    res["ts"] = now
    res["cached"] = False
    try:
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(json.dumps(res), encoding="utf-8")
    except Exception:
        pass
    return res
