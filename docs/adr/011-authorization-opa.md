# 11. External Authorization via Open Policy Agent (OPA)

Date: 2025-12-11

## Status

Accepted

## Context

The Digital Backbone requires granular attribute-based access control (ABAC) to handle varying clearance levels (Unclassified, Confidential, Secret, Top Secret) and resource sensitivity (IL4/IL5/IL6). Embedding this logic directly into application code leads to fragmentation and difficulty in auditing. The NSW Gap Analysis identified a need for a centralized, decoupled policy engine.

## Decision

We will use **Open Policy Agent (OPA)** as the centralized authorization engine.

*   **Architecture**: OPA runs as a sidecar/standalone container. The `api-client` and services query OPA for decisions.
*   **Policy Language**: Rego.
*   **Enforcement**:
    *   **Fail-Closed**: If OPA is unreachable, access is denied.
    *   **Client-Side Redaction**: The UI (`how-do`) uses OPA decisions to redact sensitive fields (e.g., "Step Description" for Secret steps) before rendering.
    *   **Backend Enforcement**: (Future) API gateways or service meshes will enforce OPA policies at the ingress level.
*   **Integration**: The `@som/api-client` exposes a `checkAccess()` method that delegates to an `OPAClient`.

## Consequences

*   **Positive**:
    *   Decoupled policy logic from business logic.
    *   Policies can be versioned and audited independently.
    *   Supports complex ABAC rules required for IL6 compliance.
    *   Fail-close security posture.
*   **Negative**:
    *   Additional infrastructure component (OPA container) to manage.
    *   Latency overhead for policy checks (though minimal for local/sidecar).
*   **Mitigation**: Use `api-client` facade/mocking to allow local development without a running OPA container if needed (though `mock` mode currently defaults to 'allow' for ease of dev, while `real` defaults to 'deny' on failure).
