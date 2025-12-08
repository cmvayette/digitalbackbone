# Branching Strategy

This repository uses a **trunk-based branching model** with short-lived feature branches.

The goals are:

* Keep `main` always releasable.
* Keep branches short-lived and focused.
* Make it obvious which part of the monorepo a change touches (Tier-0 SOM core vs Tier-1 apps vs infra).
* Preserve traceability to specs and epics.

---

## 1. Branch Types

### 1.1 `main` (trunk)

* **Status:** Protected, always green, always releasable.
* **Source of truth** for:

  * Tier-0 SOM semantics and core services.
  * Tier-1 applications in `apps/`.
  * Shared types in `packages/`.
* **No direct commits**. All changes go through Pull Requests (PRs).
* Releases are tagged from `main` as `vX.Y.Z`.

### 1.2 Feature branches

Most work happens on **short-lived feature branches**.

**Naming pattern:**

`feature/<scope>/<short-description>`

Where `<scope>` indicates *where* you are working:

* `som-core` – Tier-0 primitives and engines (event store, constraint engine, graph store, document registry, state projection).
* `som-sal` – Semantic Access Layer (ID mapping, event transformers, validation gateway).
* `som-query` – Query and temporal interfaces.
* `som-api` – Public APIs exposed to Tier-1 systems.
* `app/<app-name>` – Tier-1 systems (e.g. `app/org-chart`, `app/task-management`, `app/how-do`).
* `infra` – CI/CD, semantic linter, repo tooling, GitHub Actions, etc.

**Examples:**

* `feature/som-core/event-versioning`
* `feature/som-sal/nsips-integration-contract`
* `feature/app/org-chart/vacancy-health-bar`
* `feature/infra/add-semantic-linter-checks`

**Rules:**

* Always branch from `main`.
* Prefer branches that live for **days, not weeks**.
* Each branch should represent a **coherent unit of change** (one spec section, one feature, one bugfix).

### 1.3 Hotfix branches (later stage)

Hotfix branches are used when a tagged release in production needs an urgent fix.

**Naming pattern:**

`hotfix/<version>/<short-description>`

**Example:**

* `hotfix/v0.2.0/fix-temporal-query-off-by-one`

**Flow (when we are versioned and deploying):**

1. Branch from the release tag (e.g. `v0.2.0`).
2. Implement and test the fix.
3. Tag a new patch version (`v0.2.1`) and deploy.
4. Merge or cherry-pick the fix back into `main`.

> Note: We may not need hotfix branches until there is a real deployment pipeline and external consumers.

### 1.4 Optional `staging` / `release` branches

We **default to not using** long-lived `staging` or `release/x.y` branches until needed.

If/when required:

* `staging` – Integration testing and demo aggregation branch.
* `release/x.y` – Used only if we must maintain an older minor version in parallel with ongoing development.

---

## 2. Merge & Review Rules

All merges into `main` go through a Pull Request.

### 2.1 Baseline requirements

To merge into `main`:

* ✅ CI passes (tests, linting, including `npm run lint:semantic`).
* ✅ PR is approved by at least **one reviewer**.
* ✅ No unresolved blocking comments.

No direct pushes to `main`.

### 2.2 Stricter rules for Tier-0 SOM core

Changes to the Tier-0 SOM core are more sensitive.

Tier-0 includes (non-exhaustive):

* `packages/som-shared-types`
* Event store, state projection engine, semantic graph store
* Constraint engine
* Document registry
* Core query/temporal logic

For changes in these areas:

* Prefer **two approvals**, or at least one from a designated Tier-0 maintainer.
* Include a link to the relevant **spec/design document** in the PR description (e.g. `docs/specs/EPIC-1-immutable-event-store.md`).
* Avoid breaking SOM semantics without an explicit versioning plan.

Tier-1 app changes (e.g. org chart UI, task management UI) can use the baseline rules (1 approval).

---

## 3. Branch Lifecycle (Standard Workflow)

### 3.1 Creating a feature branch

From an up-to-date `main`:

```bash
git checkout main
git pull origin main

# Example: work on temporal constraints in the SOM core
git checkout -b feature/som-core/temporal-constraints
```

### 3.2 Working on the branch

While developing:

* Commit early and often with clear messages.
* Run tests and linting locally before pushing:

```bash
npm test
npm run lint
npm run lint:semantic
```

### 3.3 Keeping your branch up to date

Regularly rebase your feature branch on `main`:

```bash
git fetch origin
git rebase origin/main
```

Resolve any conflicts locally. This keeps the eventual merge clean.

### 3.4 Opening a Pull Request

When your work is ready:

1. Push your feature branch:

   ```bash
   git push -u origin feature/som-core/temporal-constraints
   ```

2. Open a PR targeting `main`.

3. In the PR description:

   * Summarize what changed.
   * Link the related spec/issue/epic.
   * Call out any breaking changes or migration steps.

### 3.5 Merging and cleaning up

After review and passing CI:

* Merge via **squash** (preferred) or rebase-and-merge.

  * Squash gives one clean commit on `main` per feature.
* Delete the feature branch both locally and remotely:

```bash
git branch -d feature/som-core/temporal-constraints
git push origin --delete feature/som-core/temporal-constraints
```

---

## 4. Mapping Branches to Specs & Epics

This repo is **spec-driven**. Branches should align with specs as much as possible.

### 4.1 Including spec IDs in branch names

When you’re implementing part of a spec or epic, include its ID:

* `feature/som-core/EPIC-1-immutable-event-store`
* `feature/app/org-chart/EPIC-4-vacancy-health-visualization`

### 4.2 Referencing specs in PRs

In the PR description:

* Link to the primary spec:

  * `Implements sections 1–3 of docs/specs/EPIC-1-immutable-event-store.md`
* Optionally link to tracking issues or GitHub Projects.

This keeps traceability from **spec → branch → PR → code**.

---

## 5. Releases & Tagging

### 5.1 When to tag

Whenever `main` is in a stable state and you want to:

* Mark a milestone, or
* Cut a release for a consumer,

you can create a version tag.

### 5.2 How to tag

1. Ensure `main` is up-to-date and green.
2. Bump the version in `package.json` (and any other relevant files).
3. Tag and push:

```bash
git checkout main
git pull origin main

# Example: v0.2.0
git tag v0.2.0
git push origin v0.2.0
```

4. Optionally, create a GitHub Release and include human-readable release notes.

### 5.3 Versioning rules

* **Patch** (`v0.2.1`): Bugfixes, no breaking changes to public contracts.
* **Minor** (`v0.3.0`): New features, backwards-compatible schema additions.
* **Major** (`v1.0.0`+): Breaking changes to core SOM semantics or external APIs.

---

## 6. Quick Reference

* **`main`**

  * Protected, always releasable, only via PR.
* **Feature branches**

  * `feature/<scope>/<description>`
  * Short-lived, always from `main`, rebased regularly.
* **Tier-0 changes**

  * Stricter review, spec link required.
* **Releases**

  * Tag from `main` as `vX.Y.Z`.
* **Hotfixes**

  * `hotfix/<version>/<description>`, branch from tag, merge back to `main` afterward.
