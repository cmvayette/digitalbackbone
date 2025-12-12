# Dependency Analysis Report

**Date:** 2025-12-12
**Reviewer:** Claude Code
**Scope:** Full monorepo (9 packages/apps)

---

## Executive Summary

This analysis identified:
- **5 security vulnerabilities** (all moderate severity, in vitest/esbuild chain)
- **15+ outdated packages** with available updates
- **4 packages** that could be replaced with better alternatives
- **3 dependency misconfigurations** (production vs devDependencies)

**Critical Action Required:** Upgrade vitest to v4.x to resolve esbuild security vulnerability.

---

## 1. Security Vulnerabilities

### Active Vulnerabilities (npm audit)

| Package | Severity | Issue | Fix |
|---------|----------|-------|-----|
| esbuild <=0.24.2 | MODERATE | Allows any website to send requests to dev server | Upgrade vitest |
| vite 0.11.0-6.1.6 | MODERATE | Depends on vulnerable esbuild | Upgrade vitest |
| vite-node <=2.2.0 | MODERATE | Depends on vulnerable vite | Upgrade vitest |
| vitest 0.0.1-2.2.0 | MODERATE | Depends on vulnerable vite-node | Upgrade to v4.x |
| @vitest/coverage-v8 <=2.2.0 | MODERATE | Depends on vulnerable vitest | Upgrade to v4.x |

**Root Cause:** All 5 vulnerabilities trace back to vitest v1.x using outdated esbuild.

**Fix Command:**
```bash
npm install vitest@^4.0.0 @vitest/coverage-v8@^4.0.0 --save-dev -w
```

**Breaking Changes in vitest v4:**
- Node.js 18+ required (you have Node 20)
- Some configuration options renamed
- Test environment defaults changed

---

## 2. Outdated Packages

### Critical Updates (Security/Breaking)

| Package | Current | Latest | Apps Affected | Priority |
|---------|---------|--------|---------------|----------|
| vitest | 1.0.0-1.6.1 | 4.0.15 | All | **CRITICAL** |
| @vitest/coverage-v8 | 1.6.1 | 4.0.15 | som-tier0 | **CRITICAL** |
| vite | 6.4.1 | 7.2.7 | All frontend | HIGH |
| react-router-dom | 6.22.3-6.30.2 | 7.10.1 | ui-components | HIGH |

### Major Version Updates Available

| Package | Current | Latest | Apps | Breaking Changes |
|---------|---------|--------|------|-----------------|
| diff | 4.0.2 | 8.0.2 | policy-governance | API changes |
| commander | 11.1.0 | 14.0.2 | semantic-linter | Minor API |
| chalk | 4.1.2 | 5.6.2 | semantic-linter | ESM-only |
| ts-morph | 21.0.1 | 27.0.2 | semantic-linter | TypeScript 5.x |
| fast-check | 3.23.2 | 4.4.0 | som-tier0 | Minor API |
| jsdom | 24.1.3 | 27.3.0 | how-do, objectives-okr | Minor |
| @types/node | 20.x-24.x | 25.0.1 | Various | Type definitions |

### Minor/Patch Updates

| Package | Current | Latest | Update Command |
|---------|---------|--------|----------------|
| react | 19.2.1 | 19.2.3 | `npm update react react-dom` |
| tailwindcss | 4.1.17 | 4.1.18 | `npm update tailwindcss` |
| @tailwindcss/postcss | 4.1.17 | 4.1.18 | `npm update @tailwindcss/postcss` |
| lucide-react | 0.556.0 | 0.561.0 | `npm update lucide-react` |
| @google/genai | 1.32.0 | 1.33.0 | `npm update @google/genai` |

---

## 3. Dependency Usage Analysis

### Properly Used Dependencies

