# C-ATO Hardened Dockerfile
# Multi-stage build for minimal surface area

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ packages/
COPY apps/som-tier0/ apps/som-tier0/
RUN npm ci
RUN npm run build --workspace apps/som-tier0

# Stage 2: Runner
FROM node:20-alpine
WORKDIR /app

# Harden: Create non-root user
RUN addgroup -S somgroup && adduser -S somuser -G somgroup
USER somuser

# Copy only necessary artifacts
COPY --from=builder --chown=somuser:somgroup /app/package*.json ./
COPY --from=builder --chown=somuser:somgroup /app/node_modules ./node_modules
COPY --from=builder --chown=somuser:somgroup /app/apps/som-tier0/dist ./dist
COPY --from=builder --chown=somuser:somgroup /app/apps/som-tier0/package.json ./

# Environment configuration
ENV NODE_ENV=production
ENV PORT=3000

# Healthchecks
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:3000/health/liveness || exit 1

EXPOSE 3000

CMD ["node", "dist/server.js"]
