# Engineering Note 008: Tier-1 Specification Gap Analysis
**Date**: 2025-12-10
**Scope**: Tier-1 App Implementation vs `docs/design/specs/*`

## Context
A comprehensive audit was performed to compare the current React implementation of Tier-1 applications against their "Vision" specifications.

## Executive Summary
*   **High Alignment**: `apps/org-chart` and `apps/how-do` are substantially feature-complete against their specs.
*   **Major Gaps**: `apps/task-management` lacks core Calendar/Shadow-Task features; `apps/policy-governance` lacks its real-time Obligation extraction engine.

## Findings by Application

### 1. Org Chart
*   **Status**: Mature.
*   **Verified**: Graph Canvas, Discovery Bar, Roster Builder.
*   **Gap**: Dynamic visualization modes (Mission/Process views) need verification.

### 2. How-Do
*   **Status**: Mature.
*   **Verified**: Swimlane/Timeline Viewers, Process Editor.
*   **Gap**: "Execution Mode" persistence is rudimentary.

### 3. Task Management
*   **Status**: Significant Gaps.
*   **Missing**:
    *   **Calendar Integration**: No bidirectional sync or view.
    *   **External Integration**: No "Shadow Task" logic for JIRA/ADO.
    *   **Workload Dashboard**: Minimal implementation.

### 4. Objectives & OKRs
*   **Status**: Gaps in Authoring.
*   **Missing**:
    *   **KR Composer Linter**: The "Is it measurable?" intelligence.
    *   **Measure Definitions**: Dedicated picker/creator.

### 5. Policy Governance
*   **Status**: Developing.
*   **Missing**:
    *   **Live Obligation Panel**: The core "text-to-constraint" engine.
    *   **Impact Preview**: Real-time analysis of policy changes on operations.

## Recommended Actions
1.  Prioritize **Task Management Calendar Integration**.
2.  Develop the **Policy Obligation engine**.
