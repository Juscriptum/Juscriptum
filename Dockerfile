# ============================================
# PRODUCTION Dockerfile - Law Organizer Backend
# Security-hardened, multi-stage build
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN npm run build

# Prune dev dependencies after build
RUN npm prune --production

# ============================================
# Stage 2: Production Runtime
# ============================================
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user and group early
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy production dependencies from builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Create necessary directories with proper permissions
RUN mkdir -p /app/uploads /app/logs && \
    chown -R nestjs:nodejs /app

# Set secure file permissions
RUN chmod -R 755 /app && \
    chmod 700 /app/logs

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Environment variables for production
ENV NODE_ENV=production \
    PORT=3000

# Health check with proper endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]

# ============================================
# Stage 3: Development (optional)
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
