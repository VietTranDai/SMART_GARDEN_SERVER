#!/bin/bash

echo "🔄 Restarting Smart Garden Server..."
echo "=================================="

# Stop all services
echo "⏹️  Stopping containers..."
docker-compose down

# Clean build cache (optional)
echo "🧹 Cleaning Docker cache..."
docker system prune -f

# Rebuild without cache
echo "🔨 Building containers..."
docker-compose build --no-cache

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Show status
echo "📊 Container status:"
docker-compose ps

echo "✅ Restart completed!"
echo "🌐 Server should be available at: http://localhost:3456"