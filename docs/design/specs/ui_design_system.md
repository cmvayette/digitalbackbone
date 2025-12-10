# Digital Backbone UI Design System: "Deep Void"

**Aesthetic Goal**: Operational High-Fidelity. Sci-Fi Realism.
**Core Principle**: "Text is human; Meaning is machine." Structure defined by borders, not shadows.

## 1. Color Palette (Tailwind / CSS Variables)

### The Void (Backgrounds)
- **Canvas**: `slate-950` (#020617) - Main app background. No transparency.
- **Panel**: `slate-900` (#0f172a) - Sidebars, Modals. Use with `bg-slate-900/95 backdrop-blur-md` for glass effect.
- **Surface**: `slate-800` (#1e293b) - Card backgrounds, input fields. often `bg-slate-900/50`.

### Structure (Borders)
- **Subtle**: `slate-800` (#1e293b) - Layout partitions (e.g., separating Sidebar from Canvas).
- **Default**: `slate-700` (#334155) - Component borders (Cards, Inputs).
- **Hover**: `slate-500` (#64748b) - Interactive element hover state.

### Signals (Accents)
- **Electric Pulse (Primary)**: `cyan-400` (#22d3ee) - Active states, selection, primary actions.
- **Warning**: `amber-500` (#f59e0b) - Expiring, At-Risk, Tiger Teams.
- **Critical**: `red-600` (#dc2626) - Risk, Error, Blocked.
- **Valid/Healthy**: `emerald-400` (#34d399) - On-Track, Compliant.

### Typography
- **Human Layer**: `Inter` (sans-serif). Use `tracking-tight` (-0.01em to -0.025em) for headers.
- **Machine Layer**: `JetBrains Mono` (monospace). Use for IDs, dates, coordinates, status codes.

## 2. Component Patterns

### The "Glass Card"
Used for Nodes, List Items, and Floating Panels.

```tsx
<div className="
  bg-slate-950/50 backdrop-blur-sm 
  border border-slate-700 
  hover:border-slate-500 hover:bg-slate-900/40 
  transition-all duration-200
  rounded-sm
">
  {/* Content */}
</div>
```

### Layout Partitions
Do not use whitespace to separate major areas. Use 1px borders.

```tsx
<div className="flex h-screen">
  <Sidebar className="w-64 border-r border-slate-800" />
  <Main className="flex-1 bg-slate-950" />
</div>
```

### Typography Usage
- **Headers**: `font-bold text-white tracking-tight`.
- **Labels**: `text-xs text-slate-400 font-medium`.
- **Data Attributes**: `font-mono text-[10px] uppercase tracking-wider`.

## 3. Anti-Patterns (Do Not Use)
- ❌ **Drop Shadows**: Do not use `shadow-md`, `shadow-lg` for depth. Use Border Luminosity (lighter borders on top/hover).
- ❌ **Rounded Full**: Avoid `rounded-full` for buttons or inputs (except status badges). Use `rounded-sm` or `rounded-md`.
- ❌ **White/Light Backgrounds**: The system is strictly Dark Mode.
- ❌ **Opacity Transition Only**: Always pair opacity changes with a border color change for interaction feedback.
