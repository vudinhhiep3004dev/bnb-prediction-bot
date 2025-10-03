#!/bin/bash

################################################################################
# Make all scripts executable
# Usage: ./scripts/make-executable.sh
################################################################################

echo "Making all scripts executable..."

chmod +x scripts/*.sh
chmod +x deploy.sh

echo "✓ All scripts are now executable"
echo ""
echo "Available scripts:"
ls -lh scripts/*.sh deploy.sh | awk '{print "  " $9}'

