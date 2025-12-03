# Multi-stage build for production
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install --no-audit --no-fund

# Copy frontend source code
COPY frontend ./frontend

# Build frontend
RUN npm run build

# Python backend stage
FROM python:3.11-slim AS backend

WORKDIR /app

# Copy backend requirements
COPY backend/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/main.py ./

# Final production stage with nginx
FROM nginx:alpine

# Install Python and dependencies for backend
RUN apk add --no-cache python3 py3-pip && \
    python3 -m pip install --no-cache-dir --upgrade pip

WORKDIR /app

# Copy Python backend from backend stage
COPY --from=backend /app/requirements.txt ./
COPY backend/main.py ./

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Environment variables
ENV PORT=80
ENV PROXY_PORT=5000
ENV PYTHONUNBUFFERED=1

EXPOSE 80 5000

# Start both backend and nginx
CMD ["./docker-entrypoint.sh"]
