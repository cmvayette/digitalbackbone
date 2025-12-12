# C-ATO Hardened Dockerfile for Tier-1 App
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace root files
COPY package*.json ./
COPY tsconfig*.json ./

# Copy packages
COPY packages/ packages/

# Copy the app
COPY apps/org-chart/ apps/org-chart/

# Install dependencies
RUN npm ci

# Build dependencies
RUN npm run build --workspace packages/som-shared-types
RUN npm run build --workspace packages/api-client
RUN npm run build --workspace packages/ui-components

# Build App
RUN npm run build --workspace apps/org-chart

# Runner Stage
FROM nginxinc/nginx-unprivileged:alpine

# Copy built assets
COPY --from=builder /app/apps/org-chart/dist /usr/share/nginx/html

# Expose port (default 8080 for unprivileged nginx)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
