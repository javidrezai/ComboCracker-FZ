"""یکسان‌سازی متن و هم‌معنی‌ها — تطبیق فارسی↔لاتین برای بازیابی دقیق‌تر.

- نویسه‌های عربی/فارسی را یکدست می‌کند (ي→ی، ك→ک، ة→ه، أإآ→ا).
- نیم‌فاصله (ZWNJ)، کشیده و اعراب را حذف می‌کند.
- ارقام فارسی/عربی → لاتین.
- جدول هم‌معنی دوسویه: «اولاما» ≡ «Ollama»، «ابسیدین» ≡ «obsidian» و ...
  (قابل گسترش توسط کاربر در vault/config/aliases.md)
"""
import re
import unicodedata

_CHAR_MAP = {
    "ي": "ی", "ك": "ک", "ة": "ه", "ۀ": "ه",
    "أ": "ا", "إ": "ا", "آ": "ا", "ٲ": "ا", "ٱ": "ا",
    "ؤ": "و", "ئ": "ی", "ى": "ی",
}
_STRIP = dict.fromkeys(map(ord, "‌‍‎‏ـ"), None)  # ZWNJ/ZWJ/LRM/RLM/tatweel
_FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
_DIACRITICS = re.compile(r"[ً-ٰٟ]")

# گروه‌های هم‌معنی — همه به «کلید متعارف» (اولین عضو) نگاشت می‌شوند
_BASE_GROUPS = [
    ["ollama", "اولاما", "اولما", "آلاما", "الاما"],
    ["obsidian", "ابسیدین", "آبسیدین", "ابسیدان", "آبسیدان", "ابسیدن"],
    ["python", "پایتون", "پایتن"],
    ["qwen", "کوئن", "کوان", "کیوان"],
    ["docker", "داکر", "دوکر"],
    ["llm", "الالام", "مدلزبانی"],
    ["setayesh", "ستایش"],
    ["dashboard", "داشبورد"],
    ["webhook", "وبهوک"],
    ["vault", "والت"],
    ["embedding", "امبدینگ", "embeddings", "بردار", "برداری"],
]


def normalize_text(s):
    """متن را یکدست می‌کند (بدون تغییر معنا)."""
    if not s:
        return ""
    s = unicodedata.normalize("NFKC", s)
    for a, b in _CHAR_MAP.items():
        s = s.replace(a, b)
    s = s.translate(_STRIP).translate(_FA_DIGITS)
    s = _DIACRITICS.sub("", s)
    return s.lower()


def build_canonical_map(extra_groups=None):
    """نگاشت «هر واریانت → کلید متعارف» را از گروه‌های پایه + کاربر می‌سازد."""
    cmap = {}
    for group in _BASE_GROUPS + (extra_groups or []):
        norm = [normalize_text(t) for t in group if t.strip()]
        if not norm:
            continue
        key = norm[0]
        for variant in norm:
            cmap[variant] = key
    return cmap


def parse_alias_file(text):
    """فایل هم‌معنی کاربر را می‌خواند. هر خط: «کلید = واریانت۱, واریانت۲»."""
    groups = []
    for line in (text or "").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith(">"):
            continue
        if "=" not in line:
            continue
        left, right = line.split("=", 1)
        variants = [left.strip()] + [v.strip() for v in re.split(r"[,،]", right)]
        variants = [v for v in variants if v]
        if len(variants) >= 2:
            groups.append(variants)
    return groups


def canonicalize(tokens, cmap):
    """هر توکن را به کلید متعارفش می‌نگارد (اگر باشد)."""
    return [cmap.get(t, t) for t in tokens]
