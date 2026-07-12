#!/usr/bin/env bash
# One-command local test for the Delta backend API.
# Usage:  bash test-local.sh          (no database — quick smoke test)
#         bash test-local.sh full     (uses MONGODB_URI from .env)
set -euo pipefail
cd "$(dirname "$0")"

echo "1/4 Checking Node..."
node -v || { echo "Install Node 20+ from nodejs.org first."; exit 1; }

echo "2/4 Installing dependencies (first run only)..."
[ -d node_modules ] || npm install --no-audit --no-fund

echo "3/4 Running unit tests..."
node test/validate.test.js

echo "4/4 Starting server and testing endpoints..."
if [ "${1:-}" = "full" ]; then
  set -a; [ -f .env ] && source .env; set +a
  node src/server.js & SERVER_PID=$!
else
  SKIP_DB=1 node src/server.js & SERVER_PID=$!
fi
trap 'kill $SERVER_PID 2>/dev/null' EXIT
sleep 2

echo; echo "--- health check:"
curl -s localhost:8080/healthz; echo
echo "--- valid inquiry:"
curl -s -X POST localhost:8080/api/inquiries -H 'Content-Type: application/json' \
  -d '{"businessName":"Test Store","email":"test@example.com","message":"Local test"}'; echo
echo "--- invalid inquiry (should list errors):"
curl -s -X POST localhost:8080/api/inquiries -H 'Content-Type: application/json' \
  -d '{"businessName":"No Email"}'; echo
echo
echo "All done. Server still running on http://localhost:8080 — press Ctrl+C to stop."
wait $SERVER_PID
