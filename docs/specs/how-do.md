# **HOW-DO APP — DESIGN SPEC v2**

_A blueprint-inspired, structurally grounded, deeply integrated process system_

---

# **0. PURPOSE & VISION**

The **How-Do App** is the command’s **operational operating system**—a structured, computable, intuitive environment for answering the question:

> **“How do we do X?”**

It transforms tribal knowledge into a **living, governed, navigable process landscape**, tightly bound to:

- the **Org Chart’s structure** (Organizations, Positions, Role Tags, People)
    
- the **Governance system’s constraints** (Obligations, Policies, Compliance)
    
- the **Semantic Operating Model** that gives meaning to relationships
    

The app is designed around three imperatives:

### **1. Clarity**

Every member must be able to find, understand, and follow a process in under 20 seconds.

### **2. Ownership**

Every step must clearly belong to someone — not a vague office name, but a real Position or Role Tag.

### **3. Alignment**

Processes must reflect real structure and real policy, updating as those systems evolve.

The result is a **single authoritative map** of how the organization works today — and a foundation for evolving how it works tomorrow.

---

# **1. HIGH-LEVEL FUNCTIONAL OVERVIEW**

The How-Do App consists of six functional pillars:

1. **Process Discovery**  
    “How do I…?” search that surfaces the right workflows instantly.
    
2. **Process Viewer**  
    A blueprint-clean, readable representation of steps, owners, handoffs, and obligations.
    
3. **Process Editor**  
    A simple but structurally rigorous tool for defining and updating workflows.
    
4. **Execution Mode (V2-ready hybrid)**  
    Lightweight guided walkthrough of processes, with optional step progression.
    
5. **Governance Integration**  
    Policy obligations flow into processes; drift alerts identify misalignment.
    
6. **Org Chart Integration**  
    Ownership is tied to the real organizational structure, including Role Tags.
    
7. **Process Health & Drift Monitoring**  
    Structural, policy, and process maturity indicators.
    

Each functional section below includes:

- Narrative purpose
    
- User-facing behaviors
    
- Detailed functional requirements
    
- Edge cases and constraints
    

---

# **2. FUNCTIONAL AREA: PROCESS DISCOVERY**

---

## **2.1 Purpose**

Make it effortless to find the right process in seconds, regardless of language skill, rank, or domain knowledge.

---

## **2.2 Key UX Behaviors**

### **“How do I…?” Search Bar**

- Natural language queries
    
- Auto-suggestions while typing
    
- Matches by:
    
    - process title
        
    - description
        
    - tags
        
    - step content
        
    - owner organizations
        
    - obligations satisfied
        
    - role relevance to the user
        

### **Smart Recommendations**

Triggered when:

- user opens an organization
    
- user views a position
    
- user joins a new role
    
- user searches for ambiguous terms
    

Examples:

- “Processes N6 owns”
    
- “Processes relevant to your position”
    
- “Common onboarding workflows”
    

### **Filters**

- Domain (training, logistics, IT, medical, admin…)
    
- Owning organization
    
- Step owner
    
- Role Tag relevance
    
- Obligation relevance
    
- V1 vs V2 changes
    

---

## **2.3 Functional Requirements**

- R1: Search must accept natural language queries.
    
- R2: Fuzzy matching must compensate for typos and rank/grade-specific jargon.
    
- R3: The matching engine must prioritize:
    
    1. Title
        
    2. User’s position relevance
        
    3. Obligations
        
    4. Step ownership
        
    5. Tags
        
- R4: Search results must include:
    
    - Name
        
    - Owner
        
    - 1-sentence description
        
    - Last updated
        
    - Number of steps
        
- R5: Search must return results within 150ms.
    

---

# **3. FUNCTIONAL AREA: PROCESS VIEWER**

---

## **3.1 Purpose**

Provide **crystal-clear, blueprint-inspired clarity** for any process — readable by a tired E-5 at 2200.

