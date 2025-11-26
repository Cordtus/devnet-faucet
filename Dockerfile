# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including dev) for building
RUN npm install

# Copy source files needed for build
COPY . .

# Build the Vite frontend with environment variables
ARG VITE_REOWN_PROJECT_ID
ENV VITE_REOWN_PROJECT_ID=${VITE_REOWN_PROJECT_ID}
RUN npm run build

# Now install only production dependencies
RUN rm -rf node_modules && \
    npm install --omit=dev

# Production stage
FROM node:20-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    bash \
    git \
    tini \
    wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package.json package-lock.json ./
COPY --chown=nodejs:nodejs faucet.js config.js ./
COPY --chown=nodejs:nodejs src ./src

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8088

# Use tini as entrypoint to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start the faucet
CMD ["node", "--experimental-modules", "--es-module-specifier-resolution=node", "faucet.js"]