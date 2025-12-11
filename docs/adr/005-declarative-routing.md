# ADR 005: Declarative Client-Side Routing in Tier-1 Applications

## Status
Accepted

## Context
Tier-1 Applications (specifically `how-do`) initially utilized state-based conditional rendering (e.g., `useState('view')`) to manage "navigation". This approach:
1.  Prevented deep-linking to specific resources (e.g., a specific Process ID).
2.  Broke the browser's "Back" button functionality.
3.  Led to large, monolithic `App.tsx` components managing complex view switching logic.

## Decision
We will standardize on **Declarative Client-Side Routing** using `react-router-dom` (v6+) for all Tier-1 Applications that require multi-view navigation.

### Implementation Details:
1.  **Data Router**: Use `createBrowserRouter` to enable data loading and error handling APIs.
2.  **Layout Routes**: Use `<Outlet />` patterns for shared shells (Headers/Sidebars).
3.  **Hooks**: Use `useNavigate` and `useParams` for programmatic navigation and state access.

## Consequences
-   **Positive**: Deep linking support (e.g., `/process/123`).
-   **Positive**: Browser history integration works expectedly.
-   **Positive**: Improved code modularity by separating view logic into clear Route components.
-   **Negative**: Slight increase in boilerplate for router configuration.
