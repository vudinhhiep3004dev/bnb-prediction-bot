#!/bin/bash

################################################################################
# BNB Prediction Bot - Quick Deploy Script
# 
# Usage: ./scripts/deploy.sh "commit message"
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

# Check if commit message provided
if [ -z "$1" ]; then
    print_error "Please provide a commit message"
    echo "Usage: ./scripts/deploy.sh \"your commit message\""
    exit 1
fi

COMMIT_MSG="$1"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         QUICK DEPLOY TO SERVER                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check git status
print_step "Checking git status..."
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}Changes detected${NC}"
else
    echo -e "${YELLOW}No changes detected${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Step 2: Run tests (optional)
print_step "Running tests..."
if command -v bun &> /dev/null; then
    if bun run test:hybrid; then
        echo -e "${GREEN}✓${NC} Tests passed"
    else
        print_error "Tests failed"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 1
        fi
    fi
fi

# Step 3: Build locally
print_step "Building project..."
if command -v bun &> /dev/null; then
    bun run build
else
    npm run build
fi
echo -e "${GREEN}✓${NC} Build successful"

# Step 4: Git add, commit, push
print_step "Committing changes..."
git add -A
git commit -m "$COMMIT_MSG" || echo "Nothing to commit"
echo -e "${GREEN}✓${NC} Changes committed"

print_step "Pushing to GitHub..."
git push origin main
echo -e "${GREEN}✓${NC} Pushed to GitHub"

# Step 5: Show deploy instructions
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              ✓ LOCAL DEPLOY COMPLETED!                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Now run this command on your SERVER:${NC}"
echo ""
echo -e "${GREEN}ssh root@your-server-ip 'cd /root/bnb-prediction-bot && ./scripts/update-bot.sh'${NC}"
echo ""
echo "Or manually:"
echo "  1. SSH to server: ssh root@your-server-ip"
echo "  2. Update bot: cd /root/bnb-prediction-bot && ./scripts/update-bot.sh"
echo ""

