#!/bin/bash

# Deployment script for Aixiv Insights
set -e

echo "🚀 Starting deployment of Aixiv Insights..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it and try again."
    exit 1
fi

# Build the image
echo "🔨 Building Docker image..."
docker build -t aixiv-insights:latest .

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Start the application
echo "🚀 Starting the application..."
docker-compose up -d

# Wait for the application to be ready
echo "⏳ Waiting for application to be ready..."
sleep 10

# Check if the application is running
if curl -f http://localhost:43123/health > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo "🌐 Access your app at: http://localhost:43123"
    echo "📊 Health check: http://localhost:43123/health"
else
    echo "❌ Application failed to start. Check logs with: docker-compose logs"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
