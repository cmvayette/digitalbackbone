# Requirements Document

## Introduction

The Tier-0 Semantic Operating Model (SOM) for NSW is an authoritative conceptual representation that provides a shared, computable model of organizational structure, behavior, intent, and constraints. The SOM serves as a graph-based semantic layer that unifies enterprise systems through holons (persistent entities), relationships (first-class connections), and events (immutable change records). It enables semantic interoperability, causal reasoning, organizational memory, and structural integrity across all NSW systems without replacing existing systems of record.

## Glossary

- **SOM**: Semantic Operating Model - the Tier-0 authoritative conceptual representation
- **Holon**: A persistent entity that is both a whole and a part (e.g., Person, Position, Organization, Mission, Capability, System, Asset, Qualification, Event, Location, Document, Objective, LOE, Initiative, Task)
- **Relationship**: A first-class entity expressing how holons depend on, contain, or influence each other
- **Event**: An immutable record of change over time affecting holons or relationships
- **Tier-0**: The semantic model layer that defines meaning and structure
- **Tier-1**: Application systems that consume and produce data using Tier-0 semantics
- **NSW**: Naval Special Warfare
- **LOE**: Line of Effort - structured thematic focus areas that group objectives
- **Constraint**: Rules governing validity of holons, relationships, and events
- **Measure**: Quantitative or qualitative metric attached to holons, events, or objectives
- **Lens**: Interpretation logic that combines measures into states (e.g., green/amber/red)
- **Semantic Access Layer**: Integration layer that maps external system data to SOM holons and events
- **NSIPS**: Navy Standard Integrated Personnel System
- **DRRS**: Defense Readiness Reporting System
- **EDIPI**: Electronic Data Interchange Personal Identifier
- **UIC**: Unit Identification Code
- **NEC**: Navy Enlisted Classification
- **PQS**: Personnel Qualification Standard
- **ROC/POE**: Required Operational Capability / Projected Operational Environment
- **OPLAN**: Operations Plan
- **EXORD**: Execute Order
- **CONOPS**: Concept of Operations
- **SOP**: Standard Operating Procedure
- **TTP**: Tactics, Techniques, and Procedures
- **ATO**: Authorization to Operate

## Requirements

### Requirement 1

**User Story:** As a system architect, I want to define and persist holon types with stable identities, so that entities remain consistent across system migrations and organizational changes.

#### Acceptance Criteria

1. WHEN a holon is created THEN the SOM SHALL assign a unique SOM ID that persists across all system changes
2. WHEN external systems reference entities THEN the Semantic Access Layer SHALL map external IDs to SOM holon IDs
3. WHEN a holon type is queried THEN the SOM SHALL return identity, purpose, properties, relationships, lifecycle state, and document lineage
4. WHEN a holon is marked inactive THEN the SOM SHALL preserve the holon and its history without deletion
5. WHERE a holon has temporal semantics THEN the SOM SHALL support as-of queries to reconstruct historical state

### Requirement 2

**User Story:** As a data steward, I want to create and manage relationships as first-class objects with their own properties and lifecycles, so that connections between holons are explicit and traceable.

#### Acceptance Criteria

1. WHEN a relationship is created THEN the SOM SHALL assign a unique relationship ID with directionality, multiplicity constraints, and effective dates
2. WHEN a relationship is formed THEN the SOM SHALL validate against eligibility, capacity, and policy constraints
3. WHEN a relationship changes THEN the SOM SHALL record the change as an event with source document and system provenance
4. WHEN querying relationships as-of a timestamp THEN the SOM SHALL reconstruct the relationship graph at that point in time
5. WHERE a relationship type has multiplicity constraints THEN the SOM SHALL enforce those constraints during relationship formation

### Requirement 3

**User Story:** As an operations analyst, I want all state changes to be recorded as immutable events, so that I can trace causal chains and reconstruct historical states.

#### Acceptance Criteria

1. WHEN a state change occurs THEN the SOM SHALL create an immutable event with event ID, type, timestamp, actor, subjects, payload, source system, and source document
2. WHEN an event is submitted THEN the SOM SHALL validate it against constraints, known holons, and effective documents before acceptance
3. WHEN events need correction THEN the SOM SHALL create compensating events rather than modifying existing events
4. WHEN deriving current state THEN the SOM SHALL fold events in time order to compute holon and relationship states
5. WHEN querying as-of a timestamp THEN the SOM SHALL replay events up to that point to reconstruct historical state

