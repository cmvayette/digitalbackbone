# Tier-1 Application Implementation Plans

This document provides detailed implementation plans for each Tier-1 frontend application, based on design specifications and the current implementation status.

---

## Executive Summary

| App | Current Status | Completion % | Priority |
|-----|---------------|--------------|----------|
| **Org Chart** | Completed - MVP Delivered | 100% | High |
| **How-Do** | Scaffolded - basic swimlane editor with mock data | ~15% | High |
| **Policy Governance** | Minimal scaffold - textarea-only editor | ~10% | Medium |
| **Task Management** | Scaffolded - mock task generation only | ~15% | High |
| **Objectives/OKR** | Scaffolded - mock dashboard with seed data | ~15% | Medium |

---

# 1. ORG CHART APPLICATION

## 1.1 Current Implementation Status

**Completed:**
- ✅ React + Vite + Tailwind setup
- ✅ GraphCanvas component using @xyflow/react
- ✅ OrganizationNode and PositionNode custom node components
- ✅ API client (`fetchJson` helper)
- ✅ Data transformer (API → Graph nodes/edges)
- ✅ useOrgStructure hook with React Query
- ✅ Dagre-based layout utility
- ✅ Blueprint aesthetic dark theme
- ✅ MiniMap and Controls components
- ✅ Discovery Bar (search/filter)
- ✅ Sidebar Panel (holon details)
- ✅ Person Node component
- ✅ Smart hover micro-tooltips
- ✅ Vacancy indicators
- ✅ Org health dots (green/yellow/red)
- ✅ Roster preview on hover
- ✅ Tiger Team highlighting
- ✅ "Where Am I?" functionality
- ✅ Keyboard navigation
- ✅ Breadcrumb navigation
- ✅ Undo toast for structural changes
- ✅ Fuzzy search implementation
- ✅ Edit/create organization workflows
- ✅ Position management (create/assign)

**Not Yet Implemented:**
- ❌ Natural language search (Full NLP backend)
- ❌ Advanced permissioning/RBAC

## 1.2 Implementation Plan

### Phase 1: Core Navigation & Display (MVP)

#### 1.1 Person Node Component
**File:** `src/components/nodes/PersonNode.tsx`
- Create PersonNode with name, rank, type display
- Add qualification state indicator
- Style to match blueprint aesthetic

#### 1.2 Enhanced Node Data
**Files:** `src/types/graph.ts`, `src/api/transformer.ts`
- Extend node data interfaces to include:
  - Health status for organizations
  - Vacancy count
  - Billet status for positions
  - Qualification match/mismatch
- Update transformer to populate these fields from API

#### 1.3 Sidebar Panel Component
**File:** `src/components/sidebar/SidebarPanel.tsx`
- Create sliding sidebar (right side)
- Dynamic content based on selected holon type:
  - `OrganizationSidebar.tsx` - name, description, roster, services, health
  - `PositionSidebar.tsx` - title, billet status, qualifications, occupant
  - `PersonSidebar.tsx` - name, rank, certificates, positions

#### 1.4 Selection State Management
**File:** `src/hooks/useSelection.ts`
- Track currently selected node
- Handle click events on nodes
- Keyboard navigation state (← ↑ → / esc)

### Phase 2: Discovery & Search

#### 2.1 Discovery Bar Component
**File:** `src/components/discovery/DiscoveryBar.tsx`
- Centered search input (expandable on focus)
- Typeahead suggestions
- Filter chips (vacancies, tiger teams, billet-funded)
- Keyboard activation via `/`

#### 2.2 Search Integration
**File:** `src/hooks/useSearch.ts`
- Connect to SOM `/api/v1/search` endpoint
- Fuzzy matching for orgs, positions, people
- Natural language query parsing (lite mode)

#### 2.3 Graph Navigation
**File:** `src/hooks/useGraphNavigation.ts`
- Smooth pan/zoom to selected node
- Re-center graph on search result selection
- "Where Am I?" button to return to home org

### Phase 3: Visual Enhancements

