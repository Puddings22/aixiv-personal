#!/bin/sh
set -e

# Function to handle shutdown
cleanup() {
    echo "Shutting down..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    nginx -s quit 2>/dev/null || true
    exit 0
}

# Trap signals
trap cleanup SIGTERM SIGINT

# Start Python backend in background using virtual environment
echo "Starting Python backend on port 5000..."
cd /app
/opt/venv/bin/python main.py &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in 1 2 3 4 5 6 7 8 9 10; do
    if wget --quiet --tries=1 -O /dev/null http://localhost:5000/health 2>/dev/null; then
        echo "Backend is ready!"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "Warning: Backend did not become ready in time, continuing anyway..."
    else
        sleep 1
    fi
done

# Start nginx in foreground
echo "Starting nginx on port 80..."
exec nginx -g "daemon off;"