### Requirement 4

**User Story:** As a governance officer, I want to define and enforce constraints on holons, relationships, and events, so that the system maintains structural integrity and policy compliance.

#### Acceptance Criteria

1. WHEN a constraint is defined THEN the SOM SHALL link it to a defining document with ID, type, definition, scope, and effective dates
2. WHEN a holon is created or modified THEN the SOM SHALL validate against applicable structural, policy, eligibility, temporal, capacity, and dependency constraints
3. WHEN a relationship is formed THEN the SOM SHALL check eligibility, capacity, and policy constraints before allowing the connection
4. WHEN an event is submitted THEN the SOM SHALL validate against constraints and reject invalid state changes
5. WHERE constraints are inherited down hierarchies THEN the SOM SHALL apply inheritance rules with explicit precedence for overrides

### Requirement 5

**User Story:** As a personnel manager, I want to manage Person holons with assignments, qualifications, and organizational memberships, so that individuals are tracked consistently across all systems.

#### Acceptance Criteria

1. WHEN a person appears in an authoritative personnel system THEN the SOM SHALL create a Person holon with SOM Person ID, EDIPI, service numbers, and demographics
2. WHEN a person is assigned to a position THEN the SOM SHALL create a Person OCCUPIES Position relationship validated against qualification and grade constraints
3. WHEN a person gains or loses a qualification THEN the SOM SHALL record a qualification event and update the Person HAS_QUAL Qualification relationship
4. WHEN a person separates or becomes inactive THEN the SOM SHALL mark the person inactive while preserving all historical assignments and events
5. WHERE a person has multiple concurrent positions THEN the SOM SHALL enforce max concurrent position constraints by type

### Requirement 6

**User Story:** As an organizational planner, I want to manage Position and Organization holons with hierarchical structures, so that the command structure is accurately represented.

#### Acceptance Criteria

1. WHEN an authorized billet is established THEN the SOM SHALL create a Position holon with SOM Position ID, title, grade range, required qualifications, and criticality
2. WHEN a command or unit is activated THEN the SOM SHALL create an Organization holon with SOM Organization ID, UIC, type, and parent organization
3. WHEN positions belong to organizations THEN the SOM SHALL create Position BELONGS_TO Organization relationships
4. WHEN organizations contain sub-organizations THEN the SOM SHALL create Organization CONTAINS Organization relationships forming a hierarchy
5. WHERE a position requires qualifications THEN the SOM SHALL enforce those requirements when validating Person OCCUPIES Position relationships

### Requirement 7

**User Story:** As a mission planner, I want to manage Mission, Capability, and Asset holons with their relationships, so that operational activities are tracked with supporting resources.

#### Acceptance Criteria

1. WHEN a mission or exercise is recognized THEN the SOM SHALL create a Mission holon with SOM Mission ID, name, type, classification metadata, and time bounds
2. WHEN a capability is defined THEN the SOM SHALL create a Capability holon with SOM Capability ID, name, description, and level
3. WHEN an asset is tracked for readiness THEN the SOM SHALL create an Asset holon with SOM Asset ID, hull number or serial, type, configuration, and status
4. WHEN a mission uses capabilities or assets THEN the SOM SHALL create Mission USES Capability and Asset SUPPORTS Mission relationships
5. WHERE a mission has phases THEN the SOM SHALL record phase transition events maintaining mission lifecycle state

### Requirement 8

**User Story:** As a training manager, I want to manage Qualification holons with validity periods and prerequisites, so that personnel competencies are tracked and enforced.

#### Acceptance Criteria

1. WHEN a qualification is used to gate assignments THEN the SOM SHALL create a Qualification holon with SOM Qualification ID, NEC or course code, validity period, and renewal rules
2. WHEN a person earns a qualification THEN the SOM SHALL create a Qualification HELD_BY Person relationship with effective dates
3. WHEN a qualification expires THEN the SOM SHALL record an expiration event and update the relationship validity window
4. WHEN a position requires qualifications THEN the SOM SHALL create Qualification REQUIRED_FOR Position relationships
5. WHERE qualifications have prerequisites THEN the SOM SHALL represent prerequisite chains through qualification relationships

### Requirement 9

**User Story:** As a strategic planner, I want to manage Objective and LOE holons with measures and ownership, so that organizational goals are tracked and aligned.

#### Acceptance Criteria

