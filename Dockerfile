# ================================
# Multi-stage build cho production
# ================================

# Stage 1: Dependencies & Build
FROM node:22-alpine AS builder

# Metadata
LABEL maintainer="trandaiviet78@gmail.com"
LABEL app="smart-garden-server"
LABEL stage="builder"

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    git

WORKDIR /usr/src/app

# Copy package files for better caching
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install ALL dependencies (including dev deps for build)
RUN npm ci --only=production=false && \
    npm cache clean --force

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY src ./src/

# Build application
RUN npm run build && \
    echo "✅ Build completed successfully" && \
    ls -la dist/ && \
    ls -la dist/src/ && \
    test -f dist/src/main.js || (echo "❌ ERROR: main.js not found!" && exit 1)

# Remove dev dependencies after build
RUN npm prune --production && npm cache clean --force

# ================================
# Stage 2: Production Runtime
# ================================

FROM node:22-alpine AS production

# Metadata
LABEL maintainer="trandaiviet78@gmail.com"
LABEL app="smart-garden-server"
LABEL version="1.0.0"
LABEL environment="production"

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    tzdata && \
    cp /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime && \
    echo "Asia/Ho_Chi_Minh" > /etc/timezone

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /usr/src/app

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist/
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules/
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/package*.json ./

# Copy Prisma files (needed for runtime)
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/prisma ./prisma/

COPY --chown=nestjs:nodejs pictures ./pictures/

RUN mkdir -p pictures/photo_evaluations pictures/post pictures/avatars pictures/gardens && \
    chmod -R 755 pictures

# Switch to non-root user
USER nestjs

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=Asia/Ho_Chi_Minh

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/v1/health/liveness || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/src/main.js"]