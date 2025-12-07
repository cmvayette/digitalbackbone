# **OBJECTIVES & KEY RESULTS / LINES OF EFFORT — DESIGN SPEC v2**

_A strategic intent system designed for leadership clarity, alignment, and operational leverage._

---

# **0. PURPOSE & VALUE (Leadership-Centric)**

The OKR/LoE App solves the leadership blockers that prevent strategy from actually working today.

## **0.1 Leadership Problems Today**

1. **Strategy is fragmented.**  
    LoEs live in slides. Objectives live in emails. Metrics live in spreadsheets.  
    Nothing connects.
    
2. **Metrics are untrusted.**  
    They’re:
    
    - Vague
        
    - Non-computable
        
    - Missing baselines
        
    - Not linked to work  
        Leaders can’t steer from vibes.
        
3. **No line of sight to work.**  
    Leadership cannot ask:
    
    > “What are we trying to accomplish, who owns it, how are we measuring it, and what is being done right now to move it?”
    
4. **Performance reviews are performative.**  
    End-of-quarter slides → selective storytelling → zero accountability to reality.
    
5. **No principled way to say no.**  
    Without visible commitments, leadership has no structure to prioritize or reject proposals.
    

## **0.2 Value Streams (What This System Creates)**

**Value Stream 1 — Strategic Visibility**  
Leadership gains a _single pane of glass_ for each Line of Effort:

- What outcomes we want
    
- Who owns them
    
- What work is happening
    
- What the data shows
    
- What’s stuck and why
    

**Value Stream 2 — Decision Leverage**  
Leadership can:

- Prioritize
    
- Redirect
    
- Remove obstacles
    
- Rescope objectives  
    With legitimacy grounded in structure and data.
    

**Value Stream 3 — Alignment Across the Force**  
Teams know:

- What matters
    
- How their work ladders up
    
- Which processes/projects support which objectives
    
- Where they are overloaded or misaligned
    

**Value Stream 4 — Trustable Measures**  
Metrics are computable, defined, baselined, and traceable.  
No more vibes → real evidence.

**Value Stream 5 — Accountability Without Blame**  
KRs signal system health, not personal performance.  
They detect bottlenecks, not “bad units.”

**Value Stream 6 — A Principled “No” Mechanism**  
Leaders can say:

> “This initiative does not align with any objective, and the responsible team is already at capacity.”

This shifts culture from firefighting to deliberate steering.

---

# **1. SYSTEM OVERVIEW**

The OKR/LoE App creates a structured hierarchy:

**Lines of Effort → Objectives → Key Results → Measures → Work (Projects/Processes)**

This chain connects:

- **Leadership intent**
    
- **Team actions**
    
- **System behavior**
    
- **Evidence of progress**
    

All nodes tie back to Org Chart, How-Do, and Governance.

---

# **2. CORE ENTITIES (revised)**

## **2.1 Line of Effort (LoE)**

A stable, high-level thematic focus area.

Attributes:

- Name
    
- Description (why this matters)
    
- Owner (Org/Position)
    
- Time horizon (multi-year)
    
- Related policies or constraints
    
- Related capability areas
    

Value to leadership:

> Creates a durable scaffold to organize everything—strategy, work, and measurement.

---

## **2.2 Objective**

A qualitative but concrete desired outcome under an LoE.

Attributes:

- Statement
    
- Narrative (problem the objective solves)
    
- Owner (Org/Position)
    
- Timeframe
    
- Linked KRs
    
- Linked work (processes/projects)
    
- Maturity level (improvement / transformational)
    

Value to leadership:

> Provides actionable clarity: “What exactly are we trying to achieve this year?”

---

## **2.3 Key Result (KR)**

A measurable signal of progress on an Objective.

Attributes:

- Outcome statement (from X to Y by T)
    
- Baseline (X)
    
- Target (Y)
    
- Measure reference
    
- Cadence
    
- Owner
    
- Health state
    
- Evidence log
    

Value to leadership:

> Removes ambiguity. This is where strategy becomes observable.

---

## **2.4 Measure**

A reusable, computable metric definition.

Attributes:

- Name
    
- Calculation logic (semantic expression or SQL)
    
- Data source(s)
    
- Caveats/constraints
    
- Dimensions (per team, per person, per quarter)
    

Value to leadership:

> Ensures the scoreboard is _real,_ not an after-the-fact spreadsheet.

---

## **2.5 Work Alignment (Projects, Processes, Org Structure)**

Objectives and KRs link to:

- Projects
    
- Processes (How-Do)
    
- Organizations / Positions / Role Tags
    