#### 3.1 Health Indicators
- Add health dot to OrganizationNode (green/yellow/red based on vacancy %)
- Vacancy callout badges on PositionNode

#### 3.2 Hover Interactions
**File:** `src/components/tooltip/HolonTooltip.tsx`
- Smart micro-tooltips on hover
- Roster preview for organizations
- Quick stats for positions

#### 3.3 Tiger Team Highlighting
- Soft visual indicator for dual-role relationships
- Dashed/different colored edges for tiger team connections

### Phase 4: Edit & Management

#### 4.1 Organization Management
**Files:** `src/components/modals/CreateOrgModal.tsx`, `EditOrgModal.tsx`
- Create new organization form
- Edit organization details
- Move organization (reparent)
- Auto-center on newly created orgs

#### 4.2 Position Management
**Files:** `src/components/modals/CreatePositionModal.tsx`, `AssignPersonModal.tsx`
- Create position with smart defaults
- Assign/reassign people to positions
- "Find eligible members" with qualification matching

#### 4.3 Undo System
**File:** `src/hooks/useUndo.ts`
- Toast notification after structural changes
- Single-level undo for recent actions
- Event reversal via SOM API

### Phase 5: Polish & Optimization

#### 5.1 Breadcrumb Navigation
**File:** `src/components/navigation/Breadcrumb.tsx`
- Show hierarchy path to current org
- Clickable links for quick navigation

#### 5.2 Performance Optimization
- Virtualization for large graphs
- Lazy loading of deep hierarchy levels
- Optimistic UI updates

#### 5.3 Keyboard Shortcuts
- Arrow keys for node navigation
- Escape to deselect
- `/` to focus search
- `?` for help overlay

---

# 2. HOW-DO APPLICATION (Process Definition)

## 2.1 Current Implementation Status

**Completed:**
- ✅ React + Vite + Tailwind setup
- ✅ Basic SwimlaneEditor component
- ✅ Mock data (policy.json, org-structure.json)
- ✅ Add step functionality (prompt-based)
- ✅ Basic obligation linking (keyword match)
- ✅ ProcessDefined event emission (console)
- ✅ Process Discovery (Search UI)
- ✅ Process Viewer (Read-only Swimlane)
- ✅ Agent Assignment (Semantic Proxy)

**Not Yet Implemented:**
- ❌ Linear Timeline Layout
- ❌ Step card enhancements (attachments, SLA, decision logic)
- ❌ Drag-and-drop step reordering
- ❌ Owner selection from Org Chart
- ❌ Governance integration (obligation badges, drift alerts)
- ❌ Execution Mode (V2)
- ❌ Process health indicators
- ❌ Version history & diff
- ❌ "Show Only My Steps" filter
- ❌ "Explain It to Me Like I'm New" mode
- ❌ API integration with SOM backend

## 2.2 Implementation Plan

### Phase 1: Process Viewer (MVP)

#### 1.1 Process Data Model
**File:** `src/types/process.ts`
```typescript
interface Process {
  id: string;
  name: string;
  description: string;
  owner: OwnerRef;
  steps: ProcessStep[];
  version: number;
  health: ProcessHealth;
  tags: string[];
}

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  owner: OwnerRef;
  attachments: Attachment[];
  obligations: ObligationLink[];
  estimatedTime?: number;
  decisionBranches?: DecisionBranch[];
}
```

#### 1.2 API Integration
**File:** `src/api/process-client.ts`
- Fetch processes from SOM API
- Query by type, owner, tags
- Get process details with steps

#### 1.3 Swimlane Viewer Component
**File:** `src/components/viewer/SwimlaneViewer.tsx`
- Read-only swimlane layout
- Steps grouped by owner
- Horizontal handoff arrows
- Click lanes to open Org Chart sidebar

#### 1.4 Linear Timeline Layout
**File:** `src/components/viewer/TimelineViewer.tsx`
- Vertical scrolling for mobile
- Compressed owner badges
- Same data, different presentation

### Phase 2: Process Discovery

