# **MEASURES & LENSES — DESIGN SPEC v2**

_The Semantic Measurement Backbone of the Enterprise_

---

# **0. Vision**

The Measures & Lenses App is the **authoritative, computable foundation** for how the command defines, evaluates, and interprets performance, readiness, and organizational health.

Its purpose is to move the command from:

- inconsistent metrics
    
- fragmented dashboards
    
- interpretive chaos
    
- shifting definitions
    
- non-repeatable evaluations
    

…to a world where:

- measures are formally defined, versioned, governed
    
- lenses explicitly articulate _how_ we interpret reality
    
- dashboards consume **semantic APIs**, not ad-hoc SQL
    
- analysts operate with power and safety
    
- leadership sees consistent, explainable truth across all teams
    

This is the system that makes measurement **structural**, not subjective.

This app is **not** for leadership dashboards.  
This app is for **analysts**, **semantic stewards**, and **BI engineers** who need to create the semantic definitions that power every leadership-facing insight.

---

# **1. Purpose**

Measures & Lenses exists to:

### **1.1 Provide a unified model for defining and governing measures**

- Clear formulas
    
- Clear dependencies
    
- Clear lineage
    
- Clear versioning
    
- Clear validation
    

### **1.2 Provide a tool to construct Lenses**

A Lens is an **interpretive structure**, combining multiple Measures into a perspective, such as:

- Readiness
    
- Team Health
    
- Admin Velocity
    
- Cyber Posture
    
- Workforce Sustainability
    
- Medical Availability
    

### **1.3 Serve as the backbone for dashboards and OKR evaluations**

Dashboards **never compute metrics directly**.  
They consume **Lens API outputs**, ensuring consistency and explainability.

### **1.4 Provide a semantically safe IL5 pipeline for publishing APIs**

Published Lenses automatically become API-readable semantic products through a **contracted API surface**, with no runtime attack-surface expansion.

---

# **2. Core Concepts**

---

## **2.1 Measure**

A Measure is the smallest atomic unit of computable truth.

Attributes:

- `id`
    
- `name`
    
- `description`
    
- `type` (numeric, categorical, boolean, rating, ratio, index)
    
- `formula` (declarative measure DSL)
    
- `dataSources`
    
- `calculationWindow`
    
- `owner` (Analyst / Team)
    
- `visibility` (private, internal, published)
    
- `version`
    
- `status` (draft/published/deprecated)
    
- `dependencies`
    
- `unitOfEvaluation` (person, position, organization, project, etc.)
    

Measures are validated against:

- type rules
    
- data availability
    
- dependency graph integrity
    
- governance constraints
    
- authorization scope
    

---

## **2.2 Lens**

A Lens is a **semantic arrangement of Measures** that defines a particular perspective of truth.

A lens includes:

- Set of Measures
    
- Compositional rules
    
- Weightings or logic
    
- Thresholds/interpretation schemas
    
- Scope (which orgs/units/tiers it applies to)
    
- Versioning
    
- Publishing status
    
- Metadata for dashboards
    

Examples:

- **Readiness Lens v3**
    
- **Workforce Sustainability Lens**
    
- **Team Health Lens (Tier 2)**
    
- **Cyber Hardening Lens**
    
- **Operational Tempo Lens**
    

A Lens is a _semantic product_, not a computation step.

---

## **2.3 Tiered Lenses**

Lenses may define **tier-specific rules** for:

- units of evaluation (Force → Group → Team → Element)
    
- aggregation method
    
- weighting adjustments
    
- visibility rules
    
- measure inclusion/exclusion
    

Example:

`Readiness Lens     Tier 1 (Force): Weighted readiness across all Groups     Tier 2 (Group): Composite readiness of Teams     Tier 3 (Team): Raw readiness measures + availability`

---

## **2.4 Published Lens**

A Published Lens is one that has passed:

- Validation
    
- Governance review
    
- Security checks
    
- Version registration
    

Upon publishing, a Lens becomes **available via Lens APIs**.

---

## **2.5 Lens Execution Kernel**

A secure backend component that:

- reads published Lens definitions
    
- resolves measures
    
- evaluates lens rules
    
- handles aggregation
    
- timestamps outputs
    
- enforces authorization
    

This kernel is the only system that performs computation.  
All dashboards call the kernel via the API.

---

# **3. User Personas**

---

## **3.1 Data Analysts**

Primary operators of Measures & Lenses.

Needs:

- Create, edit, validate measures
    
- Test measures against sample units
    
- Build lenses
    
- Preview and validate interpretations
    
- Publish semantic products
    
- Understand measure lineage
    

---

## **3.2 BI Engineers**

Consumers of Lens APIs.

Needs:

- Stable, versioned API contract
    
- Fast evaluation
    
- Metadata and explainability
    
- Clear deprecation signals
    

---

## **3.3 Leadership (Indirect Consumer)**

Never interacts with the app directly.

Their needs are met by:

- Dashboards built on Lens APIs
    
- OKR systems consuming Lenses
    
- Alerts that follow semantic consistency
    

---

## **3.4 Governance / Compliance**

Uses Measures & Lenses to ensure:

- Approved definitions
    
- Proper versioning
    
- Drift detection
    
- Policy alignment
    

---

# **4. Functional Areas**

---

# **4.1 Measure Builder**

A structured, blueprint-like interface for analysts to define measures.

Functionality:

- Declarative formula builder
    
- Data source selector
    
