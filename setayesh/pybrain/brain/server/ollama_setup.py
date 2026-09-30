"""اتصال خودکار اولاما (Ollama) به ستایش.

این ماژول تضمین می‌کند مغز سرور، خودش و بدون دخالت دستی به مدل محلی وصل شود:
  ۱. بررسی سلامت اولاما (health check).
  ۲. اگر اولاما نصب است ولی اجرا نشده → خودکار `ollama serve` را بالا می‌آورد.
  ۳. اگر مدل موردنظر نصب نیست → خودکار `ollama pull` می‌کند.
  ۴. صبر می‌کند تا سرویس و مدل آماده شوند، سپس مدل را گرم می‌کند.

فقط با کتابخانهٔ استاندارد؛ اگر باینری `ollama` نباشد، بی‌صدا به حالت دستی برمی‌گردد.
"""
import os
import time
import shutil
import subprocess


def _log(msg, quiet=False):
    if not quiet:
        print(msg, flush=True)


def ensure_ollama(client, model=None, auto_start=True, auto_pull=True,
                  wait_seconds=90, quiet=False):
    """اتصال اولاما را تضمین می‌کند و یک گزارش وضعیت برمی‌گرداند."""
    model = model or client.model
    status = {"available": False, "model_ready": False,
              "started": False, "pulled": False, "message": ""}
    has_binary = shutil.which("ollama") is not None

    # ۱) اگر در دسترس نیست، تلاش برای راه‌اندازی سرویس
    if not client.is_available():
        if auto_start and has_binary:
            _log("▸ اولاما اجرا نشده — در حال راه‌اندازی سرویس...", quiet)
            try:
                subprocess.Popen(
                    ["ollama", "serve"],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    start_new_session=True,
                )
                status["started"] = True
            except Exception as e:
                status["message"] = f"راه‌اندازی اولاما ناموفق: {e}"
            # انتظار تا بالا آمدن سرویس
            deadline = time.time() + 20
            while time.time() < deadline and not client.is_available():
                time.sleep(1)
        else:
            status["message"] = (
                "اولاما در دسترس نیست و نصب هم نیست. "
                "نصب: https://ollama.com/download"
                if not has_binary else
                "اولاما در دسترس نیست (auto_start خاموش است)."
            )

    status["available"] = client.is_available()
    if not status["available"]:
        _log(f"⚠️  {status['message']}", quiet)
        return status

    # ۲) بررسی/دانلود مدل
    if client.has_model(model):
        status["model_ready"] = True
    elif auto_pull and has_binary:
        _log(f"▸ مدل «{model}» نصب نیست — در حال دانلود (بار اول ممکن است طول بکشد)...", quiet)
        try:
            subprocess.run(["ollama", "pull", model], check=True,
                           timeout=max(wait_seconds, 600))
            status["pulled"] = True
            status["model_ready"] = client.has_model(model)
        except Exception as e:
            status["message"] = f"دانلود مدل ناموفق: {e}"
    else:
        status["message"] = f"مدل «{model}» نصب نیست. اجرا کنید: ollama pull {model}"

    # ۳) گرم‌کردن مدل (اولین پاسخ سریع‌تر)
    if status["model_ready"] and os.environ.get("SETAYESH_WARMUP", "1") != "0":
        _log(f"▸ گرم‌کردن مدل «{model}»...", quiet)
        client.warmup(model)

    if status["available"] and status["model_ready"]:
        _log(f"✅ اتصال اولاما به ستایش برقرار شد | مدل: {model}", quiet)
    elif status["message"]:
        _log(f"⚠️  {status['message']}", quiet)
    return status


def connection_summary(status):
    """خلاصهٔ یک‌خطی وضعیت اتصال برای داشبورد/لاگ."""
    if status.get("available") and status.get("model_ready"):
        return "🟢 متصل و آماده"
    if status.get("available"):
        return "🟡 اولاما بالا است ولی مدل آماده نیست"
    return "🔴 اولاما در دسترس نیست"
