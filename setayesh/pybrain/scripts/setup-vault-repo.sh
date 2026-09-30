#!/usr/bin/env bash
# راه‌اندازی «مکان دوم» مغز: والت ابسیدین را به یک مخزن git مستقل تبدیل می‌کند
# و به مغز سرور وصلش می‌کند.
#
# استفاده:
#   ۱. یک مخزن خصوصیِ خالی روی GitHub بسازید، مثلاً: setayesh-vault
#   ۲. اجرا کنید:
#        bash setayesh/scripts/setup-vault-repo.sh git@github.com:USER/setayesh-vault.git [مسیر-مقصد]
#
# پیش‌فرضِ مقصد: ~/setayesh-vault
set -euo pipefail

REMOTE="${1:-}"
DEST="${2:-$HOME/setayesh-vault}"
SRC="$(cd "$(dirname "$0")/../vault" && pwd)"

if [ -z "$REMOTE" ]; then
  echo "خطا: آدرس مخزن را بدهید."
  echo "مثال: bash $0 git@github.com:USER/setayesh-vault.git"
  exit 1
fi

echo "▸ ساخت والت مستقل در: $DEST"
mkdir -p "$DEST"
# کپی محتوای والت (شامل .obsidian و .gitignore)
cp -a "$SRC/." "$DEST/"

cd "$DEST"
if [ ! -d .git ]; then
  git init -b main
fi
git add -A
git commit -m "Initial Setayesh vault (Obsidian second brain)" || echo "(چیزی برای commit نبود)"
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
git push -u origin main

echo ""
echo "✅ والت در مکان دوم آماده شد: $DEST"
echo "▸ حالا در تنظیمات مغز سرور (vault/config/brain-settings.md) این را بگذارید:"
echo "     vault_remote: $REMOTE"
echo "▸ و متغیر محیطی مغز سرور را به این مسیر اشاره دهید:"
echo "     export SETAYESH_VAULT=$DEST"
echo ""
echo "از این پس مغز سرور قبل هر اجرا pull و بعد از آن push می‌کند — دو مغز متصل‌اند 🔗"
