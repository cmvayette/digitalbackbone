# **MEMBER HUB — DESIGN SPEC v1**

_A single place for each member to see what matters, what’s expected, and what’s theirs._

---

## **0. PURPOSE & VALUE**

**Purpose:**  
The **Member Hub** is the **personal cockpit** for each member of the command.

It answers three core questions:

1. **“What do I need to know?”** (notifications, news, alerts)
    
2. **“What do I need to do?”** (tasks, actions, approvals)
    
3. **“What do I need to keep up to date?”** (certs, documents, device info, etc.)
    

This Hub must be:

- The **default landing page** for most users
    
- The **lowest-friction path** to handle admin/operational tasks
    
- The **transparent mirror** of what the system knows about them (within clearance limits)
    

---

## **1. HIGH-LEVEL LAYOUT**

Single main page, with three primary regions:

1. **Top: “What’s happening”**
    
    - Critical alerts
        
    - Priority notifications
        
    - Command news / announcements
        
2. **Middle: “What you need to do” (Task Strip / Task Board)**
    
    - Interactive, actionable tasks
        
    - Direct integration with How-Do, Governance obligations, and local workflows
        
3. **Bottom: “Your Vault” (Structured Dropbox)**
    
    - Opinionated slots for key documents/certs
        
    - Status on what’s missing / expiring / outdated
        
    - Safe place to put things the system can use to answer data calls
        

Blueprint aesthetic, minimal noise, all signal.

---

## **2. CORE ENTITY: MEMBER PROFILE CONTEXT**

The Hub is member-centric. Everything is filtered through:

- Who they are (Person from Org Chart)
    
- What positions they occupy
    
- What Tiger Teams / extra orgs they belong to
    
- What obligations and processes are attached to those positions
    
- What devices, certs, and docs are linked to them
    

This context drives:

- Which tasks they see
    
- Which notifications are relevant
    
- Which vault slots matter
    

---

## **3. FUNCTIONAL AREA: NOTIFICATIONS & NEWS**

---

### **3.1 Purpose**

Give the member a **clear, prioritized view** of:

- Time-sensitive requirements
    
- Command-wide messages that truly matter
    
- Changes that affect their obligations, access, or expectations
    

---

### **3.2 Notification Types**

1. **Actionable Alerts (Red / Amber)**
    
    - Expiring certs
        
    - Required training
        
    - Upcoming deadlines tied to obligations or KRs
        
    - System access at risk (e.g., CAC, IA training)
        
2. **Informational Notices (Blue/Grey)**
    
    - Command announcements
        
    - Policy changes that affect them
        
    - Role or org assignment changes
        
3. **FYI, Low-Weight Items**
    
    - General news
        
    - Non-critical events
        

---

### **3.3 Functional Requirements**

- R1: Notifications are **personalized**:
    
    - Derived from Governance obligations (via their positions/role tags)
        
    - Derived from How-Do executions they’re involved in
        
    - Derived from expiring documents in their Vault
        
- R2: Each notification clearly indicates:
    
    - **What** happened
        
    - **Why** it matters to them
        
    - **What, if anything, they need to do**
        
    - **By when**, if applicable
        
- R3: Notifications must be:
    
    - Dismissible (with rules: e.g., you can snooze, but not hide critical obligations)
        
    - Traceable (visible in a simple history)
        
- R4: Command news and announcements:
    
    - Are scoped (command-wide, group, team, role-specific)
        
    - Are clearly separated from “you must act” alerts
        

---

## **4. FUNCTIONAL AREA: TASK LIST / ACTION CENTER**

---

### **4.1 Purpose**

Turn the Member Hub into an **action surface**, not just a dashboard.

This area answers:

> **“What do I need to do next?”**  
> **“Can I do it right here?”**

---

### **4.2 Task Sources**

Tasks can originate from:

- **How-Do Execution**
    
    - Steps assigned to the member’s position or role tag
        
    - Example: “Complete section B of onboarding packet.”
        
- **Governance Obligations**
    
    - Direct obligations targeting their role (e.g., “Certifying official must review…”)
        
- **Org & Leader Assigned Tasks**
    
    - Local admin tasks (“update your device record”)
        
    - One-off requests tied to their role/team
        
- **System Health / Data Completeness**
    
    - “Upload cyber cert”
        
    - “Confirm your current workstation name”
        
    - “Confirm your emergency contact info”
        

---

### **4.3 Task Card Design**

Each task card shows:

- Clear verb phrase:
    
    > “Upload your most recent Cyber Awareness Certificate”
    
- Source:
    
    - Process (How-Do)
        
    - Obligation (Governance)
        
    - Leader/Org
        
- Due date / SLA (if applicable)
    
- Confidence/priority (Visual indication)
    
- One or two buttons:
    
    - **Action in place** (form, upload, confirmation)
        
    - **Open related context** (jump to the process, policy, or org view)
        

---

### **4.4 Inline Task Actioning**

Wherever possible:

- The member should **complete the task inside the Hub**, not be kicked elsewhere.
    
    - Upload a file directly into a Vault slot
        
    - Confirm a piece of info (device name, phone, etc.)
        
    - Click “I’ve completed this” when the “work” is external but confirmation is required
        

Completed tasks:

- Update source systems (How-Do, Governance, reference tables)
    
- Disappear from the active list
    
- Appear in a simple “Recently completed” list
    

