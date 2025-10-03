#!/bin/bash

# BNB Prediction Bot Deployment Script for Vultr VPS

set -e

echo "================================"
echo "BNB Prediction Bot Deployment"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

echo -e "${GREEN}Step 1: Updating system...${NC}"
apt-get update
apt-get upgrade -y

echo -e "${GREEN}Step 2: Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo -e "${GREEN}Step 3: Installing Bun...${NC}"
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

echo -e "${GREEN}Step 4: Installing PM2...${NC}"
npm install -g pm2

echo -e "${GREEN}Step 5: Creating application directory...${NC}"
APP_DIR="/opt/bnb-prediction-bot"
mkdir -p $APP_DIR
cd $APP_DIR

echo -e "${GREEN}Step 6: Cloning repository...${NC}"
if [ -d ".git" ]; then
  echo "Repository already exists, pulling latest changes..."
  git pull
else
  echo "Enter your repository URL:"
  read REPO_URL
  git clone $REPO_URL .
fi

echo -e "${GREEN}Step 7: Installing dependencies...${NC}"
bun install

echo -e "${GREEN}Step 8: Setting up environment variables...${NC}"
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"
  cp .env.example .env
  echo -e "${YELLOW}Please edit .env file with your credentials:${NC}"
  echo "nano .env"
  echo -e "${YELLOW}Press Enter when done...${NC}"
  read
else
  echo ".env file already exists"
fi

echo -e "${GREEN}Step 9: Building application...${NC}"
bun run build

echo -e "${GREEN}Step 10: Setting up PM2...${NC}"
pm2 delete bnb-prediction-bot 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

echo -e "${GREEN}Step 11: Setting up log rotation...${NC}"
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

echo -e "${GREEN}Step 12: Setting up firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check bot status"
echo "  pm2 logs                - View logs"
echo "  pm2 restart bnb-prediction-bot - Restart bot"
echo "  pm2 stop bnb-prediction-bot    - Stop bot"
echo "  pm2 monit               - Monitor resources"
echo ""
echo -e "${YELLOW}Don't forget to:${NC}"
echo "1. Configure your .env file"
echo "2. Test the bot with /start command"
echo "3. Monitor logs for any errors"
echo ""

