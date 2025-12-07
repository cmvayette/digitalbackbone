# ORG CHART APPLICATION — DESIGN SPEC (Integrated & Vision-Aligned)

---

# 0. Vision: What We Are Building

We are building the **most intuitive, effortless, and structurally honest organizational explorer** ever deployed inside a military or large enterprise environment.

The Org Chart App must:

- **Give every member clarity** about where they are, what exists around them, and who does what.
- **Make the structure of the organization navigable, discoverable, and self-explanatory.**
- **Turn the org chart from a static diagram into a living, operational interface**—the gateway to services, roles, people, and work itself.
- **Reduce administrative friction** by making position management, assignments, and structural updates simple, predictable, and safe.
- **Support organic, cross-functional work** through Tiger Teams without compromising structural integrity.
- **Be immediately understandable** even to a first-time user and **powerfully efficient** for experts.

The design philosophy is:
**Minimal UI. Maximal clarity. No noise. Everything purposeful.**

The app must feel like a **blueprint that became interactive.**
Clean lines, structural truth, zero ornamentation.

---

# 1. Purpose

The Org Chart App is a **holonic, interactive visualization** of the enterprise. It enables users to:

- Navigate the hierarchy intuitively
- Discover what each office does
- Find who occupies which roles
- Access services provided by offices
- Manage positions and assignments
- Create and manage organizational units (including Tiger Teams)

It is both a **directory** and a **work surface**.

---

# 2. Primary Interface Regions

## 2.1 Graph Canvas (Primary Surface)

- Occupies 70–85% of the screen
- Displays **Organizations → Positions → Persons** as holon cards
- Blueprint aesthetic:
    - Dark canvas
    - Monoline geometry (1–1.25px)
    - Minimal fill
    - Functional accents only

**Behaviors & Enhancements Integrated:**

- Pan, zoom, collapse/expand, re-center
- **Smart Hover Micro-Tooltips** for immediate understanding
- **Vacancy callout indicators**
- **Org health dots (green/yellow/red)**
- **Roster preview on hover**
- **Soft highlighting of dual-role relationships (Tiger Teams)**
- **Auto-center on newly created orgs/positions/teams**
- “Where Am I?” button for rapid reorientation
- Keyboard navigation (← ↑ → / esc)
- Undo toast after structural changes

These features preserve visual purity while dramatically improving usability.

---

## 2.2 Discovery Bar (Centered Search/Filter)

Appears centered at the top of the graph; compact, non-intrusive.

Supports:

- Typeahead search for orgs, positions, people
- **Natural-language queries (lite mode)**
    Examples:
    - “vacant billets in training”
    - “who works in contracting?”
    - “show tiger teams”
- Filters:
    - Vacancies
    - Billet-funded positions
    - Qualification match/mismatch
    - Tiger Team organizations
- Selecting a result re-centers graph smoothly
- Activatable via `/`

The Discovery Bar is the **primary wayfinding tool.**

---

## 2.3 Sidebar Panel (Right Side)

Opens when any holon is selected. Dynamically adapts.

### Organization Sidebar

- Name & description
- Roster overview
- Suborgs summary
- **Inline service launch icons** (email, SharePoint, forms, guides, etc.)
- Org health indicator
- Breadcrumb linking

### Position Sidebar

- Title
- Billet status
- Qualification expectations
- Occupant (if any)
- Vacancy indicator
- **Find eligible members**
- Assign/reassign tools

### Person Sidebar

- Name, rank, type
- Certificates & qualifications
- Primary position
- **Other organizational affiliations (e.g., Tiger Teams)**
- Quick navigation to those teams

### Tiger Team Sidebar

(Same as organization—Tiger Teams _are_ organizations)

- Purpose
- Members
- Lead(s)
- Duration (optional metadata)
- Links to relevant tools or shared documents

---

# 3. Entity Model (Holons)

## 3.1 Organization

- Structural unit or Tiger Team
- Parent, siblings, children
- Description & purpose
- Services
- Roster (positions + people)
- Health indicator (# of filled/vacant positions)

## 3.2 Position

- Title
- Billet status (funded/unfunded)
- Qualification expectations
- Allowed occupant type (mil/civ/ctr)
- Assigned Person
- State: Vacant / Filled / Acting / Archived

## 3.3 Person

- Name
- Rank/type
- Certificates & qualifications
- Primary Position
- Additional Organization affiliations (e.g., Tiger Teams)

## 3.4 Tiger Team (Organization Type)

- Behaves identically to an Organization
- Additional metadata:
    - Purpose
    - Sponsor org
    - Duration

---

# 4. Graph Initialization & Navigation Model

## 4.1 Launch Behavior

Graph centers on **user’s home organization**.

Visible:

- Parent (1 up)
- Siblings
- Home org (center)
- Children (1 down)

Also shown:

- Smart hover insights
- Health dots
- Vacancy indicators

## 4.2 Re-Centering Behavior

Selecting an organization:

- Reorients graph around that node
- Maintains the 3-band contextual window
- Breadcrumb updates
- “Where Am I?” button appears if user drifts

## 4.3 Deep Navigation

One layer of children visible at a time.
Selecting a child makes it the new center.

Consistent, simple mental model.

---

# 5. Core User Use Cases

## 5.1 Find Who Is in an Organization

- Search or click org
- Tooltip previews
- Sidebar shows description, roster, services
- Roster preview inline on hover

## 5.2 Understand What an Office Does

- Organization sidebar description
- Inline service icons
- Auto-generated narrative summaries (optional enhancement)

## 5.3 Assign People to Positions

- Vacancy indicators
- Sidebar qualification validation
- “Find eligible members”
- Assignment workflow

## 5.4 Manage Positions

- Create/edit/archive positions
- Smart defaults (inherit billet, suggest quals)
- Auto-center after creation
- Undo for mistakes

## 5.5 Manage Organizational Structure

- Create/edit/move organizations
- Breadcrumb-aware navigation
- Recovery from mistakes via undo toast

## 5.6 Create and Manage Tiger Teams

- Tiger Team = Organization
- Create team
- Add positions
- Assign members (dual-roles)
- Navigate to and from teams effortlessly

---

# 6. Holon Card Design Requirements

- Blueprint, monoline (1–1.25px)
- Minimal fill
- High-contrast dark canvas
- Functional color accents
- Modular geometry

### Organization Card

- Name
- Health dot
- Child count
- Services indicator

### Position Card

- Title
- Billet badge
- Qualification indicator
- Person preview

### Person Card

- Name
- Rank/type
- Qualification state

---

# 7. Discovery Bar Spec (Finalized)

Capabilities:

- Typeahead
- Lite natural language
- Filters
- Jump-to-node
- Keyboard activation

Design:

- Minimalist
- Expands when focused
- Blueprint-styled outline

---

# 8. Intuitive UX Enhancements (Integrated Into Spec)

### A. Orientation Enhancers

- Breadcrumbs
- “Where Am I?” button
- Auto-center on creation
- Undo toast

### B. Discovery Enhancers

- Smart hovers
- Natural-language search
- Vacancy filters
- Org health dots
- Roster preview

### C. Efficiency Enhancers

- Keyboard navigation
- Smart defaults
- Click-to-launch office services

These are invisible unless needed, but transformative once discovered.
