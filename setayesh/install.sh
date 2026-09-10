#!/usr/bin/env bash
# نصاب/به‌روزرسان مغز ستایش — یک فرمان، همه‌چیز را راستی‌آزمایی و آماده می‌کند.
#
# استفاده:
#   bash setayesh/install.sh                 # نصب/به‌روزرسانی محلی + تست
#   bash setayesh/install.sh --with-ollama   # + دانلود مدل و مدلِ embedding
#   sudo bash setayesh/install.sh --service  # + نصب سرویس دائمی (systemd)
#   bash setayesh/install.sh --dir ~/setayesh  # نصب در مسیر دلخواه (کپی)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
WITH_OLLAMA=0; DO_SERVICE=0; TARGET=""
while [ $# -gt 0 ]; do
  case "$1" in
    --with-ollama) WITH_OLLAMA=1 ;;
    --service) DO_SERVICE=1 ;;
    --dir) shift; TARGET="${1:-}" ;;
    -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
    *) echo "گزینهٔ ناشناخته: $1"; exit 1 ;;
  esac
  shift
done

VER="$(cat "$ROOT/VERSION" 2>/dev/null || echo 0.0.0)"
echo "🧠 نصب مغز ستایش — نسخهٔ $VER"
echo "════════════════════════════════"

# ۱) پایتون
if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ python3 یافت نشد. لطفاً پایتون ۳ نصب کنید."; exit 1
fi
echo "✅ پایتون: $(python3 --version 2>&1)"

# ۲) کپی به مسیر دلخواه (اختیاری)
if [ -n "$TARGET" ] && [ "$TARGET" != "$ROOT" ]; then
  echo "▸ کپی به $TARGET"
  mkdir -p "$TARGET"
  cp -a "$ROOT/." "$TARGET/"
  ROOT="$TARGET"
fi

# ۳) راستی‌آزمایی: اجرای تست‌ها
echo "▸ اجرای تست‌ها..."
( cd "$ROOT/brain/server" && SETAYESH_WARMUP=0 python3 -m unittest tests.test_brain 2>&1 | tail -1 )

# ۴) Ollama (اختیاری)
if [ "$WITH_OLLAMA" -eq 1 ]; then
  if command -v ollama >/dev/null 2>&1; then
    MODEL="$(grep -E '^\s*model\s*:' "$ROOT/vault/config/brain-settings.md" | head -1 | sed 's/.*:\s*//' | tr -d '\r')"
    EMB="$(grep -E '^\s*embeddings_model\s*:' "$ROOT/vault/config/brain-settings.md" | head -1 | sed 's/.*:\s*//' | tr -d '\r')"
    echo "▸ دانلود مدل‌ها: ${MODEL:-qwen2.5:7b} و ${EMB:-nomic-embed-text}"
    ollama pull "${MODEL:-qwen2.5:7b}" || true
    ollama pull "${EMB:-nomic-embed-text}" || true
  else
    echo "⚠️  Ollama نصب نیست — از https://ollama.com/download نصب کنید (مغز بدون آن هم با موتور محلی کار می‌کند)."
  fi
fi

# ۵) سرویس دائمی (اختیاری)
if [ "$DO_SERVICE" -eq 1 ]; then
  echo "▸ نصب سرویس systemd..."
  bash "$ROOT/deploy/install-server.sh"
fi

echo ""
echo "✅ نصب کامل شد. اجرا:"
echo "   bash $ROOT/run.sh \"سلام، خودت را معرفی کن\""
echo "   bash $ROOT/run.sh --serve        # وبهوک + داشبورد وب: http://localhost:8787"
echo "   python3 $ROOT/brain/server/main.py --doctor"
echo ""
echo "والت را در Obsidian باز کنید: $ROOT/vault"
