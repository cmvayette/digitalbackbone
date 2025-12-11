# Strategic Gap Analysis: How-Do Application
**Date:** 2025-12-10
**Type:** Gap Analysis & Remediation Strategy
**Context:** Aligning technical reality with the "Governance as Code" strategic vision.

---

# Phase 1: The Validity Audit (The "Red Pen")

We assessed the current `apps/how-do` codebase (legacy/MVP) against the 5 Stakeholder Personas.

## 1. The Unit Commander (Strategic Owner)
*   **The Nightmare:** "Green Slide Illusion" / Hidden Rot.
*   **The Requirement:** **Drift Latency** < 24hrs. Provable alignment via Drift Alerts.
*   **Current Reality:** **FAILURE**.
    *   *Evidence:* The current `useDriftDetection` hook is client-side only and runs per-process. There is no aggregate "Command Dashboard" to see unit-wide drift. A Commander would have to open every single process manually to see if it's drifting.
    *   *Verdict:* **The "Theater" Trap.** The system *can* detect drift, but only if you look at the specific problem directly. It lacks the "Satellite View" required for command.

## 2. The G-3 / Ops Officer (Process Architect)
*   **The Nightmare:** Version Control Loop / Emailing PDFs.
*   **The Requirement:** **Governance as Code**. Edit once, propagate everywhere.
*   **Current Reality:** **PARTIAL**.
    *   *Evidence:* The `ProcessEditor` exists and saves to a unified store (mocked currently). Updates *would* theoretically propagate on next fetch.
    *   *Critical Gap:* "Adoption Rate" metrics are missing. The G-3 has no feedback loop to know if the troops are actually using the new process or ignoring it.

## 3. The NCO / First Line Supervisor (The Enforcer)
*   **The Nightmare:** Tribal Knowledge / "Go ask Sergeant Miller".
*   **The Requirement:** **"Explain it to Me" Toggle**. Translation of legalese to grunt-proof steps.
*   **Current Reality:** **MISSING**.
    *   *Evidence:* Codebase scan of `apps/how-do` reveals zero implementation of an AI simplification toggle or "Plain English" view mode. Steps are rendered exactly as written.
    *   *Verdict:* The feature that saves the NCO time does not exist.

## 4. The Junior Operator (The Executor)
*   **The Nightmare:** Cognitive Overload / 200-page PDF.
*   **The Requirement:** **Contextual Search**. exact 5 steps in < 20s.
*   **Current Reality:** **PARTIAL**.
    *   *Evidence:* `ProcessSearch.tsx` exists and performs fuzzy matching. However, it lacks "Context Awareness" (knowing *who* the user is to rank results).
    *   *The "Theater" Trap:* It looks like Google, but it acts like `Ctrl+F`. It doesn't know that "Leave Request" for a Private is different than for a Captain.

## 5. The Compliance Officer/IG (The Auditor)
*   **The Nightmare:** Forensic Archaeology.
*   **The Requirement:** **The Obligation Badge**. Link step to Policy/Law.
*   **Current Reality:** **PASS (mostly)**.
    *   *Evidence:* `StepCard.tsx` renders `ObligationBadges`. The data model supports linking.
    *   *Risk:* The implementation assumes data entry was perfect. If the link isn't made in the editor, the badge doesn't appear.

## CRITICAL MISSING LINK
**The "Aggregate Health Engine."**
We have components that work in isolation (a single process can be healthy/unhealthy), but we lack the **Semantic Aggregation Layer** that rolls this up into:
1.  **Command Dashboards** (Commander Persona)
2.  **Adoption Analytics** (G-3 Persona)

---

# Phase 2: Solution Design (The "Fix")

## Fix 1: The "Command Insight" Engine (Solving for the Commander)
*   **Architecture:** Introduce an async **Drift Aggregator** service (Node.js/BullMQ).
    *   *Logic:* Listens for `OrgChange` or `PolicyChange` events. Background-scans all affected processes. Updates a `ReadModel_UnitHealth` table.
*   **UX Pattern:** Create a **"Morning Coffee" Dashboard** for the Commander.
    *   *Widget:* "Continuity Risk: X Critical Roles Vacant."
    *   *Widget:* "Policy Drift: Y Processes Misaligned."
    *   *Constraint:* Access restricted by Role Tag (Command Staff only).

## Fix 2: Contextual Search v2 (Solving for the Operator)
*   **Architecture:** Enhance Search with **Vector Embeddings + Metadata Filtering**.
*   **Logic:**
    *   Query: "How do I request leave?"
    *   Context: User is `E-3` in `Logistics`.
    *   Filter: Boost results tagged `E-1` to `E-4` and `Logistics`. Deprioritize `Officer` workflows.
*   **UX Mitigation:** Show "Recommended for your Rank/Role" badges on results to build trust.

## Fix 3: The "Translator" (Solving for the NCO)
*   **Architecture:** LLM Integration (Tier-2 feature).
*   **Feature:** Add a **"Simplify" Toggle** (global state in `App.tsx`).
    *   *Logic:* When ON, pass step description through an LLM prompt: *"Rewrite this military instruction for a junior operator with 1 month of experience. Use simple verbs."*
*   **UX Mitigation (The "Old Guard" Fear):** Ensure the *original* legal text is always 1 click away ("Show Source"). Never replace; only overlay.

---

# Phase 3: The Implementation Roadmap

## Phase 1: The "Bleeding" Stop (0-3 Months)
*Goal: Fix stability and trust. Ensure the "Executor" and "Auditor" are satisfied.*
1.  **Refactor Search:** Implement Metadata filtering (by User Role) in `ProcessSearch`.
2.  **Harden Drift Logic:** Move `useDriftDetection` logic to a shared library that can be run server-side later.
3.  **UI Unification:** (Completed in Stream 8). Ensure the app looks professional (Deep Void theme).

## Phase 2: The Structural Pivot (3-6 Months)
*Goal: Enable the "Commander" and "G-3".*
1.  **Event Bus Integration:** Connect `OrgChart` events (Vacancy) to `How-Do` triggers.
2.  **Aggregate Dashboard:** Build the "Unit Health" view using cached health scores.
3.  **Adoption Metrics:** Instrument `ProcessViewer` to track "Views vs. Copies" and "Time on Page."

## Phase 3: The "Moonshot" (6+ Months)
*Goal: Predictive Command.*
1.  **Simulation Mode:** "What if N6 goes offline?"
2.  **LLM "Simplify" Toggle:** Requires secure, self-hosted LLM infrastructure.

---

# Phase 4: Risk Assessment

## Data Debt
*   **Risk:** Migrating 50 disconnected Word docs into structured Process Steps.
*   **Strategy:** "Ingestion Wizards" are useless if the data is garbage. We need a **"Bounty Program"**. Gamify the digitization. Reward Junior Operators for "digitizing 1 SOP this week."

## The "Rejection" Vector
*   **Vector:** Middle Managers (The "Gatekeepers").
*   **Resistance:** They will block the "Drift Alerts" because it makes them look bad.
*   **Remediation:** **Maturity Modeling**. Replace "Red/Green" binary status with "Maturity Level 1-5".
    *   Level 1: Documented (Even if drifting).
    *   Level 2: Owned (Someone is assigned).
    *   Level 3: Linked (Obligations mapped).
    *   *Psychology:* "You aren't failing; you are at Level 1. Let's get to Level 2."

---

**Next Steps for Engineering:**
1.  Prioritize **Search Metadata Filtering** (Low Effort / High Impact for Junior Operator).
2.  Design the **Drift Aggregation Architecture** (High Effort / Critical for Commander).
