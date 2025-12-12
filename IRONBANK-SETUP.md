# Iron Bank Setup - Quick Start

## Step 1: Get Your Iron Bank Username

1. Go to https://registry1.dso.mil in your browser
2. Login (you've already registered)
3. Click your name in the top-right corner → **User Profile**
4. Your **username** is shown at the top (might be different from your email)

## Step 2: Update .env.ironbank

Edit `.env.ironbank` and replace `REPLACE_WITH_YOUR_USERNAME` with your actual username:

```bash
# Open in editor
nano .env.ironbank

# Or use sed (replace 'your-actual-username' with what you found)
sed -i '' 's/REPLACE_WITH_YOUR_USERNAME/your-actual-username/' .env.ironbank
```

Your `.env.ironbank` should look like:
```bash
IRON_BANK_USER=your-actual-username
IRON_BANK_TOKEN=1Y2sAFj0LqccUvW9ZV5dym8qsPzumOqv
```

## Step 3: Login Manually (Quick Test)

```bash
# Copy-paste this into your terminal
echo "1Y2sAFj0LqccUvW9ZV5dym8qsPzumOqv" | \
  docker login registry1.dso.mil \
  -u YOUR-USERNAME-HERE \
  --password-stdin
```

Replace `YOUR-USERNAME-HERE` with your Harbor username.

**Expected output:**
```
Login Succeeded
```

## Step 4: Run Migration Script

Once login works manually, run the migration:

```bash
./scripts/migrate-to-ironbank.sh
```

This will:
1. ✅ Login to Iron Bank
2. ✅ Pull Iron Bank Node.js image
3. ✅ Backup your current Dockerfile
4. ✅ Switch to Iron Bank Dockerfile
5. ✅ Build new image: `som-tier0:ironbank`
6. ✅ Verify FIPS mode

## Troubleshooting

### "unauthorized" error

**Problem**: Username or token incorrect

**Solution**:
1. Verify username in Harbor User Profile (https://registry1.dso.mil)
2. Regenerate CLI secret: User Profile → ⋮ → Generate
3. Update `.env.ironbank` with new token

### "Image not found" error

**Problem**: You may not have access to the specific Iron Bank image

**Solution**:
1. Try pulling a public Iron Bank image first:
   ```bash
   docker pull registry1.dso.mil/ironbank/redhat/ubi/ubi9-minimal:latest
   ```
2. If that works, the Node.js image path might be different
3. Browse available images at: https://registry1.dso.mil/harbor/projects/3/repositories

## Quick Commands Reference

```bash
# Test login only
./scripts/ironbank-login.sh

# Full migration
./scripts/migrate-to-ironbank.sh

# Manual pull test
docker pull registry1.dso.mil/ironbank/opensource/nodejs/nodejs20:20.11.1

# Build with Iron Bank
docker build -t som-tier0:ironbank -f Dockerfile.ironbank .

# Verify FIPS
docker run --rm som-tier0:ironbank node -e \
  "const crypto = require('crypto'); \
   crypto.setFips(1); \
   console.log('FIPS enabled:', crypto.getFips());"
```

## What Gets Updated

- ✅ `Dockerfile` → Uses Iron Bank Node.js (UBI-based, FIPS-enabled)
- ✅ Backup created → `Dockerfile.alpine-backup-TIMESTAMP`
- ✅ New image → `som-tier0:ironbank`
- ⚠️ `docker-compose.yml` → You'll need to update manually (see below)

## Next: Update docker-compose.yml (Optional)

```yaml
services:
  som-tier0:
    image: som-tier0:ironbank  # ← Update this
    build:
      context: .
      dockerfile: Dockerfile  # ← Now uses Iron Bank base

  postgres:
    image: registry1.dso.mil/ironbank/opensource/postgres/postgresql16:16.3

  keycloak:
    image: registry1.dso.mil/ironbank/opensource/keycloak/keycloak:23.0.7
```

Note: You'll need to login to Iron Bank before docker-compose can pull these images.

## Rollback (If Needed)

```bash
# Restore Alpine Dockerfile
cp Dockerfile.alpine-backup-* Dockerfile

# Rebuild with Alpine
docker build -t som-tier0:alpine .
```
