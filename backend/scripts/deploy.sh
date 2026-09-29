#!/usr/bin/env bash
# Deploys the Worker: the Python API plus the static site in frontend/out. Used locally (npm run deploy) and by
# Cloudflare's Git builds (deploy command: npm run deploy:worker).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f ../frontend/out/index.html ]; then
  echo "frontend/out is missing: run 'npm run build' first" >&2
  exit 1
fi
if ! command -v uv >/dev/null 2>&1; then
  # Cloudflare's build image has Python but not uv, which pywrangler uses to bundle the Python packages
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi
npm install --no-audit --no-fund --silent   # wrangler, pinned in backend/package.json
uv run pywrangler deploy
