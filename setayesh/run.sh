#!/usr/bin/env bash
# راه‌انداز کامل مغز ستایش — Ollama را بررسی می‌کند، مدل را آماده می‌کند و مغز را اجرا می‌کند.
# استفاده:
#   bash setayesh/run.sh "سوال شما"     # یک پرسش
#   bash setayesh/run.sh                 # حالت تعاملی
#   bash setayesh/run.sh --serve         # وبهوک + داشبورد وب
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
export SETAYESH_VAULT="${SETAYESH_VAULT:-$ROOT/vault}"

echo "🧠 مغز ستایش | والت: $SETAYESH_VAULT"

if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ python3 یافت نشد. لطفاً پایتون ۳ نصب کنید."; exit 1
fi

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
MODEL="$(grep -E '^\s*model\s*:' "$SETAYESH_VAULT/config/brain-settings.md" 2>/dev/null | head -1 | sed 's/.*:\s*//' | tr -d '\r' || echo qwen2.5:7b)"
MODEL="${MODEL:-qwen2.5:7b}"

if command -v ollama >/dev/null 2>&1; then
  if ! curl -sf "$OLLAMA_HOST/api/tags" >/dev/null 2>&1; then
    echo "▸ راه‌اندازی Ollama..."; (ollama serve >/dev/null 2>&1 &) ; sleep 3
  fi
  if ! ollama list 2>/dev/null | grep -q "${MODEL%%:*}"; then
    echo "▸ دانلود مدل $MODEL (بار اول ممکن است طول بکشد)..."; ollama pull "$MODEL" || true
  fi
else
  echo "⚠️  Ollama نصب نیست. مغز اجرا می‌شود ولی پاسخ مدل نمی‌آید."
  echo "    نصب: https://ollama.com/download  سپس: ollama pull $MODEL"
fi

exec python3 "$ROOT/brain/server/main.py" "$@"
