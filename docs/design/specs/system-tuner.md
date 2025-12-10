# System Tuner Architecture

## 1. Vision
The "System Tuner" allows Command Leadership to strictly align the software's behavior with their current "Commander's Intent" without code changes. It moves hardcoded heuristics ("Magic Numbers") into a managed, versioned configuration.

## 2. Tuneable Domains

### 2.1 Domain: Command Insight (Drift Aggregation)
*Current State*: Hardcoded weights (Freshness 30%, Completeness 30%, Compliance 40%).
*Tuner Control*:
*   **"Readiness Bias" Slider**: Shift focus between *Administrative Correctness* (Documentation) vs. *Operational Validity* (Ownership/Structure).
*   **Fragility Threshold**: Define what score triggers a "Red" status on the dashboard (e.g., < 60 vs < 80).

### 2.2 Domain: Contextual Search (`apps/how-do`)
*Current State*: Hardcoded relevance (Rank Match = 50pts, Role Match = 30pts).
*Tuner Control*:
*   **"Discovery Bias" Slider**:
    *   *Role-Centric*: "Show me what I need to DO" (High weight on Role Tags/Positions).
    *   *Rank-Centric*: "Show me what is appropriate for my GRADE" (High weight on Rank).
*   **Recommendation Threshold**: Adjust the score required to trigger the "RECOMMENDED" badge and UI glow.

### 2.3 Domain: Drift Detection Sensitivity
*Current State*: Only 'High' criticality obligations trigger missing-link drift.
*Tuner Control*:
*   **"Inspection Mode" Toggle**: When ON, triggers drift warnings for *Medium* and *Low* criticality obligations too (useful for Inspector General visits).
*   **Staleness Threshold**: Define how many days before a process is marked "Stale" (e.g., 90 days vs 365 days).

## 3. Configuration Schema (`GovernanceConfig`)

```typescript
type GovernanceConfig = {
  // Global Settings
  version: number;
  lastUpdatedBy: string;

  // 1. Aggregation Logic
  aggregation: {
    weights: {
      freshness: number;    // 0.0 - 1.0
      completeness: number; // 0.0 - 1.0
      compliance: number;   // 0.0 - 1.0
    };
    alertThresholds: {
      critical: number;     // e.g. 50
      warning: number;      // e.g. 75
    };
  };

  // 2. Search Logic
  search: {
    weights: {
      rankMatch: number;    // e.g. 50
      roleMatch: number;    // e.g. 30
      tagMatch: number;     // e.g. 10
    };
    recommendationMinScore: number; // e.g. 10
  };

  // 3. Drift Logic
  drift: {
    inspectionMode: boolean; // If true, strict checking
    staleDays: number;       // e.g. 90
    requiredObligationCriticality: 'high' | 'medium' | 'low';
  };
};
```

## 4. Implementation Plan
1.  **Define Schema**: Add `GovernanceConfig` to `@som/shared-types`.
2.  **Create Store**: Implement `useGovernanceConfig()` hook (backed by API/Mock).
3.  **Refactor Consumers**:
    *   Update `calculateProcessHealth` to accept config object.
    *   Update `calculateRelevance` (Search) to accept config object.
    *   Update `useDriftDetection` to accept config object.
4.  **Build Admin UI**: Create "The Tuner" interface in `apps/som-tier0` or separate admin panel.
