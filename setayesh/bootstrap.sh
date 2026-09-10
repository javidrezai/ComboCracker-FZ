#!/usr/bin/env bash
# نصب یک‌خطی مغز ستایش:
#   curl -fsSL https://raw.githubusercontent.com/javidrezai/ComboCracker-FZ/claude/setayesh-project-continuation-tcud92/setayesh/bootstrap.sh | bash
set -euo pipefail
REPO="${SETAYESH_REPO:-https://github.com/javidrezai/ComboCracker-FZ.git}"
BRANCH="${SETAYESH_BRANCH:-claude/setayesh-project-continuation-tcud92}"
DIR="${SETAYESH_DIR:-$HOME/ComboCracker-FZ}"

echo "🧠 نصب یک‌خطی مغز ستایش"
if ! command -v git >/dev/null 2>&1; then echo "❌ git لازم است."; exit 1; fi

if [ -d "$DIR/.git" ]; then
  echo "▸ به‌روزرسانی $DIR"
  git -C "$DIR" pull --ff-only || true
else
  echo "▸ دریافت به $DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$DIR"
fi

bash "$DIR/setayesh/install.sh" "$@"
