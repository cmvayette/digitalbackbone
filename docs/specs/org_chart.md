# 📄 ORG CHART APPLICATION — DESIGN SPEC (Integrated & Vision-Aligned)

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

The app must feel like a **blueprint that became interactive**—the **computable map** of the organization's nervous system.

---

# 1. Purpose (The Semantic Digital Backbone Engine)

The Org Chart App is a **holonic, interactive visualization** of the enterprise. It enables users to:

- Navigate the hierarchy intuitively.
- **Discover capabilities** and active missions of each office.
- Find who occupies which roles.
- **View Policy Obligations** and organizational risk (Governance as Code).
- **Manage positions and assignments based on required competence** (Competence as Algorithm).
- **Visualize strategic alignment** (Alignment is Provable).
- Create and manage organizational units (including Tiger Teams).

It is both a **directory** and a **work surface**—the front-end for the **Semantic Digital Backbone.**

---

# 2. Primary Interface Regions

## 2.1 Graph Canvas (Primary Surface: The Organizational Map)

- Occupies 70–85% of the screen.
- Displays **Organizations → Positions → Persons** as **Holon Pods.**
- Blueprint aesthetic: Dark canvas, Monoline geometry (1–1.25px), Minimal fill, Functional accents only.

### **Integrated Semantic Features (Core to the Digital Backbone):**

- **Visualization Modes (NEW):** A toggle bar allows users to switch the Pod arrangement and connection lines to show different **computable relationships** (Structure is Physics):
    1.  **Reporting Mode (Default):** Classic hierarchical lines.
    2.  **Mission Alignment Mode:** Connects Pods that share a high-level **Objective/Key Result.**
    3.  **Process Flow Mode:** Uses directional arrows to show dependencies related to a specific **How-Do** process or **Policy Obligation.**
- **Smart Hover Micro-Tooltips** for immediate understanding.
- **Vacancy callout indicators.**
- **Semantic Health Badges (NEW):**
    - **Load/Capacity Indicator (NEW):** A small progress ring on the Pod showing current task load vs. defined capacity.
    - **Compliance Status Dot (NEW):** Red/Yellow/Green dot showing risk from overdue Policy Obligations.
- **Soft highlighting of dual-role relationships (Tiger Teams).**
- **Auto-center on newly created orgs/positions/teams.**

These features turn the canvas into an active, analytical map.

---

## 2.2 Discovery Bar (Centered Search/Filter)

Appears centered at the top of the graph; compact, non-intrusive.

Supports:

- Typeahead search for orgs, positions, people.
- **Natural-language queries (lite mode) integrated with the Semantic Graph (UPDATED):**
    Examples:
    - “vacant billets requiring **'Cloud Security' competence**”
    - “who works in contracting and is linked to the **'2026 Modernization Objective'**?”
    - “show tiger teams”
- **Semantic Filters (UPDATED):**
    - Vacancies
    - Billet-funded positions
    - **Competency Tag Match/Mismatch** (vs. needed skills)
    - **Objective Alignment** (Filter by active strategic goal)
- Selecting a result re-centers graph smoothly.

The Discovery Bar is the **primary wayfinding tool and competence finder.**

---

## 2.3 Sidebar Panel (Right Side)

Opens when any holon is selected. Dynamically adapts.

### Organization Sidebar (The Holon View)

- Name & description.
- **Competency Tags:** Key capabilities derived from linked How-Do processes.
- Roster overview.
- **Policy Obligations View (NEW):** List of critical policies governing this unit, with links to generated tasks.
- **Objective Links (NEW):** List of strategic objectives the organization contributes to.
- Inline service launch icons.

### Position Sidebar (The Role View)

- Title, Billet status.
- Qualification expectations **(Required Qualifications).**
    - *Must display provenance (e.g., "Source: DoD Manual 8570.01").*
- Occupant (if any).
- Vacancy indicator.
- **Roster Builder Panel Toggle (NEW):** Button to initiate the strategic staffing process.
- Assign/reassign tools.
- **Linked How-Do Processes (NEW):** Direct link to the official operational procedure for this role.