---

## **3.2 Core UX Model**

Two layout modes:

### **A. Swimlane Layout (default)**

- Steps grouped by owner (Organization, Position, or Role Tag).
    
- Handoffs shown horizontally.
    
- Lanes clickable to open the Org Chart sidebar.
    

### **B. Linear Timeline Layout**

- Vertical scrolling version for mobile and quick scanning.
    
- Lanes compressed into owner badges.
    

---

## **3.3 Step Card Components**

Each step shows:

- Title
    
- Description (plain language, 1–2 sentences)
    
- Owner (Position, Organization, Role Tag)
    
- Linked attachments (SOPs, templates, forms)
    
- Obligation badges (hover to expand)
    
- Estimated time / SLA (optional)
    
- Decision logic (minimal, V-shape)
    

---

## **3.4 Viewer Enhancements**

### **Show Only My Steps**

Filters process to:

- Steps owned by the user’s position(s)
    
- Upstream dependencies
    
- Immediate downstream expectations
    

### **Explain It to Me Like I’m New**

Simplifies language automatically:

- Removes jargon
    
- Expands acronyms
    
- Adds small contextual examples
    

### **Scenario Mode**

User selects:

- “I’m a contractor”
    
- “I’m a new onboardee”
    
- “Request was denied”
    

The viewer adjusts based on branch logic.

---

## **3.5 Functional Requirements**

- V1: Must render processes up to 50 steps cleanly.
    
- V2: Must support guided execution (see section 5).
    
- Must gracefully collapse branches and loops.
    
- Must degrade elegantly on narrow screens.
    
- Must support click-through to Org Chart.
    

---

# **4. FUNCTIONAL AREA: PROCESS EDITOR**

---

## **4.1 Purpose**

Allow process owners to create/update workflows with **zero BPMN training**, while enforcing structural correctness.

---

## **4.2 Core Editing Interactions**

- Add step
    
- Define title & description
    
- Select owner (Org, Position, Role Tag)
    
- Reorder steps via drag
    
- Add decision branches
    
- Attach files/forms
    
- Link obligations
    
- Save draft / publish / archive
    
- Version history & diff
    

---

## **4.3 Owner Selection Logic**

Owner types:

- **Organization**
    
- **Position**
    
- **Role Tag** (multi-eligible owners)
    

Functional rules:

- Editor must fetch owners from Org Chart in real time
    
- Role Tags must show eligible positions & personnel
    
- Cannot select archived positions
    
- Must warn when:
    
    - owner org is archived
        
    - no occupants fill owner position(s)
        
    - role tags have no assigned positions
        

---

## **4.4 Functional Requirements**

- R1: Every step must have exactly one owner type.
    
- R2: Step order must remain structurally sound.
    
- R3: Branches must rejoin cleanly; editor prevents orphan branches.
    
- R4: Editor must validate:
    
    - Steps without owners
        
    - Broken links
        
    - Missing obligation coverage
        
    - Drift conditions
        

---

# **5. FUNCTIONAL AREA: EXECUTION MODE (V2 HYBRID)**

---

## **5.1 Purpose**

Enable lightweight, user-driven walkthroughs of processes **without** converting How-Do into a tasking system.

---

## **5.2 Core UX Model**

- Highlight current step
    
- Mark step complete
    
- Auto-advance
    
- Show handoff owner
    
- Show attached templates
    
- Persist partial progress
    
- Resume later
    
- Allow user to abandon or restart
    

---

## **5.3 Functional Requirements**

- Execution state stored per user per process instance
    
- No multi-user workflow — not a task assignment system
    
- Supports branching logic and Scenario Modes
    
- Supports “My Active Processes” tab
    

---

# **6. FUNCTIONAL AREA: GOVERNANCE INTEGRATION**

---

## **6.1 Purpose**

Ensure processes embody policy, and warn owners when they don’t.

---

