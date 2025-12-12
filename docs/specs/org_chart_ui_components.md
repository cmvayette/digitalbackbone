# Org Chart UI Component Specifications

## 1. Position Card (Structural Node) 🧍

This component represents an individual **position** within the organizational hierarchy. Its primary function is to show **Identity** and the **Structural State** (manned or vacant). It contains no services or analytics.

### Purpose

- **Discovery:** Identify who is in a specific role and their immediate supervisor.
- **State Tracking:** Clearly indicate if the position is a formal **Billet** or a flexible **Functional** assignment.
- **Action:** Primary navigation link to the individual's full profile.

---

## 2. Organization Card (Structural Node) 🏛️

This component represents a **unit** or **department**. Its data is limited to structural facts and a single neutral resource metric.

### Purpose

- **Discovery:** Identify the unit lead and its location within the hierarchy.
- **Structural Health:** Display the **Vacancy Count** as the sole metric, acting as a resource indicator rather than a performance score.
- **Action:** Primary navigation link to the **Inspector Panel** to view services.

### Prototype HTML

```html
<div class="prototype-container">
    <h2>1. Position Card (Manned Billet)</h2>
    <div class="card">
        <div class="card-header">
            <div>
                <span class="badge badge-billet">Billet</span>
                <h3 class="role-title" style="margin-top:4px;">N3 Ops Officer</h3>
            </div>
        </div>
        <div class="identity">
            <div class="avatar">
                <span style="font-size: 10px; color: var(--text-primary);">IMG</span>
            </div>
            <div class="person-details">
                <span class="name">Sarah Miller</span>
                <span class="rank">LCDR • USN</span>
            </div>
        </div>
        <div class="context">
            <div class="context-row">
                <span>Reports To:</span>
                <span class="link">N3 Dept Head</span>
            </div>
            <div class="context-row">
                <span>Location:</span>
                <span>Bldg 401, Coronado</span>
            </div>
        </div>
        <div class="actions">
            <button class="btn btn-primary">Connect</button>
            <button class="btn">View Profile</button>
        </div>
    </div>

    <h2>2. Position Card (Vacant Functional)</h2>
    <div class="card vacant">
        <div class="card-header">
            <div>
                <span class="badge badge-functional">Functional</span>
                <h3 class="role-title" style="margin-top:4px;">Data Eng Lead</h3>
            </div>
        </div>
        <div class="identity">
            <div class="avatar ghost">?</div>
            <div class="person-details">
                <span class="vacant-label">Vacant</span>
                <span class="rank">Est. O-3 / GS-12</span>
            </div>
        </div>
        <div class="context">
            <div class="context-row">
                <span>Reports To:</span>
                <span class="link">Chief Digital Officer</span>
            </div>
            <div class="context-row">
                <span>Status:</span>
                <span>Open for 14 Days</span>
            </div>
        </div>
        <div class="actions">
            <button class="btn">View Requirements</button>
            <button class="btn">Suggest Candidate</button>
        </div>
    </div>

    <h2>3. Organization Card (Resource View)</h2>
    <div class="card">
        <div class="card-header">
            <div>
                <span class="badge badge-org">LSU-1</span>
                <h3 class="role-title" style="margin-top:4px;">Logistics Support Unit 1</h3>
            </div>
        </div>
        <div class="context" style="border:none; margin-bottom: 0;">
            <div class="context-row">
                <span>Commander:</span>
                <span class="link">CDR James Holden</span>
            </div>
            <div class="context-row">
                <span>Parent Org:</span>
                <span class="link">NSW Group 1</span>
            </div>
        </div>
        <div class="context" style="background: var(--bg-surface); padding: 10px; border-radius: 4px; border:none; margin-top: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Manning Snapshot</span>
            <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                <div class="stat-block">
                    <span class="stat-number">45</span>
                    <span class="stat-label">Total Seats</span>
                </div>
                <div class="stat-block">
                    <span class="stat-number stat-vacancies">3</span>
                    <span class="stat-label">Vacancies</span>
                </div>
            </div>
        </div>
        <div class="actions">
            <button class="btn btn-primary">View Services</button>
            <button class="btn">View Org Chart</button>
        </div>
    </div>
</div>
```

