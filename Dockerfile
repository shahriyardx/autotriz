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

ARG BUN_VERSION=1.4

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

# Next.js reads `next.config.ts` at build time, and `R2_PUBLIC_URL` decides
# which remote host images may be loaded from. Pass it in with
# `--build-arg R2_PUBLIC_URL=https://cdn.example.com` so the allow-list is
# correct; without it the config falls back to its default.
ARG R2_PUBLIC_URL
ENV R2_PUBLIC_URL=${R2_PUBLIC_URL}

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# There is no database while the image is built. The client is only
# constructed from this, never connected to: every route that reads data
# is rendered per request. The real value is injected at runtime.
ENV DATABASE_URL=postgres://build:build@127.0.0.1:5432/build
ENV AUTH_SECRET=build-only-secret-not-used-at-runtime

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

# `wget` is used by the health check below.
RUN apk add --no-cache wget

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

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/api/health || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bun", "server.js"]
