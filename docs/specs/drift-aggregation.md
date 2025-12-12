# Drift Aggregation Architecture

## 1. Problem Statement
The "How-Do" application currently assesses process health in isolation. A unit commander cannot see the aggregate " Governance Readiness" of their command. There is no mechanism to bubble up "Drift" (mismatches between policy and practice) to a leadership dashboard.

**The Missing Link**: A Semantic Aggregation Engine that turns individual `ProcessMaturity` scores into a weighted `CommandReadiness` index.

## 2. Core Concepts

### 2.1 The "Fragility" Index
Instead of just "Health", we measure "Fragility". A highly critical process (Warfighting function) with low maturity is **Fragile**. A low-criticality process with low maturity is merely **Untidy**.

$$ \text{Fragility} = \frac{\text{Criticality} \times (5 - \text{Maturity})}{\text{TimeSinceDrift}} $$

### 2.2 Hierarchical Roll-up
Drift aggregates up the Org Chart:
1.  **Process Level**: Individual Maturity (1-5).
2.  **Position Level**: "Owner Competency" (Average Maturity of owned processes).
3.  **Unit Level**: "Command Readiness" (Weighted average of critical processes).

## 3. Architecture Components

### 3.1 The Aggregator Service (`apps/som-aggregator`)
A background service (Event Consumer) that listens for:
-   `ProcessUpdated`
-   `PolicyUpdated`
-   `OrgStructureChanged`

When these events occur, it triggers a **Recalculation Job**.

### 3.2 Data Schema (New Holons)

#### `CommandInsight` (Holon)
A snapshot of health for a specific Organization at a specific time.
```typescript
interface CommandInsight extends Holon {
  type: 'CommandInsight';
  properties: {
    orgId: string;
    timestamp: Date;
    overallReadiness: number; // 0-100
    criticalDrifts: Array<{
       processId: string;
       processName: string;
       ownerId: string;
       driftType: 'Compliance' | 'Staleness' | 'Ownership';
    }>;
    fragilityHotspots: string[]; // List of Position IDs with high aggregate drift
  }
}
```

### 3.3 Event Flow
1.  **User** edits a Process (Drift Introduced).
2.  **API** emits `Processmodified` event.
3.  **Aggregator** consumes event:
    *   Calculates new `ProcessMaturity`.
    *   Identifies Owner & Organization.
    *   Recalculates `CommandInsight` for that Org.
4.  **Notification Engine** checks thresholds:
    *   If `Readiness` drops > 10%, alert Unit Commander (Mock "Morning Coffee" alert).

## 4. Implementation Strategy

### Phase 1: In-Memory Aggregation (MVP)
*   Frontend `ProcessHealthDashboard` calculates simple averages on the fly.
*   **Limitation**: Does not scale to thousands of processes.

### Phase 2: Async Worker (Target)
*   Implement `som-aggregator` as a separate worker service.
*   Store `CommandInsight` holons in the graph.
*   Expose via `useCommandInsight(orgId)` hook.

## 6. Configuration & Administration

### 6.1 `GovernanceConfig` (Singleton Holon)
Weights and thresholds must be configurable dynamically by Command Administrators, not hardcoded.

```typescript
interface GovernanceConfig extends Holon {
  type: 'GovernanceConfig'; // Singleton
  properties: {
    weights: {
      freshness: number;     // e.g., 0.3
      completeness: number;  // e.g., 0.3
      compliance: number;    // e.g., 0.4
    };
    criticalityMultipliers: {
      [key in CriticalityLevel]: number; // e.g. { High: 2.0, Low: 0.5 }
    };
    thresholds: {
      fragilityAlert: number; // Score below which alert triggers (e.g., 60)
    };
  }
}
```

### 6.2 Admin UI: "The Governance Tuner"
*   **Sliders** for adjusting contribution weights (must sum to 1.0).
*   **Simulation Mode**: "If I maximize Compliance weight, how does my Unit Readiness change?"
*   Allows Leadership to shift focus (e.g., "This quarter is about Ownership" -> increase Ownership weight).
