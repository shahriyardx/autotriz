#!/bin/sh
# Applies pending migrations, then hands over to the server.
#
# Drizzle records what it has already run, so this is safe on every boot
# and safe when several containers start at once — the first to reach the
# lock wins and the rest find nothing to do.
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set. The container cannot start without it." >&2
  exit 1
fi

# Both the probe and the migration run from /app/migrate, which is where
# the drizzle and postgres packages live.
cd /app/migrate

echo "→ Waiting for the database…"
i=1
until bun --eval "
  import postgres from 'postgres';
  const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 2, connect_timeout: 5 });
  await sql\`select 1\`;
  await sql.end();
" >/dev/null 2>&1; do
  if [ "$i" -ge 30 ]; then
    echo "The database did not become reachable in time." >&2
    exit 1
  fi
  i=$((i + 1))
  sleep 2
done

echo "→ Applying migrations…"
bun run migrate.ts
cd /app

echo "→ Starting the server on ${HOSTNAME:-0.0.0.0}:${PORT:-3000}"
exec "$@"