Value to leadership:

> Makes the org navigable from intent → action.

---

# **3. AUTHORING & UX FLOWS**

---

## **3.1 LoE Composer**

A clean, blueprint-style editor for defining LoEs with:

- Problem framing
    
- Outcomes expected
    
- Stakeholders
    
- Structural owner assignment
    

Guidance:

- “A good LoE should be enduring, thematic, and large enough to host multiple Objectives.”
    

Leadership value:

> Defines the strategic architecture in a way that actually survives contact with reality.

---

## **3.2 Objective Composer**

Features:

- Real-time validation
    
- Anti-vagueness linter
    
- Owner selection from Org Chart
    
- Alignment recommendations (from policy, processes, previous objectives)
    

Leadership value:

> Ensures objectives are sharp, ownable, and connected to constraints.

---

## **3.3 KR Composer (Core Value Engine)**

Features:

- Templates: “From X to Y by T”
    
- Automatic baseline suggestions
    
- Target reasonableness checks
    
- Measure picker / Measure creator
    
- KR Linter checks:
    
    - Is it measurable?
        
    - Is it an output instead of an outcome?
        
    - Does the owner have control?
        
    - Is this a vanity metric?
        

Leadership value:

> Turns every KR into a small, well-behaved decision function.

---

# **4. PROGRESS MODEL**

---

## **4.1 Evidence Updates**

Automated:

- Pulls results from Measures & Lenses
    
- Shows trends and gaps  
    Manual:
    
- Users can submit evidence + interpretation
    

Leadership value:

> Converts KRs into operational dials and gauges.

---

## **4.2 Health Model**

Status:

- On-track
    
- At-risk
    
- Off-track
    
- Unknown (no data)
    

Drivers:

- Data updates
    
- Trend direction
    
- Commentary
    

Leadership value:

> Provides early warning, not postmortems.

---

# **5. ALIGNMENT ENGINE**

---

## **5.1 Structural Alignment**

Every LoE, Objective, and KR binds to:

- Org
    
- Position
    
- Role Tags
    
- Tiger Teams
    

(By Org Chart integration)

Leadership value:

> Makes accountability structural, not personal.

---

## **5.2 Work Alignment**

Objectives/KRs link to:

- Projects (initiatives)
    
- Processes (How-Do)
    
- Obligations (Governance)
    
- Measures (analytics engine)
    

Leadership value:

> Shows how intent translates to real execution.

---

# **6. REVIEW CADENCE & GOVERNANCE**

---

## **6.1 Quarterly Review Flow**

Leadership sees:

- For each LoE → status of all objectives
    
- For each Objective → KR trend, commentary, bottlenecks
    
- For each KR → which processes/orgs/projects influence it
    

No slides. No recreation. The system _is_ the review.

Leadership value:

> Turns reviews from theater into steering rituals.

---

## **6.2 Overload & Neglect Detection**

System flags:

- Orgs overloaded with too many objectives
    
- Objectives with no KRs
    
- KRs with no data
    
- Stale updates
    
- Misaligned efforts
    

Leadership value:

> Offers principled ways to say “stop,” “no,” or “reassign.”

---

# **7. INTEGRATION WITH GOVERNANCE, HOW-DO, ORG CHART**

---

### **Governance → OKR**

- Policy-derived obligations appear as candidate Objectives or KRs
    
- Conflicting obligations flagged
    

### **OKR → How-Do**

- Processes mapped to KRs show where work is stuck
    
- Drift detection when processes change
    

### **OKR → Org Chart**

- Leaders can click any org and see its commitments and performance
    

Leadership value:

> Creates the first truly integrated strategic-operational system.

---

# **8. DATA MODEL (LEAN V2)**

- `LineOfEffort`
    
- `Objective`
    
- `KeyResult`
    
- `MeasureRef`
    
- `EvidenceLog`
    
- `AlignmentLink`
    
- `ReviewSession`
    

All versioned. All auditable.

---

# **9. DESIGN PRINCIPLES**

- Strategic clarity > data density
    
- Blueprint minimalism
    
- Navigation by intent
    
- Outcomes, not outputs
    
- Evidence, not vibes
    
- Structural alignment first, dashboards second
    
- Everything must feel effortless for leadership
    

---

# **10. SUMMARY (Leadership Value Wrapped in One Sentence)**

The OKR/LoE App becomes **the command’s strategy cockpit**—a system that turns Lines of Effort into measurable objectives, ties them to real work, surfaces evidence of progress, and gives leadership a principled, clear, and trustworthy way to steer the organization.