#### 2.1 Search Bar Component
**File:** `src/components/search/ProcessSearch.tsx`
- "How do I...?" natural language input
- Auto-suggestions while typing
- Match by title, description, tags, owners, obligations

#### 2.2 Search Results Component
**File:** `src/components/search/SearchResults.tsx`
- Name, owner, description, last updated
- Step count, health indicator
- Click to view process

#### 2.3 Filters Panel
**File:** `src/components/search/FiltersPanel.tsx`
- Domain filter (training, logistics, IT, etc.)
- Owning organization
- Role Tag relevance
- Obligation relevance

### Phase 3: Enhanced Viewer Features

#### 3.1 Step Card Enhancements
**File:** `src/components/viewer/StepCard.tsx`
- Linked attachments (SOPs, templates, forms)
- Obligation badges with hover expand
- Estimated time / SLA indicator
- Decision logic visualization (V-shape branches)

#### 3.2 "Show Only My Steps" Mode
**File:** `src/hooks/useStepFilter.ts`
- Filter to user's position-owned steps
- Show upstream dependencies
- Show immediate downstream expectations

#### 3.3 "Explain It to Me Like I'm New" Mode
**File:** `src/hooks/useSimplifiedView.ts`
- Jargon removal
- Acronym expansion
- Contextual examples

### Phase 4: Process Editor

#### 4.1 Enhanced Swimlane Editor
**File:** `src/components/editor/SwimlaneEditor.tsx` (refactor existing)
- Drag-and-drop step reordering (use @dnd-kit)
- Add/edit/delete steps
- Decision branch creation
- Attachment management

#### 4.2 Owner Selection
**File:** `src/components/editor/OwnerPicker.tsx`
- Fetch owners from Org Chart API
- Organization, Position, Role Tag options
- Show eligible positions & personnel
- Warnings for archived/vacant positions

#### 4.3 Obligation Linking
**File:** `src/components/editor/ObligationLinker.tsx`
- Select obligations from Policy system
- Multiple obligations per step
- Missing coverage warnings

#### 4.4 Validation Engine
**File:** `src/utils/process-validator.ts`
- Steps without owners
- Broken links
- Missing obligation coverage
- Orphan branches

### Phase 5: Governance Integration

#### 5.1 Drift Detection
**File:** `src/hooks/useDriftDetection.ts`
- Monitor policy changes
- Detect structural misalignments
- Flag "Needs Review" processes

#### 5.2 Drift Alerts UI
**File:** `src/components/alerts/DriftAlert.tsx`
- Banner in Editor
- Health indicator in Process list
- One-click navigation to resolve

### Phase 6: Process Health Model

#### 6.1 Health Computation
**File:** `src/utils/health-calculator.ts`
- Freshness (last updated/validated)
- Obligation coverage %
- Structural alignment
- Complexity score

#### 6.2 Health Dashboard
**File:** `src/components/health/ProcessHealthDashboard.tsx`
- Overview of all processes
- Filter by health status
- Prioritized review queue

### Phase 7: Execution Mode (V2)

#### 7.1 Execution State Management
**File:** `src/hooks/useExecution.ts`
- Track current step per user per process
- Mark step complete
- Auto-advance
- Persist partial progress

#### 7.2 Execution UI
**File:** `src/components/execution/ExecutionView.tsx`
- Highlighted current step
- Handoff owner display
- Attached templates
- Resume/abandon/restart controls

---

# 3. POLICY GOVERNANCE APPLICATION

## 3.1 Current Implementation Status

**Completed:**
- ✅ React + Vite + Tailwind setup
- ✅ Basic PolicyEditor component (textarea only)
- ✅ Mock org data
- ✅ DocumentIssued event emission (console)

**Not Yet Implemented:**
- ❌ Rich text editing
- ❌ Policy document structure (sections, scope, definitions)
- ❌ Obligation extraction
- ❌ Constraint definition
- ❌ Policy lifecycle management
- ❌ Compliance tracking
- ❌ Integration with How-Do processes
- ❌ Document versioning
- ❌ Effective date management
- ❌ Policy search and discovery
- ❌ API integration with SOM backend

