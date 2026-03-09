FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
ENV NODE_ENV=production
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Runtime dependencies for better-sqlite3 native addon and healthcheck
RUN apk add --no-cache wget libstdc++

# Copy standalone output (includes node_modules for serverExternalPackages)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Ensure sqlite data directory exists
RUN mkdir -p /app/sqlite-data

EXPOSE 3000
CMD ["node", "server.js"]
