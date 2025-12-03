# PowerShell deployment script for Aixiv Insights

Write-Host "🚀 Starting deployment of Aixiv Insights..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "❌ Docker Compose is not installed. Please install it and try again." -ForegroundColor Red
    exit 1
}

# Build the image
Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
docker build -t aixiv-insights:latest .

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Start the application
Write-Host "🚀 Starting the application..." -ForegroundColor Yellow
docker-compose up -d

# Wait for the application to be ready
Write-Host "⏳ Waiting for application to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if the application is running
try {
    Invoke-WebRequest -Uri "http://localhost:43123/health" -UseBasicParsing | Out-Null
    Write-Host "✅ Application is running successfully!" -ForegroundColor Green
    Write-Host "🌐 Access your app at: http://localhost:43123" -ForegroundColor Cyan
    Write-Host "📊 Health check: http://localhost:43123/health" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Application failed to start. Check logs with: docker-compose logs" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
