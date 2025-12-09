# Iconography Strategy: Org Chart Smart UX

## Principles
Icons in the "Blueprint" design system are functional, not decorative. They serve as "Semantic Signage"—quickly conveying status, mode, or action without requiring reading.

## Smart Drag-and-Drop (Feedback States)
When a user is dragging a candidate (Person), the interface must instantly communicate compatibility.

| Concept | Icon (Lucide) | Context / Usage | Color |
| :--- | :--- | :--- | :--- |
| **Compatible / Match** | `CheckCircle2` | Shown on a Position Pod when hovering a valid candidate. | `text-accent-green` |
| **Incompatible / Block** | `Ban` | Shown on a Position Pod when hovering an invalid candidate. | `text-accent-red` |
| **Warning / Partial** | `AlertTriangle` | Shown when qualifications are met but other risks exist (e.g., overload). | `text-accent-yellow` |
| **Drag Handle** | `GripVertical` | Affordance on Person Pod to indicate draggability. | `text-text-secondary` |
| **Drop Zone** | `ArrowDownToLine` | Shown inside an empty Position to invite dropping. | `text-accent-blue` |

## Visualization Modes (Discovery Bar)
Icons to distinguish the mathematical/layout "physics" being applied.

| Mode | Icon (Lucide) | Metaphor | Usage |
| :--- | :--- | :--- | :--- |
| **Reporting Mode** | `Network` | The formal hierarchy; the "wiring diagram." | Toggle Button |
| **Mission Mode** | `Orbit` | "Solar System"; gravitational clusters around objectives. | Toggle Button |
| **Process Mode** | `GitMerge` | Value streams; how work flows (input -> output). | Toggle Button |

## Node Status & Badges
Micro-indicators within the Holon Pods.

| Concept | Icon (Lucide) | Usage |
| :--- | :--- | :--- |
| **Leadership** | `Star` | Indicates a "Key Leadership Position" (KLP). |
| **Certificate** | `Scroll` | Represents a person's qualification/cert. |
| **Requirement** | `Shield` | Represents a position's mandatory requirement. |
| **Vacancy** | `UserPlus` | Empty state avatar or action button. |
| **Tiger Team** | `Zap` | Indicates arbitrary/temporary grouping. |
