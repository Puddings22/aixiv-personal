#!/bin/sh
set -e

# Start Python backend in background
echo "Starting Python backend on port 5000..."
cd /app
python3 main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start nginx in foreground
echo "Starting nginx on port 80..."
exec nginx -g "daemon off;"