### Person Sidebar

- Name, rank, type.
- **Held Certificates** (Qualifications).
- Primary position.
- **Other organizational affiliations (Dual-Roles/Tiger Teams)**.
- **Current Task Load Meter (NEW):** Visualizing their assigned work capacity.

### Tiger Team Sidebar

- Purpose, Sponsor org, Duration.
- **Shared Objective/Mission Link.**
- Members and their associated load/commitment to the team.

---

# 3. Entity Model (The Holon Nodes)

This model represents the **computable elements** of the Semantic Digital Backbone:

## 3.1 Organization (The Unit Holon)

- **Structural identity** (Parent, siblings, children).
- Description & purpose.
- **Services/Capabilities (Competency Tags).**
- **Policy/Governance links.**
- Health indicator (Load / Compliance / Filled positions).

## 3.2 Position (The Role Holon)

- Title, Billet status.
- **Required Qualifications** (derived from linked How-Do processes).
    - **Provenance:** Critical. Every qualification must trace back to a **Policy Obligation** or **Standard Operating Procedure (SOP)**.
- Allowed occupant type.
- **Assigned Person.**
- State: Vacant / Filled / Acting / Archived.

## 3.3 Person (The Identity Holon)

- Name, Rank/type.
- **Held Certificates** (Evidence of competence).
- Primary Position, Additional affiliations.
- **Current Load/Capacity data.**

## 3.4 Competence Reconciliation Function (The Logic Layer)

The system does not simply match strings. It uses a **Reconciliation Function** to map *Held Certificates* to *Required Qualifications*.

- **Logic:** `Certificate(C) → Satisfies → Qualification(Q)`
- **Example:** A Person holds "CompTIA Security+" (Certificate). The Position requires "IAM Level 2" (Qualification). The system knows that "CompTIA Security+" *satisfies* "IAM Level 2" and validates the match.
- **Grace Logic:** If a valid certificate is expired but within a grace period, the match is valid but flagged "At Risk".

---

# 4. Core User Use Cases (Actionable Coherence)

## 5.3 Assign People to Positions (The Roster Builder)

- Vacancy indicators prompt action.
- Sidebar **Qualification validation against Competency Tags.**
- **"Find eligible members" button triggers the Roster Builder (see Section 8.D).**
- Assignment workflow utilizes Load Conflict Check before final approval.

## 5.5 Manage Organizational Structure

- Create/edit/move organizations.
- When moving an Org, the system checks for **Policy Governance conflicts** and alerts the user (e.g., "Warning: Moving this org breaks compliance with Policy X").

## 5.6 Understand What an Office Does (The Semantic View)

- Organization sidebar description.
- Use **Mission Alignment Mode** to see who they collaborate with on strategy.
- Use **Process Flow Mode** to see their functional dependencies.

---

# 8. Intuitive UX Enhancements (Integrated Into Spec)

### D. **The Roster Builder Panel (The Team Builder Feature)**

The Roster Builder is a focused view used for strategic staffing.

- **Trigger:** Click the "Find eligible members" button on a vacant Position Sidebar.
- **Layout:** Two columns in a dedicated modal/side view.
    1.  **Position Requirements (Left):** Lists *Mandatory* and *Desired* **Qualifications** derived directly from the Position's linked **How-Do** process.
    2.  **Internal Talent Pool (Right):** Searchable list of all personnel.
- **Logic:**
    - **Smart Match Score:** Displays a score for each person based on the **Reconciliation** of their **Held Certificates** against the position's *Mandatory* **Qualifications**.
    - **Load Conflict Check:** Flags candidates whose **Current Task Load Meter** exceeds a defined capacity threshold, warning against over-commitment.
    - **Recommendation Logic:** Prioritizes high-score, low-load candidates.

This updated specification is now a truly **Integrated & Vision-Aligned** design document that leverages the Semantic Digital Backbone principles in every critical UI component.
