# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the index
RUN npm run build:index

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.25-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 (OpenShift runs containers as non-root)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
