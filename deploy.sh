#!/bin/bash
# ==============================================================================
# CryptoOS — Automated VPS Production Deployment Script
# ==============================================================================
set -e

echo "=========================================================="
echo "  🚀 Starting CryptoOS Production Deployment"
echo "=========================================================="

# 1. Verify Docker & Docker Compose installation
command -v docker >/dev/null 2>&1 || { 
    echo "❌ Docker is not installed. Please install Docker first:";
    echo "   curl -fsSL https://get.docker.com | sh";
    exit 1; 
}

# 2. Check environment file
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "❗ Please edit .env with your real JWT_SECRET and MASTER_PASSWORD_HASH before continuing."
    exit 1
fi

# 3. Create persistent directories
echo "📁 Ensuring persistent storage directories exist..."
mkdir -p backend/data
mkdir -p certbot/conf
mkdir -p certbot/www

# 4. Build and start containers
echo "🐳 Building and starting Docker containers..."
docker compose down || true
docker compose up -d --build

echo ""
echo "=========================================================="
echo "  ✅ CryptoOS is now successfully running!"
echo "  🌐 Access the application at: http://localhost"
echo "=========================================================="
echo ""
echo "Useful Commands:"
echo "  - View backend logs:   docker compose logs -f backend"
echo "  - View frontend logs:  docker compose logs -f frontend"
echo "  - View proxy logs:     docker compose logs -f nginx"
echo "  - Backup database:     cp backend/data/cryptoos.db backend/data/backup_\$(date +%F).db"
echo "  - Stop services:       docker compose down"
echo "=========================================================="
