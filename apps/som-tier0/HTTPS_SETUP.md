# HTTPS/TLS Configuration Guide
**NIST 800-53: SC-8 (Transmission Confidentiality)**

This guide explains how to configure HTTPS/TLS for the SOM Tier-0 API server to meet DoD C-ATO requirements.

---

## Overview

The SOM Tier-0 server supports both HTTP (development) and HTTPS (production) modes with:
- **TLS 1.3** support (DoD preferred)
- **TLS 1.2** fallback for compatibility
- **FIPS 140-2 compliant cipher suites**
- **Automatic HTTP → HTTPS redirect**
- **DoD-approved cryptographic standards**

---

## Quick Start (Development)

### 1. Generate Self-Signed Certificates

```bash
npm run generate-certs
```

This creates:
- `certs/server.key` - Private key (RSA 4096-bit)
- `certs/server.crt` - Self-signed certificate (valid 365 days)

### 2. Configure Environment

Create `.env` file:

```bash
# Enable HTTPS
ENABLE_HTTPS=true

# HTTPS Port
HTTPS_PORT=3443

# HTTP Redirect Port
HTTP_PORT=3080

# TLS Configuration
TLS_MIN_VERSION=TLSv1.3
TLS_MAX_VERSION=TLSv1.3
TLS_CERT_PATH=./certs/server.crt
TLS_KEY_PATH=./certs/server.key
```

### 3. Start Server

```bash
npm run dev
```

You should see:
```
✓ HTTPS server running on https://localhost:3443
  TLS Version: TLSv1.3
  Certificate: ./certs/server.crt
  FIPS 140-2 cipher suites enabled
HTTP redirect server running on http://localhost:3080
  → Redirecting to https://localhost:3443
```

### 4. Test the Server

```bash
# Test HTTPS endpoint (ignore self-signed cert warning)
curl -k https://localhost:3443/health

# Test HTTP redirect
curl -L http://localhost:3080/health
```

**Browser Access**: Navigate to `https://localhost:3443`
- Your browser will show a security warning (expected for self-signed certs)
- Click "Advanced" → "Proceed to localhost" to continue

---

## Production Deployment

### Prerequisites

1. **Obtain DoD-Approved Certificates**
   - Request certificates from your organization's CA
   - OR use DoD PKI certificates
   - Certificates must be signed by a DoD-trusted CA

2. **Certificate Requirements**
   - **Key Size**: RSA 2048-bit minimum, 4096-bit recommended
   - **Signature Algorithm**: SHA-256 or higher
   - **Validity**: Follow organizational policy (typically 1-2 years)

### Configuration Steps

#### 1. Upload Certificates to Server

```bash
# Secure directory for certificates
sudo mkdir -p /etc/som-tier0/certs
sudo chmod 700 /etc/som-tier0/certs

# Copy certificate files
sudo cp server.crt /etc/som-tier0/certs/
sudo cp server.key /etc/som-tier0/certs/
sudo cp ca-bundle.crt /etc/som-tier0/certs/  # If applicable

# Set secure permissions
sudo chmod 600 /etc/som-tier0/certs/server.key
sudo chmod 644 /etc/som-tier0/certs/server.crt
```

#### 2. Update Production Environment

```bash
# Production .env
NODE_ENV=production
ENABLE_HTTPS=true
HTTPS_PORT=443
HTTP_PORT=80

TLS_MIN_VERSION=TLSv1.2
TLS_MAX_VERSION=TLSv1.3
TLS_CERT_PATH=/etc/som-tier0/certs/server.crt
TLS_KEY_PATH=/etc/som-tier0/certs/server.key
TLS_CA_PATH=/etc/som-tier0/certs/ca-bundle.crt
```

#### 3. Configure Firewall

```bash
# Allow HTTPS traffic
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=http  # For redirect
sudo firewall-cmd --reload
```

#### 4. Start Server with SystemD

Create `/etc/systemd/system/som-tier0.service`:

```ini
[Unit]
Description=SOM Tier-0 API Server
After=network.target

[Service]
Type=simple
User=som-tier0
WorkingDirectory=/opt/som-tier0
EnvironmentFile=/etc/som-tier0/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/som-tier0

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable som-tier0
sudo systemctl start som-tier0
sudo systemctl status som-tier0
```

---

## TLS Configuration Details

### Supported TLS Versions

| Version | Status | Notes |
|---------|--------|-------|
| TLS 1.3 | ✅ Recommended | Best security, DoD preferred |
| TLS 1.2 | ✅ Supported | For compatibility, DoD minimum |
| TLS 1.1 | ❌ Disabled | Deprecated by NIST |
| TLS 1.0 | ❌ Disabled | Insecure |

### DoD-Approved Cipher Suites (FIPS 140-2)

