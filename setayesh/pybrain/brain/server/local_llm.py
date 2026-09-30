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
_NOTE_HINTS = ("یادداشت کن", "ذخیره کن", "نوت کن", "بنویس که", "ثبت کن", "save note", "note this", "remember that")
_SUM_HINTS = ("خلاصه کن", "خلاصه‌ای", "خلاصه بده", "جمع‌بندی", "summarize", "summary of")
# واژه‌های عددی فارسی ۰..۱۰ — فقط وقتی یک عملگر هم در جمله باشد به رقم تبدیل می‌شوند،
# تا «دو به‌علاوه سه» هم مثل «۲ + ۳» محاسبه شود (نه فقط ارقام).
_FA_NUM_WORDS = [
    ("صفر", "0"), ("یک", "1"), ("دو", "2"), ("سه", "3"), ("چهار", "4"),
    ("پنج", "5"), ("شش", "6"), ("هفت", "7"), ("هشت", "8"), ("نه", "9"), ("ده", "10"),
]


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

    @staticmethod
    def _relevant(q, kb):
        # Only present a retrieved vault doc as the answer when it actually
        # shares a meaningful word with the question — otherwise the fallback
        # would dump an unrelated note ("پرت و پلا") for a greeting or a sum.
        def toks(s):
            s = s.translate(_FA_DIGITS).lower()
            return set(w for w in re.split(r"[^0-9a-z؀-ۿ]+", s) if len(w) >= 3)
        # Compare only the real question, not the retrieved-knowledge block that
        # the loop appends after it (otherwise the question "overlaps" itself).
        qonly = re.split(r"###|دانش مرتبط|دانش والت", q)[0]
        return bool(toks(qonly) & toks(kb))

    def _math_expr(self, q):
        s = q.translate(_FA_DIGITS)
        # Turn spelled-out Persian numbers into digits, but only when an operator
        # (word or symbol) is present, so plain prose like «نه» (=no) is untouched.
        if any(w in s for w, _ in _OP_WORDS) or re.search(r"[+\-*/×]", s):
            for w, n in _FA_NUM_WORDS:
                s = re.sub(r"(?<![؀-ۿ])" + re.escape(w) + r"(?![؀-ۿ])", f" {n} ", s)
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

        # ۰) ذخیرهٔ نوت (فرمان صریح، بالاترین اولویت)
        for h in _NOTE_HINTS:
            if h in ql:
                content = q[ql.find(h) + len(h):].strip(" :،.") or q
                return f"TOOL: save_note({content[:40]} :: {content})"

        # ۰.۵) خلاصه‌سازی چند نوت
        for h in _SUM_HINTS:
            if h in ql:
                topic = q[ql.find(h) + len(h):].strip(" :،.")
                for lead in ("دربارهٔ", "درباره", "راجع به", "در مورد", "از"):
                    if topic.startswith(lead):
                        topic = topic[len(lead):].strip()
                return f"TOOL: summarize({topic or q})"

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

        # ۵) پاسخ از روی دانشِ بازیابی‌شده — فقط اگر واقعاً به سؤال مربوط باشد،
        # وگرنه معرفی پیش‌فرض (تا نوتِ بی‌ربط به‌عنوان جواب دامپ نشود).
        kb = self._first_knowledge(last)
        if kb and self._relevant(q, kb):
            return f"FINAL: بر اساس دانش والت — {kb}"
        return ("FINAL: من ستایش‌ام، مغز محلی و شفاف شما. الان روی موتور محلیِ جایگزین کار می‌کنم "
                "(اولاما در دسترس نیست). می‌توانم محاسبه کنم، زمان بدهم، گراف دانش والت را جست‌وجو کنم "
                "و در صورت اتصال، از وب هم اطلاعات بگیرم.")
