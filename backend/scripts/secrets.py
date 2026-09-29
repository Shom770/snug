"""Copy the settings snug needs from the repo-root .env into the Cloudflare Worker as secrets.

    uv run python scripts/secrets.py          # production (wrangler secret bulk)
    uv run python scripts/secrets.py --local  # writes .dev.vars for `npm run preview`
"""

import json
import subprocess
import sys
from pathlib import Path

from dotenv import dotenv_values

KEYS = ('OPENROUTER_KEY', 'GOOGLE_CLIENT_ID', 'NWS_USER_AGENT', 'JEV_MODEL')
here = Path(__file__).resolve().parents[1]
env = dotenv_values(here.parent / '.env')
values = {k: env[k] for k in KEYS if env.get(k)}
missing = [k for k in KEYS[:3] if k not in values]
if missing:
    sys.exit(f'missing in .env: {", ".join(missing)}')

if '--local' in sys.argv:
    (here / '.dev.vars').write_text(''.join(f'{k}={json.dumps(v)}\n' for k, v in values.items()) + 'SNUG_ENV=development\n')
    print('wrote backend/.dev.vars:', ', '.join(values))
else:
    subprocess.run(['npx', 'wrangler', 'secret', 'bulk'], input=json.dumps(values), text=True, cwd=here, check=True)
    print('set secrets:', ', '.join(values))
