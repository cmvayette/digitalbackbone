# Universal UI Design System: "Operational Fidelity"

**Version:** 1.0
**Scope:** All Tier-1 Applications (`apps/org-chart`, `apps/how-do`, `apps/policy-governance`)

---

## 1. Design Philosophy
The Digital Backbone is not a "website"; it is a **Mission Operating System**.
The User Interface must feel like a **precision instrument**.

*   **Aesthetic**: "Blueprint Dark". High-contrast, monoline geometry, minimal "chrome".
*   **Interaction**: "Immediate & Tactile". Hover states are reactive. Transitions are instant (150-200ms).
*   **Information Density**: High but breathable. Use hierarchy (Typography/Color) rather than whitespace to separate groups.

---

## 2. Core Tokens

### 2.1 Color Palette (Dark Mode Native)
We use a semantic token system mapped to Tailwind defaults (Slate).

| Token | Value (Tailwind/Hex) | Usage |
| :--- | :--- | :--- |
| **Canvas** | `slate-950` (`#020617`) | The deep background. The "Void" where content lives. |
| **Panel** | `slate-900` (`#0f172a`) | Sidebars, Modals, Cards. |
| **Surface** | `slate-800` (`#1e293b`) | Input fields, Hover states, Secondary backgrounds. |
| **Border** | `slate-700` (`#334155`) | Hairline borders, dividers. |
| **Text Primary** | `slate-50` (`#f8fafc`) | Headings, Body text. |
| **Text Secondary** | `slate-400` (`#94a3b8`) | Metadata, Labels, Descriptions. |
| **Accent Primary** | `orange-500` (`#f97316`) | **Action**: Buttons, Links, Active States. |
| **Accent Success** | `emerald-500` (`#10b981`) | **Safe**: Active status, Compliance, Health (Good). |
| **Accent Warning** | `amber-500` (`#f59e0b`) | **Caution**: Vacancies, Expiring items. |
| **Accent Critical** | `rose-600` (`#e11d48`) | **Danger**: Errors, Blockers, Vacancies (Critical). |

### 2.2 Typography
We use a dual-font stack to differentiate "Interface" from "Data".

*   **UI Font**: `Inter` (or System Sans). Used for Headings, Buttons, Body Copy.
*   **Data Font**: `JetBrains Mono` (or System Mono). Used for IDs, Codes (UIC, BIN), Dates, Section Labels, Badge Text.

**Scale:**
*   `text-xs` (10-11px): Uppercase Labels, Metadata.
*   `text-sm` (13-14px): Standard Body, Inputs.
*   `text-base` (16px): Card Titles, Important Data.
*   `text-lg/xl` (18-24px): Page Headers, Modal Titles.

---

## 3. Component Atoms

### 3.1 The "Holon Card"
The fundamental unit of content.
*   **Bg**: `bg-panel`
*   **Border**: `1px solid border-color`
*   **Radius**: `rounded-md` (4px-6px)
*   **Shadow**: `shadow-md`
*   **Interact**: Hover `translate-y-[-2px]`, `shadow-lg`, `border-slate-600`.

### 3.2 Buttons
*   **Primary**: `bg-accent-primary` text `slate-950` font-bold hover:brightness-110.
*   **Secondary**: `bg-surface` border `border-color` text `text-primary` hover:bg-slate-700.
*   **Ghost**: Transparent bg, text `text-secondary` hover:text-primary hover:bg-white/5.

### 3.3 Badges & Chips
Used for State (Active, Vacant) or Type (Person, Org).
*   **Shape**: `rounded` (not full pill).
*   **Text**: `text-[10px]` uppercase tracking-wider font-mono font-bold.
*   **Style**:
    *   *Solid*: `bg-accent-primary` text `white` (for High Priority).
    *   *Subtle*: `bg-slate-800` text `text-secondary` border `border-slate-700`.

### 3.4 Inputs (The "Surface" Input)
*   **Bg**: `bg-canvas` or `bg-surface` (darker than panel).
*   **Border**: `1px solid border-color`. Focus: `border-accent-primary`.
*   **Text**: `text-sm`.
*   **Discovery Bar Variant**: Large, floating, backdrop-blur.

---

## 4. Layout Patterns

### 4.1 The Inspector Panel
A right-aligned drawer that provides details for the selected object.
*   **Width**: Fixed (e.g., 400px).
*   **Header**: High density. "Identity" block (Icon + Title + Subtitle).
*   **Sections**: Divided by strict hairlines.
*   **Labels**: Mono, Uppercase, Tiny (`text-xs text-secondary`).

### 4.2 The Discovery Bar
A centered "Command Palette" for navigation.
*   **Position**: Top-Center (floating).
*   **Behavior**: Expands on focus. Supports natural language.
*   **Glass**: `bg-panel/90 backdrop-blur-md`.

---

## 5. CSS Implementation (Tailwind Config Reference)

To adopt this system, applications should extend their `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: {
          canvas: '#020617', // slate-950
          panel: '#0f172a',  // slate-900
          surface: '#1e293b', // slate-800
        },
        border: {
          DEFAULT: '#334155', // slate-700
        },
        accent: {
          orange: '#f97316',
          green: '#10b981',
          red: '#e11d48',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      }
    }
  }
}
```

---

## 6. Iconography
*   **Library**: `lucide-react`
*   **Style**: Stroke 1.5px or 2px.
*   **Size**:
    *   Small: 14px (Metadata)
    *   Standard: 16-18px (Buttons)
    *   Large: 24px (Section Headers)
