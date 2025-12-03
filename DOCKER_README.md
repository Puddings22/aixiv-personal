# Docker Deployment Guide for Aixiv Insights

This guide will help you deploy the Aixiv Insights application using Docker containers.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- Git (to clone the repository)
- Node.js 18+ and npm (for local development)

## Quick Start

### 0. Local Development (Optional)

If you want to run the app locally first:

```bash
# Install dependencies (use the script to avoid recursion)
chmod +x install-deps.sh
./install-deps.sh

# Or manually:
npm install

# Start development server
npm run dev

# Access at: http://localhost:43123
```

### 1. Build and Run (Development)

```bash
# Build the Docker image
docker build -t aixiv-insights:latest .

# Run the container
docker-compose up -d

# Check logs
docker-compose logs -f

# Access the application
# Open http://localhost:43123 in your browser
```

### 2. Using the Makefile (Linux/Mac)

```bash
# Show available commands
make help

# Build and run
make build
make run

# Stop the container
make stop

# View logs
make logs

# Clean up
make clean

# Local development
make dev
```

### 3. Using the Deployment Scripts

#### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Windows PowerShell:
```powershell
.\deploy.ps1
```

## Production Deployment

For production deployment, use the production docker-compose file:

```bash
# Build for production
docker build -t aixiv-insights:prod .

# Run in production mode
docker-compose -f docker-compose.prod.yml up -d

# Stop production
docker-compose -f docker-compose.prod.yml down
```

## Configuration

### Environment Variables

The application uses the following environment variables:
- `NODE_ENV`: Set to `production` for production builds

### Ports

- **Development**: Port 43123 (mapped to container port 80)
- **Production**: Port 43123 (mapped to container port 80)

### Volumes

- **Development**: No persistent volumes
- **Production**: Logs directory mounted to `/var/log/nginx`

## Docker Commands Reference

### Basic Commands

```bash
# Build image
docker build -t aixiv-insights:latest .

# Run container
docker run -p 43123:80 aixiv-insights:latest

# Stop container
docker stop <container_id>

# Remove container
docker rm <container_id>

# Remove image
docker rmi aixiv-insights:latest
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and start
docker-compose up -d --build

# Stop and remove everything
docker-compose down --rmi all --volumes --remove-orphans
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 43123
   netstat -tulpn | grep :43123
   
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Container won't start**
   ```bash
   # Check container logs
   docker-compose logs
   
   # Check container status
   docker-compose ps
   ```

3. **Build fails**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker build --no-cache -t aixiv-insights:latest .
   ```

### Health Check

The application includes a health check endpoint:
- **URL**: `http://localhost:43123/health`
- **Expected Response**: `healthy`

### Logs

- **Application logs**: `docker-compose logs -f`
- **Nginx logs**: Mounted to `./logs` directory in production

## Performance Optimization

### Resource Limits

Production deployment includes resource limits:
- **Memory**: 512MB limit, 256MB reservation
- **CPU**: 0.5 cores limit, 0.25 cores reservation

### Caching

- Static assets are cached for 1 year
- Gzip compression enabled for all text-based content types
- Browser caching headers configured

## Security Features

- Security headers configured (XSS protection, frame options, etc.)
- Content Security Policy enabled
- No sensitive information exposed in frontend
- All API requests routed through backend

## Monitoring

### Health Checks

The container includes automatic health checks:
- Checks every 30 seconds
- 10-second timeout
- 3 retries before marking unhealthy
- 40-second startup grace period

### Logging

- Structured logging with timestamps
- Access and error logs separated
- Log rotation handled by Docker

## Scaling

To scale the application horizontally:

```bash
# Scale to multiple instances
docker-compose up -d --scale aixiv-insights=3

# Or use Docker Swarm
docker stack deploy -c docker-compose.yml aixiv-stack
```

## Backup and Recovery

### Backup

```bash
# Backup the application data
docker run --rm -v aixiv-insights_data:/data -v $(pwd):/backup alpine tar czf /backup/app-backup.tar.gz -C /data .

# Backup the entire container
docker export aixiv-insights-app > aixiv-insights-backup.tar
```

### Recovery

```bash
# Restore from backup
docker run --rm -v aixiv-insights_data:/data -v $(pwd):/backup alpine tar xzf /backup/app-backup.tar.gz -C /data

# Import container
docker import aixiv-insights-backup.tar aixiv-insights:backup
```

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify Docker is running: `docker info`
3. Check container status: `docker-compose ps`
4. Review the configuration files
5. Check system resources: `docker stats`