**TLS 1.3 (Preferred):**
- `TLS_AES_256_GCM_SHA384`
- `TLS_AES_128_GCM_SHA256`
- `TLS_CHACHA20_POLY1305_SHA256`

**TLS 1.2 (Fallback):**
- `ECDHE-RSA-AES256-GCM-SHA384`
- `ECDHE-RSA-AES128-GCM-SHA256`
- `ECDHE-ECDSA-AES256-GCM-SHA384`
- `ECDHE-ECDSA-AES128-GCM-SHA256`

### Security Features

- ✅ **Perfect Forward Secrecy (PFS)** - ECDHE key exchange
- ✅ **AEAD Encryption** - GCM mode prevents tampering
- ✅ **Server Cipher Preference** - Server controls cipher selection
- ✅ **HTTP Strict Transport Security (HSTS)** - Browser enforcement
- ✅ **Automatic HTTP → HTTPS Redirect** - No unencrypted traffic

---

## Troubleshooting

### Certificate Errors

**Error**: `ENOENT: no such file or directory`

**Solution**: Verify certificate paths in `.env` are correct
```bash
ls -la ./certs/server.key ./certs/server.crt
```

**Error**: `error:0909006C:PEM routines:get_name:no start line`

**Solution**: Certificate file is corrupted or wrong format
```bash
# Check certificate format
openssl x509 -in ./certs/server.crt -text -noout
```

### Permission Errors

**Error**: `EACCES: permission denied`

**Solution**: Check file permissions
```bash
chmod 600 ./certs/server.key
chmod 644 ./certs/server.crt
```

### Port Binding Errors

**Error**: `EADDRINUSE: address already in use`

**Solution**: Port 443/3443 is already in use
```bash
# Find process using port
sudo lsof -i :3443
# Kill process or use different port
```

**Linux Port < 1024 Requires Root**:
```bash
# Option 1: Use port > 1024 (e.g., 3443)
HTTPS_PORT=3443

# Option 2: Grant capability to Node.js (Linux)
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

### Browser Certificate Warnings

**Development (Self-Signed):**
- Expected behavior
- Click "Advanced" → "Proceed to localhost"
- OR import `server.crt` into browser's trusted certificates

**Production:**
- Should NOT occur with proper CA-signed certificates
- If it does, verify certificate chain and CA bundle

---

## Testing HTTPS Configuration

### Manual Testing

```bash
# 1. Test TLS handshake
openssl s_client -connect localhost:3443 -tls1_3

# 2. View certificate details
echo | openssl s_client -connect localhost:3443 2>/dev/null | openssl x509 -noout -text

# 3. Check cipher suites
nmap --script ssl-enum-ciphers -p 3443 localhost

# 4. Test HTTP redirect
curl -v http://localhost:3080/health 2>&1 | grep -i location
```

### Automated Testing

```bash
# Install testssl.sh
git clone https://github.com/drwetter/testssl.sh.git
cd testssl.sh

# Run comprehensive TLS test
./testssl.sh https://localhost:3443
```

### Expected Results

✅ **TLS 1.3** supported
✅ **TLS 1.2** supported (fallback)
❌ **TLS 1.1** NOT supported
❌ **TLS 1.0** NOT supported
✅ **Forward Secrecy** enabled
✅ **FIPS 140-2** compliant ciphers only
✅ **HSTS** header present

---

## Certificate Renewal

### Development Certificates

Regenerate annually or when expired:
```bash
npm run generate-certs
```

### Production Certificates

Follow organizational certificate renewal process:

1. **Request renewal 30-60 days before expiration**
2. **Generate new CSR** (or reuse existing key)
   ```bash
   openssl req -new -key server.key -out renewal.csr
   ```
3. **Submit CSR to CA**
4. **Install new certificate** (keep private key)
5. **Restart server**
   ```bash
   sudo systemctl restart som-tier0
   ```

---

## Compliance Checklist

- [ ] TLS 1.2 or 1.3 enabled
- [ ] TLS 1.0 and 1.1 disabled
- [ ] FIPS 140-2 compliant cipher suites only
- [ ] Perfect Forward Secrecy (PFS) enabled
- [ ] Certificates from DoD-approved CA (production)
- [ ] Private keys stored securely (chmod 600)
- [ ] HSTS header enabled
- [ ] HTTP → HTTPS redirect functional
- [ ] Certificate expiration monitoring configured
- [ ] Audit logging captures HTTPS connections

---

## References

- **NIST SP 800-52 Rev 2**: Guidelines for TLS
- **NIST SP 800-53 SC-8**: Transmission Confidentiality
- **DoD Cloud Computing SRG**: TLS Requirements
- **FIPS 140-2**: Cryptographic Module Validation

---

## Support

For issues or questions:
- **ISSM**: issm@your-domain.mil
- **System Owner**: owner@your-domain.mil
- **Security Documentation**: See `SYSTEM_SECURITY_PLAN.md`
