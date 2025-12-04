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

# Python backend stage - build dependencies in isolated environment
# Use Alpine to match the final nginx:alpine base
FROM python:3.11-alpine AS backend

WORKDIR /app

# Install build dependencies needed for some Python packages
RUN apk add --no-cache gcc musl-dev libffi-dev

# Copy backend requirements
COPY backend/requirements.txt ./

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/main.py ./

# Final production stage with nginx
FROM nginx:alpine

# Install Python, wget, CA certificates, and build dependencies for Python packages
RUN apk add --no-cache python3 py3-pip wget ca-certificates gcc musl-dev libffi-dev

WORKDIR /app

# Copy Python virtual environment from backend stage
COPY --from=backend /opt/venv /opt/venv

# Recreate venv with system Python3 to fix path issues
# The venv from python:3.11-alpine has hardcoded paths that don't work in nginx:alpine
RUN rm -rf /opt/venv && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip

# Copy requirements and install dependencies using the new venv
COPY backend/requirements.txt /tmp/requirements.txt
RUN /opt/venv/bin/pip install --no-cache-dir -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

# Copy backend code
COPY backend/main.py ./

# Copy built frontend from frontend-builder stage (Vite outputs to frontend/dist due to root config)
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Environment variables
ENV PORT=80
ENV PROXY_PORT=5000
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:$PATH"

EXPOSE 80 5000

# Start both backend and nginx
CMD ["./docker-entrypoint.sh"]
