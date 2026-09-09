"""ابزارهای جدا و رایگان مغز سرور.

هر ابزار یک تابع است که یک رشته می‌گیرد و یک رشته برمی‌گرداند.
افزودن ابزار جدید: یک تابع بنویسید و در build_registry ثبت کنید.
"""
import datetime
import ast
import operator as op


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


def build_registry(vault):
    """ابزارها را با دسترسی به والت می‌سازد."""
    def tool_list_files(_=""):
        """لیست فایل‌های والت."""
        return "\n".join(vault.list_files()) or "(والت خالی است)"

    def tool_read_note(name):
        """خواندن یک نوت از والت. ورودی: نام نوت."""
        txt = vault.read_note(name.strip())
        return txt if txt is not None else f"نوتی به نام «{name}» پیدا نشد."

    def tool_search(query):
        """جست‌وجوی گراف دانش. ورودی: کلیدواژه."""
        hits = vault.retrieve(query, k=3)
        if not hits:
            return "نتیجه‌ای پیدا نشد."
        return "\n\n".join(f"### {n}\n{t[:400]}" for n, t in hits)

    return {
        "calc": tool_calc,
        "now": tool_now,
        "list_files": tool_list_files,
        "read_note": tool_read_note,
        "search": tool_search,
    }


def tool_help(registry):
    """توضیح ابزارهای موجود برای پرامپت مدل."""
    docs = {
        "calc": "محاسبهٔ ریاضی، مثل calc(12*7)",
        "now": "زمان فعلی، now()",
        "list_files": "لیست فایل‌های والت، list_files()",
        "read_note": "خواندن نوت، read_note(نام)",
        "search": "جست‌وجوی دانش، search(کلیدواژه)",
    }
    return "\n".join(f"- {name}: {docs.get(name, '')}" for name in registry)
