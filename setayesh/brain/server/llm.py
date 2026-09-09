"""اتصال به مدل محلی از طریق Ollama — فقط با کتابخانهٔ استاندارد پایتون."""
import json
import urllib.request
import urllib.error


class OllamaClient:
    """کلاینت سبک برای Ollama (بدون وابستگی خارجی)."""

    def __init__(self, host="http://localhost:11434", model="qwen2.5:7b",
                 temperature=0.4, timeout=120):
        self.host = host.rstrip("/")
        self.model = model
        self.temperature = temperature
        self.timeout = timeout

    def chat(self, messages, temperature=None, model=None):
        """یک درخواست chat به Ollama می‌فرستد و متن پاسخ را برمی‌گرداند."""
        payload = {
            "model": model or self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": self.temperature if temperature is None else temperature},
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{self.host}/api/chat", data=data,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                body = json.loads(resp.read().decode("utf-8"))
            return body.get("message", {}).get("content", "")
        except urllib.error.URLError as e:
            raise RuntimeError(
                f"اتصال به Ollama ناموفق بود ({self.host}). "
                f"مطمئن شوید Ollama در حال اجراست و مدل «{model or self.model}» نصب است. جزئیات: {e}"
            )

    def list_models(self):
        """لیست مدل‌های نصب‌شده روی Ollama را برمی‌گرداند (نام‌ها)."""
        try:
            with urllib.request.urlopen(f"{self.host}/api/tags", timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return [m.get("name", "") for m in data.get("models", [])]
        except Exception:
            return []

    def has_model(self, model=None):
        """آیا مدل موردنظر نصب است؟ (تطبیق دقیق یا با/بی تگ :latest)."""
        target = model or self.model
        names = self.list_models()
        if target in names:
            return True
        base = target.split(":")[0]
        return any(n == target or n.split(":")[0] == base for n in names)

    def warmup(self, model=None):
        """مدل را با یک درخواست کوچک در حافظه بارگذاری می‌کند (اولین پاسخ سریع‌تر)."""
        try:
            self.chat([{"role": "user", "content": "hi"}], model=model)
            return True
        except Exception:
            return False

    def is_available(self):
        """بررسی می‌کند که Ollama در دسترس است یا نه."""
        try:
            with urllib.request.urlopen(f"{self.host}/api/tags", timeout=5) as resp:
                return resp.status == 200
        except Exception:
            return False
