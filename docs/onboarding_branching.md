# Developer Onboarding – Branching Workflows

Welcome to the **Digital Backbone** (Semantic Operating Model) codebase.

This document walks through **practical workflows** for using our branching strategy, with concrete examples tied to this repo’s structure:

* `apps/` – Tier-1 applications (som-tier0 UI, org chart, task management, policy governance, etc.).
* `packages/` – Shared libraries such as `som-shared-types`.
* `docs/` – Design documents, specs, and product documentation.

Before you start, read: `docs/branching-strategy.md`.

---

## 1. Common Tasks and Which Branch to Use

### 1.1 Implementing a new UI feature in a Tier-1 app

**Scenario:**
You’re adding a *vacancy health bar* to the **Org Chart** app (`apps/org-chart`), showing how many positions in an Organization are unfilled.

**Branch to create:**

```bash
git checkout main
git pull origin main
git checkout -b feature/app/org-chart/vacancy-health-bar
```

**What you’ll typically do:**

* Update `apps/org-chart` components, hooks, and tests.
* Possibly add new query endpoints in the Tier-0 SOM API (only if necessary).
* Run tests and linters:

  ```bash
  npm test
  npm run lint
  npm run lint:semantic
  ```

**PR checklist:**

* Title:

  * `feat(org-chart): add vacancy health bar to organization cards`
* Description:

  * What the feature does.
  * Any assumptions (e.g., how vacancy percentage is calculated).
  * Screenshots or GIFs if available.
* Target branch:

  * `main`.

After approval and green CI, merge and delete the branch.

---

### 1.2 Changing SOM core semantics (Holons, Relationships, Events)

**Scenario:**
You’re extending the SOM schema to support a new holon type `Capability` or changing how temporal constraints are evaluated.

This affects `packages/som-shared-types` and core services.

**Branch to create:**

```bash
git checkout main
git pull origin main
git checkout -b feature/som-core/capability-holon-support
```

If the work is tied to a spec/epic, include the ID:

```bash
git checkout -b feature/som-core/EPIC-3-capability-holon-support
```

**What you’ll typically do:**

* Update shared types in `packages/som-shared-types`.
* Modify the event store / projection / graph logic if required.
* Update property-based tests to reflect new invariants.
* Ensure `npm run lint:semantic` passes.

**PR checklist:**

* Title:

  * `feat(som-core): add Capability holon type and projection support`
* Description:

  * Link to spec: `docs/specs/EPIC-3-capability-holon-support.md`.
  * Enumerate any breaking changes.
  * Note migration considerations (e.g., event versioning, default values).
* Reviews:

  * Request at least one Tier-0 maintainer.

---

### 1.3 Integrating a new external system via the Semantic Access Layer (SAL)

**Scenario:**
You’re onboarding data from a new personnel system into the SOM via the SAL (`ID Mapping`, `Event Transformer`, `Validation Gateway`).

**Branch to create:**

```bash
git checkout main
git pull origin main
git checkout -b feature/som-sal/personnel-system-x-integration
```

**What you’ll typically do:**

* Define ID mapping rules and types.
* Implement event transformers that convert source data into SOM events.
* Extend validation logic for structure and constraints.
* Add tests for:

  * Valid data → valid events.
  * Invalid data → rejected with clear error messages.

**PR checklist:**

* Title:

  * `feat(som-sal): add Personnel System X integration`
* Description:

  * Summarize mapping decisions.
  * Link to integration spec.
  * Document error handling behavior.
* Ensure:

  * `npm run lint:semantic` passes.
  * External system access is behind feature flags or config where appropriate.

---

### 1.4 Updating documentation only

**Scenario:**
You’re clarifying a design document or updating product specs without changing code.

**Branch to create:**

```bash
git checkout main
git pull origin main
git checkout -b feature/docs/update-system-architecture-diagram
```

**What you’ll typically do:**

* Modify files under `docs/` (e.g., `docs/design/system_architecture.md`, `docs/product_specs.md`).
* Optionally update README links.

**PR checklist:**

* Title:

  * `docs: clarify semantic access layer responsibilities`
* Description:

  * What changed and why.
* Tests:

  * At minimum, ensure CI passes (formatters, link checks if configured).

---

### 1.5 Infra / CI / semantic linter changes

**Scenario:**
You’re adding a new GitHub Actions workflow to run the semantic linter or adjusting the rule set.

**Branch to create:**

```bash
git checkout main
git pull origin main
git checkout -b feature/infra/add-semantic-linter-to-ci
```

**What you’ll typically do:**

* Edit `.github/workflows/*` and config files.
* Adjust `npm` scripts in `package.json`.
* Possibly refine semantic linter rules to enforce architectural constraints.

**PR checklist:**

* Title:

  * `chore(infra): enforce semantic linter in CI`
* Description:

  * Explain the pipeline changes.
  * Call out any new checks that may block merges.
* Make sure:

  * CI is green after your changes.
  * Team knows about new requirements.

---

## 2. End-to-End Example Workflows

### 2.1 Example: Adding a new temporal query to the SOM API

**Goal:**
Expose a new REST endpoint in the Tier-0 SOM application to query the state of Positions as of a specific timestamp (`apps/som-tier0` + core query logic).

**Steps:**

