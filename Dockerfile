# Multi-stage Dockerfile for the Coffee & Gospel Next.js app (ARM64 / Raspberry Pi).

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm install --legacy-peer-deps; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  else echo "No lockfile found. Installing with npm..." && npm install --legacy-peer-deps; \
  fi

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Build runs strict tsc; no DB connection is needed at build time (Drizzle has no
# codegen step), so a placeholder URL keeps env validation happy.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
# Headroom for the TS type-check during build.
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN rm -rf .next
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Runtime caps for the Pi (compose env can override).
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV UV_THREADPOOL_SIZE=8

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Next.js standalone output bundles the server + only the node_modules it needs.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8358
ENV PORT=8358
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
