# Epic: Core Semantic Schema & Event Definitions

Establish the foundational data structures (Holons) and state-change mechanisms (Events) required to represent Measures and Lenses within the Semantic Operating Model. This defines the 'Vocabulary' of the system.

## Issue: Update MeasureDefinition & LensDefinition Interfaces

Update `packages/som-shared-types/src/holon.ts` to fully align with Design Spec v2.

**Requirements:**
1.  **MeasureDefinition**: Ensure properties include `formula` (DSL), `calculationWindow`, `unitOfEvaluation`, `visibility`, `version`, and `status`.
2.  **LensDefinition**: Ensure properties include `compositionRules` (weights), `scope` (tiers), and `status`.
3.  **Validation**: Run `npm run lint:semantic` to ensure interfaces match the `HolonType` enum.

**Labels**: backend, types, tier-0

---

## Issue: Define Lifecycle Events for Measurement Domain

Update `packages/som-shared-types/src/event.ts` to support the full lifecycle of measurement artifacts. The existing `MeasureEmitted` and `LensEvaluated` cover the *runtime* aspect, but we need events for the *definition* aspect.

**New Event Types:**
*   `MeasureDefined`: Initial creation of a measure.
*   `MeasureUpdated`: Modification of logic/metadata.
*   `MeasureDeprecated`: Soft deletion/archival.
*   `LensDefined`: Creation of a lens structure.
*   `LensPublished`: The specific event that 'freezes' a version for use.
*   `LensDeprecated`: Archival of a lens.

**Labels**: backend, types, tier-0

---

## Issue: Implement Semantic Validator (Constraints) for Measures

Implement a `Constraint` logic in `som-tier0` to enforce validity rules on `MeasureDefined` events.

**Rules to Enforce:**
1.  **Circular Dependency**: A measure cannot reference itself in its formula (directly or indirectly).
2.  **Type Safety**: Input data sources must match the expected type of the formula.
3.  **Scope Check**: `unitOfEvaluation` must be a valid HolonType (e.g., Person, Unit).

**Labels**: backend, logic, tier-0

---

# Epic: Tier-0: State Projection & Command Handling

Implement the backend logic in the Core to handle incoming events, update the Graph Store (Projections), and persist the current state of Measure and Lens definitions.

## Issue: Implement MeasureDefinition Repository & Projection

Create the backend logic to project `MeasureDefined` and `MeasureUpdated` events into the current state.

**Tasks:**
1.  Create `MeasureRepository` in `apps/som-tier0/src/measurement/`.
2.  Implement `applyEvent` logic to update the Graph Store representation of the Measure.
3.  Ensure `version` is incremented upon `MeasureUpdated` events.

**Labels**: backend, projection, tier-0

---

## Issue: Implement LensDefinition Repository & Projection

Create the backend logic to project `LensDefined` and `LensPublished` events.

**Tasks:**
1.  Create `LensRepository`.
2.  Handle `LensPublished` specifically: This should likely create a separate, immutable snapshot record (or property) in the Graph to ensure historical queries use the correct logic version.
3.  Implement state transitions (Draft -> Published -> Deprecated).

**Labels**: backend, projection, tier-0

---

## Issue: Implement 'Lens Compiler' Logic

Implement the logic described in Spec 4.6.2. When a `LensPublished` event is processed, the system must 'compile' the lens.

**Functionality:**
1.  Resolve all referenced `MeasureDefinitions`.
2.  Snapshot their specific versions.
3.  Generate a static JSON execution graph.
4.  Store this compiled artifact in the Graph Store attached to the Lens Holon.

*Note: This ensures that if a Measure changes later, the Published Lens remains mathematically identical.*

**Labels**: backend, logic, tier-0

---

# Epic: Lens Execution Kernel (The Engine)

The secure backend service responsible for actually computing results. It acts as the bridge between the Abstract Definitions (Lenses/Measures) and the Concrete Data (The Graph).

## Issue: Design & Implement Measure DSL Parser

