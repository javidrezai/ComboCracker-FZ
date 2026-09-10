"""بازیابی برداری با embeddings واقعی (وقتی Ollama در دسترس است) + کش محلی.

اگر embedder در دسترس نباشد، هیچ کاری نمی‌کند و فراخوان به TF-IDF برمی‌گردد.
بردارها بر اساس هشِ محتوا کش می‌شوند تا هر بار دوباره محاسبه نشوند.
"""
import json
import math
import hashlib
from pathlib import Path


def _cos(a, b):
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(y * y for y in b)) or 1.0
    return dot / (na * nb)


class EmbeddingIndex:
    def __init__(self, embedder, model, cache_path):
        self.embedder = embedder
        self.model = model
        self.cache_path = Path(cache_path)
        self._cache = {}
        try:
            if self.cache_path.exists():
                self._cache = json.loads(self.cache_path.read_text(encoding="utf-8"))
        except Exception:
            self._cache = {}

    def _key(self, text):
        h = hashlib.sha1((self.model + "\n" + text).encode("utf-8")).hexdigest()
        return h

    def _save(self):
        try:
            self.cache_path.parent.mkdir(parents=True, exist_ok=True)
            self.cache_path.write_text(json.dumps(self._cache), encoding="utf-8")
        except Exception:
            pass

    def embed(self, text):
        key = self._key(text)
        if key in self._cache:
            return self._cache[key]
        vec = self.embedder.embed(text, model=self.model)
        if vec:
            self._cache[key] = vec
        return vec

    def rank(self, query, docs, k):
        """docs: list of (f, txt). خروجی: top-k به‌صورت (score, f, txt)."""
        qv = self.embed(query)
        if not qv:
            return None  # نشانهٔ شکست → فراخوان به TF-IDF برمی‌گردد
        scored = []
        for f, txt in docs:
            dv = self.embed(txt[:2000])
            if dv:
                scored.append((_cos(qv, dv), f, txt))
        self._save()
        if not scored:
            return None
        scored.sort(key=lambda x: -x[0])
        return scored[:k]
