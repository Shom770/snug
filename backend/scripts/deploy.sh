#!/usr/bin/env bash
# Deploys the Worker from your machine (the Python API plus the static site in frontend/out). Run `npm run build` first.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f ../frontend/out/index.html ]; then
  echo "frontend/out is missing: run 'npm run build' first" >&2
  exit 1
fi
uv run pywrangler deploy
