#!/bin/bash

################################################################################
# BNB Prediction Bot - Fix Update Conflict
# 
# Script để fix conflict khi update bot
# Usage: ./scripts/fix-update-conflict.sh
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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         FIX UPDATE CONFLICT                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check current status
print_step "Checking git status..."
git status

echo ""
print_warning "This will stash your local changes and pull the latest code."
read -p "Do you want to continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Stash local changes
print_step "Stashing local changes..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
git stash push -m "Auto-stash before fix-update $TIMESTAMP"
echo -e "${GREEN}✓${NC} Local changes stashed"

# Pull latest changes
print_step "Pulling latest changes..."
git pull origin main
echo -e "${GREEN}✓${NC} Code updated"

# Try to restore stashed changes
print_step "Attempting to restore stashed changes..."
if git stash pop; then
    echo -e "${GREEN}✓${NC} Stashed changes restored successfully"
else
    print_warning "Could not automatically restore stashed changes (conflicts detected)"
    echo ""
    echo "Your changes are saved in stash. To view them:"
    echo "  git stash list"
    echo ""
    echo "To manually apply them later:"
    echo "  git stash apply stash@{0}"
    echo ""
    echo "To see what was stashed:"
    echo "  git stash show -p stash@{0}"
    echo ""
fi

# Reinstall dependencies
print_step "Reinstalling dependencies..."
if command -v bun &> /dev/null; then
    bun install
else
    npm install
fi
echo -e "${GREEN}✓${NC} Dependencies installed"

# Rebuild
print_step "Rebuilding project..."
if command -v bun &> /dev/null; then
    bun run build
else
    npm run build
fi
echo -e "${GREEN}✓${NC} Project rebuilt"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ FIX COMPLETED!                              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

print_step "You can now restart the bot with:"
echo "  pm2 restart bnb-prediction-bot"
echo ""

