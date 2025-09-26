#!/usr/bin/env bash
set -euo pipefail

# Script para ejecutar todas las pruebas del proyecto
# - Lint
# - Unit tests (Vitest)
# - Build (Vite)
# - Lighthouse (LHCI autorun)
# - Playwright install + E2E, visual y a11y
# Produce artefactos en ./reports/ y playwright-report/

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p reports

echo "==> 1) Lint"
npm run lint

echo "==> 2) Unit tests (Vitest)"
npm run test:unit || { echo "Unit tests failed"; exit 1; }

echo "==> 3) Build (Vite)"
npm run build || { echo "Build failed"; exit 1; }

echo "==> 4) Lighthouse (LHCI autorun)"
# Serve build and run LHCI autorun to temporary public storage
npx http-server ./dist -p 8080 --silent &
HTTP_SERVER_PID=$!
sleep 1
set -o errtrace
if npx -y @lhci/cli@0.8 autorun --collect.url=http://localhost:8080 --upload.target=temporary-public-storage; then
  echo "Lighthouse run completed"
else
  echo "Lighthouse run failed"; kill $HTTP_SERVER_PID || true; exit 1
fi
kill $HTTP_SERVER_PID || true

echo "==> 5) Install Playwright browsers"
npx playwright install --with-deps || { echo "Playwright install failed"; exit 1; }

echo "==> 6) Playwright E2E + visual + a11y"
# This uses scripts configured in package.json
npm run test:e2e || { echo "E2E tests failed"; exit 1; }
npm run test:visual || echo "Visual tests returned non-zero (check failures)"
npm run test:a11y || echo "A11y tests returned non-zero (check warnings)"

echo "All tests completed. Reports in playwright-report/ and LHCI output (temporary storage)."

exit 0
