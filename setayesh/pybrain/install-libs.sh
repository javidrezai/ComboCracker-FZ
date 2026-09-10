#!/usr/bin/env bash
# Download the important Python libraries into the local store (pybrain/libs)
# so the brain can use them, even offline afterwards. Safe to re-run.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
PY="python3"; command -v python3 >/dev/null 2>&1 || PY="python"
echo "📦 نصب کتابخانه‌های مهم پایتون در $HERE/libs ..."
"$PY" -m pip install --upgrade --target "$HERE/libs" -r "$HERE/requirements-libs.txt"
echo "✅ تمام. مغز ستایش حالا این کتابخانه‌ها را دارد."