1. WHEN leadership sets a measurable goal THEN the SOM SHALL create an Objective holon with SOM Objective ID, description, level, time horizon, and status
2. WHEN a focus area is declared THEN the SOM SHALL create an LOE holon with SOM LOE ID, name, description, and timeframe
3. WHEN objectives are grouped THEN the SOM SHALL create Objective GROUPED_UNDER LOE relationships
4. WHEN an objective is created THEN the SOM SHALL require at least one measure, one owner, and one LOE link
5. WHERE objectives have child objectives THEN the SOM SHALL represent decomposition through objective dependency relationships

### Requirement 10

**User Story:** As a program manager, I want to manage Initiative and Task holons aligned to objectives, so that work efforts are tracked and connected to strategic goals.

#### Acceptance Criteria

1. WHEN a multi-step effort is undertaken THEN the SOM SHALL create an Initiative holon with SOM Initiative ID, name, scope, sponsor, and stage
2. WHEN actionable work is defined THEN the SOM SHALL create a Task holon with SOM Task ID, description, type, priority, due date, and status
3. WHEN initiatives support objectives THEN the SOM SHALL create Initiative ALIGNED_TO Objective relationships
4. WHEN tasks are part of initiatives THEN the SOM SHALL create Task PART_OF Initiative relationships
5. WHERE initiatives or tasks have dependencies THEN the SOM SHALL create DEPENDS_ON relationships for sequencing and risk analysis

### Requirement 11

**User Story:** As a data analyst, I want to define and attach measures and lenses to holons and events, so that performance and health can be evaluated consistently.

#### Acceptance Criteria

1. WHEN a measurement is needed THEN the SOM SHALL create a MeasureDefinition holon with name, description, unit, calculation method, and sampling frequency
2. WHEN an interpretation logic is needed THEN the SOM SHALL create a LensDefinition holon with inputs, logic, thresholds, and outputs
3. WHEN measures are emitted THEN the SOM SHALL record measure emission events linked to holons or other events
4. WHEN lenses are evaluated THEN the SOM SHALL compute outputs from input measures and record lens evaluation events
5. WHERE measure or lens definitions change THEN the SOM SHALL create new versions while preserving old versions for historical comparability

### Requirement 12

**User Story:** As a policy officer, I want to manage Document holons as sources of authority, so that all definitions and constraints are traceable to authoritative sources.

#### Acceptance Criteria

1. WHEN a document defines terms or constraints THEN the SOM SHALL create a Document holon with SOM Document ID, reference numbers, title, type, version, and effective dates
2. WHEN documents define holon types, constraints, measures, or lenses THEN the SOM SHALL create Document DEFINES relationships
3. WHEN documents authorize events THEN the SOM SHALL create Document AUTHORIZES Event relationships
4. WHEN documents supersede others THEN the SOM SHALL create Document SUPERSEDES Document relationships
5. WHERE queries need historical context THEN the SOM SHALL determine which documents were in force at a given timestamp

### Requirement 13

**User Story:** As a system integrator, I want a Semantic Access Layer that maps external system data to SOM holons and events, so that Tier-1 systems can interact with the SOM without direct schema knowledge.

#### Acceptance Criteria

1. WHEN external systems identify entities THEN the Semantic Access Layer SHALL map external IDs to SOM holon IDs
2. WHEN external systems submit data THEN the Semantic Access Layer SHALL transform it into SOM events and validate before acceptance
3. WHEN external systems query state THEN the Semantic Access Layer SHALL provide views of the semantic graph in system-appropriate formats
4. WHEN mapping conflicts occur THEN the Semantic Access Layer SHALL resolve them using precedence rules grounded in documents
5. WHERE multiple systems reference the same entity THEN the Semantic Access Layer SHALL ensure all references map to the same SOM holon

### Requirement 14

**User Story:** As a system administrator, I want event replay and as-of query capabilities, so that I can reconstruct historical states and audit changes over time.

#### Acceptance Criteria

1. WHEN querying as-of a timestamp THEN the SOM SHALL replay events up to that point and return the state of holons and relationships at that time
2. WHEN reconstructing organizational structure THEN the SOM SHALL show which positions existed, who occupied them, and which organizations contained them at the specified time
3. WHEN tracing causal chains THEN the SOM SHALL follow event causal links to show what structural changes led to current states
4. WHEN auditing changes THEN the SOM SHALL provide a complete event history for any holon or relationship
5. WHERE events have validity windows THEN the SOM SHALL respect those windows when computing as-of states

