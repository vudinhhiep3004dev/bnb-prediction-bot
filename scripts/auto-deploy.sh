#!/bin/bash

################################################################################
# BNB Prediction Bot - Auto Deploy Script
# 
# Script tự động deploy hoàn toàn bot lên VPS Ubuntu 22.04
# Usage: curl -fsSL <script-url> | bash
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="bnb-prediction-bot"
APP_DIR="/opt/$APP_NAME"
REPO_URL="https://github.com/yourusername/bnb-prediction-bot.git"
NODE_VERSION="20"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║         BNB PREDICTION BOT - AUTO DEPLOY SCRIPT           ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root (use sudo)"
        exit 1
    fi
}

# Main deployment steps
main() {
    print_header
    check_root

    # Step 1: Update system
    print_step "Step 1/12: Updating system..."
    apt-get update -qq
    apt-get upgrade -y -qq
    apt-get install -y -qq curl git build-essential
    print_step "✓ System updated"

    # Step 2: Install Node.js
    print_step "Step 2/12: Installing Node.js ${NODE_VERSION}..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - > /dev/null 2>&1
        apt-get install -y -qq nodejs
    fi
    print_step "✓ Node.js $(node --version) installed"

    # Step 3: Install Bun
    print_step "Step 3/12: Installing Bun..."
    if ! command -v bun &> /dev/null; then
        curl -fsSL https://bun.sh/install | bash > /dev/null 2>&1
        export BUN_INSTALL="$HOME/.bun"
        export PATH="$BUN_INSTALL/bin:$PATH"
        echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
        echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
    fi
    print_step "✓ Bun installed"

    # Step 4: Install PM2
    print_step "Step 4/12: Installing PM2..."
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2 > /dev/null 2>&1
    fi
    print_step "✓ PM2 installed"

    # Step 5: Create app directory
    print_step "Step 5/12: Creating application directory..."
    mkdir -p $APP_DIR
    cd $APP_DIR
    print_step "✓ Directory created: $APP_DIR"

    # Step 6: Clone repository
    print_step "Step 6/12: Cloning repository..."
    if [ -d ".git" ]; then
        print_warning "Repository already exists, pulling latest changes..."
        git pull origin main > /dev/null 2>&1
    else
        git clone $REPO_URL . > /dev/null 2>&1
    fi
    print_step "✓ Repository cloned"

    # Step 7: Install dependencies
    print_step "Step 7/12: Installing dependencies..."
    $HOME/.bun/bin/bun install > /dev/null 2>&1
    print_step "✓ Dependencies installed"

    # Step 8: Setup environment
    print_step "Step 8/12: Setting up environment..."
    if [ ! -f ".env" ]; then
        cp .env.example .env
        print_warning "Created .env file - YOU MUST EDIT IT WITH YOUR CREDENTIALS!"
        echo ""
        echo -e "${YELLOW}Please edit .env file now:${NC}"
        echo "  nano $APP_DIR/.env"
        echo ""
        echo "Required variables:"
        echo "  - TELEGRAM_BOT_TOKEN"
        echo "  - CLOUDFLARE_ACCOUNT_ID"
        echo "  - CLOUDFLARE_GATEWAY_ID"
        echo "  - GOOGLE_AI_STUDIO_API_KEY"
        echo ""
        read -p "Press Enter after editing .env file..."
    else
        print_step "✓ .env file already exists"
    fi

    # Step 9: Build application
    print_step "Step 9/12: Building application..."
    $HOME/.bun/bin/bun run build > /dev/null 2>&1
    print_step "✓ Application built"

    # Step 10: Setup PM2
    print_step "Step 10/12: Setting up PM2..."
    pm2 delete $APP_NAME 2>/dev/null || true
    pm2 start ecosystem.config.cjs > /dev/null 2>&1
    pm2 save > /dev/null 2>&1
    
    # Setup PM2 startup
    env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root > /dev/null 2>&1
    print_step "✓ PM2 configured"

    # Step 11: Setup log rotation
    print_step "Step 11/12: Setting up log rotation..."
    pm2 install pm2-logrotate > /dev/null 2>&1
    pm2 set pm2-logrotate:max_size 10M > /dev/null 2>&1
    pm2 set pm2-logrotate:retain 7 > /dev/null 2>&1
    pm2 set pm2-logrotate:compress true > /dev/null 2>&1
    print_step "✓ Log rotation configured"

    # Step 12: Setup firewall
    print_step "Step 12/12: Setting up firewall..."
    if command -v ufw &> /dev/null; then
        ufw --force enable > /dev/null 2>&1
        ufw allow 22/tcp > /dev/null 2>&1
        ufw allow 80/tcp > /dev/null 2>&1
        ufw allow 443/tcp > /dev/null 2>&1
        print_step "✓ Firewall configured"
    else
        print_warning "UFW not found, skipping firewall setup"
    fi

    # Deployment complete
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║              🎉 DEPLOYMENT COMPLETED! 🎉                   ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Show status
    echo -e "${BLUE}Bot Status:${NC}"
    pm2 status $APP_NAME
    echo ""
    
    # Show useful commands
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  pm2 status              - Check bot status"
    echo "  pm2 logs $APP_NAME      - View logs"
    echo "  pm2 restart $APP_NAME   - Restart bot"
    echo "  pm2 stop $APP_NAME      - Stop bot"
    echo "  pm2 monit               - Monitor resources"
    echo ""
    
    # Show next steps
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Verify .env configuration: nano $APP_DIR/.env"
    echo "  2. Test bot in Telegram: Send /start to your bot"
    echo "  3. Check logs: pm2 logs $APP_NAME"
    echo "  4. Monitor: pm2 monit"
    echo ""
    
    # Show warnings
    echo -e "${RED}Important:${NC}"
    echo "  ⚠️  Make sure .env file is properly configured"
    echo "  ⚠️  Test all bot commands before using"
    echo "  ⚠️  Monitor logs for any errors"
    echo ""
    
    print_step "Deployment script completed successfully!"
}

# Run main function
main "$@"

