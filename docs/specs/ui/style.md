# 🎨 Digital Blueprint UI/UX Standard (DBS v1.0)

## 1. Core Design Philosophy

The aesthetic must reinforce the system's mission: **structural truth, maximal clarity, and zero noise**. The application must feel like a **blueprint that became interactive**.

| Principle | Description | Rationale |
| :--- | :--- | :--- |
| **Aesthetic Model** | High-contrast **Digital Blueprint** / Architectural style. | Reinforces the engineered framework of the Semantic Operating Model (SOM). |
| **Cognitive Load** | **Zero cognitive tax**; everything purposeful. Avoid excessive density; use **Smart Hovers** for depth. | Ensures immediate understanding for first-time users and efficiency for experts. |
| **Monoline Structure** | All dividing lines, borders, and connectors must use **monoline geometry** (1–1.25px) and a subtle blue-grey color ($\text{#475569}$). | Establishes the blueprint feel and visually separates the system's structural elements. |

---

## 2. Color Palette & Theming (Mandatory Dark Mode)

All applications must utilize the following high-contrast dark theme, designed for prolonged screen use and maximum data visibility (WCAG 2.0 Compliant).

| Element | Hex Code | Purpose | Rationale |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | $\text{#0F172A}$ | Primary screen background (the digital "paper"). | Low eye strain, high-contrast base. |
| **Panel/Surface** | $\text{#1E293B}$ | Background for cards, side panels, and modules (e.g., Org Sidebar, Holon Card background). | Creates clear separation from the canvas. |
| **Border/Dividers** | $\text{#475569}$ | Structural lines, borders, and monoline geometry. | Blueprint feel. |
| **Primary Text** | $\text{#F8FAFC}$ | Headlines, main content, primary data points. | Highest readability. |
| **Secondary Text** | $\text{#94A3B8}$ | Metadata, supporting details, inactive labels. | Reduces noise. |

---

## 3. Functional Color Use (Accents & Status)

Color is reserved strictly for **functional signaling**, not decoration.

| Color Accent | Hex Code | Usage Context | Example Application |
| :--- | :--- | :--- | :--- |
| **Primary Action** | $\text{#F97316}$ (Orange) | **Mandatory accent** for primary buttons ("Publish," "Connect"), active navigation indicators, and high-priority alerts. | **Org Chart:** "Connect" button; **Policy:** Live Obligation Panel indicator. |
| **Success/Valid** | $\text{#10B981}$ (Green) | Status indicating success, validity, **Functional** positions, or "On-Track" status. | **How-Do:** Completed step; **OKR:** KR Health dot. |
| **Warning/Risk** | $\text{#FACC15}$ (Amber) | Status indicating "At-Risk," expiring soon, or moderate drift. | **Member Hub:** Expiring certificate alert. |
| **Structural** | $\text{#94A3B8}$ (Blue-Grey) | Used for ghost/vacant states or non-primary structural identifiers. | **Org Chart:** Vacant card border (dashed $\text{#475569}$), Vacant label. |

---

## 4. Typography Standards

The typography must reinforce the division between human narrative and the underlying computational structure.

| Typeface Slot | Font Stack/Style | Mandatory Usage |
| :--- | :--- | :--- |
| **Primary UI/Narrative**| Standard Sans-serif (e.g., Inter or system font) | All prose, headings, button labels, and general body text. |
| **Computational/Code** | **Monospace** (e.g., JetBrains Mono, Fira Code) | **Strictly reserved** for technical names: `event_type`, measure DSL, API routes, status labels in structured reports. |
| **Headings** | Bold and capitalized. Headers should establish a clear hierarchy (`H1-H3`). | Use a strong `H1` and `H2` hierarchy with ample spacing to avoid visual clutter. |

---

## 5. Component Behavior & Interaction Standards

| Component/Feature | Standard Behavior | Application Examples |
| :--- | :--- | :--- |
| **Holon Card** | Must represent a single entity (`Organization`, `Position`, `Person`). Must contain minimal, immediate data (Name, Status Badge). | **Org Chart:** Position Card. |
| **Functional Badges**| Small, high-contrast tags used to convey immutable state (e.g., **Billet** vs. **Functional**). | **Org Chart:** Billet Badge; **How-Do:** Obligation Badge. |
| **Smart Hover** | Used to reveal secondary data (roster preview, step description, full mission statement) **on demand**, minimizing canvas clutter. | **Org Chart:** Roster preview on Organization card hover. |
| **Action Center** | Where tasks are presented, they must be **Inline Actioning** capable (confirm, upload, or launch process context). | **Member Hub:** Task Strip. |
| **Structural Navigation**| Must include a **"Where Am I?"** feature and clear breadcrumbs for reorientation within the hierarchy. | **Org Chart:** Graph navigation; **How-Do:** Breadcrumbs for process versions. |
| **System Traceability**| Every measured or governed element must carry metadata linking it back to the definitive source (e.g., Policy $\rightarrow$ Obligation $\rightarrow$ How-Do Step). | **How-Do:** Step Card shows Obligation Badges; **M&L:** Lens output includes **Explainability Metadata**. |

