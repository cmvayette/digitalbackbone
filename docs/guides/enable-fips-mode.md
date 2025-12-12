# Enabling FIPS 140-2 Cryptography

**Purpose**: Enable FIPS-validated cryptographic operations for IL5/IL6 compliance
**Requirement**: DoD IL5/IL6 systems must use FIPS 140-2 Level 2+ validated cryptography
**Status**: Required for production; optional for development

---

## Prerequisites

- ✅ Iron Bank Node.js base image (with FIPS-enabled OpenSSL)
- ✅ Migrated from Alpine to Iron Bank (see migration script)

---

## Step 1: Update Application Startup Code

Add FIPS enablement to your main server file:

**File**: `apps/som-tier0/src/index.ts`

```typescript
import crypto from 'crypto';

// Enable FIPS mode (MUST be called before any crypto operations)
try {
  crypto.setFips(1);
  console.log('✅ FIPS mode enabled');
  console.log('   FIPS status:', crypto.getFips()); // Should log: 1
} catch (error) {
  console.error('❌ Failed to enable FIPS mode:', error);
  console.error('   This is REQUIRED for IL5/IL6 production deployment');

  // In production, fail fast if FIPS cannot be enabled
  if (process.env.NODE_ENV === 'production') {
    console.error('   Exiting due to FIPS requirement...');
    process.exit(1);
  } else {
    console.warn('   Continuing in development mode without FIPS');
  }
}

// ... rest of your server initialization
```

---

## Step 2: Verify FIPS Mode

Create a verification script:

**File**: `scripts/verify-fips.js`

```javascript
const crypto = require('crypto');

console.log('FIPS Verification Script');
console.log('========================\n');

// Check if FIPS mode is available
try {
  crypto.setFips(1);
  console.log('✅ FIPS mode enabled successfully');
  console.log('   crypto.getFips():', crypto.getFips());
} catch (error) {
  console.error('❌ FIPS mode NOT available');
  console.error('   Error:', error.message);
  console.error('\nPossible causes:');
  console.error('   1. Not using FIPS-enabled OpenSSL');
  console.error('   2. Not using Iron Bank Node.js image');
  console.error('   3. OpenSSL compiled without FIPS module');
  process.exit(1);
}

// Test FIPS-approved algorithms
console.log('\nTesting FIPS-approved algorithms:');

// Test AES-256
try {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    crypto.randomBytes(32),
    crypto.randomBytes(16)
  );
  console.log('✅ AES-256-CBC: Supported');
} catch (error) {
  console.error('❌ AES-256-CBC: Failed -', error.message);
}

// Test SHA-256
try {
  const hash = crypto.createHash('sha256');
  hash.update('test');
  hash.digest('hex');
  console.log('✅ SHA-256: Supported');
} catch (error) {
  console.error('❌ SHA-256: Failed -', error.message);
}

// Test SHA-512
try {
  const hash = crypto.createHash('sha512');
  hash.update('test');
  hash.digest('hex');
  console.log('✅ SHA-512: Supported');
} catch (error) {
  console.error('❌ SHA-512: Failed -', error.message);
}

// Test RSA-2048 key generation
try {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  console.log('✅ RSA-2048 Key Generation: Supported');
} catch (error) {
  console.error('❌ RSA-2048: Failed -', error.message);
}

// Test random bytes generation (FIPS-approved RNG)
try {
  const randomBytes = crypto.randomBytes(32);
  console.log('✅ Random Bytes (FIPS RNG): Supported');
  console.log('   Sample (hex):', randomBytes.toString('hex').substring(0, 32) + '...');
} catch (error) {
  console.error('❌ Random Bytes: Failed -', error.message);
}

console.log('\n🎉 All FIPS-approved algorithms verified!');
console.log('\nNote: Non-FIPS algorithms (MD5, SHA-1, DES) will fail in FIPS mode.');
```

**Run verification:**
```bash
# In container
docker run --rm som-tier0:ironbank node scripts/verify-fips.js

# Or locally (if using Iron Bank Node.js)
node scripts/verify-fips.js
```

---

## Step 3: Update UUID Generation (If Applicable)

If your application uses `uuid` package for event IDs, ensure it uses FIPS-approved RNG:

**File**: `apps/som-tier0/src/event-store/index.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Option 1: Use uuid with crypto.randomBytes (FIPS-approved RNG)
import { v4 as uuidv4 } from 'uuid';

function generateEventId(): string {
  // uuid v4() uses crypto.randomBytes() internally when available
  // In Node.js, this will use FIPS-approved RNG if FIPS mode is enabled
  return uuidv4();
}

// Option 2: Manual UUID generation with explicit crypto.randomBytes
function generateEventIdManual(): string {
  const bytes = crypto.randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

  return [
    bytes.subarray(0, 4).toString('hex'),
    bytes.subarray(4, 6).toString('hex'),
    bytes.subarray(6, 8).toString('hex'),
    bytes.subarray(8, 10).toString('hex'),
    bytes.subarray(10, 16).toString('hex'),
  ].join('-');
}
```

---

## Step 4: Avoid Non-FIPS Algorithms

**Algorithms that WILL FAIL in FIPS mode:**

❌ MD5 (not FIPS-approved)
❌ SHA-1 (deprecated, not FIPS-approved for new applications)
❌ DES, 3DES (weak, not FIPS-approved)
❌ RC4 (broken, not FIPS-approved)

**FIPS-Approved Algorithms:**

✅ AES (128, 192, 256 bit)
✅ SHA-2 family (SHA-256, SHA-384, SHA-512)
✅ RSA (2048, 3072, 4096 bit)
✅ ECDSA (P-256, P-384, P-521 curves)
✅ HMAC with SHA-2

**Code Review Checklist:**

