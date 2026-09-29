"""Write backend/data.sql: the people in the local snug.db (and their preferences, tune picks and check-ins) as
INSERTs for D1, so moving to Cloudflare keeps everyone's settings. Sessions aren't copied; people sign in again.

    npm run db:import    # runs this, then loads data.sql into the remote D1 database
"""

import sqlite3
from pathlib import Path

here = Path(__file__).resolve().parents[1]
db = sqlite3.connect(here / 'snug.db')
db.row_factory = sqlite3.Row
SKIP = "email NOT LIKE '%@example.com'"  # test accounts


def lit(v):
    if v is None:
        return 'NULL'
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def inserts(table, where, *args):
    rows = db.execute(f'SELECT * FROM {table} WHERE {where}', args).fetchall()
    return [f'INSERT OR IGNORE INTO {table} ({", ".join(r.keys())}) VALUES ({", ".join(lit(r[k]) for k in r.keys())});' for r in rows]


users = f'user_id IN (SELECT id FROM users WHERE {SKIP})'
out = inserts('users', SKIP)
out += inserts('preferences', users)
# only the forecasts check-ins point at; the rest were just the hourly cache
out += inserts('forecasts', f'id IN (SELECT forecast_id FROM checkins WHERE {users})')
out += inserts('checkins', users)
out += inserts('tune_picks', users)
(here / 'data.sql').write_text('\n'.join(out) + '\n')
print(f'wrote backend/data.sql ({len(out)} rows)')
