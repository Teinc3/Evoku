# Build stage
FROM node:24 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the application (client and server)
RUN npm run build


# Runtime stage
FROM node:24-slim AS runtime

WORKDIR /app

# Copy package files
COPY package*.json ./

# Set production environment
ENV NODE_ENV=production

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy config files
COPY --from=builder /app/config ./config

# Expose the port (from server config)
EXPOSE 8080

# Use a non-root user for better security
USER node

# Start the server
CMD ["npm", "start"]