1. **Create feature branch:**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/som-query/position-as-of-endpoint
   ```

2. **Implement changes:**

   * Extend query layer types in `packages/som-shared-types`.
   * Implement the temporal query logic in the SOM core (e.g., projection or specialized query module).
   * Add an HTTP endpoint in `apps/som-tier0/src` (e.g., `/api/v1/temporal/positions`).
   * Add tests for:

     * Query with valid `asOfTimestamp`.
     * Boundary cases (first/last event).
     * No data case.

3. **Run checks locally:**

   ```bash
   npm test
   npm run lint
   npm run lint:semantic
   ```

4. **Open PR:**

   * Push:

     ```bash
     git push -u origin feature/som-query/position-as-of-endpoint
     ```

   * Create PR targeting `main`.

   * Title: `feat(som-query): add temporal Position query endpoint`.

   * Description:

     * Summary of behavior.
     * Example request/response JSON.
     * Link to spec if one exists.

5. **Review & merge:**

   * Address feedback.
   * After approval and passing CI, merge into `main` (squash recommended).
   * Delete the branch.

---

### 2.2 Example: Coordinated front-end and back-end change

**Goal:**
Org chart UI needs new data (vacancy percentages), which requires both SOM API changes and Org Chart UI changes.

**Option A – Single branch (small coordinated change)**

If the change is manageable and low-risk:

1. Create one branch that covers both:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/app/org-chart/vacancy-health-end-to-end
   ```

2. Implement:

   * SOM API change: add vacancy metrics to Organization responses.
   * Org Chart UI change: render the vacancy health bar.

3. Test back-end and front-end.

4. Open single PR with:

   * Clear breakdown of back-end vs front-end changes.
   * Screenshots of UI.

5. Merge and clean up.

**Option B – Two branches (if back-end is complex or risky)**

1. **Back-end branch:**

   ```bash
   git checkout -b feature/som-api/org-vacancy-metrics
   ```

   Implement and merge SOM API support first.

2. **Front-end branch:**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/app/org-chart/vacancy-health-ui
   ```

   Build UI on top of the updated API.

Use Option B when the back-end change is substantial and benefits from being reviewed independently.

---

### 2.3 Example: Fixing a bug in a released version (future hotfix)

**Goal:**
Fix a critical bug in `v0.2.0` that affects an external consumer.

> Note: This applies once we have tagged releases and a deployment pipeline.

1. **Create hotfix branch from tag:**

   ```bash
   git checkout v0.2.0
   git checkout -b hotfix/v0.2.0/fix-temporal-off-by-one
   ```

2. **Implement fix and tests.**

3. **Tag new patch:**

   ```bash
   # After merging fix into the hotfix branch
   git tag v0.2.1
   git push origin v0.2.1
   ```

4. **Merge fix back into `main`:**

   ```bash
   git checkout main
   git pull origin main
   git merge --no-ff hotfix/v0.2.0/fix-temporal-off-by-one
   git push origin main
   ```

5. Delete the hotfix branch after deployment.

---

## 3. Working With Specs, Issues, and Projects

### 3.1 Linking branches to specs

You will often see branch names like:

* `feature/som-core/EPIC-1-immutable-event-store`
* `feature/app/task-management/EPIC-5-initiative-timeline-view`

These correspond to spec files under `docs/specs/` and/or GitHub issues/epics.

**Your responsibilities:**

* Reference the spec in your PR description.
* Note which sections or acceptance criteria are covered by your changes.

### 3.2 Splitting large specs across multiple branches

For large epics:

* Don’t create one massive branch that lives for weeks.
* Instead, create several focused feature branches that all include the epic ID.

Example for an epic “Semantic Linter v1”:

* `feature/infra/EPIC-7-semantic-linter-cli`
* `feature/infra/EPIC-7-semantic-linter-ruleset`
* `feature/infra/EPIC-7-semantic-linter-ci-integration`

Each is reviewed and merged independently.

---

## 4. Day-One Checklist for New Developers

1. **Clone the repo:**

   ```bash
   git clone git@github.com:cmvayette/digitalbackbone.git
   cd digitalbackbone
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Verify everything runs:**

   ```bash
   npm test
   npm run build
   npm run lint
   npm run lint:semantic
   ```

4. **Read key docs:**

   * `README.md`
   * `docs/branching-strategy.md`
   * `docs/design/system_architecture.md`
   * Any relevant `docs/specs/*.md` for the epic you’re assigned.

5. **Create your first feature branch:**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/app/org-chart/first-task
   ```

6. **Open a small PR early:**

   * Even a tiny change is useful to validate your setup and the PR process.

---

## 5. FAQ

**Q: Can I work directly on `main` for small changes?**
**A:** No. Even tiny changes should go through a feature branch and PR. This keeps history clean and CI enforced.

**Q: How long should a feature branch live?**
**A:** Aim for **a few days** at most. If it’s taking weeks, consider breaking the work into smaller slices.

**Q: How do I know if my change is Tier-0 sensitive?**
**A:** If you are changing:

* SOM types (`packages/som-shared-types`),
* event sourcing logic,
* core query/temporal behavior,
* constraint evaluation,
  then treat it as Tier-0. Request a Tier-0 maintainer review and reference the relevant spec.

**Q: What if I need to touch both Tier-0 and a Tier-1 app?**
**A:** That’s normal. Choose between:

* One coordinated feature branch (simple change), or
* Two smaller branches (one per layer) if the back-end change is large or risky.

If in doubt, ask in the team channel.

---

By following this branching model, we keep the **Digital Backbone** repo:

* Stable enough to cut releases at any time.
* Flexible enough to support rapid iteration.
* Traceable back to the semantics and specs that matter.
