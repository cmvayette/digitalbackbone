#!/bin/bash
# Migrate to Iron Bank Images - Skunkworks Phase
# This script helps transition from Alpine to Iron Bank base images

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.ironbank"

echo "🏦 Iron Bank Migration Script"
echo "=============================="
echo ""

# Check if .env.ironbank exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.ironbank file not found"
    echo ""
    echo "Please create $ENV_FILE with:"
    echo "IRON_BANK_USER=your-username"
    echo "IRON_BANK_TOKEN=your-cli-secret"
    exit 1
fi

# Load credentials
echo "📄 Loading Iron Bank credentials..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Verify credentials are set
if [ -z "$IRON_BANK_USER" ]; then
    echo "❌ IRON_BANK_USER not set in .env.ironbank"
    exit 1
fi

if [ -z "$IRON_BANK_TOKEN" ]; then
    echo "❌ IRON_BANK_TOKEN not set in .env.ironbank"
    exit 1
fi

echo "✅ Credentials loaded"
echo ""

# Step 1: Login to Iron Bank
echo "🔐 Step 1: Login to Iron Bank Registry"
echo "---------------------------------------"
echo "$IRON_BANK_TOKEN" | docker login registry1.dso.mil -u "$IRON_BANK_USER" --password-stdin

if [ $? -ne 0 ]; then
    echo "❌ Login failed. Check your credentials in .env.ironbank"
    exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Pull Iron Bank Node.js image
echo "📦 Step 2: Pull Iron Bank Node.js Image"
echo "---------------------------------------"
echo "Pulling registry1.dso.mil/ironbank/opensource/nodejs/nodejs20:20.11.1..."
docker pull registry1.dso.mil/ironbank/opensource/nodejs/nodejs20:20.11.1

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull Iron Bank Node.js image"
    echo "   You may not have access to this image. Contact Iron Bank support."
    exit 1
fi

echo "✅ Image pulled successfully"
echo ""

# Step 3: Backup original Dockerfile
echo "💾 Step 3: Backup Original Dockerfile"
echo "---------------------------------------"
if [ -f "$PROJECT_ROOT/Dockerfile" ]; then
    BACKUP_FILE="$PROJECT_ROOT/Dockerfile.alpine-backup-$(date +%Y%m%d-%H%M%S)"
    cp "$PROJECT_ROOT/Dockerfile" "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
else
    echo "⚠️  No existing Dockerfile found (this is OK if new setup)"
fi
echo ""

# Step 4: Use Iron Bank Dockerfile
echo "🔄 Step 4: Switching to Iron Bank Dockerfile"
echo "---------------------------------------"
if [ -f "$PROJECT_ROOT/Dockerfile.ironbank" ]; then
    cp "$PROJECT_ROOT/Dockerfile.ironbank" "$PROJECT_ROOT/Dockerfile"
    echo "✅ Dockerfile updated to use Iron Bank images"
else
    echo "❌ Dockerfile.ironbank not found!"
    exit 1
fi
echo ""

# Step 5: Build the new image
echo "🔨 Step 5: Build Image with Iron Bank Base"
echo "---------------------------------------"
echo "Building som-tier0:ironbank..."
cd "$PROJECT_ROOT"
docker build -t som-tier0:ironbank -f Dockerfile .

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "Common issues:"
    echo "1. Iron Bank UBI uses glibc (not musl) - may have dependency issues"
    echo "2. Check for Alpine-specific commands in Dockerfile"
    echo "3. User creation commands differ (useradd vs adduser)"
    echo ""
    echo "Restoring backup..."
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" "$PROJECT_ROOT/Dockerfile"
        echo "✅ Backup restored"
    fi
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Step 6: Verify FIPS mode
echo "🔒 Step 6: Verify FIPS Cryptography"
echo "---------------------------------------"
echo "Testing if FIPS mode can be enabled..."

FIPS_TEST=$(docker run --rm som-tier0:ironbank node -e "const crypto = require('crypto'); try { crypto.setFips(1); console.log('ENABLED'); } catch(e) { console.log('DISABLED'); }")

if [ "$FIPS_TEST" = "ENABLED" ]; then
    echo "✅ FIPS mode is available and can be enabled!"
    echo ""
    echo "Note: FIPS is not auto-enabled. You must call crypto.setFips(1) in your code."
    echo "      Add this to apps/som-tier0/src/index.ts for IL5/IL6 compliance."
else
    echo "⚠️  FIPS mode could not be enabled"
    echo "   This may be OK for development, but is required for IL5/IL6 production"
    echo "   Check if Iron Bank Node.js image includes FIPS-enabled OpenSSL"
fi
echo ""

# Step 7: Update docker-compose.yml (optional)
echo "🐳 Step 7: Update docker-compose.yml (Optional)"
echo "---------------------------------------"
if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    echo "Found docker-compose.yml"
    echo ""
    echo "You may want to update the PostgreSQL and other service images to Iron Bank versions:"
    echo "  - postgres: registry1.dso.mil/ironbank/opensource/postgres/postgresql16:16.3"
    echo "  - keycloak: registry1.dso.mil/ironbank/opensource/keycloak/keycloak:23.0.7"
    echo ""
    echo "⚠️  Manual update required - edit docker-compose.yml"
else
    echo "No docker-compose.yml found (OK if not using it)"
fi
echo ""

# Summary
echo "🎉 Migration Complete!"
echo "======================"
echo ""
echo "✅ Iron Bank login successful"
echo "✅ Iron Bank Node.js image pulled"
echo "✅ Dockerfile updated to use Iron Bank base"
echo "✅ Image built successfully: som-tier0:ironbank"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Enable FIPS in your application code:"
echo "   Add to apps/som-tier0/src/index.ts:"
echo "   import crypto from 'crypto';"
echo "   crypto.setFips(1);"
echo ""
echo "2. Test your application:"
echo "   docker run -p 3000:3000 som-tier0:ironbank"
echo ""
echo "3. Update docker-compose.yml to use Iron Bank images for all services"
echo ""
echo "4. Add .env.ironbank to .gitignore (if not already done)"
echo ""
echo "Backups:"
echo "--------"
if [ -f "$BACKUP_FILE" ]; then
    echo "Original Dockerfile: $BACKUP_FILE"
fi
echo ""
echo "Rollback:"
echo "---------"
echo "If you need to rollback:"
if [ -f "$BACKUP_FILE" ]; then
    echo "  cp $BACKUP_FILE $PROJECT_ROOT/Dockerfile"
fi
echo "  docker build -t som-tier0:alpine ."
