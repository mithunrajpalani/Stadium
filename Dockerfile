# Stage 1: Build Image
FROM node:20-alpine AS build

WORKDIR /app

# Copy package configurations
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci || npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production Image
FROM nginx:alpine

# Copy built assets to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Replace default Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Start Nginx honoring the PORT environment variable
CMD sed -i -e "s/8080/${PORT:-8080}/g" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
