# Developer Onboarding Guide: Semantic Operating Model (SOM)

Welcome to the **Semantic Operating Model (SOM)** team. This guide is designed to help you understand the system's philosophy, navigate its architecture, and — most importantly — extend it.

---

## 1. The Core Philosophy
The SOM is **not just a database**. It is a **Semantic Graph** that sits *above* traditional systems of record (like personnel or logistics databases).

*   **Systems of Record (SoR)**: Contain raw data (tables, rows, foreign keys).
*   **SOM**: Contains *meaning* (Holons, Relationships, Events).

Your job is often to write the code that translates the "Raw Data" of an external system into the "Meaning" of the SOM.

### The Three Primitives
Everything in SOM is built from three things:
1.  **Holons**: The "Nouns". Persistent entities (People, Units, Ships, Plans). They have stable IDs that never change.
2.  **Relationships**: The "Verbs". First-class connections (OCCUPIES, COMMANDS, CERTIFIES). They have their own lifecycle and properties.
3.  **Events**: The "History". Immutable records of change. We never update a record in place; we append a new event that *modifies* the current state.

---

## 2. System Architecture: The "Glacial" Layers
Think of the system as a flow of data from "Wild/External" to "Clean/Internal".

### Layer 1: Semantic Access Layer (SAL)
*   **Role**: The Gatekeeper.
*   **Input**: Dirty, raw data from External Systems (JSON, XML, CSV).
*   **Output**: Clean, validated SOM **Events**.
*   **Responsibility**: ID Mapping (External ID -> Holon ID), Data Transformation, Conflict Resolution.

### Layer 2: The Core (Event Store & Projection)
*   **Role**: The Source of Truth.
*   **Components**:
    *   **Event Store**: An append-only log of every valid event ever received.
    *   **State Projection**: A machine that reads the Event Store and builds the "Current State" of every Holon.
    *   **Constraint Engine**: The Policeman. Checks rules (e.g., "A Person cannot occupy two Full-Time positions") against every incoming event.

### Layer 3: The Graph Store
*   **Role**: The Read Interface.
*   **Function**: An ultra-fast, in-memory graph representation of the "Current State" (and historical states) derived from the Core.
*   **Usage**: The API queries *this*, not the Event Store directly.

---

## 3. How to Extend the System

The SOM is designed for expansion. Here is how you add new capabilities.

### Scenario A: Integrating a New External System
*You have a new data source (e.g., "Medical Readiness Database") and you want its data in the Graph.*

1.  **Define the Connector**: Create a new module in `semantic-access-layer/adapters/`.
2.  **Implement ID Mapping**: How do you know valid user "123" in Medical DB is "Holon-UUID-999"? Use the `IdMappingService`.
3.  **Write Transformers**: Write functions that take Medical Records and output `EventType.MeasureEmitted` or `EventType.QualificationAwarded` events.
4.  **Register**: Add your adapter to the SAL entry point.

### Scenario B: Adding a New Domain (Holon Type)
*You need to track a new thing (e.g., "Vehicles") that doesn't exist yet.*

1.  **Define Schema**: Create `schemas/v1/vehicle.schema.json`. Define its properties (VIN, Make, Model).
2.  **Update Types**: Add `Vehicle` to `HolonType` enum in `packages/som-shared-types/src/holon.ts`.
3.  **Create Manager**: Create `apps/som-tier0/src/vehicle-management/`.
    *   Implement `createVehicle()`: Generates UUID -> Submits `VehicleCreated` Event.
    *   Implement logic specific to Vehicles (e.g., "Maintenance Check").
4.  **Update Projection**: Add a case for `EventType.VehicleCreated` in `StateProjectionEngine`.

---

## 4. Apps & The Graph
The "Apps" (Tier-1 Systems) interact with the SOM Core via the **API Layer**.

*   **Queries**: Apps ask the Graph Store (via API) for data. "Who is in this Unit?"
*   **Commands**: Apps submit **Events** (via API) to change state. "Assign Smith to Position X."

**Crucially**: Apps *never* write directly to the Graph. They submit an *intent* (an Event). The Core validates it, and *if* valid, the Graph updates itself.

---

## 5. Developer Quick Start

### Prerequisites
*   Node.js (v18+)
*   npm

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Build shared types & core
npm run build
```

### Running Tests
We use `vitest` for fast, watch-mode testing.
```bash
# Run all core tests
npm test

# Run integration tests (The "Whole Enchilada")
npm run test:integration
```

### Running Frontend Apps
Each frontend application is a separate workspace. You can run them individually:
```bash
# Run the Org Chart app
npm run dev -w apps/org-chart

# Run the detailed Process app
npm run dev -w apps/how-do

# Run the Policy Editor
npm run dev -w apps/policy-governance
```


### Key Directories
*   `apps/som-tier0/src/core`: The brain. Interfaces for Repositories and base types.
*   `apps/som-tier0/src/api`: The face. REST API endpoints.
*   `apps/how-do`, `apps/policy-governance`, etc.: Tier-1 Frontend Applications (React/Vite).
*   `packages/som-shared-types`: The contract. Shared interfaces between Frontend/Backend.

---

## 6. Where to find help
*   **Specs**: `docs/design/specs/` (The "Bible" of requirements).
*   **Architecture**: `docs/design/system_architecture.md` (Detailed diagrams).
*  **UI Design System**: `docs/design/ui/design-sys.md` (If building frontends).

---

## 7. Semantic Governance (The Linter)
We use a custom CLI tool to enforce architectural rules on our TypeScript definitions. This prevents "Ontology Drift" where the code diverges from the design.

### Running the Linter
```bash
npm run lint:semantic
```

### What it checks
1.  **Holon Completeness**: Every `HolonType` enum must have a matching Interface.
2.  **Relationship Integrity**: Ensuring relationships are properly defined with required metadata.
3.  **Event Integrity**: Ensuring events match the canonical event model.

> **Tip**: If you see a failure in CI for `lint:semantic`, it means you defined a new Type (e.g., in an Enum) but forgot to define its Shape (Interface).
