"""ابزارهای جدا و رایگان مغز سرور.

هر ابزار یک تابع است که یک رشته می‌گیرد و یک رشته برمی‌گرداند.
افزودن ابزار جدید: یک تابع بنویسید و در build_registry ثبت کنید.
"""
import datetime
import ast
import re
import html
import operator as op
import urllib.parse
import urllib.request


def clean_excerpt(text, limit=260):
    """یک خلاصهٔ تمیز از یک نوت مارک‌داون می‌سازد (بدون #، لینک، تیتر)."""
    lines = []
    for ln in text.splitlines():
        ln = ln.strip()
        if not ln or ln.startswith("#"):
            continue
        ln = re.sub(r"\[\[([^\]|]+)(\|[^\]]+)?\]\]", r"\1", ln)  # [[لینک|متن]] → لینک
        ln = re.sub(r"[*`>_-]{1,3}", "", ln).strip()
        if ln:
            lines.append(ln)
    out = " ".join(lines)
    return (out[:limit].rstrip() + "…") if len(out) > limit else out


# --- ماشین‌حساب امن (بدون eval) ---
_OPS = {
    ast.Add: op.add, ast.Sub: op.sub, ast.Mult: op.mul,
    ast.Div: op.truediv, ast.Pow: op.pow, ast.Mod: op.mod,
    ast.USub: op.neg, ast.FloorDiv: op.floordiv,
}


def _safe_eval(node):
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_safe_eval(node.left), _safe_eval(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_safe_eval(node.operand))
    raise ValueError("عبارت مجاز نیست")


def tool_calc(expr):
    """محاسبهٔ یک عبارت ریاضی امن. مثال: calc(2*(3+4))"""
    tree = ast.parse(expr, mode="eval")
    return str(_safe_eval(tree.body))


def tool_now(_=""):
    """زمان و تاریخ فعلی."""
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def tool_web_search(query):
    """جست‌وجوی وب رایگان (DuckDuckGo، بدون کلید API). ورودی: عبارت جست‌وجو."""
    q = urllib.parse.quote(query.strip())
    url = f"https://html.duckduckgo.com/html/?q={q}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Setayesh)"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        page = resp.read().decode("utf-8", "replace")
    # استخراج عنوان + خلاصهٔ نتایج
    results = []
    for m in re.finditer(r'result__a"[^>]*>(.*?)</a>', page, re.DOTALL):
        title = html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip()
        if title:
            results.append(title)
        if len(results) >= 5:
            break
    if not results:
        return "نتیجه‌ای پیدا نشد."
    return "\n".join(f"- {r}" for r in results)


def build_registry(vault):
    """ابزارها را با دسترسی به والت می‌سازد."""
    def tool_list_files(_=""):
        """لیست فایل‌های والت."""
        return "\n".join(vault.list_files()) or "(والت خالی است)"

    def tool_read_note(name):
        """خواندن یک نوت از والت. ورودی: نام نوت."""
        txt = vault.read_note(name.strip())
        return txt if txt is not None else f"نوتی به نام «{name}» پیدا نشد."

    def tool_summarize(query):
        """خلاصهٔ چند نوتِ مرتبط. ورودی: موضوع/کلیدواژه."""
        hits = vault.retrieve(query, k=4)
        if not hits:
            return "نوتی برای خلاصه‌سازی پیدا نشد."
        parts = []
        for n, t in hits:
            first = clean_excerpt(t, 140)
            if first:
                parts.append(f"• {n}: {first}")
        return f"خلاصهٔ «{query}» از {len(parts)} نوت:\n" + "\n".join(parts)

    def tool_save_note(arg):
        """ذخیرهٔ نوت در ناحیهٔ مجاز. ورودی: «عنوان :: محتوا»."""
        if "::" in arg:
            title, content = arg.split("::", 1)
        elif "|" in arg:
            title, content = arg.split("|", 1)
        else:
            title, content = arg.strip()[:40], arg.strip()
        rel = vault.save_note(title.strip(), content.strip())
        return f"نوت ذخیره شد: {rel}"

    def tool_search(query):
        """جست‌وجوی گراف دانش. ورودی: کلیدواژه."""
        hits = vault.retrieve(query, k=3)
        if not hits:
            return "نتیجه‌ای پیدا نشد."
        return "\n".join(f"«{n}» — {clean_excerpt(t)}" for n, t in hits)

    return {
        "calc": tool_calc,
        "now": tool_now,
        "list_files": tool_list_files,
        "read_note": tool_read_note,
        "search": tool_search,
        "web_search": tool_web_search,
        "save_note": tool_save_note,
        "summarize": tool_summarize,
    }


def tool_help(registry):
    """توضیح ابزارهای موجود برای پرامپت مدل."""
    docs = {
        "calc": "محاسبهٔ ریاضی، مثل calc(12*7)",
        "now": "زمان فعلی، now()",
        "list_files": "لیست فایل‌های والت، list_files()",
        "read_note": "خواندن نوت، read_note(نام)",
        "search": "جست‌وجوی دانش والت، search(کلیدواژه)",
        "web_search": "جست‌وجوی وب، web_search(عبارت)",
        "save_note": "ذخیرهٔ نوت، save_note(عنوان :: محتوا)",
        "summarize": "خلاصهٔ چند نوت، summarize(موضوع)",
    }
    return "\n".join(f"- {name}: {docs.get(name, '')}" for name in registry)
