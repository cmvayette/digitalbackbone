# Graph Navigation & Visualization Research: Focus + Context

## Core Philosophy
Users lose their "mental map" if nodes disappear completely. Instead of **Hiding** (filtering), usage **Ghosting** (attenuation) to preserve context while highlighting the signal.

## 1. The "Ghosting" Pattern
**Definition:** Visually de-emphasizing peripheral nodes (transparency/desaturation) rather than removing them.

| Technqiue | Description | CSS Implementation | Usage |
| :--- | :--- | :--- | :--- |
| **Opacity Reduction** | Lower `opacity` of non-focused nodes to `0.1` or `0.2`. | `opacity-10 grayscale` | Best for maintaining spatial awareness. |
| **Desaturation** | Remove color from background nodes. | `grayscale` | Good for "active" vs "inactive" states. |
| **Layering** | Push context to background layer (Z-index). | `z-0` vs `z-50` | Ensures focus nodes are droppable/clickable. |

**Recommendation for Org Chart:**
*   **Global State:** All nodes visible by default.
*   **Focus State:** When a node is clicked, neighbors stay `opacity-100`, all others fade to `opacity-20` and `grayscale`.
*   **Transition:** `transition-all duration-500` to smooth the fade.

## 2. Navigation Best Practices
*   **Slippy Map:** Drag to pan, scroll to zoom (Default React Flow).
*   **Semantic Zoom:** (Already Implemented)
    *   LOD 0 (Satellite): Colored blocks.
    *   LOD 1 (Street): Names/Titles.
    *   LOD 2 (Indoor): Full bios/actions.
*   **"Fit View" on Transitions:** When changing modes or focusing, smoothly animate the camera to frame the relevant nodes.

## 3. "Structure as Physics" (Animation)
*   **Layout Transitions:** When switching from "Reporting" to "Mission", nodes should *drift* to new positions rather than teleporting. (Requires `react-flow` transitions or `d3-force` integration).
*   **Constraint-based Layout:** In "Mission Mode", nodes should feel "tethered" to their mission centers.

## Action Plan
1.  **Refactor Focus Logic:** In `GraphCanvas.tsx`, replace `hidden` property logic with a `ghosted` property (or derived class name).
2.  **Add Transitions:** ensuring `transition-opacity` is set on the Node components.