| Package | Usage | Status |
|---------|-------|--------|
| @xyflow/react | org-chart graph rendering | Appropriate |
| @tanstack/react-query | Data fetching/caching | Appropriate |
| @tiptap/* | Rich text editing (policy-governance) | Appropriate |
| hono | Backend API framework | Appropriate |
| better-sqlite3 | SQLite persistence | Appropriate |
| neo4j-driver | Graph database | Appropriate |
| bullmq | Background job processing | Appropriate |
| pino | Structured logging | Appropriate |

### Potentially Misplaced Dependencies

| Package | Current Location | Should Be | Reason |
|---------|-----------------|-----------|--------|
| @faker-js/faker | dependencies (org-chart, som-tier0, api-client) | devDependencies | Only used for mocking/seeding |
| dagre | dependencies (org-chart) | dependencies | Correct, used in production layout |

### Underutilized Dependencies

| Package | Installed In | Actual Usage | Recommendation |
|---------|--------------|--------------|----------------|
| @dnd-kit/* | how-do | 2 files only | Keep - provides drag/drop for swimlane editor |
| diff | policy-governance | 1 file (RedlineView) | Keep - critical for policy comparison |
| zustand | org-chart (not installed) | Used via ui-components | Add explicit dependency |

### Duplicate Dependencies

| Package | Versions | Apps |
|---------|----------|------|
| lucide-react | 0.400.0, 0.556.0 | ui-components (old), all apps (new) |
| react-router-dom | 6.22.3, 7.10.1 | ui-components (old), apps (new) |
| @types/node | 20.x, 24.x, 25.x | Various |

---

## 4. Alternative Package Recommendations

### Consider Replacing

| Current | Alternative | Reason | Effort |
|---------|------------|--------|--------|
| dagre | @dagrejs/dagre or elkjs | dagre unmaintained since 2018; elkjs is actively maintained | Medium |
| diff (v4) | diff (v8) or jsdiff | v4 is very old; v8 has better TypeScript support | Low |
| chalk (v4) | chalk (v5) or picocolors | chalk v5 is ESM-only but smaller; picocolors is 14x smaller | Low |
| ts-node | tsx | tsx is faster, better ESM support, already used elsewhere | Low |

### Keep As-Is

| Package | Reason |
|---------|--------|
| @xyflow/react | Best React flow/graph library, actively maintained |
| @tanstack/react-query | Industry standard, excellent caching |
| @tiptap/* | Best rich text editor for React |
| hono | Fast, modern, good TypeScript support |
| zustand | Lightweight, excellent for this use case |
| pino | Fastest Node.js logger |
| bullmq | Best Redis-based job queue |

---

## 5. Recommended Actions

### Immediate (Week 1) - Security

```bash
# 1. Fix vitest security vulnerability
npm install vitest@^4.0.0 @vitest/coverage-v8@^4.0.0 --save-dev -w

# 2. Update all minor/patch versions
npm update

# 3. Verify no regressions
npm test
```

### Short-term (Week 2) - Maintenance

```bash
# 1. Move @faker-js/faker to devDependencies
# In apps/org-chart/package.json, apps/som-tier0/package.json, packages/api-client/package.json
# Move from "dependencies" to "devDependencies"

# 2. Align lucide-react versions
npm install lucide-react@^0.561.0 -w packages/ui-components

# 3. Update react-router-dom in ui-components
npm install react-router-dom@^7.10.1 -w packages/ui-components
```

### Medium-term (Week 3-4) - Major Upgrades

```bash
# 1. Upgrade vite to v7 (test thoroughly)
npm install vite@^7.0.0 --save-dev -w

# 2. Upgrade diff to v8
npm install diff@^8.0.0 -w apps/policy-governance

# 3. Replace dagre with elkjs (if layout issues arise)
npm install elkjs -w apps/org-chart
npm uninstall dagre -w apps/org-chart
# Then update apps/org-chart/src/utils/layout.ts
```

### Long-term - Modernization

1. **Replace chalk with picocolors** in semantic-linter (14x smaller)
2. **Replace ts-node with tsx** in semantic-linter (faster, better ESM)
3. **Consider Bun** for backend (faster than Node.js)
4. **Add bundle analyzer** to track dependency sizes

---

## 6. Dependency Size Analysis

### Largest Dependencies (Estimated)

| Package | Size | Notes |
|---------|------|-------|
| @faker-js/faker | ~800KB | Only needed for dev/mocking |
| @xyflow/react | ~500KB | Required for org-chart |
| @tiptap/* (combined) | ~400KB | Required for policy editor |
| neo4j-driver | ~300KB | Required for graph DB |
| jsdom | ~250KB | Dev only (testing) |

### Bundle Optimization Opportunities

1. **Tree-shake @faker-js/faker** - Only import specific modules
2. **Lazy-load @tiptap** - Only load when editing policies
3. **Code-split @xyflow/react** - Only needed in org-chart app

---

## 7. Version Alignment Matrix

| Package | Root | how-do | org-chart | policy-gov | task-mgmt | som-tier0 | Recommended |
|---------|------|--------|-----------|------------|-----------|-----------|-------------|
| react | - | ^19.0.0 | ^19.2.0 | ^19.2.0 | ^19.2.0 | - | ^19.2.0 |
| typescript | - | ~5.9.3 | ~5.9.3 | ~5.9.3 | ~5.9.3 | ~5.9.3 | ~5.9.3 |
| vitest | - | ^1.6.0 | ^1.6.1 | - | ^1.6.1 | ^1.0.0 | ^4.0.0 |
| vite | - | ^6.0.0 | ^6.0.0 | ^6.0.0 | ^6.0.0 | - | ^7.0.0 |
| tailwindcss | - | ^4.1.17 | ^4.1.17 | ^4.1.17 | ^4.1.17 | - | ^4.1.18 |
| eslint | - | ^9.39.1 | ^9.39.1 | ^9.39.1 | ^9.39.1 | ^9.39.1 | ^9.39.1 |

---

## 8. package.json Issues Found

### Syntax Errors

**packages/ui-components/package.json:4** - Duplicate "version" key:
```json
{
  "name": "@som/ui-components",
  "version": "0.1.0",
  "version": "0.1.0",  // DUPLICATE - remove this line
```

### Missing Dependencies

| App | Missing | Used By |
|-----|---------|---------|
| org-chart | zustand | Imported but relies on hoisting |
| how-do | vitest | Listed but version inconsistent |

### Workspace Reference Issues

| Package | Reference | Issue |
|---------|-----------|-------|
| org-chart | @som/api-client: "^0.1.0" | Should be workspace:* |
| org-chart | @som/ui-components: "^0.1.0" | Should be workspace:* |

---

## Summary

**Priority Actions:**

1. **CRITICAL:** Upgrade vitest to v4.x (security)
2. **HIGH:** Fix duplicate version in ui-components/package.json
3. **MEDIUM:** Align all package versions across workspace
4. **LOW:** Move @faker-js/faker to devDependencies

**Estimated Effort:** 4-8 hours for all immediate/short-term actions

**Risk Assessment:**
- vitest v4 upgrade may require test file updates
- vite v7 upgrade is significant but well-documented
- All other upgrades are low-risk
