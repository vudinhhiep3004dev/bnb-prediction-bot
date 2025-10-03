#!/bin/bash

################################################################################
# BNB Prediction Bot - Health Check Script
# 
# Script kiểm tra tình trạng bot và hệ thống
# Usage: ./scripts/check-health.sh
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="bnb-prediction-bot"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         BNB PREDICTION BOT - HEALTH CHECK                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check PM2 status
echo -e "${BLUE}1. PM2 Status:${NC}"
if pm2 list | grep -q "$APP_NAME"; then
    if pm2 list | grep -q "$APP_NAME.*online"; then
        echo -e "   ${GREEN}✓${NC} Bot is running"
        pm2 status $APP_NAME
    else
        echo -e "   ${RED}✗${NC} Bot is not running"
        pm2 status $APP_NAME
    fi
else
    echo -e "   ${RED}✗${NC} Bot not found in PM2"
fi
echo ""

# Check system resources
echo -e "${BLUE}2. System Resources:${NC}"
echo "   CPU Usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "      " 100 - $1"%"}'

echo "   Memory Usage:"
free -h | awk 'NR==2{printf "      Used: %s / %s (%.2f%%)\n", $3,$2,$3*100/$2 }'

echo "   Disk Usage:"
df -h / | awk 'NR==2{printf "      Used: %s / %s (%s)\n", $3,$2,$5}'
echo ""

# Check network connectivity
echo -e "${BLUE}3. Network Connectivity:${NC}"

# Test Binance API
if curl -s --max-time 5 https://api.binance.com/api/v3/ping > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} Binance API: OK"
else
    echo -e "   ${RED}✗${NC} Binance API: FAILED"
fi

# Test Cloudflare
if curl -s --max-time 5 https://cloudflare.com > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} Cloudflare: OK"
else
    echo -e "   ${RED}✗${NC} Cloudflare: FAILED"
fi

# Test Google
if curl -s --max-time 5 https://www.google.com > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} Internet: OK"
else
    echo -e "   ${RED}✗${NC} Internet: FAILED"
fi
echo ""

# Check .env file
echo -e "${BLUE}4. Configuration:${NC}"
if [ -f ".env" ]; then
    echo -e "   ${GREEN}✓${NC} .env file exists"
    
    # Check required variables
    if grep -q "TELEGRAM_BOT_TOKEN=.\+" .env; then
        echo -e "   ${GREEN}✓${NC} TELEGRAM_BOT_TOKEN is set"
    else
        echo -e "   ${RED}✗${NC} TELEGRAM_BOT_TOKEN is missing"
    fi
    
    if grep -q "CLOUDFLARE_ACCOUNT_ID=.\+" .env; then
        echo -e "   ${GREEN}✓${NC} CLOUDFLARE_ACCOUNT_ID is set"
    else
        echo -e "   ${RED}✗${NC} CLOUDFLARE_ACCOUNT_ID is missing"
    fi
    
    if grep -q "CLOUDFLARE_GATEWAY_ID=.\+" .env; then
        echo -e "   ${GREEN}✓${NC} CLOUDFLARE_GATEWAY_ID is set"
    else
        echo -e "   ${RED}✗${NC} CLOUDFLARE_GATEWAY_ID is missing"
    fi
    
    if grep -q "GOOGLE_AI_STUDIO_API_KEY=.\+" .env; then
        echo -e "   ${GREEN}✓${NC} GOOGLE_AI_STUDIO_API_KEY is set"
    else
        echo -e "   ${RED}✗${NC} GOOGLE_AI_STUDIO_API_KEY is missing"
    fi
else
    echo -e "   ${RED}✗${NC} .env file not found"
fi
echo ""

# Check logs
echo -e "${BLUE}5. Recent Errors (last 10):${NC}"
if [ -f "logs/error.log" ]; then
    ERROR_COUNT=$(wc -l < logs/error.log)
    if [ $ERROR_COUNT -eq 0 ]; then
        echo -e "   ${GREEN}✓${NC} No errors in log"
    else
        echo -e "   ${YELLOW}⚠${NC} Found $ERROR_COUNT error entries"
        echo "   Last 5 errors:"
        tail -5 logs/error.log | sed 's/^/      /'
    fi
else
    echo -e "   ${YELLOW}⚠${NC} Error log file not found"
fi
echo ""

# Check PM2 logs
echo -e "${BLUE}6. Recent PM2 Logs:${NC}"
pm2 logs $APP_NAME --lines 5 --nostream 2>/dev/null || echo -e "   ${YELLOW}⚠${NC} Could not retrieve PM2 logs"
echo ""

# Check uptime
echo -e "${BLUE}7. Uptime:${NC}"
if pm2 list | grep -q "$APP_NAME"; then
    UPTIME=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.pm_uptime" 2>/dev/null)
    if [ ! -z "$UPTIME" ]; then
        UPTIME_SECONDS=$(( ($(date +%s) - $UPTIME / 1000) ))
        UPTIME_FORMATTED=$(date -u -d @${UPTIME_SECONDS} +"%H hours %M minutes")
        echo "   Bot uptime: $UPTIME_FORMATTED"
    fi
fi
echo "   System uptime: $(uptime -p)"
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    HEALTH CHECK SUMMARY                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# Count issues
ISSUES=0

if ! pm2 list | grep -q "$APP_NAME.*online"; then
    ISSUES=$((ISSUES + 1))
fi

if ! curl -s --max-time 5 https://api.binance.com/api/v3/ping > /dev/null 2>&1; then
    ISSUES=$((ISSUES + 1))
fi

if [ ! -f ".env" ]; then
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Bot is healthy.${NC}"
else
    echo -e "${RED}✗ Found $ISSUES issue(s). Please check the details above.${NC}"
fi
echo ""

