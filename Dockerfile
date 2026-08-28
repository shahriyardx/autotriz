# syntax=docker/dockerfile:1

###############################################################################
# AUTOTRIZ — production image
#
# Built with Bun, run on Bun. Next.js traces the server it needs into
# `.next/standalone`, so the final image carries no project `node_modules`
# beyond the handful of packages the migration step needs.
#
# Migrations run when the container starts, not when it is built: the
# database is reachable at deploy time, not at build time.
###############################################################################

# Pinned so a rebuild months from now produces the same image. The
# lockfile is v2, which needs Bun 1.4 or newer to read.
ARG BUN_VERSION=1.4.0

# ---------------------------------------------------------------------------
# 1. Dependencies — cached until the lockfile changes
# ---------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------------------------------------------------------------------------
# 2. Build
# ---------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# The build needs no configuration of its own: nothing is fetched, and
# every route that reads data is rendered per request. Coolify supplies
# the real values at runtime.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN bun run build

# ---------------------------------------------------------------------------
# 3. Migration dependencies — a tiny tree, kept apart from the traced server
# ---------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS migrator
WORKDIR /migrate

# Only what `src/db/migrate.ts` imports. Versions follow the app's lockfile.
COPY --from=deps /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps /app/node_modules/postgres ./node_modules/postgres

# ---------------------------------------------------------------------------
# 4. Runtime
# ---------------------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user. The bun image already ships `bun:bun` (1000:1000).
RUN mkdir -p /app/.next/cache && chown -R bun:bun /app

# The traced server, then the two folders the standalone server does not
# copy for itself.
COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static
COPY --from=builder --chown=bun:bun /app/public ./public

# Everything the start-up migration needs. The SQL sits beside the script
# so `./drizzle` resolves the same way it does in the repository.
COPY --from=builder --chown=bun:bun /app/drizzle ./migrate/drizzle
COPY --from=builder --chown=bun:bun /app/src/db/migrate.ts ./migrate/migrate.ts
COPY --from=migrator --chown=bun:bun /migrate/node_modules ./migrate/node_modules

COPY --chown=bun:bun docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER bun
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bun", "server.js"]
