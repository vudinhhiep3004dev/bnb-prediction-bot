#!/bin/bash

################################################################################
# BNB Prediction Bot - Backup Script
# 
# Script backup cấu hình và dữ liệu quan trọng
# Usage: ./scripts/backup.sh
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKUP_DIR="${HOME}/backups/bnb-prediction-bot"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup-${DATE}.tar.gz"

print_step() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         BNB PREDICTION BOT - BACKUP                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create backup directory
print_step "Creating backup directory..."
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓${NC} Backup directory: $BACKUP_DIR"

# Create temporary directory for backup
TEMP_DIR=$(mktemp -d)
print_step "Preparing backup..."

# Copy important files
cp .env "$TEMP_DIR/" 2>/dev/null || echo "Warning: .env not found"
cp ecosystem.config.cjs "$TEMP_DIR/" 2>/dev/null
cp package.json "$TEMP_DIR/" 2>/dev/null
cp -r logs "$TEMP_DIR/" 2>/dev/null || echo "Warning: logs directory not found"

# Create archive
print_step "Creating backup archive..."
cd "$TEMP_DIR"
tar -czf "$BACKUP_DIR/$BACKUP_FILE" .
cd - > /dev/null

# Cleanup temp directory
rm -rf "$TEMP_DIR"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✓${NC} Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Keep only last 7 backups
print_step "Cleaning old backups (keeping last 7)..."
cd "$BACKUP_DIR"
ls -t backup-*.tar.gz | tail -n +8 | xargs rm -f 2>/dev/null
BACKUP_COUNT=$(ls -1 backup-*.tar.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✓${NC} Total backups: $BACKUP_COUNT"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ BACKUP COMPLETED!                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Backup location: $BACKUP_DIR/$BACKUP_FILE"
echo "Backup size: $BACKUP_SIZE"
echo ""
echo "To restore:"
echo "  tar -xzf $BACKUP_DIR/$BACKUP_FILE -C /path/to/restore"
echo ""

