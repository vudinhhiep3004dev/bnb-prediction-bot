#!/bin/bash

################################################################################
# BNB Prediction Bot - Remote Deploy Script
# 
# Deploy directly to server via SSH
# Usage: ./scripts/deploy-remote.sh your-server-ip
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

# Check if server IP provided
if [ -z "$1" ]; then
    print_error "Please provide server IP"
    echo "Usage: ./scripts/deploy-remote.sh your-server-ip"
    exit 1
fi

SERVER_IP="$1"
SERVER_USER="root"
BOT_PATH="/root/bnb-prediction-bot"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         DEPLOY TO SERVER: $SERVER_IP                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Test SSH connection
print_step "Testing SSH connection..."
if ssh -o ConnectTimeout=5 $SERVER_USER@$SERVER_IP "echo 'Connected'" &> /dev/null; then
    echo -e "${GREEN}✓${NC} SSH connection successful"
else
    print_error "Cannot connect to server"
    exit 1
fi

# Step 2: Deploy to server
print_step "Deploying to server..."
ssh $SERVER_USER@$SERVER_IP "cd $BOT_PATH && ./scripts/update-bot.sh"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ DEPLOY COMPLETED!                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 3: Show bot status
print_step "Checking bot status..."
ssh $SERVER_USER@$SERVER_IP "pm2 status bnb-prediction-bot"

echo ""
print_step "Recent logs:"
ssh $SERVER_USER@$SERVER_IP "pm2 logs bnb-prediction-bot --lines 10 --nostream"

echo ""
echo -e "${YELLOW}Deploy completed! Test the bot with /predict command.${NC}"