## **6.2 Obligation Linkage**

Steps may satisfy obligations, which include:

- Required action
    
- Actor (Org / Position / Role Tag)
    
- Trigger
    
- Deadline
    
- Policy reference
    

Viewer shows obligation badges.  
Editor warns of missing coverage.

---

## **6.3 Drift Alerts**

Triggered when:

- Policy changes
    
- Obligations updated
    
- Structure changes (Org Chart edits)
    
- Role Tags reassigned
    
- Positions archived / renamed
    

Alerts shown as:

- Banner in Editor
    
- Health indicator in Process list
    
- “Needs Review” state
    

---

## **6.4 Functional Requirements**

- Must detect all broken obligation mappings
    
- Must detect all structural misalignments
    
- Must provide one-click navigation to resolve issues
    
- Must support multiple obligations per step
    
- Must prevent publishing when obligations are violated (configurable)
    

---

# **7. FUNCTIONAL AREA: ORG CHART INTEGRATION**

---

## **7.1 Purpose**

Tie process ownership to the real structure of the command.

---

## **7.2 Structural Concepts**

**Organizations**  
Own entire processes or groups of steps.

**Positions**  
Own discrete steps.

**Role Tags**  
Provide multi-eligible ownership for flexible but controlled responsibility.

---

## **7.3 Functional Behaviors**

From How-Do → Org Chart:

- Clicking a lane owner opens Org Chart sidebar.
    

From Org Chart → How-Do:

- Organizations show processes owned
    
- Positions show steps owned
    
- Individuals show processes they participate in
    

---

# **8. FUNCTIONAL AREA: PROCESS HEALTH MODEL**

---

## **8.1 Purpose**

Provide trust signals that help users evaluate the reliability of a process.

---

## **8.2 Health Indicators**

### **1. Freshness**

- Last updated
    
- Last validated
    
- Outdated threshold configurable
    

### **2. Obligation Coverage**

- % obligations satisfied
    
- Missing mappings
    

### **3. Structural Alignment**

- Position/org drift
    
- Role Tag validity
    

### **4. Complexity Score**

- Step count
    
- Branch count
    
- Owner count
    

### **5. Execution Feedback (V2)**

- Steps with high friction
    
- User-reported confusion
    

---

## **8.3 Functional Requirements**

- Must compute health on publish
    
- Must surface warnings non-intrusively
    
- Must integrate with search ranking
    

---

# **9. FUNCTIONAL AREA: DATA MODEL (MVP & V2)**

---

## **Entities**

- Process
    
- ProcessVersion
    
- ProcessStep
    
- Attachment
    
- ObligationLink
    
- ExecutionInstance (V2)
    
- DriftFlag
    
- Tag
    

---

## **Key Relationships**

- ProcessVersion → Process (1:N)
    
- Step → ProcessVersion (N:1)
    
- Step → Owner (Org/Position/RoleTag union)
    
- Step → ObligationLink (0:N)
    
- ExecutionInstance → User + Version
    

---

# **10. FUNCTIONAL AREA: USER EXPERIENCE PRINCIPLES**

- Blueprint aesthetic
    
- Monoline geometry
    
- High contrast
    
- Zero decorative UI
    
- Cognitive simplicity
    
- Structural truth at all layers
    
- “If a user is confused, the system is wrong.”
    

---

# **11. FUTURE EXTENSIONS**

- Automated SLA monitoring
    
- Heatmaps of step friction
    
- Cross-process dependency graphs
    
- Simulation (“If we change X, what breaks?”)
    
- Process bundling (playbooks)
    

---

# **12. SUMMARY**

The How-Do App v2 is:

- A structurally rigorous process system
    
- Deeply integrated with Org Chart and Governance
    
- Future-ready for guided execution
    
- Designed for clarity and real-world utility
    
- Governed by semantic fidelity and operational truth
    

It is the **authoritative operational manual** of the command — not as a document, but as a living system.