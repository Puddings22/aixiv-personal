#!/bin/bash

echo "📦 Installing dependencies for Aixiv Insights..."

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "🗑️  Removing existing node_modules..."
    rm -rf node_modules
fi

# Check if package-lock.json exists
if [ -f "package-lock.json" ]; then
    echo "🗑️  Removing existing package-lock.json..."
    rm -f package-lock.json
fi

echo "🔧 Installing dependencies..."
npm install

echo "✅ Dependencies installed successfully!"
echo "🚀 You can now run: npm run dev"
