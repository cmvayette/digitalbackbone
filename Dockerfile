# C-ATO Hardened Dockerfile
# Multi-stage build for minimal surface area

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace root files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy packages first (shared-types must be built before apps)
COPY packages/ packages/

# Copy the app to build
COPY apps/som-tier0/ apps/som-tier0/

# Install all dependencies
RUN npm ci

# Build shared-types FIRST (dependency order)
RUN npm run build --workspace packages/som-shared-types

# Build som-tier0 with TypeScript project references
RUN npm run build --workspace apps/som-tier0

# Stage 2: Runner
FROM node:20-alpine
WORKDIR /app

# Harden: Create non-root user
RUN addgroup -S somgroup && adduser -S somuser -G somgroup

# Copy only necessary artifacts (before changing to non-root user)
# Copy root workspace files first
COPY --from=builder --chown=somuser:somgroup /app/package*.json ./

# Copy node_modules (includes symlinked workspaces)
COPY --from=builder --chown=somuser:somgroup /app/node_modules ./node_modules

# Copy the shared-types package (runtime dependency)
COPY --from=builder --chown=somuser:somgroup /app/packages/som-shared-types ./packages/som-shared-types

# Copy app dist and package.json
COPY --from=builder --chown=somuser:somgroup /app/apps/som-tier0/dist ./apps/som-tier0/dist
COPY --from=builder --chown=somuser:somgroup /app/apps/som-tier0/package.json ./apps/som-tier0/

USER somuser

# Environment configuration
ENV NODE_ENV=production
ENV PORT=3000

# Healthchecks
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:3000/health/liveness || exit 1

EXPOSE 3000

WORKDIR /app/apps/som-tier0
CMD ["node", "dist/server.js"]
