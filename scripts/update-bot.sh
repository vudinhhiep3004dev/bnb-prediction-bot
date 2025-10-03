#!/bin/bash

################################################################################
# BNB Prediction Bot - Update Script
# 
# Script cập nhật bot lên phiên bản mới
# Usage: ./scripts/update-bot.sh
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

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         BNB PREDICTION BOT - UPDATE                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Backup .env
print_step "Backing up .env file..."
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓${NC} .env backed up"
else
    print_error ".env file not found!"
    exit 1
fi

# Pull latest changes
print_step "Pulling latest changes from git..."
git fetch origin
git pull origin main
echo -e "${GREEN}✓${NC} Code updated"

# Update dependencies
print_step "Updating dependencies..."
if command -v bun &> /dev/null; then
    bun install
else
    npm install
fi
echo -e "${GREEN}✓${NC} Dependencies updated"

# Rebuild
print_step "Rebuilding project..."
if command -v bun &> /dev/null; then
    bun run build
else
    npm run build
fi
echo -e "${GREEN}✓${NC} Project rebuilt"

# Restart bot
print_step "Restarting bot..."
pm2 restart $APP_NAME
echo -e "${GREEN}✓${NC} Bot restarted"

# Wait a bit for bot to start
sleep 3

# Check status
print_step "Checking bot status..."
if pm2 list | grep -q "$APP_NAME.*online"; then
    echo -e "${GREEN}✓${NC} Bot is running"
else
    print_error "Bot failed to start!"
    echo "Check logs: pm2 logs $APP_NAME"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ UPDATE COMPLETED!                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show status
pm2 status $APP_NAME
echo ""

# Show recent logs
echo -e "${BLUE}Recent Logs:${NC}"
pm2 logs $APP_NAME --lines 10 --nostream
echo ""

print_step "Update completed successfully!"
echo ""
echo -e "${YELLOW}Please test the bot to ensure everything works correctly.${NC}"