### Prototype CSS

```css
:root {
    /* USER-PROVIDED COLORS (Dark Theme) */
    --bg-canvas: #0f172a;
    --bg-panel: #1e293b;
    --bg-surface: #334155;
    --border-color: #475569;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --accent-orange: #f97316;
    --accent-green: #10b981;

    /* MAPPED/DERIVED COLORS */
    --bg-vacant: var(--bg-surface);
    --highlight: var(--accent-orange);
    --btn-default-bg: var(--bg-surface);
    --btn-default-hover: #475569;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--bg-canvas);
    margin: 0;
    padding: 20px;
}

h2 {
    color: var(--text-primary);
    margin: 30px 0 10px;
    font-size: 18px;
    font-weight: 500;
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 5px;
}

.prototype-container {
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
    align-items: flex-start;
}

/* --- BASE CARD STYLES --- */
.card {
    background: var(--bg-panel);
    border: 1px solid var(--border-color);
    border-radius: 4px; /* Final corner radius */
    width: 350px; /* Final width */
    padding: 12px; /* Final padding */
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(0,0,0,0.3);
}

/* --- HEADER SECTION --- */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}

.badge {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 6px;
    border-radius: 4px; 
    font-weight: 600;
}

.badge-billet { background: var(--accent-orange); color: var(--bg-panel); }
.badge-functional { background: var(--accent-green); color: var(--bg-panel); }
.badge-org { background: var(--bg-surface); color: var(--text-secondary); }

.role-title {
    font-weight: 700;
    font-size: 16px;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.2;
}

/* --- IDENTITY SECTION --- */
.identity {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.person-details { display: flex; flex-direction: column; }
.name { font-weight: 600; font-size: 14px; color: var(--text-primary); }
.rank { font-size: 12px; color: var(--text-secondary); }

/* --- CONTEXT SECTION --- */
.context {
    border-top: 1px solid var(--border-color);
    padding-top: 8px;
    margin-bottom: 8px;
}

.context-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.link { color: var(--highlight); text-decoration: none; font-weight: 500; cursor: pointer; }
.link:hover { text-decoration: underline; }

/* --- ACTIONS SECTION --- */
.actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

.btn {
    flex: 1;
    padding: 6px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background: var(--btn-default-bg);
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    text-align: center;
}

.btn:hover { background: var(--btn-default-hover); color: var(--text-primary); }

.btn-primary { 
    background: var(--accent-orange); 
    color: var(--bg-panel); 
    border: none; 
}
.btn-primary:hover { 
    background: #fb923c;
    color: var(--bg-canvas); 
}

/* --- STATE: VACANT (THE GHOST CARD) --- */
.card.vacant {
    background: var(--bg-vacant);
    border: 2px dashed var(--border-color); 
    opacity: 0.85; 
    box-shadow: none;
}

.card.vacant .role-title, .card.vacant .name { color: var(--text-secondary); }

.avatar.ghost {
    background: transparent;
    border: 2px dashed var(--border-color);
    color: var(--border-color);
    font-size: 24px;
}

.vacant-label {
    color: var(--text-secondary);
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
}

/* --- STATE: ORG CARD STATS --- */
.stat-block {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-top: 4px;
}
.stat-number { font-weight: 700; font-size: 14px; color: var(--text-primary); }
.stat-label { font-size: 12px; color: var(--text-secondary); }
.stat-vacancies { color: var(--text-primary); }
```

---

## 3. Inspector Panel (Functional Layer) 🛠️

This is the side panel **triggered by the Organization Card** (via "View Services"). It is the dedicated workspace for **Actions** and **Workflows**, linking structure to function.

### Purpose