Create a safe parser for the Measure formula DSL (Domain Specific Language).

**Specs:**
1.  Must parse strings like `count(person where status == 'Available')`.
2.  Must be secure (no eval() or arbitrary code execution).
3.  Recommendation: Use a library like `json-logic-js` or a custom AST parser restricted to specific math/logic operators supported by the Graph.

**Labels**: backend, computation, security

---

## Issue: Implement Lens Evaluator Service

Create the service that executes a compiled Lens against a specific target (e.g., a specific Unit).

**Input:** `LensID`, `TargetHolonID` (e.g., Unit UUID).
**Process:**
1.  Retrieve the *Compiled* Lens definition.
2.  For each Measure in the Lens, execute the DSL against the Graph Store data for the Target Holon.
3.  Aggregate results based on Tier/Weight rules defined in the Lens.
**Output:** A Result Object containing the score and breakdown.

**Labels**: backend, computation, tier-0

---

## Issue: Implement Event Emission for Calculations

Ensure that significant calculations result in observable events.

**Tasks:**
1.  When the Kernel runs a calculation that is 'official' (e.g., scheduled run vs. preview), it must emit `EventType.LensEvaluated`.
2.  When a specific atomic measure is calculated, emit `EventType.MeasureEmitted`.

*This populates the history of performance over time.*

**Labels**: backend, events, tier-0

---

# Epic: Tier-1 App: Measure & Lens Builder UI

The frontend application (`apps/measures-lenses`) used by Analysts to author definitions. This app generates the Events that the Core consumes.

## Issue: Scaffold Measures & Lenses App

Initialize a new React/Vite workspace at `apps/measures-lenses`.

**Tasks:**
1.  Configure build scripts.
2.  Install dependencies (shared-types, ui-kit).
3.  Set up routing (/measures, /lenses, /catalog).

**Labels**: frontend, setup

---

## Issue: Implement Measure Editor UI

Build the interface for defining atomic Measures.

**Features:**
1.  Form for basic metadata (Name, Description, Unit of Eval).
2.  Code/Formula Editor for the DSL (with syntax highlighting/validation if possible).
3.  'Test' button: Allows user to pick a sample Holon (e.g., Unit Alpha) and see the result of the formula immediately (calling the Kernel via API).

**Labels**: frontend, ui-components

---

## Issue: Implement Lens Composition UI

Build the interface for assembling Measures into Lenses.

**Features:**
1.  Measure Selector (Search existing published measures).
2.  Weighting/Logic Editor (Assign percentages or logical operators).
3.  Tier Configuration (Define how aggregation changes from Team -> Force).
4.  Validation Preview: Show a graph of dependencies.

**Labels**: frontend, ui-components

---

## Issue: Implement Publishing Workflow UI

Create the UI flow for moving a Lens from Draft to Published.

**Features:**
1.  Diff View: Show changes from previous version.
2.  'Publish' Action: Submits the intent to publish.
3.  Governance Checklist: Require specific metadata before enabling the publish button.

**Labels**: frontend, workflow

---

# Epic: API Surface (IL5 Compliance)

Expose the capabilities of the Kernel via a static, secure, and contracted API surface for consumption by Dashboards and external tools.

## Issue: Implement Static Evaluation Endpoints

Create the REST endpoints in `apps/som-tier0/src/api`.

**Routes:**
*   `GET /api/lens/:lensId/evaluate?target=:holonId`: Triggers the Kernel to calculate current state.
*   `GET /api/lens/:lensId/metadata`: Returns the compiled definition (for explainability).
*   `GET /api/lens/:lensId/history?target=:holonId`: Returns historical `LensEvaluated` events.

**Constraint:** These routes must be static. No dynamic route generation based on lens names.

**Labels**: backend, api

---

## Issue: Implement 'Explainability' Metadata Response

Ensure the API response includes not just the score, but the *why*.

**Requirement:**
The JSON response must include a `breakdown` object showing the values of constituent measures and the weights applied, allowing a frontend to render a drill-down view.

**Labels**: backend, api

---