---

### **4.5 Functional Requirements**

- R1: Tasks must be **deduped** — one surface, not three notifications for the same obligation.
    
- R2: Tasks must respect **permissions and classification** — only show appropriate items.
    
- R3: Task actions must be transactionally safe:
    
    - If the action fails upstream, the task should reflect that (with a clear error).
        
- R4: Tasks should be sortable and filterable:
    
    - By due date, type, origin (training, admin, etc.).
        

---

## **5. FUNCTIONAL AREA: STRUCTURED “DROPBOX” VAULT**

---

### **5.1 Purpose**

Provide a **structured, opinionated personal vault** that:

- Reduces repeated data calls
    
- Standardizes where key docs live
    
- Keeps member-owned data linked to systems that need it
    
- Gives members transparency into what the organization “thinks” is on file for them
    

---

### **5.2 Vault Model**

Instead of a free-for-all folder, the Vault is made up of **slots**, each with:

- Name (e.g., “Cyber Awareness Certificate”, “Medical Readiness Summary”, “Device: Primary Workstation Name”)
    
- Type:
    
    - File (PDF, image, etc.)
        
    - Text data (computer name, phone number, etc.)
        
    - Linked record (from a system of record)
        
- Status:
    
    - Present
        
    - Missing
        
    - Expiring soon
        
    - Outdated / superseded
        
- Owner: the member (with system read-access based on role)
    
- Last updated date
    
- Where this slot feeds:
    
    - Which data calls / dashboards / obligations depend on it
        

Think of it as a **schema-ed personal record** the member can actually see and maintain.

---

### **5.3 UX for Vault**

Layout:

- A simple grid of “cards” or “cells” grouped by category:
    
    - **Identity & Contact**
        
    - **Certifications & Training**
        
    - **Systems & Devices**
        
    - **Medical / Readiness (if permissible)**
        
    - **Other Role-Specific Docs**
        

Each slot shows:

- Icon + label
    
- Current status (checkmark / warning / empty)
    
- Next action:
    
    - “Upload file”
        
    - “Update value”
        
    - “Review and confirm”
        

Hover or click:

- See where this info is used (“Supports: IA Compliance, Help Desk, N6 data calls”).
    

---

### **5.4 Integration & Data Calls**

Behind the scenes:

- Command staff can query:
    
    - “% of members with valid cyber certs on file”
        
    - “List of members missing device info”
        
- Without spamming members repeatedly.
    

When a higher-level data call comes through:

- Instead of emailing “Send us your latest X,”
    
    - The system can check Vault coverage
        
    - Only issue tasks to those missing / outdated entries
        
    - Compile an export directly from Vault data
        

This **drastically reduces noise** for members and staff.

---

### **5.5 Functional Requirements**

- R1: Slots must be **configurable**:
    
    - Different commands / communities can define their own vault schema.
        
- R2: Slots must be **typed and validated**:
    
    - e.g., expiration date for certs, file type constraints, data format constraints.
        
- R3: Vault actions must:
    
    - Update underlying reference tables or event streams
        
    - Trigger changes in Governance / How-Do tasks where relevant (e.g., closing “upload cert” tasks).
        
- R4: Members must always see:
    
    - What the system believes it has on them
        
    - When it was last updated
        
    - Which parts are optional vs required
        

---

## **6. INTEGRATION ACROSS THE STACK**

---

### **6.1 With Org Chart**

- Member identity and positions come from Org Chart.
    
- Tasks and Vault slots are scoped by:
    
    - Primary position
        
    - Additional org memberships (Tiger Teams, etc.)
        

Org Chart can open Member Hub for a person (e.g., a leader reviewing a specific member).

---

### **6.2 With How-Do**

- Steps assigned to the member’s positions / role tags appear as tasks.
    
- Completion of certain tasks updates How-Do execution instances.
    
- Processes that require member-provided docs can check Vault slots instead of sending emails.
    

---

### **6.3 With Governance**

- Personal obligations (via Role Tags or Positions) generate:
    
    - Notifications
        
    - Tasks
        
- Governance can inspect:
    
    - Coverage of certain obligations at the member level (e.g., cert compliance).
        

---

### **6.4 With Measures & OKR System**

- Some Vault slots and tasks produce data that feeds measures:
    
    - e.g., “Time from task assigned → cert uploaded”
        
- Tasks tied to certain Objectives/KRs can be traced back to strategic intent:
    
    - e.g., KR: “Increase % of members with up-to-date device records from 40% to 95%.”
        

---

## **7. UX PRINCIPLES FOR MEMBER HUB**

- **Zero cognitive tax**: it should be obvious what’s urgent vs nice-to-know.
    
- **Everything inside 2–3 clicks**:
    
    - See what’s needed
        
    - Do it
        
    - See it update
        
- **Respect time and attention**:
    
    - No spam
        
    - No duplicate tasks
        
    - No “mystery items” they can’t complete
        
- **Transparency by default**:
    
    - Show what the system holds about them
        
    - Show what’s missing and why it matters
        

---

## **8. FUTURE EXTENSIONS**

- Personal “timeline” of key events (assignments, cert completions, major changes).
    
- Lightweight personal preferences (notification channels, task grouping).
    
- Integration with sentiment / pulse tools (“How’s work going?” surfaced here).
    
- Contextual help or guided “walkthroughs” for new members.