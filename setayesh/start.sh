#!/usr/bin/env bash
# Setayesh AI launcher for macOS / Linux.
# Double-click on macOS (rename to start.command) or run: ./start.sh
set -u
cd "$(dirname "$0")"

echo
echo "  ============================================"
echo "     Starting Setayesh AI"
echo "  ============================================"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "  [!] Node.js is not installed. Install the LTS from https://nodejs.org and run this again."
  read -r -p "  Press Enter to close..." _
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "  First run: installing dependencies (one time)..."
  echo
  if ! npm install --no-audit --no-fund; then
    echo
    echo "  [!] npm install failed. Check your internet connection and run this again."
    read -r -p "  Press Enter to close..." _
    exit 1
  fi
  echo
fi

# Use the OS trust store when Node supports it (20.6+); fall back cleanly.
CA=""
if node --use-system-ca -e "0" >/dev/null 2>&1; then CA="--use-system-ca"; fi

# Enable the in-app Restart button: this launcher relaunches on exit code 88.
export SETAYESH_RELAUNCH=1

echo "  Open http://localhost:3000 in your browser. Keep this window open while you use Setayesh."
echo

# Open the browser once, a few seconds after the server starts.
( sleep 3; (command -v open >/dev/null 2>&1 && open http://localhost:3000) \
  || (command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:3000) ) >/dev/null 2>&1 &

while true; do
  node $CA index.js
  code=$?
  if [ "$code" = "88" ]; then
    echo; echo "  Restarting Setayesh..."; echo
    continue
  fi
  break
done

echo
echo "  Setayesh has stopped. You can close this window."