- Preview on sample units
    
- Validation panel:
    
    - missing fields
        
    - bad types
        
    - circular dependencies
        
    - insufficient data
        
    - governance conflicts
        
- Versioning controls
    
- Test harness
    
- Publish/draft toggle
    

Input examples:

`measure personnel_available = count(person where status == "Available") measure pct_trained = trained_personnel / total_personnel measure cycletime = avg(request.completedAt - request.createdAt)`

---

# **4.2 Lens Builder**

Analysts create Lenses by:

- Selecting constituent Measures
    
- Assigning weights or logic
    
- Defining tiered aggregation rules
    
- Adding thresholds/interpretation layers
    
- Previewing results
    
- Testing explainability output
    

UI Example:

**Lens: Readiness v3**

|Measure|Weight|Tier 1 Rule|Tier 2 Rule|Tier 3 Rule|
|---|---|---|---|---|
|availability|40%|mean|weighted|raw|
|qualifications|30%|min|min|raw|
|medical|20%|mean|mean|raw|
|admin compliance|10%|mean|mean|raw|

---

# **4.3 Lens Validation Engine**

Validates:

- all referenced measures exist
    
- no circularity
    
- scope compatibility
    
- unit-of-evaluation consistency
    
- governance restrictions
    
- data availability
    
- explainability completeness
    

---

# **4.4 Publishing Workflow**

Publishing includes:

- Version increment
    
- Governance approval
    
- Security review
    
- Lens Compiler run
    
- Commit to Published Lenses
    
- Audit log entry
    
- Trigger deployment to API execution kernel
    

---

# **4.5 Lens Catalog**

Search, filter, inspect:

- published lenses
    
- draft lenses
    
- deprecated lenses
    
- usage in dashboards
    
- scope applicability
    
- measure dependencies
    

Clicking a lens opens its definition, rules, tiers, lineage, and coverage graph.

---

# **4.6 API Publishing Model (IL5-Safe)**

This is where the design aligns with our security concerns.

### **4.6.1 Contracted API Surface (Pre-approved)**

No new API routes are created at runtime.

We pre-approve these routes:

`GET /api/lens/{lensId}/evaluate?unit={id}&tier={t} GET /api/lens/{lensId}/metadata GET /api/lens/{lensId}/units GET /api/lens/{lensId}/time-series`

IL5 is satisfied because **the API surface is static**.

---

### **4.6.2 Lens Compiler**

When a lens is published:

- compiles declarative definitions
    
- validates
    
- snapshots rules to immutable metadata
    
- produces the execution graph
    
- signs version metadata
    
- stores compiled JSON in Published Lenses
    

No code is generated.  
No routes are created.

Lenses are **data**, not “dynamic endpoints.”

---

### **4.6.3 Lens Execution Kernel**

Requests go through:

- AuthN
    
- AuthZ
    
- Lens version resolution
    
- Evaluation
    
- Result packaging
    
- Explainability metadata
    

Outputs include:

`{   score: 0.82,   breakdown: {       availability: 0.90,       quals: 0.80,       medical: 0.70   },   interpretation: "Adequate",   version: "v3.1",   evaluatedAt: "2025-12-06T10:14:22Z" }`

---

### **4.6.4 Audit & Compliance**

Every publish creates:

- Change log
    
- Publisher identity
    
- Version delta
    
- Formal artifact (signed JSON)
    
- Time-bound validity window
    
- Optional rollback
    

IL5 auditors love this.

---

# **5. Navigation Model**

This app is for analysts; navigation is functional, not hierarchical.

Sections:

- Measures
    
- Lenses
    
- Catalog
    
- Validation Center
    
- Publishing Queue
    
- Governance Alerts
    

---

# **6. Governance Integration**

Governance can:

- Annotate measures with policy references
    
- Require governance review for certain lenses
    
- Flag when a measure used in many lenses is modified
    
- Require expiration windows
    
- Detect drift between declared vs. observed behavior
    

---

# **7. Process Health Model**

For each unit, Lenses produce:

- compliance scores
    
- readiness scores
    
- administrative health
    
- cyber posture
    
- sustainability indicators
    

This supports:

- OKR evaluations
    
- Leadership dashboards
    
- Risk identification
    
- Comparative analysis
    

---

# **8. Data Model (Simplified)**

### **Measure**

`id   name   description   dsl   version   status   owner   dependencies[]   unitOfEval   sourceRefs[]   visibility`

### **Lens**

`id   name   tierRules[]   measureRefs[]   compositionRules[]   version   scope   status   metadata{}`

### **PublishedLens**

`id   compiledDefinition (JSON)   version   signature   publishedAt   publishedBy   validFrom   validTo`  

---

# **9. Future Extensions**

- Automated Lens-Version migration assistant
    
- Lens diffs and semantic comparisons
    
- Predictive lenses (ML integrated)
    
- Multi-lens comparison dashboards (Explain battle rhythm differences)
    
- Semantic alerting (e.g., readiness drop triggers notifications)
    

---

# **10. Summary**

The Measures & Lenses System:

- Encapsulates semantics into stable, secure APIs
    
- Ensures repeatable, explainable truth
    
- Avoids IL5 pitfalls through static API surfaces
    
- Empowers analysts
    
- Removes dashboard drift
    
- Links structure, intent, and performance
    
- Creates the backbone for decision-quality analytics
    

This is the **semantic foundation** that your entire digital ecosystem sits on.