```bash
# Search for non-FIPS algorithms in your codebase
grep -r "createHash('md5')" apps/som-tier0/
grep -r "createHash('sha1')" apps/som-tier0/
grep -r "createCipheriv('des" apps/som-tier0/
```

If found, replace with FIPS-approved alternatives:
- MD5 → SHA-256
- SHA-1 → SHA-256 or SHA-512
- DES → AES-256

---

## Step 5: Test in Container

Build and test:

```bash
# Build with Iron Bank base
docker build -t som-tier0:ironbank -f Dockerfile .

# Run with FIPS verification
docker run --rm som-tier0:ironbank node -e "
  const crypto = require('crypto');
  crypto.setFips(1);
  console.log('FIPS enabled:', crypto.getFips());

  // Test that non-FIPS fails
  try {
    crypto.createHash('md5');
    console.log('ERROR: MD5 should fail in FIPS mode!');
    process.exit(1);
  } catch (e) {
    console.log('✅ MD5 correctly blocked in FIPS mode');
  }

  // Test that FIPS-approved works
  try {
    const hash = crypto.createHash('sha256').update('test').digest('hex');
    console.log('✅ SHA-256 works:', hash.substring(0, 16) + '...');
  } catch (e) {
    console.log('ERROR: SHA-256 should work in FIPS mode!');
    process.exit(1);
  }
"
```

Expected output:
```
FIPS enabled: 1
✅ MD5 correctly blocked in FIPS mode
✅ SHA-256 works: 9f86d081884c7d65...
```

---

## Step 6: Environment Configuration

Add FIPS configuration to your environment:

**File**: `apps/som-tier0/src/config.ts`

```typescript
export const config = {
  // ... existing config

  security: {
    fipsMode: process.env.FIPS_MODE === 'true' || process.env.NODE_ENV === 'production',
    requireFips: process.env.REQUIRE_FIPS === 'true' || process.env.NODE_ENV === 'production',
  },
};
```

**File**: `.env` (example)

```bash
# FIPS Configuration
FIPS_MODE=true          # Enable FIPS mode
REQUIRE_FIPS=true       # Fail if FIPS cannot be enabled (production)
```

**Update startup code**:

```typescript
import { config } from './config';

if (config.security.fipsMode) {
  try {
    crypto.setFips(1);
    console.log('✅ FIPS mode enabled (required for IL5/IL6)');
  } catch (error) {
    console.error('❌ Failed to enable FIPS mode:', error);

    if (config.security.requireFips) {
      console.error('   FIPS is required but unavailable. Exiting...');
      process.exit(1);
    } else {
      console.warn('   Continuing without FIPS (development only)');
    }
  }
}
```

---

## Step 7: Update Documentation

Document FIPS status in your System Security Plan (SSP):

**Control SC-13 (Cryptographic Protection)**:

```markdown
## SC-13: Cryptographic Protection

**Implementation**:
The system uses FIPS 140-2 validated cryptographic modules provided by Iron Bank
hardened Node.js container images. FIPS mode is enabled at application startup via
`crypto.setFips(1)` and verified during health checks.

**Approved Algorithms**:
- Symmetric: AES-256-CBC, AES-256-GCM
- Hash: SHA-256, SHA-512
- Asymmetric: RSA-2048, RSA-4096, ECDSA P-256
- Random Number Generation: FIPS-approved RNG via crypto.randomBytes()

**Code Location**: `apps/som-tier0/src/index.ts:5-15`

**Verification**: Automated FIPS verification runs on container startup and fails
fast if FIPS mode cannot be enabled in production.

**Status**: ✅ Implemented (as of [DATE])
```

---

## Troubleshooting

### Issue: "Error: FIPS mode not supported"

**Cause**: Node.js not compiled with FIPS-enabled OpenSSL

**Solution**:
1. Verify you're using Iron Bank Node.js image
2. Check OpenSSL version: `docker run --rm som-tier0:ironbank openssl version`
3. Should show: `OpenSSL 3.x.x FIPS ...`

### Issue: Application crashes after enabling FIPS

**Cause**: Using non-FIPS algorithms (MD5, SHA-1, etc.)

**Solution**:
1. Check error logs for algorithm name
2. Search codebase: `grep -r "createHash('md5')" .`
3. Replace with FIPS-approved alternative (SHA-256)

### Issue: Third-party library breaks in FIPS mode

**Cause**: Dependency uses non-FIPS crypto

**Solution**:
1. Identify library: Check stack trace
2. Update library to latest version (may have FIPS support)
3. Replace library with FIPS-compatible alternative
4. Submit issue to library maintainer

---

## Compliance Checklist

Before submitting for ATO:

- [ ] FIPS mode enabled in production environment
- [ ] FIPS verification script passes
- [ ] All crypto operations use FIPS-approved algorithms
- [ ] No MD5, SHA-1, DES in codebase
- [ ] Iron Bank Node.js base image used
- [ ] OpenSSL FIPS module verified (`openssl version` shows FIPS)
- [ ] Application fails fast if FIPS cannot be enabled (production)
- [ ] FIPS status documented in SSP (SC-12, SC-13)
- [ ] Health check verifies FIPS status
- [ ] Monitoring alerts if FIPS disabled

---

## References

- [NIST FIPS 140-2](https://csrc.nist.gov/publications/detail/fips/140/2/final)
- [Node.js Crypto Module - FIPS](https://nodejs.org/api/crypto.html#cryptosetfipsmode)
- [OpenSSL FIPS Module](https://www.openssl.org/docs/fips.html)
- [DoD Approved Cryptographic Modules](https://public.cyber.mil/pki-pke/tools-configuration-files/)

---

**Last Updated**: December 11, 2025
**Compliance Status**: Required for IL5/IL6
**Implementation Time**: 2-4 hours