## 3.2 Implementation Plan

### Phase 1: Document Management (MVP)

#### 1.1 Policy Data Model
**File:** `src/types/policy.ts`
```typescript
interface PolicyDocument {
  id: string;
  title: string;
  documentType: DocumentType;
  version: string;
  status: 'draft' | 'review' | 'active' | 'superseded' | 'archived';
  effectiveDates: { start: Date; end?: Date };
  sections: PolicySection[];
  obligations: Obligation[];
  supersedes?: string[];
}

interface Obligation {
  id: string;
  statement: string;
  actor: OwnerRef; // Org/Position/RoleTag
  trigger: string;
  deadline?: string;
  policyReference: string;
}
```

#### 1.2 API Integration
**File:** `src/api/policy-client.ts`
- CRUD operations for policy documents
- Obligation management
- Version history queries

#### 1.3 Policy List View
**File:** `src/components/PolicyList.tsx`
- Table of all policies
- Filter by status, type, effective date
- Search by title/content

### Phase 2: Rich Document Editor

#### 2.1 Section-Based Editor
**File:** `src/components/editor/SectionEditor.tsx`
- Structured sections (Purpose, Scope, Definitions, Responsibilities, Procedures)
- Rich text formatting (bold, lists, links)
- Section templates

#### 2.2 Obligation Extractor
**File:** `src/components/editor/ObligationExtractor.tsx`
- Highlight text to create obligation
- Auto-detect "shall/must" statements
- Assign actor from Org Chart
- Set triggers and deadlines

#### 2.3 Constraint Definition
**File:** `src/components/editor/ConstraintBuilder.tsx`
- Define structural, policy, eligibility constraints
- Scope to holon types, relationships, events
- Set precedence and effective dates

### Phase 3: Policy Lifecycle

#### 3.1 Workflow Management
**File:** `src/components/workflow/PolicyWorkflow.tsx`
- Draft → Review → Active → Superseded/Archived
- Review assignments
- Approval tracking

#### 3.2 Version Management
**File:** `src/components/versioning/VersionHistory.tsx`
- Version comparison (diff view)
- Track changes between versions
- Rollback capability

#### 3.3 Effective Date Management
**File:** `src/components/dates/EffectiveDatePicker.tsx`
- Set start/end dates
- Schedule future activation
- Handle supersession chains

### Phase 4: Compliance & Integration

#### 4.1 Compliance Dashboard
**File:** `src/components/compliance/ComplianceDashboard.tsx`
- Obligations by status
- Overdue obligations
- Compliance metrics by org

#### 4.2 Process Integration
**File:** `src/components/integration/ProcessLinkage.tsx`
- View processes that satisfy obligations
- Identify unlinked obligations
- Navigate to How-Do app

#### 4.3 Org Chart Integration
**File:** `src/components/integration/OrgLinkage.tsx`
- View policies owned by organization
- View obligations assigned to position
- Navigate to Org Chart app

---

# 4. TASK MANAGEMENT APPLICATION

## 4.1 Current Implementation Status

**Completed:**
- ✅ React + Vite + Tailwind setup
- ✅ TaskInbox component
- ✅ Mock traffic generator
- ✅ Task completion handling
- ✅ TaskCreated/TaskCompleted event emission (console)

**Not Yet Implemented:**
- ❌ Position-based task inbox (vs person-based)
- ❌ Task detail panel
- ❌ Semantic source context (why task exists)
- ❌ Organizational workload view
- ❌ Calendar integration
- ❌ Governance/How-Do integration
- ❌ OKR integration
- ❌ Shadow Tasks (JIRA/ADO integration)
- ❌ Task generation engine
- ❌ SLA and deadline visualization
- ❌ Workload metrics
- ❌ API integration with SOM backend

## 4.2 Implementation Plan

### Phase 1: Core Task System (MVP)

