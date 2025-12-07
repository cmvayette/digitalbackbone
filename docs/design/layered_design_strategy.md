# Layered Design Strategy: The Digital Backbone

This document articulates the design philosophy of the Digital Backbone, structured from high-level values down to component-level implementation rules. It serves as the primary alignment mechanism for all design and architectural decisions.

---

## 1. Top-Level: The Philosophy (Why we build)

These principles guide *what* we choose to build and *why* it matters.

### 1.1 Meaning Over Data
Traditional systems manage *data* (rows, columns). The Digital Backbone manages *meaning* (semantics, relationships).
*   **Principle**: Do not just store "User ID 123". Store "Officer Smith *occupies* the position of Platoon Commander".
*   **Implication**: Every data point must have a defined semantic meaning (Holon/Relationship/Event).

### 1.2 Truth Through Time (Event Sourcing)
The state of the organization is a fluid function of time. We must be able to prove *why* the world looks the way it does.
*   **Principle**: The Source of Truth is the *Event Log*, not the current state.
*   **Implication**: Never "overwrite" data. Always append a new Event that modifies the projection.

### 1.3 Governance by Design
Rules should be constraints in the system, not just text in a PDF.
*   **Principle**: Policy is Code.
*   **Implication**: If a Policy says "No one can hold two billets", the Constraint Engine must reject the `PersonAssigned` event that violates it.

### 1.4 Human-Centric Computation
The system does not replace human judgment; it augments it by enforcing the tedious rules so humans can focus on intent.
*   **Principle**: Automation supports; Humans decide.
*   **Implication**: The system detects drift and flags it (e.g., "This Org is out of compliance"), but rarely takes destructive action without human confirmation ("Human-in-the-Loop").

---

## 2. System-Level: Architecture & Interaction (How it works together)

These principles guide how the sub-systems (Tier-0, Tier-1) relate to each other.

### 2.1 The "Glacial" Data Flow
Data flows from "Wild" to "Structured". The closer to the core, the more rigid and pure the data must be.
*   **Flow**: `External (Wild)` → `SAL (Sanitized)` → `Event Store (Immutable)` → `Graph (Projected)` → `Apps (Consumed)`.
*   **Principle**: Tier-1 Apps *read* from the Graph but *write* to the Event Store (via Intent).
*   **Implication**: No frontend app ever writes directly to the database. All writes are formulated as explicit *Events* (e.g., `SubmitTask`, `IssueOrder`).

### 2.2 Holonic Uniformity
The system is composed of **Holons** (Whole/Parts).
*   **Principle**: If it exists, it is a Holon.
*   **Implication**: A Person, a Policy, a Task, and an Objective are all modeled using the same fundamental structure (Unique ID, Relationships, Lifecycle). This allows universal querying ("Show me everything connected to this Mission").

### 2.3 Semantic Boundaries
Tier-0 (Backend) owns the *Logic* and *Truth*. Tier-1 (Frontend) owns the *Context* and *Task*.
*   **Principle**: Dumb Pipes, Smart Core.
*   **Implication**: The frontend should not contain business logic about *validity*. It should only contain logic about *presentation* and *capture*. The Core rejects invalid intents.

---

## 3. Component-Level: Design & Consistency (How we build it)

These principles guide the daily implementation of code and UI.

### 3.1 The "Blueprint" Aesthetic
The interface should feel like a technical instrument—precise, clean, and data-dense—not a "consumer app".
*   **Visuals**: High contrast, monospaced data fonts, visible structure (lines, grids), "engineering" palette (blues, greys, alerts).
*   **Interaction**: Direct manipulation of the graph where possible.
*   **Why**: It reinforces the mental model that you are *tuning the organization*, not just filling out forms.

### 3.2 Strong Typing as Governance
We use TypeScript not just for safety, but as a form of governance.
*   **Principle**: Shared Types (`packages/som-shared-types`) are the Contract.
*   **Implication**: If a concept isn't in the Shared Types, it doesn't exist. We use `lint:semantic` to ensure that every Type has a matching Schema and Interface.

### 3.3 Default to "Draft"
Because the system is rigid about truth, we must be flexible about *work-in-progress*.
*   **Principle**: Real vs. Draft.
*   **Implication**: Almost every entity (Procedures, Plans, Structures) should support a "Draft" or "Simulation" state that doesn't affect the live operational graph until explicitly "Issued" or "Published".

### 3.4 Traceability of UI
Every pixel in the UI should theoretically be traceable back to a source.
*   **Principle**: "Show your work."
*   **Implication**: When showing a Task, the UI should be able to show *why* that task exists (e.g., "Derived from Objective B, which supports Mission X").

---

## 4. The "Missing Questions" (Strategic Gaps)

To fully mature this design, we identified and **resolved** the following strategic gaps.
Detailed resolutions can be found in [Strategic Decisions](./strategic_decisions.md).

1.  **Identity & Federation**: Resolved via **Event Sourcing / Git-style Replay**.
2.  **The Role of Agents**: Resolved via **`IActor` Interface** (Agents defined as Systems, not Persons).
3.  **Legacy Coexistence**: Resolved via **Semantic Proxies** (Unified Meaning, Distributed Mastery).
4.  **Classification Boundaries**: Resolved via **Network Segregation** (Single-Level Security).
