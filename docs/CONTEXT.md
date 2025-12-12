# Agent Context Map

This file is the **PRIMARY ENTRY POINT** for any AI Agent or Developer working in this repository.
It links to the definitive **Source of Truth** for each domain.

> [!IMPORTANT]
> **Agents:** Before starting any task, check the relevant section below to align with the latest strategy and architecture.

## 1. Strategy & Governance (Why & When)
*   **[Roadmap](file:///docs/strategy/roadmap.md)**: The current active priorities and execution plan. Check this to know *what* to work on.
*   **[Branching Strategy](file:///docs/guides/branching_strategy.md)**: Naming conventions (`feature/scope/desc`) you MUST follow.
*   **[Agent Protocol](file:///docs/guides/agent_protocol.md)**: The **Review-Verify-Task** cycle you MUST follow.
*   **[Extensibility Strategy](file:///docs/strategy/extensibility.md)**: Vision for the "Digital Backbone Kit".

## 2. Architecture: Tier-0 Core (How it Works)
*   **[System Overview](file:///docs/architecture/system_overview.md)**: The "Glacial" layers (SAL -> Event Store -> Graph).
*   **[ADR 014: Polyglot Persistence](file:///docs/adr/014-polyglot-persistence-neo4j-redis.md)**: The decision to split state across Postgres, Neo4j, and Redis.
*   **[Core Principles](file:///docs/architecture/core_principles.md)**: Design philosophy (Meaning over Data, Truth through Time).
*   **[C-ATO Readiness](file:///docs/architecture/c_ato_readiness.md)**: Security, Authentication, and Hardening requirements.
*   **[Shared Types](file:///packages/som-shared-types/README.md)**: The Type Contract. Inspect `packages/som-shared-types/src` for actual interfaces.

## 3. Specifications: Tier-1 Apps (What to Build)
*   **[Org Chart](file:///docs/specs/org_chart.md)**: Visual explorer spec.
*   **[How-Do](file:///docs/specs/how-do.md)**: Process & Qualification spec.
*   **[Policy Governance](file:///docs/specs/policyGovernance.md)**: Document management spec.
*   **[Task Management](file:///docs/specs/taskmanagement.md)**: Initiative & Task tracking spec.
*   **[Objectives / OKR](file:///docs/specs/objectivesOKRs.md)**: Strategy alignment spec.

### UI & UX Standard
*   **[UI / UX Principles](file:///docs/specs/ui/ux_principles.md)**: The "Constitution" of our design.
*   **[Design System](file:///docs/specs/ui/ui_design_system.md)**: The "Deep Void" aesthetic rules.
*   **[Iconography](file:///docs/specs/ui/iconography.md)**: Icon usage rules.

## 4. Developer Guides (How to Dev)
*   **[Developer Onboarding](file:///docs/guides/developer_onboarding.md)**: Quick start, directory map, and tooling setup.
*   **[Local Infrastructure](file:///docs/notes/local_infrastructure.md)**: How to run the full Docker stack locally.
