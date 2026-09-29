#!/usr/bin/env bash
# On Cloudflare's Git builds (WORKERS_CI / CI set), makes the repo deployable by the default deploy command,
# a plain `npx wrangler deploy` from the root: bundles the Python packages and points wrangler at
# backend/wrangler.jsonc. Locally it does nothing; `npm run deploy` goes through pywrangler in backend/ instead.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -n "${WORKERS_CI:-}${CI:-}" ] || exit 0

if ! command -v uv >/dev/null 2>&1; then
  # the build image has Python but not uv, which pywrangler uses to bundle the Python packages
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi
npm install --no-audit --no-fund --silent   # wrangler, pinned in backend/package.json
uv run pywrangler sync

# run from the root, wrangler follows this redirect to backend/wrangler.jsonc, and bundles the packages from
# ./python_modules (it looks where it's run, not next to the config)
mkdir -p ../.wrangler/deploy
echo '{ "configPath": "../../backend/wrangler.jsonc" }' > ../.wrangler/deploy/config.json
ln -sfn backend/python_modules ../python_modules
