# C-ATO Hardened Dockerfile - Iron Bank Edition
# Multi-stage build for minimal surface area
# Uses DoD Iron Bank hardened images

# Stage 1: Build
FROM registry1.dso.mil/ironbank/opensource/nodejs/nodejs20:latest AS builder

# Iron Bank runs as 'node' user (UID 1001) by default
# Need to ensure /app is writable
USER root
WORKDIR /app
RUN chown -R node:node /app
USER node

# Copy package files and TypeScript config
COPY --chown=node:node package*.json ./
COPY --chown=node:node tsconfig*.json ./
COPY --chown=node:node packages/ packages/
COPY --chown=node:node apps/som-tier0/ apps/som-tier0/

# Install dependencies (for all workspaces in monorepo)
RUN npm ci

# Build all workspaces (shared packages first, then apps)
# This ensures @som/shared-types is built before som-tier0 tries to import it
RUN npm run build

# Stage 2: Runtime
FROM registry1.dso.mil/ironbank/opensource/nodejs/nodejs20:latest

WORKDIR /app

# Iron Bank image already includes 'node' user (UID 1001)
# No need to create a new user

# Copy only production artifacts from builder
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/som-tier0/dist ./dist
COPY --from=builder --chown=node:node /app/apps/som-tier0/package.json ./

# Switch to non-root user (node user already exists)
USER node

# Environment configuration
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck (note: Iron Bank images may not have wget; use curl or node)
# Iron Bank UBI images typically include curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health/liveness || exit 1

EXPOSE 3000

CMD ["node", "dist/server.js"]
