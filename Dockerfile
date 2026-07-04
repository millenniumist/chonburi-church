# Multi-stage Dockerfile for Next.js production deployment

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies using the available lock file
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm install --legacy-peer-deps; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  else echo "No lockfile found. Installing with npm..." && npm install --legacy-peer-deps; \
  fi

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
# Disable hot-swap during build by unsetting SECONDARY
ENV DATABASE_URL_SECONDARY=
# Use placeholder DB URL during build (won't actually connect)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Generate Prisma Client
RUN npx prisma generate

# Bump Node heap so TS check / Payload don't OOM during build
ENV NODE_OPTIONS="--max-old-space-size=6144"

# Clean any existing build artifacts
RUN rm -rf .next

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy Prisma files
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy lib directory (for logger and other utilities)
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

# Copy Google Sheets credentials
COPY --from=builder --chown=nextjs:nodejs /app/privatekey-gsheet.json ./privatekey-gsheet.json

# Create bulletins directory with proper ownership before switching to nextjs user
RUN mkdir -p /app/bulletins && chown -R nextjs:nodejs /app/bulletins

USER nextjs

EXPOSE 8358

ENV PORT=8358
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
