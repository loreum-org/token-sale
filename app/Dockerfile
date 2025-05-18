# Stage 1: Build dependencies and application
FROM node:18-alpine AS builder

# Install necessary build tools
RUN apk add --no-cache python3 make g++ gcc libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with full native build support
RUN npm ci --no-audit

# Copy the rest of the application
COPY . .

# Build the application with forced dependency rebuild
RUN npm rebuild lightningcss --force && \
    npm rebuild tailwindcss --force && \
    ESLINT_DISABLE=true NEXT_IGNORE_ESLINT=1 npm run build

# Stage 2: Create a minimal production image
FROM node:18-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the necessary files from the build stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 