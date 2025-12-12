#!/bin/bash
# Iron Bank Registry Login Script
# Reads credentials from .env file and logs into registry1.dso.mil

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

echo "🔐 Iron Bank Registry Login"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found at $ENV_FILE"
    echo ""
    echo "Create a .env file in project root with:"
    echo "IRON_BANK_USER=your-username"
    echo "IRON_BANK_TOKEN=your-cli-secret"
    exit 1
fi

# Load environment variables
echo "📄 Loading credentials from .env..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Check required variables
if [ -z "$IRON_BANK_USER" ]; then
    echo "❌ Error: IRON_BANK_USER not set in .env"
    exit 1
fi

if [ -z "$IRON_BANK_TOKEN" ]; then
    echo "❌ Error: IRON_BANK_TOKEN not set in .env"
    exit 1
fi

REGISTRY="registry1.dso.mil"

echo "👤 Username: $IRON_BANK_USER"
echo "🔑 Token: ${IRON_BANK_TOKEN:0:8}... (hidden)"
echo ""

# Login to registry
echo "🔄 Logging into $REGISTRY..."
echo "$IRON_BANK_TOKEN" | docker login "$REGISTRY" -u "$IRON_BANK_USER" --password-stdin

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Login successful!"
    echo ""
    echo "Testing image pull..."
    docker pull "$REGISTRY/ironbank/redhat/ubi/ubi9-minimal:latest" > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ Test pull successful! Iron Bank access confirmed."
        echo ""
        echo "You can now pull images like:"
        echo "  docker pull $REGISTRY/ironbank/opensource/nodejs/nodejs20:20.11.1"
    else
        echo "⚠️  Login worked but test pull failed. You may not have access to all images."
        echo "   Try pulling the Node.js image you need for the project."
    fi
else
    echo ""
    echo "❌ Login failed!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Verify credentials in .env file"
    echo "2. Regenerate CLI secret in Harbor: https://registry1.dso.mil"
    echo "3. Check username matches Harbor User Profile (not email)"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
