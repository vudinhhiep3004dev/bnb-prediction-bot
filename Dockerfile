# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN npm install -g bun && bun install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN bun run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install bun
RUN npm install -g bun

# Copy package files
COPY package.json bun.lockb* ./

# Install production dependencies only
RUN bun install --production --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p logs

# Set environment
ENV NODE_ENV=production

# Expose port (if needed for health checks)
EXPOSE 3000

# Start the bot
CMD ["bun", "start"]

