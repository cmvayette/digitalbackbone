# UX Research: Drag-and-Drop & Network Navigation

## Executive Summary
To achieve the "Structure as Physics" vision, the Org Chart app should move beyond static diagrams to a truly tactile, responsive surface. This document outlines key UX patterns identified in research and recommends specific integrations for the Digital Backbone.

## 1. Drag-and-Drop Patterns

### A. "Ghosting" & Semantic Feedback
*   **Pattern:** When dragging a node, a semi-transparent "ghost" follows the cursor.
*   **Recommendation:** When dragging a **Person Pod**:
    *   Show a ghost of their avatar/card.
    *   **Smart Highlighting (Physics):** Dim all incompatible positions. Light up valid vacancies (green) or "stretch" non-ideal matches (yellow) based on the Reconciliation Score.
    *   *Why?* Makes the "competence physics" visible during the interaction.

### B. "Magnetic" Snapping
*   **Pattern:** Droppable items "snap" to valid targets when near.
*   **Recommendation:**
    *   **Assigning:** Snaps Person into Position.
    *   **Tiger Teaming:** Snapping a Person/Org onto an **Objective Pod** creates a "Gravity Well" (new Tiger Team cluster).

### C. Contextual Drop Zones
*   **Pattern:** Zones appear only during drag state.
*   **Recommendation:**
    *   **"The Bench"**: A drawer at the bottom to temporarily hold people (unassign) or drag specific people *from* (Roster).
    *   **"Draft State"**: Dragging doesn't commit immediately; it creates a "Pending Change" edge (dotted line) requiring confirmation.

## 2. Network Navigation Patterns

### A. Semantic Zoom (Focus + Context)
*   **Pattern:** Detail level changes based on zoom factor.
*   **Recommendation:**
    *   **Zoom Level 1 (Strategic):** Show only Organizations and top-level Objectives.
    *   **Zoom Level 2 (Operational):** Show Leadership Positions and Key Results.
    *   **Zoom Level 3 (Tactical):** Show all Positions, People, and detailed Load Meters.
    *   *Why?* Prevents cognitive overload while maintaining "whole system" awareness.

### B. Mini-Map & Breadcrumbs
*   **Pattern:** Small overlay showing global position.
*   **Recommendation:**
    *   Standard Mini-map for the infinite canvas.
    *   **"Lineage Bar"**: A breadcrumb trail (e.g., `Cyber Command > Strategy Div > Team Alpha`) that acts as a quick-jump anchor.

### C. Force-Directed Layouts (Structure as Physics)
*   **Pattern:** Nodes repel/attract based on relationships.
*   **Recommendation:**
    *   **Reporting Mode:** Rigid tree layout (Gravity = Hierarchy).
    *   **Mission Mode:** Force-directed. Objectives act as "Suns"; related Teams orbited them.
    *   **Conflict Visuals:** "Tension" lines (red, vibrating) for nodes with conflicting policies or over-capacity loads.

## 3. Integration Priorities (Short Term)

1.  **Drag-to-Assign w/ Competence Check:** Drag person from Sidebar -> Drop on Position -> Trigger "Reconciliation Audit" -> Confirm.
2.  **Semantic Zooming:** Implement Level of Detail (LOD) for the Graph Canvas.
3.  **"Gravity" Layout:** Use `react-flow` or `d3-force` to prototype the "Mission Mode" clustering.
