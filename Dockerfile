FROM node:22-alpine

# Install system dependencies including curl
RUN apk add --no-cache curl python3 make g++ && \
    adduser -S app

WORKDIR /app

# Install ALL dependencies first (including dev dependencies for build)
COPY package*.json ./
RUN npm ci

# Generate Prisma
COPY prisma ./prisma/
RUN npx prisma generate

# Build app
COPY . .
RUN npm run build && \
    rm -rf src/ *.config.* tsconfig*.json nest-cli.json README.md

# Remove dev dependencies after build
RUN npm ci --only=production && npm cache clean --force

# Ensure directories exist and set permissions
RUN mkdir -p pictures logs && \
    chown -R app /app

USER app

ENV NODE_ENV=production PORT=3000

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:3000/v1/health/liveness || exit 1

EXPOSE 3000
CMD ["node", "dist/main"]