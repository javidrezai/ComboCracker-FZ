#!/usr/bin/env bash
# نصب مغز ستایش به‌عنوان سرویسِ دائمی روی سرور (systemd).
# مغز در بوت بالا می‌آید، خودکار به اولاما وصل می‌شود و وبهوک/داشبورد را سرو می‌کند.
#
# استفاده:  sudo bash setayesh/deploy/install-server.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE=/etc/systemd/system/setayesh-brain.service

if [ "$(id -u)" -ne 0 ]; then
  echo "لطفاً با sudo اجرا کنید: sudo bash $0"; exit 1
fi

echo "▸ نصب سرویس از $ROOT"
sed "s#__ROOT__#$ROOT#g" "$ROOT/deploy/setayesh-brain.service" > "$SERVICE"

systemctl daemon-reload
systemctl enable setayesh-brain.service
systemctl restart setayesh-brain.service

echo ""
echo "✅ سرویس نصب و فعال شد."
echo "  وضعیت:   systemctl status setayesh-brain"
echo "  لاگ:     journalctl -u setayesh-brain -f"
echo "  وبهوک:   http://localhost:8787   (داشبورد وب روی GET /)"
