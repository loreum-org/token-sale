# Stage 1: Build dependencies and application
FROM node:18-alpine AS builder

# Install necessary build tools for native dependencies
RUN apk add --no-cache python3 make g++ gcc libc6-compat curl git

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with explicit platform target
ENV NEXT_TELEMETRY_DISABLED 1
ENV TAILWIND_OXIDE_TARGET musl

# Clean install with proper rebuild of native modules
RUN npm ci --no-audit --no-optional && \
    npm rebuild --force

# Copy the rest of the application
COPY . .

# Build using our specialized docker build script
RUN npm run build:docker

# Stage 2: Create a minimal production image
FROM node:18-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the necessary files from the build stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"] 