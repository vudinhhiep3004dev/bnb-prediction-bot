#!/bin/bash

################################################################################
# BNB Prediction Bot - Deploy Bot Script
# 
# Script deploy/update bot (sau khi server đã được setup)
# Usage: ./scripts/deploy-bot.sh
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="bnb-prediction-bot"

print_step() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         BNB PREDICTION BOT - DEPLOY/UPDATE                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    echo ""
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo -e "${YELLOW}Please edit .env file with your credentials:${NC}"
    echo "  nano .env"
    echo ""
    echo "Required variables:"
    echo "  - TELEGRAM_BOT_TOKEN"
    echo "  - CLOUDFLARE_ACCOUNT_ID"
    echo "  - CLOUDFLARE_GATEWAY_ID"
    echo "  - GOOGLE_AI_STUDIO_API_KEY"
    echo ""
    read -p "Press Enter after editing .env file..."
fi

# Validate .env
print_step "Validating .env configuration..."
if ! grep -q "TELEGRAM_BOT_TOKEN=.\+" .env || \
   ! grep -q "CLOUDFLARE_ACCOUNT_ID=.\+" .env || \
   ! grep -q "CLOUDFLARE_GATEWAY_ID=.\+" .env || \
   ! grep -q "GOOGLE_AI_STUDIO_API_KEY=.\+" .env; then
    print_error "Missing required environment variables in .env"
    echo "Please check your .env file"
    exit 1
fi
echo -e "${GREEN}✓${NC} Configuration validated"

# Install dependencies
print_step "Installing dependencies..."
if command -v bun &> /dev/null; then
    bun install
else
    npm install
fi
echo -e "${GREEN}✓${NC} Dependencies installed"

# Build project
print_step "Building project..."
if command -v bun &> /dev/null; then
    bun run build
else
    npm run build
fi
echo -e "${GREEN}✓${NC} Project built"

# Check if bot is already running
if pm2 list | grep -q "$APP_NAME"; then
    print_step "Bot is already running, restarting..."
    pm2 restart $APP_NAME
    echo -e "${GREEN}✓${NC} Bot restarted"
else
    print_step "Starting bot with PM2..."
    pm2 start ecosystem.config.cjs
    pm2 save
    echo -e "${GREEN}✓${NC} Bot started"
fi

# Setup PM2 startup (if not already done)
if ! systemctl is-enabled pm2-root &> /dev/null; then
    print_step "Setting up PM2 auto-start..."
    pm2 startup systemd -u root --hp /root
    pm2 save
    echo -e "${GREEN}✓${NC} PM2 auto-start configured"
fi

# Setup log rotation (if not already done)
if ! pm2 list | grep -q "pm2-logrotate"; then
    print_step "Setting up log rotation..."
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 7
    pm2 set pm2-logrotate:compress true
    echo -e "${GREEN}✓${NC} Log rotation configured"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ DEPLOYMENT COMPLETED!                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show bot status
echo -e "${BLUE}Bot Status:${NC}"
pm2 status $APP_NAME
echo ""

# Show logs preview
echo -e "${BLUE}Recent Logs:${NC}"
pm2 logs $APP_NAME --lines 10 --nostream
echo ""

# Show useful commands
echo -e "${BLUE}Useful Commands:${NC}"
echo "  pm2 logs $APP_NAME      - View logs"
echo "  pm2 restart $APP_NAME   - Restart bot"
echo "  pm2 stop $APP_NAME      - Stop bot"
echo "  pm2 monit               - Monitor resources"
echo ""

# Test bot
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Open Telegram and find your bot"
echo "  2. Send /start command"
echo "  3. Try /predict command"
echo "  4. Monitor logs: pm2 logs $APP_NAME"
echo ""

print_step "Deployment completed successfully!"