- **Functional Access:** Provide a high-scent, efficient directory of services offered by that organization (e.g., N1 provides Travel, Leave, Pay services).
- **Ownership Clarity:** Clearly indicate the **Point of Contact (POC)** for each service, whether an individual or an entire team (via the Popover).
- **Workflow:** House links to external systems (DTS, pay forms, etc.).

### HTML Mockup: Inspector Panel (Service Tile Focus)

```html
<div class="inspector-panel">
    
    <div class="panel-header">
        <div class="unit-identity">
            <div class="unit-logo">N1</div>
            <div class="unit-title">
                <h1>N1 Administration</h1>
                <span class="unit-subtitle">CDR Sarah Miller, Commanding Officer</span>
            </div>
        </div>
    </div>

    <div class="panel-mission">
        <span class="section-label">Mission Statement</span>
        <p class="mission-text">To optimize personnel readiness and administrative functions, ensuring maximum operational deployment capabilities for all subordinate units.</p>
    </div>

    <div class="panel-services">
        <span class="section-label">Available Services & POCs</span>
        <div class="service-list">
            
            <div class="service-tile" style="z-index: 10;">
                <div class="service-trigger">
                    <div class="service-icon"><svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg></div>
                    <span class="service-name">Official Travel (DTS)</span>
                </div>
                <div class="service-owner">
                    <div class="owner-icon-container"><svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></div>
                    <span class="owner-label">Team</span>
                </div>
            </div>

            <div class="service-tile" style="z-index: 1;">
                <div class="service-trigger">
                    <div class="service-icon"><svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg></div>
                    <span class="service-name">Submit Leave Request</span>
                </div>
                <div class="service-owner">
                    <div class="owner-avatar" style="background-color: var(--border-color);"></div>
                    <span class="owner-label">POC</span>
                </div>
            </div>
            
            <div class="service-tile"><div class="service-trigger"><div class="service-icon"><svg viewBox="0 0 24 24"><path d="M19 19H5V5h14v14zm-2-10H7v7h10V9z"/></svg></div><span class="service-name">Security Clearances</span></div><div class="service-owner"><div class="owner-avatar" style="background-color: var(--accent-green);"></div><span class="owner-label">POC</span></div></div>
            <div class="service-tile"><div class="service-trigger"><div class="service-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div><span class="service-name">Manpower Documents</span></div><div class="service-owner"><div class="owner-icon-container"><svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div><span class="owner-label">Team</span></div></div>

        </div>
    </div>
</div>
```

### Inspector Panel CSS