#### 1.1 Task Data Model
**File:** `src/types/task.ts`
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  state: 'created' | 'assigned' | 'started' | 'blocked' | 'completed' | 'cancelled';
  ownerType: 'Position' | 'Organization' | 'Person';
  ownerId: string;
  dueDate: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  source: TaskSource;
  sourceRefId?: string;
  tags: string[];
  classification?: string;
}

type TaskSource = 'Manual' | 'Governance' | 'HowDo' | 'OKR' | 'WorkPackage' | 'Request' | 'Calendar' | 'External';
```

#### 1.2 API Integration
**File:** `src/api/task-client.ts`
- Fetch tasks for position/person
- Create/update/complete tasks
- Query by source, status, priority

#### 1.3 Position Task Inbox
**File:** `src/components/inbox/PositionInbox.tsx`
- Tasks grouped by status (overdue, due soon, in progress, blocked)
- Filter by source, priority, domain
- Task aging indicators

#### 1.4 Task Detail Panel
**File:** `src/components/detail/TaskDetailPanel.tsx`
- Slide-over sidebar
- Source system and purpose
- Link to originating entity
- Owner (Position + Person)
- Related obligations/processes
- History log

### Phase 2: Member Experience

#### 2.1 Personal Task View
**File:** `src/components/views/MyTasksView.tsx`
- Tasks from all positions held
- Directly assigned tasks
- Tasks from initiated requests
- Shadow Tasks badge

#### 2.2 Task Origin Context
**File:** `src/components/detail/OriginContext.tsx`
- "Generated from: Onboarding Process Step 3"
- "Obligation due per NSWINST 1230.1B"
- "Work Package: CLD UI Redesign"
- Links to source systems

#### 2.3 Task Completion Flow
**File:** `src/components/modals/CompleteTaskModal.tsx`
- Notes (optional)
- Evidence attachment (if required)
- Cascading effects display (completes step, satisfies obligation)

### Phase 3: Organizational Views

#### 3.1 Workload Dashboard
**File:** `src/components/dashboard/WorkloadDashboard.tsx`
- Aggregated task volumes by org
- Heat map by position
- Overdue tasks count
- SLA breaches

#### 3.2 Bottleneck Detection
**File:** `src/components/analytics/BottleneckView.tsx`
- Workload imbalance across positions
- Structural bottlenecks
- Backlog growth trends

#### 3.3 Workload Trendlines
**File:** `src/components/charts/TrendCharts.tsx`
- Historical throughput
- Cycle time trends
- Backlog over time

### Phase 4: Integrations

#### 4.1 Calendar Integration
**File:** `src/hooks/useCalendarSync.ts`
- Deadlines on calendar
- Workload forecasts
- Sprint windows

#### 4.2 Governance Integration
**File:** `src/hooks/useGovernanceSync.ts`
- Task completion resolves obligation
- Evidence capture
- Compliance state update

#### 4.3 How-Do Integration
**File:** `src/hooks/useHowDoSync.ts`
- Task completion advances process step
- Workflow progression

#### 4.4 OKR Integration
**File:** `src/hooks/useOKRSync.ts`
- KR checkpoint tasks
- Recurring review cadences
- Objective-aligned work tracking

### Phase 5: Shadow Tasks (External Integration)

#### 5.1 External Work Gateway
**File:** `src/api/external-gateway.ts`
- JIRA connector
- ADO connector
- GitHub connector
- Map external items to ShadowTask

#### 5.2 Shadow Task Display
**File:** `src/components/shadow/ShadowTaskCard.tsx`
- Visual differentiation (subtle badge)
- Read-only display
- Link to external system

#### 5.3 Sync Rules
**File:** `src/services/sync-rules.ts`
- Inbound sync (always on)
- Limited outbound (reassignment, state changes)
- No user-initiated external updates

### Phase 6: Task Generation Engine

#### 6.1 Event Listeners
**File:** `src/services/task-generator.ts`
- Subscribe to semantic events
- ObligationCreated → Task
- ProcessStepActivated → Task
- KRCheckpointDue → Task
- MilestoneDue → Task

#### 6.2 Assignment Logic
**File:** `src/services/assignment-logic.ts`
- Position-based ownership
- Role Tag resolution
- SLA deadline calculation

---

# 5. OBJECTIVES & OKR APPLICATION

## 5.1 Current Implementation Status

**Completed:**
- ✅ React + Vite + Tailwind setup
- ✅ Dashboard component
- ✅ Mock objectives with progress
- ✅ Task velocity chart (last 20 days)
- ✅ Seed history generator

**Not Yet Implemented:**
- ❌ Line of Effort (LoE) management
- ❌ Objective composer with validation
- ❌ Key Result (KR) composer with linting
- ❌ Measure integration
- ❌ Evidence updates (automated + manual)
- ❌ Health model (on-track/at-risk/off-track)
- ❌ Work alignment (projects, processes)
- ❌ Quarterly review flow
- ❌ Overload/neglect detection
- ❌ Governance/How-Do/Org Chart integration
- ❌ API integration with SOM backend

## 5.2 Implementation Plan

### Phase 1: Strategic Hierarchy (MVP)

#### 1.1 Data Models
**File:** `src/types/okr.ts`
```typescript
interface LineOfEffort {
  id: string;
  name: string;
  description: string;
  owner: OwnerRef;
  timeHorizon: { start: Date; end: Date };
  objectives: string[]; // Objective IDs
}

