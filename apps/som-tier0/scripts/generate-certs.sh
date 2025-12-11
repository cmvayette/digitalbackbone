#!/bin/bash
#
# Generate Self-Signed TLS Certificates for Development
# NIST SC-8: Transmission Confidentiality
#
# For production, use certificates from a DoD-approved CA
#

set -e

CERT_DIR="$(dirname "$0")/../certs"
DAYS_VALID=365

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Generating Self-Signed TLS Certificates ===${NC}"
echo ""
echo "⚠️  WARNING: These certificates are for DEVELOPMENT ONLY"
echo "   For production, use certificates from a DoD-approved CA"
echo ""

# Create certs directory
mkdir -p "$CERT_DIR"

# Check if certificates already exist
if [ -f "$CERT_DIR/server.key" ] && [ -f "$CERT_DIR/server.crt" ]; then
    echo -e "${YELLOW}Certificates already exist in $CERT_DIR${NC}"
    read -p "Do you want to regenerate them? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing certificates"
        exit 0
    fi
    echo "Regenerating certificates..."
fi

# Generate private key (RSA 4096-bit for DoD compliance)
echo -e "${GREEN}[1/3]${NC} Generating private key (RSA 4096-bit)..."
openssl genrsa -out "$CERT_DIR/server.key" 4096 2>/dev/null

# Set secure permissions on private key
chmod 600 "$CERT_DIR/server.key"

# Generate certificate signing request (CSR)
echo -e "${GREEN}[2/3]${NC} Generating certificate signing request..."
openssl req -new \
    -key "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.csr" \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=IT/CN=localhost" \
    2>/dev/null

# Generate self-signed certificate
echo -e "${GREEN}[3/3]${NC} Generating self-signed certificate (valid for $DAYS_VALID days)..."
openssl x509 -req \
    -days $DAYS_VALID \
    -in "$CERT_DIR/server.csr" \
    -signkey "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.crt" \
    -extfile <(printf "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1") \
    2>/dev/null

# Clean up CSR
rm "$CERT_DIR/server.csr"

# Set permissions
chmod 644 "$CERT_DIR/server.crt"

echo ""
echo -e "${GREEN}✓ Certificates generated successfully!${NC}"
echo ""
echo "Certificate files:"
echo "  Private Key: $CERT_DIR/server.key (permissions: 600)"
echo "  Certificate: $CERT_DIR/server.crt (permissions: 644)"
echo ""
echo "Certificate details:"
openssl x509 -in "$CERT_DIR/server.crt" -noout -subject -dates
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Update .env file with certificate paths:"
echo "     TLS_KEY_PATH=$CERT_DIR/server.key"
echo "     TLS_CERT_PATH=$CERT_DIR/server.crt"
echo ""
echo "  2. Set ENABLE_HTTPS=true in .env"
echo ""
echo "  3. Restart the server: npm run dev"
echo ""
echo -e "${RED}⚠️  Remember: These are self-signed certificates for development only!${NC}"
echo "   Your browser will show a security warning. This is expected."
echo "   For production, obtain certificates from a DoD-approved CA."
echo ""
