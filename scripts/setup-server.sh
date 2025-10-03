#!/bin/bash

################################################################################
# BNB Prediction Bot - Server Setup Script
# 
# Script cài đặt môi trường server (Node.js, Bun, PM2)
# Usage: ./scripts/setup-server.sh
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root (use sudo)"
        exit 1
    fi
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         BNB PREDICTION BOT - SERVER SETUP                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

check_root

# Update system
print_step "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git build-essential
echo -e "${GREEN}✓${NC} System updated"

# Install Node.js 20
print_step "Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✓${NC} Node.js $(node --version) installed"
else
    echo -e "${YELLOW}⚠${NC} Node.js already installed: $(node --version)"
fi

# Install Bun
print_step "Installing Bun..."
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    # Add to bashrc
    if ! grep -q "BUN_INSTALL" ~/.bashrc; then
        echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
        echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
    fi
    
    echo -e "${GREEN}✓${NC} Bun installed"
else
    echo -e "${YELLOW}⚠${NC} Bun already installed"
fi

# Install PM2
print_step "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✓${NC} PM2 installed"
else
    echo -e "${YELLOW}⚠${NC} PM2 already installed: $(pm2 --version)"
fi

# Setup firewall
print_step "Setting up firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    echo -e "${GREEN}✓${NC} Firewall configured"
else
    apt-get install -y ufw
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    echo -e "${GREEN}✓${NC} Firewall installed and configured"
fi

# Create logs directory
print_step "Creating logs directory..."
mkdir -p /var/log/bnb-prediction-bot
chmod 755 /var/log/bnb-prediction-bot
echo -e "${GREEN}✓${NC} Logs directory created"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ SERVER SETUP COMPLETED!                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Installed:${NC}"
echo "  • Node.js: $(node --version)"
echo "  • npm: $(npm --version)"
echo "  • Bun: $($HOME/.bun/bin/bun --version)"
echo "  • PM2: $(pm2 --version)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Clone your repository"
echo "  2. Run: ./scripts/deploy-bot.sh"
echo ""

