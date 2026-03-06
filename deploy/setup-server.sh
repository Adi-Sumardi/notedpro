#!/bin/bash
# ============================================
# NotedPro - First-time Server Setup (Hostinger)
# Run this once via SSH: bash setup-server.sh
# ============================================

set -e

DOMAIN="simonik.yapinet.id"
APP_DIR="$HOME/domains/$DOMAIN/app"
PUBLIC_DIR="$HOME/domains/$DOMAIN/public_html"

echo "==> Setting up NotedPro on $DOMAIN"

# Create directory structure
mkdir -p "$APP_DIR/backend"
mkdir -p "$PUBLIC_DIR"

# Check PHP version
echo "==> PHP version:"
php -v | head -1

# Check Composer
if ! command -v composer &> /dev/null; then
    echo "==> Installing Composer..."
    cd /tmp
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar ~/bin/composer 2>/dev/null || {
        mkdir -p ~/bin
        mv composer.phar ~/bin/composer
    }
    chmod +x ~/bin/composer
    echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
    export PATH="$HOME/bin:$PATH"
fi

echo "==> Composer version:"
composer --version 2>/dev/null || ~/bin/composer --version

echo ""
echo "============================================"
echo "Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Add these GitHub Secrets to your repository:"
echo "   SSH_HOST     = 153.92.11.13"
echo "   SSH_PORT     = 65002"
echo "   SSH_USERNAME = u300093989"
echo "   SSH_PASSWORD = (your SSH password)"
echo "   DB_PASSWORD  = (your database password)"
echo ""
echo "2. Push to main branch to trigger CI/CD deployment"
echo "3. After first deploy, verify .env at:"
echo "   $APP_DIR/backend/.env"
echo "============================================"