interface Objective {
  id: string;
  statement: string;
  narrative: string;
  owner: OwnerRef;
  timeframe: { start: Date; end: Date };
  keyResults: string[]; // KR IDs
  linkedWork: WorkAlignment[];
  maturityLevel: 'improvement' | 'transformational';
}

interface KeyResult {
  id: string;
  outcomeStatement: string;
  baseline: number;
  target: number;
  current: number;
  measureRef: string;
  cadence: 'weekly' | 'monthly' | 'quarterly';
  owner: OwnerRef;
  health: 'on-track' | 'at-risk' | 'off-track' | 'unknown';
  evidenceLog: Evidence[];
}
```

#### 1.2 API Integration
**File:** `src/api/okr-client.ts`
- CRUD for LoEs, Objectives, KRs
- Query by owner, timeframe, health
- Measure data fetching

#### 1.3 LoE List View
**File:** `src/components/loe/LOEList.tsx`
- All Lines of Effort
- Progress indicators
- Drill-down to objectives

### Phase 2: Authoring Tools

#### 2.1 LoE Composer
**File:** `src/components/composer/LOEComposer.tsx`
- Problem framing
- Expected outcomes
- Stakeholder assignment
- Guidance tooltips

#### 2.2 Objective Composer
**File:** `src/components/composer/ObjectiveComposer.tsx`
- Statement input with validation
- Narrative (problem being solved)
- Owner selection from Org Chart
- Anti-vagueness linter
- Alignment recommendations

#### 2.3 KR Composer
**File:** `src/components/composer/KRComposer.tsx`
- "From X to Y by T" template
- Baseline suggestions (from measures)
- Target reasonableness checks
- Measure picker/creator
- KR Linter:
  - Is it measurable?
  - Is it an output instead of outcome?
  - Does owner have control?
  - Is it a vanity metric?

### Phase 3: Progress Tracking

#### 3.1 Evidence Updates
**File:** `src/components/progress/EvidencePanel.tsx`
- Automated pulls from Measures & Lenses
- Manual evidence submission
- Interpretation notes

#### 3.2 Health Model
**File:** `src/utils/health-calculator.ts`
- Compute health from:
  - Data updates
  - Trend direction
  - Commentary/flags
- Thresholds for on-track/at-risk/off-track

#### 3.3 KR Detail View
**File:** `src/components/detail/KRDetailView.tsx`
- Current vs baseline vs target
- Trend chart
- Evidence history
- Health status

### Phase 4: Alignment Engine

#### 4.1 Structural Alignment
**File:** `src/components/alignment/StructuralAlignment.tsx`
- Bind LoE/Objective/KR to:
  - Organizations
  - Positions
  - Role Tags
  - Tiger Teams

#### 4.2 Work Alignment
**File:** `src/components/alignment/WorkAlignment.tsx`
- Link to Projects (initiatives)
- Link to Processes (How-Do)
- Link to Obligations (Governance)
- Link to Measures

#### 4.3 Alignment Visualization
**File:** `src/components/alignment/AlignmentGraph.tsx`
- Visual tree: LoE → Objectives → KRs → Work
- Identify unaligned work
- Identify objectives without KRs

### Phase 5: Review & Governance

#### 5.1 Quarterly Review View
**File:** `src/components/review/QuarterlyReview.tsx`
- LoE status summary
- Objective KR trends
- Bottleneck identification
- Commentary collection

#### 5.2 Overload Detection
**File:** `src/components/alerts/OverloadAlerts.tsx`
- Orgs with too many objectives
- Objectives without KRs
- KRs without data
- Stale updates

#### 5.3 "Principled No" Support
**File:** `src/components/decision/DecisionSupport.tsx`
- View org capacity
- Alignment check for new proposals
- Recommendation engine

### Phase 6: Integration

#### 6.1 Governance Integration
- Policy-derived obligations as candidate Objectives/KRs
- Conflict detection

#### 6.2 How-Do Integration
- Processes mapped to KRs
- Drift detection when processes change

#### 6.3 Org Chart Integration
- Click org → see commitments and performance
- Leadership single pane of glass

---

# Implementation Priority Matrix

## Immediate (Next 2 Sprints)

1. **Org Chart - Phase 1**: Core navigation, sidebar, person nodes
2. **Task Management - Phase 1**: Position inbox, task detail, API integration
3. **How-Do - Phase 1**: Process viewer, API integration

## Short-term (Sprints 3-4)

4. **Org Chart - Phase 2**: Discovery bar, search
5. **Task Management - Phase 2**: Member experience, completion flow
6. **Objectives/OKR - Phase 1**: Strategic hierarchy, LoE/Objective views

## Medium-term (Sprints 5-6)

7. **How-Do - Phase 2-3**: Discovery, enhanced viewer
8. **Policy Governance - Phase 1-2**: Document management, rich editor
9. **Objectives/OKR - Phase 2**: Authoring tools with validation

## Long-term (Sprints 7+)

10. **Org Chart - Phase 4**: Edit workflows, position management
11. **Task Management - Phase 4-5**: Integrations, shadow tasks
12. **How-Do - Phase 4-5**: Editor, governance integration
13. **Policy Governance - Phase 3-4**: Lifecycle, compliance
14. **Objectives/OKR - Phase 4-6**: Alignment, review, integrations

---

# Cross-Cutting Concerns

## Shared Components to Build

1. **OwnerPicker** - Reusable org/position/role selection
2. **HolonLink** - Navigation links between apps
3. **HealthIndicator** - Consistent health visualization
4. **TimelineChart** - Reusable trend visualization
5. **SearchBar** - Consistent search UX across apps
6. **SidebarPanel** - Consistent detail panel pattern

## API Patterns to Establish

1. Standard error handling
2. Optimistic updates
3. Caching strategy (React Query)
4. Real-time updates (WebSocket consideration)

## Testing Strategy

1. Unit tests for business logic
2. Component tests with React Testing Library
3. Integration tests against SOM API
4. E2E tests for critical user flows

---

# Dependencies on SOM Backend

Each app requires specific SOM API capabilities:

| Feature | Required API | Status |
|---------|-------------|--------|
| Org navigation | `/temporal/organizations/{id}/structure` | ✅ Available |
| Holon queries | `/holons/{type}` | ✅ Available |
| Unified search | `/search` | ✅ Available |
| Event submission | `/events` | ✅ Available |
| Process queries | `/holons/Process` | ✅ Available |
| Task management | Task holon CRUD | ✅ Types defined |
| OKR management | Objective/LOE CRUD | ✅ Types defined |
| Constraint validation | Constraint engine | ✅ Available |

All required backend capabilities appear to be in place. Implementation can proceed.
