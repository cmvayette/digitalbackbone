# Universal UI Design System: "Operational Fidelity"

**Version:** 1.1 (Industrial Flat)
**Scope:** All Tier-1 Applications (`apps/org-chart`, `apps/how-do`, `apps/policy-governance`)

---

## 1. Design Philosophy
The Digital Backbone is not a "website"; it is a **Mission Operating System**.
The User Interface must feel like a **precision instrument**.

*   **Aesthetic**: "Industrial Flat". Muted contrast, schematic feel, no "Sci-Fi" glows.
*   **Interaction**: "Immediate & Tactile". Hover states are subtle value shifts. Transitions are instant (150-200ms).
*   **Information Density**: Maximum. Use hierarchy (Typography/Variable Sizing) to organize complex data.

---

## 2. Core Tokens

### 2.1 Color Palette (Dark Mode Native)
We use a semantic token system mapped to Tailwind defaults (Slate).

| Token | Value (Tailwind/Hex) | Usage |
| :--- | :--- | :--- |
| **Canvas** | `slate-950` (`#020617`) | The deep background. The "Void" where content lives. |
| **Panel** | `slate-900` (`#0f172a`) | Sidebars, Modals, Cards. |
| **Surface** | `slate-800` (`#1e293b`) | **Subtle**: Input fields, Secondary backgrounds. |
| **Border** | `slate-700` (`#334155`) | **Muted**: Structural dividers, Card borders. |
| **Text Primary** | `slate-50` (`#f8fafc`) | Headings, Body text. |
| **Text Secondary** | `slate-400` (`#94a3b8`) | Metadata, Labels, Descriptions. |
| **Accent Primary** | `orange-500` (`#f97316`) | **Action**: Buttons, Links, Active States. |
| **Accent Success** | `emerald-500` (`#10b981`) | **Safe**: Active status, Compliance, Health (Good). |
| **Accent Warning** | `amber-500` (`#f59e0b`) | **Caution**: Vacancies, Expiring items. |
| **Accent Critical** | `rose-600` (`#e11d48`) | **Danger**: Errors, Blockers, Vacancies (Critical). |

### 2.2 Typography
We use a dual-font stack to differentiate "Interface" from "Data".

*   **UI Font**: `Inter`. Headings, Buttons.
*   **Data Font**: `JetBrains Mono`. IDs, UICs, Codes, Badge Text.

**Scale:**
*   `text-[10px]` (Caps): High-density labels, Compact Mode stats.
*   `text-xs` (12px): Metadata, Standard Labels.
*   `text-sm` (14px): Body, Inputs.
*   `text-base` (16px): Card Titles.
*   `text-lg` (18px): Command Headers.

---

## 3. Component Atoms

### 3.1 The "Holon Card"
The fundamental unit of content.
*   **Bg**: `bg-panel`
*   **Border**: `1px solid slate-700` (Muted).
*   **Radius**: `rounded-md` (4px).
*   **Shadow**: `shadow-sm` (Subtle depth, no heavy drop shadows).
*   **Interact**: Hover `border-slate-600`, `shadow-md`.

### 3.2 Buttons
*   **Primary**: `bg-accent-primary` text `slate-950` font-bold hover:brightness-110.
*   **Secondary**: `bg-surface` border `border-color` text `text-primary` hover:bg-slate-700.
*   **Ghost**: Transparent, text `text-secondary` hover:text-primary.

### 3.3 Badges & Chips
*   **Shape**: `rounded` (not full pill).
*   **Text**: `text-[10px]` uppercase tracking-wider font-mono font-bold.
*   **Style**:
    *   *Solid*: `bg-accent-primary` text `white` (High Priority).
    *   *Subtle*: `bg-slate-800` text `text-secondary`.
    *   *Tiger Team*: `text-amber-500` transparent/border-dashed.

### 3.4 Ghost States (Vacant/Placeholder)
Used for empty slots or potential resources.
*   **Opacity**: 90%.
*   **Border**: `border-dashed border-slate-700`.
*   **Bg**: `bg-surface/50`.
*   **Indicator**: "?" avatar or "VACANT" label.

---

## 4. Layout Patterns

### 4.1 Hierarchical Sizing (Tiered heights)
Components adapt their physical size to their organizational importance.
*   **Tier 1 (Command)**: **Height 200px**. Prominent headers, full details, accent borders.
*   **Tier 2 (Standard)**: **Height 180px**. Standard density.
*   **Tier 3 (Compact)**: **Height 120px**. 
    *   **Stripped**: No internal containers.
    *   **Inline Stats**: Data displayed in a single row (`Seats: X | Vac: Y`).
    *   **Visuals**: Reduced padding (`p-2`).

### 4.2 The Inspector Panel
A right-aligned drawer for details.
*   **Header**: Max-density "Identity" block.
*   **Service Tiles**: Fixed height (56px), flex layout (Trigger | Owner).

### 4.3 The Discovery Bar
*   **Position**: Floating Top-Center.
*   **Style**: Glassmorphism (`backdrop-blur-md`).
*   **Features**: Natural Language filtering ("Vacancies").

---

## 5. CSS Implementation (Tailwind Config)

```js
module.exports = {
  theme: {
    extend: {
{{ ... }}
      }
    }
  }
}
```