### Requirement 15

**User Story:** As a compliance officer, I want constraint validation to occur before events are accepted, so that invalid state changes are prevented rather than corrected after the fact.

#### Acceptance Criteria

1. WHEN an event is submitted THEN the SOM SHALL validate it against all applicable constraints before accepting it into the event stream
2. WHEN validation fails THEN the SOM SHALL reject the event and return detailed error information including which constraints were violated
3. WHEN validation succeeds THEN the SOM SHALL accept the event as a valid state change and update derived states
4. WHEN constraints reference documents THEN the SOM SHALL use the documents in force at the event timestamp for validation
5. WHERE events are batch submissions THEN the SOM SHALL validate all events in the batch and accept or reject the batch atomically

### Requirement 16

**User Story:** As a knowledge worker, I want to query the semantic graph to discover relationships and patterns, so that I can answer complex questions about organizational structure and behavior.

#### Acceptance Criteria

1. WHEN querying holons by type THEN the SOM SHALL return all holons of that type with their current properties and relationships
2. WHEN querying relationships THEN the SOM SHALL support traversal in both directions with filtering by relationship type and properties
3. WHEN searching for patterns THEN the SOM SHALL support graph pattern matching across multiple holon and relationship types
4. WHEN querying with temporal constraints THEN the SOM SHALL support as-of queries and time-range queries for events and state changes
5. WHERE queries span multiple domains THEN the SOM SHALL return results that respect access control constraints

### Requirement 17

**User Story:** As a system architect, I want schema versioning for holon types, relationships, and event types, so that the model can evolve without breaking existing integrations.

#### Acceptance Criteria

1. WHEN the SOM schema changes THEN the SOM SHALL assign major or minor version numbers based on breaking vs non-breaking changes
2. WHEN holon type definitions evolve THEN the SOM SHALL preserve previous interpretations anchored to documents
3. WHEN new holon types or relationship types are added THEN the SOM SHALL validate them against existing types for collisions and complexity
4. WHEN measure or lens definitions change THEN the SOM SHALL create new versions and allow historical evaluations using old versions
5. WHERE multiple schema versions coexist THEN the SOM SHALL define and enforce coexistence rules

### Requirement 18

**User Story:** As a governance steward, I want change proposal and approval processes for schema modifications, so that the SOM maintains coherence and quality.

#### Acceptance Criteria

1. WHEN a new holon type is proposed THEN the SOM SHALL require reference documents, example use cases, and collision analysis
2. WHEN a new constraint is proposed THEN the SOM SHALL require defining documents and evaluation for impact on existing holons and relationships
3. WHEN a new measure or lens is proposed THEN the SOM SHALL require defining documents and validation against existing measures
4. WHEN schema changes are approved THEN the SOM SHALL log the decision as a Document with rationale
5. WHERE schema changes affect existing data THEN the SOM SHALL provide migration paths or compatibility layers

### Requirement 19

**User Story:** As a Tier-1 system developer, I want clear boundaries for what semantics live in Tier-0 vs Tier-1, so that I don't duplicate logic or create semantic drift.

#### Acceptance Criteria

1. WHEN a Tier-1 system needs to interpret entities THEN the system SHALL use Tier-0 holon definitions without redefining them
2. WHEN a Tier-1 system needs to evaluate health or status THEN the system SHALL use Tier-0 lenses without creating independent color logic
3. WHEN a Tier-1 system needs to enforce rules THEN the system SHALL use Tier-0 constraints without implementing hidden business rules
4. WHEN a Tier-1 system produces data THEN the system SHALL emit events through the Semantic Access Layer for validation
5. WHERE a Tier-1 system needs new semantics THEN the system SHALL propose them as Tier-0 schema changes rather than implementing them independently

### Requirement 20

**User Story:** As a security officer, I want access control constraints on the semantic graph, so that sensitive information is protected based on roles and clearances.

#### Acceptance Criteria

1. WHEN users query the SOM THEN the SOM SHALL enforce role-based access constraints on which holons and relationships are visible
2. WHEN documents have classification metadata THEN the SOM SHALL restrict access to holons and constraints defined by those documents
3. WHEN events contain sensitive information THEN the SOM SHALL enforce access controls on event queries and as-of reconstructions
4. WHEN schema changes are proposed THEN the SOM SHALL restrict proposal and approval rights based on roles
5. WHERE access is denied THEN the SOM SHALL return filtered results without revealing the existence of restricted information
