"""موتور محلیِ جایگزین ستایش — بدون هیچ مدل خارجی.

وقتی اولاما در دسترس نیست، مغز باز هم باید کار کند. این موتور سبک، با قواعد ساده،
درخواست‌ها را به فراخوانی ابزار (calc/now/search/web_search) یا پاسخ از روی دانشِ
بازیابی‌شده ترجمه می‌کند و با همان پروتکل حلقهٔ عامل (TOOL: / FINAL:) پاسخ می‌دهد.

هدف: «کارکردن محلیِ تضمین‌شده» — نه جایگزینی یک مدل واقعی.
"""
import re

_FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
# فقط واژه‌های عملگرِ بدون‌ابهام (از «در»/«بر» تنهایی پرهیز می‌کنیم)
_OP_WORDS = [
    ("ضربدر", "*"), ("ضرب در", "*"), ("×", "*"),
    ("به‌علاوه", "+"), ("بعلاوه", "+"), ("به علاوه", "+"), ("جمع با", "+"),
    ("منهای", "-"), ("منها", "-"),
    ("تقسیم بر", "/"), ("تقسیم‌بر", "/"),
]
_TIME_HINTS = ("ساعت", "زمان", "تاریخ", "چند شد", "الان چند", "time", "date", "clock")
_WEB_HINTS = ("جست‌وجو وب", "جستجو وب", "سرچ وب", "توی وب", "در وب", "اینترنت", "web", "search online", "google")
_KB_HINTS = ("چیست", "کیست", "یعنی چه", "توضیح", "درباره", "معرفی", "چطور", "چگونه", "what is", "who is", "explain")


class LocalFallbackLLM:
    model = "local-fallback"
    temperature = 0.0
    host = "local"

    def is_available(self):
        return True

    def list_models(self):
        return ["local-fallback"]

    def has_model(self, model=None):
        return True

    def warmup(self, model=None):
        return True

    # --- کمک‌ها ---
    @staticmethod
    def _last_user(messages):
        for m in reversed(messages):
            if m.get("role") == "user":
                return m.get("content", "")
        return ""

    @staticmethod
    def _extract_question(text):
        if "درخواست کاربر:" in text:
            return text.split("درخواست کاربر:", 1)[1].strip()
        return text.strip()

    @staticmethod
    def _first_knowledge(text):
        # اولین قطعهٔ «### عنوان\nمتن» از بخش دانشِ مرتبط را برمی‌گرداند
        m = re.search(r"###\s*(.+)\n(.+)", text)
        if m:
            title = m.group(1).strip()
            body = m.group(2).strip()
            return f"{title}: {body}"
        return ""

    def _math_expr(self, q):
        s = q.translate(_FA_DIGITS)
        for w, op in _OP_WORDS:
            s = s.replace(w, f" {op} ")
        # عبارتی که حداقل یک عملگر بین اعداد دارد (با پرانتز اختیاری)
        m = re.search(r"[-+]?\(?\d[\d\s.()]*[-+*/][\d\s.()+\-*/]*\d\)?", s)
        if not m:
            return None
        expr = re.sub(r"[^0-9+\-*/().]", "", m.group(0))
        # اعتبارسنجی حداقلی
        if re.search(r"\d[+\-*/]\d", expr) or re.search(r"\)[+\-*/]?\(", expr):
            return expr
        return None

    # --- قلب موتور ---
    def chat(self, messages, temperature=None, model=None):
        last = self._last_user(messages)

        # اگر نتیجهٔ ابزار برگشته، جمع‌بندی نهایی
        if last.strip().startswith("OBSERVATION:"):
            obs = last.split("OBSERVATION:", 1)[1].strip()
            return f"FINAL: {obs}"

        q = self._extract_question(last)
        ql = q.lower()

        # ۱) ریاضی
        expr = self._math_expr(q)
        if expr:
            return f"TOOL: calc({expr})"

        # ۲) زمان/تاریخ
        if any(h in ql for h in _TIME_HINTS):
            return "TOOL: now()"

        # ۳) جست‌وجوی وب (صریح)
        if any(h in ql for h in _WEB_HINTS):
            terms = re.sub(r"(جست‌وجو|جستجو|سرچ|در وب|توی وب|اینترنت|web|search|online|google)", "", q, flags=re.I).strip()
            return f"TOOL: web_search({terms or q})"

        # ۴) پرسش دانشی → جست‌وجوی گراف دانش والت
        if any(h in ql for h in _KB_HINTS):
            return f"TOOL: search({q})"

        # ۵) پاسخ از روی دانشِ بازیابی‌شده، یا معرفی پیش‌فرض
        kb = self._first_knowledge(last)
        if kb:
            return f"FINAL: بر اساس دانش والت — {kb}"
        return ("FINAL: من ستایش‌ام، مغز محلی و شفاف شما. الان روی موتور محلیِ جایگزین کار می‌کنم "
                "(اولاما در دسترس نیست). می‌توانم محاسبه کنم، زمان بدهم، گراف دانش والت را جست‌وجو کنم "
                "و در صورت اتصال، از وب هم اطلاعات بگیرم.")
