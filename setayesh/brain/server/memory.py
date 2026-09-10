"""مغز ابسیدین — خواندن/نوشتن والت به‌عنوان حافظهٔ دائمی.

اصل ایمنی: پوشهٔ knowledge/ برای مغز فقط‌خواندنی است. مغز فقط در
lessons/، dashboard/ و logs/ می‌نویسد.
"""
import re
import math
import datetime
from collections import Counter
from pathlib import Path

import normalize as norm


LINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
WORD_RE = re.compile(r"[\w؀-ۿ]+", re.UNICODE)


def _now():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


class Vault:
    """رابط دسترسی به والت Obsidian (حافظهٔ دائمی مغز)."""

    def __init__(self, root):
        self.root = Path(root).resolve()
        self.knowledge = self.root / "knowledge"
        self.lessons = self.root / "lessons"
        self.config = self.root / "config"
        self.dashboard = self.root / "dashboard"
        self.logs = self.root / "logs"
        self.notes = self.root / "notes"
        for d in (self.knowledge, self.lessons, self.config, self.dashboard, self.logs, self.notes):
            d.mkdir(parents=True, exist_ok=True)

    # ---------- خواندن تنظیمات (بدون ری‌استارت، هر گام تازه خوانده می‌شود) ----------
    def read_settings(self):
        """تنظیمات را از config/brain-settings.md می‌خواند (فرمت key: value)."""
        settings = {}
        f = self.config / "brain-settings.md"
        if not f.exists():
            return settings
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("#") or ":" not in line or line.startswith(">"):
                continue
            # فقط خطوطی که شبیه key: value هستند (نه لینک markdown)
            m = re.match(r"^\s*[-*]?\s*`?([a-zA-Z_][a-zA-Z0-9_]*)`?\s*:\s*(.+?)\s*$", line)
            if m:
                key, val = m.group(1), m.group(2).strip().strip("`")
                settings[key] = val
        return settings

    def set_setting(self, key, value):
        """یک کلید را در config/brain-settings.md می‌نویسد/به‌روزرسانی می‌کند."""
        import re as _re
        f = self.config / "brain-settings.md"
        text = f.read_text(encoding="utf-8") if f.exists() else "# ⚙️ تنظیمات مغز ستایش\n\n"
        pat = _re.compile(rf"^(\s*{_re.escape(key)}\s*:\s*).*$", _re.MULTILINE)
        if pat.search(text):
            text = pat.sub(rf"\g<1>{value}", text, count=1)
        else:
            text = text.rstrip() + f"\n{key}: {value}\n"
        f.write_text(text, encoding="utf-8")
        return value

    # ---------- یکسان‌سازی و هم‌معنی‌ها ----------
    def _canonical_map(self):
        f = self.config / "aliases.md"
        extra = norm.parse_alias_file(f.read_text(encoding="utf-8")) if f.exists() else []
        return norm.build_canonical_map(extra)

    def _tokens(self, text, cmap):
        toks = [w.lower() for w in WORD_RE.findall(norm.normalize_text(text)) if len(w) > 1]
        return norm.canonicalize(toks, cmap)

    # ---------- ایندکس و بازیابی گراف دانش ----------
    def _all_notes(self):
        notes = []
        for f in sorted(self.knowledge.rglob("*.md")):
            try:
                notes.append((f, f.read_text(encoding="utf-8")))
            except Exception:
                continue
        return notes

    def retrieve(self, query, k=4):
        """بازیابی برداری محلی (TF-IDF کسینوسی) + دنبال‌کردن لینک‌های [[...]].

        بدون هیچ وابستگی خارجی و کاملاً آفلاین؛ جایگزین شمارش سادهٔ کلیدواژه.
        """
        notes = self._all_notes()
        by_name = {f.stem: (f, txt) for f, txt in notes}
        cmap = self._canonical_map()
        docs = []
        for f, txt in notes:
            toks = self._tokens(txt, cmap)
            if toks:
                docs.append((f, txt, toks))
        q_tokens = self._tokens(query, cmap)
        if not docs or not q_tokens:
            return []

        # فراوانی سندی (df) و idf
        N = len(docs)
        df = {}
        for _, _, toks in docs:
            for t in set(toks):
                df[t] = df.get(t, 0) + 1
        def idf(t):
            return math.log((N + 1) / (df.get(t, 0) + 1)) + 1.0

        # بردار پرسش
        qtf = Counter(q_tokens)
        qvec = {t: qtf[t] * idf(t) for t in qtf}
        qnorm = math.sqrt(sum(v * v for v in qvec.values())) or 1.0
        q_title_set = set(q_tokens)

        scored = []
        for f, txt, toks in docs:
            dtf = Counter(toks)
            dvec = {t: dtf[t] * idf(t) for t in dtf}
            dnorm = math.sqrt(sum(v * v for v in dvec.values())) or 1.0
            dot = sum(qv * dvec[t] for t, qv in qvec.items() if t in dvec)
            score = dot / (qnorm * dnorm)
            # تقویت تطبیق عنوان
            if q_title_set & set(self._tokens(f.stem, cmap)):
                score += 0.15
            if score > 0:
                scored.append((score, f, txt))
        scored.sort(key=lambda x: -x[0])
        top = scored[:k]
        # دنبال‌کردن یک سطح لینک‌های [[...]] برای غنی‌سازی زمینه
        result = []
        seen = set()
        for score, f, txt in top:
            if f.stem in seen:
                continue
            seen.add(f.stem)
            result.append((f.stem, txt.strip()))
            for link in LINK_RE.findall(txt):
                name = link.split("|")[0].strip()
                if name in by_name and name not in seen:
                    seen.add(name)
                    lf, ltxt = by_name[name]
                    result.append((name, ltxt.strip()))
        return result[: k + 2]

    def list_files(self):
        """لیست همهٔ فایل‌های markdown والت."""
        return sorted(str(p.relative_to(self.root)) for p in self.root.rglob("*.md"))

    def read_note(self, name):
        """محتوای یک نوت را بر اساس نام یا مسیر برمی‌گرداند."""
        for p in self.root.rglob("*.md"):
            if p.stem == name or str(p.relative_to(self.root)) == name:
                return p.read_text(encoding="utf-8")
        return None

    # ---------- نوشتن (فقط در بخش‌های مجاز مغز) ----------
    def read_lessons(self, limit=10):
        """آخرین درس‌های خودآموخته را برمی‌گرداند."""
        f = self.lessons / "self-learned.md"
        if not f.exists():
            return ""
        lines = f.read_text(encoding="utf-8").splitlines()
        return "\n".join(lines[-limit * 3:])

    def add_lesson(self, text):
        """یک درس تازه به حافظهٔ خودآموخته اضافه می‌کند."""
        f = self.lessons / "self-learned.md"
        header = "" if f.exists() else "# درس‌های خودآموختهٔ ستایش\n\n> مغز اینجا می‌نویسد؛ شما آزادانه ویرایش کنید.\n\n"
        with f.open("a", encoding="utf-8") as fh:
            if header:
                fh.write(header)
            fh.write(f"- **[{_now()}]** {text}\n")

    def append_log(self, session_id, lines):
        """گزارش استدلال/تعمیر یک اجرا را در logs/ ثبت می‌کند."""
        f = self.logs / f"{datetime.date.today().isoformat()}.md"
        header = "" if f.exists() else f"# لاگ اجرای مغز — {datetime.date.today().isoformat()}\n\n"
        with f.open("a", encoding="utf-8") as fh:
            if header:
                fh.write(header)
            fh.write(f"\n## اجرا `{session_id}` — {_now()}\n\n")
            for ln in lines:
                fh.write(ln + "\n")

    def save_note(self, name, content):
        """یک نوت را در ناحیهٔ نوشتنیِ مجاز (notes/) ذخیره می‌کند.

        قانون ایمنی: مغز هرگز در knowledge/ (دانش پایهٔ کاربر) نمی‌نویسد.
        """
        safe = re.sub(r"[\\/:*?\"<>|]", "-", (name or "").strip()) or "note"
        safe = safe.replace("..", "-")[:80]
        path = (self.notes / f"{safe}.md").resolve()
        # اطمینان از ماندن داخل notes/
        if self.notes.resolve() not in path.parents:
            raise ValueError("مسیر نوت نامعتبر است.")
        body = content if content is not None else ""
        if not body.lstrip().startswith("#"):
            body = f"# {safe}\n\n{body}"
        path.write_text(body.rstrip() + "\n", encoding="utf-8")
        return str(path.relative_to(self.root))

    def write_dashboard(self, content):
        """داشبورد زندهٔ نقشهٔ مغز را می‌نویسد."""
        (self.dashboard / "DASHBOARD.md").write_text(content, encoding="utf-8")