```css
:root {
    /* USER-PROVIDED COLORS (Dark Theme) */
    --bg-canvas: #0f172a;
    --bg-panel: #1e293b;
    --bg-surface: #334155;
    --border-color: #475569;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --accent-orange: #f97316;
    --accent-green: #10b981;
    --font-ui: 'Inter', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;

    /* MAPPED/DERIVED COLORS */
    --highlight: var(--accent-orange);
    --btn-default-bg: var(--bg-surface);
    --btn-default-hover: #475569;
}

body {
    background-color: var(--bg-canvas);
    color: var(--text-primary);
    font-family: var(--font-ui);
    margin: 0;
    height: 100vh;
    display: flex;
    justify-content: flex-end;
    overflow: hidden;
}

svg { width: 100%; height: 100%; fill: currentColor; }

/* --- INSPECTOR PANEL STRUCTURE --- */
.inspector-panel {
    width: 400px;
    height: 100%;
    background-color: var(--bg-panel);
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    box-shadow: -10px 0 30px rgba(0,0,0,0.5);
    z-index: 1000;
}

/* --- Panel Header (Max Density) --- */
.panel-header { 
    padding: 16px 24px; /* Reduced vertical padding */
    border-bottom: 1px solid var(--border-color); 
    background: linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-panel) 100%); 
}

/* --- Unit Identity --- */
.unit-identity { 
    display: flex; 
    align-items: center; 
    gap: 16px; 
    margin-bottom: 0; 
}

.unit-logo { 
    width: 40px; /* Final size */
    height: 40px; /* Final size */
    background-color: var(--bg-canvas); 
    border: 1px solid var(--border-color); 
    border-radius: 50%; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    color: var(--text-secondary); 
    font-weight: 700;
    flex-shrink: 0;
}

.unit-title h1 { 
    font-size: 18px; 
    font-weight: 700; 
    margin: 0; 
    text-transform: uppercase; 
    color: var(--text-primary);
}

.unit-subtitle { 
    font-size: 11px; 
    color: var(--text-secondary); 
    margin-top: 4px;
    display: block;
}

/* --- Mission Section (Compact) --- */
.panel-mission {
    padding: 16px 24px; 
    border-bottom: 1px solid var(--border-color);
}
.mission-text {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0;
}

.section-label { 
    font-family: var(--font-mono); 
    font-size: 10px; 
    color: var(--text-secondary); 
    text-transform: uppercase; 
    letter-spacing: 0.1em; 
    margin-bottom: 8px; 
    display: block; 
}

/* --- Services Section (Priority Area) --- */
.panel-services { 
    padding: 24px; 
    overflow-y: auto; 
    flex-grow: 1;
}

.service-list { display: flex; flex-direction: column; gap: 8px; }

/* --- SERVICE TILE (Fix for Bounding) --- */
.service-tile {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    display: flex;
    align-items: stretch;
    height: 56px;
    position: relative; /* CRITICAL FIX: Ensures popover bounding */
    transition: all 0.2s;
}

.service-trigger {
    flex-grow: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    cursor: pointer;
    border-right: 1px solid rgba(255,255,255,0.05);
}

.service-tile:hover { 
    background-color: #475569;
    border-color: var(--text-secondary);
}

.service-icon { color: var(--accent-orange); width: 20px; height: 20px; }
.service-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }

/* --- THE OWNER COMPONENT (Right Side) --- */
.service-owner {
    width: 48px; /* Final width */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: rgba(0,0,0,0.1);
    position: relative;
    color: var(--text-secondary);
}

.service-owner:hover { 
    background-color: rgba(0,0,0,0.3); 
    color: var(--text-primary);
}

/* TYPE A: The Group Icon Container (Unified Size) */
.owner-icon-container {
    width: 20px; 
    height: 20px; 
    display: flex;
    align-items: center;
    justify-content: center;
}

/* TYPE B: The Individual Avatar Container (Unified Size) */
.owner-avatar {
    width: 20px; 
    height: 20px; 
    border-radius: 50%;
    background-color: #64748b;
    border: 2px solid var(--bg-surface);
    background-size: cover;
}

.owner-label {
    font-family: var(--font-mono); 
    font-size: 8px;
    color: var(--text-secondary); 
    margin-top: 4px; 
    text-transform: uppercase;
}

/* --- THE TEAM POPOVER --- */
.team-popover {
    display: none;
    position: absolute;
    top: 50px; 
    right: 48px; /* Positioning matches new service-owner width */
    width: 220px;
    background-color: var(--bg-panel);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    z-index: 100;
    padding: 8px;
    flex-direction: column;
    gap: 4px;
}

.service-owner:hover .team-popover { display: flex; }

.popover-header { 
    font-size: 10px; 
    font-weight: 700; 
    color: var(--text-secondary); 
    text-transform: uppercase; 
    padding: 4px 8px; 
    border-bottom: 1px solid var(--border-color); 
    margin-bottom: 4px; 
    display: flex; 
    justify-content: space-between; 
}

.popover-row { 
    display: flex; 
    align-items: center; 
    gap: 8px; 
    padding: 6px 8px; 
    border-radius: 4px; 
    cursor: pointer; 
    transition: background 0.2s; 
}

.popover-row:hover { background-color: var(--bg-surface); }
.mini-avatar { width: 20px; height: 20px; border-radius: 50%; background-color: #64748b; }
.mini-info { flex-grow: 1; display: flex; flex-direction: column; }
.mini-name { font-size: 11px; font-weight: 500; color: var(--text-primary); }
.mini-role { font-size: 9px; color: var(--text-secondary); }
```
