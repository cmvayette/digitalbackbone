# Digital Backbone Development Roadmap

A practical roadmap to complete the five essential Tier-1 applications: Org Chart, How-Do, Policy Governance, Task Management, and Objectives/OKR.

---

## Guiding Principles for This Roadmap

1. **Build horizontally first, then vertically** - Get all apps to basic functionality before deep features
2. **Shared infrastructure before app-specific features** - Components used by multiple apps get built first
3. **API integration early** - Connect to real backend, not just mocks
4. **One app leads** - Org Chart is the foundation; other apps reference it

---

## Phase Overview

| Phase | Focus | Duration | Outcome |
|-------|-------|----------|---------|
| **0** | Foundation | 1 week | Shared components, API patterns, simplifications |
| **1** | Core Read | 2 weeks | All 5 apps display real data from SOM API |
| **2** | Core Write | 2 weeks | All 5 apps can create/edit their primary entities |
| **3** | Cross-App Integration | 2 weeks | Apps link to each other, shared context |
| **4** | Advanced Features | 3 weeks | Search, filters, health indicators, dashboards |
| **5** | Polish | 2 weeks | UX refinement, keyboard shortcuts, performance |

**Total: ~12 weeks to functional completion**

---

# Phase 0: Foundation (Week 1)

Before building app features, establish the shared infrastructure.

## 0.1 Backend Simplifications

Execute the high-priority simplifications to reduce friction:

| Task | Files | Effort |
|------|-------|--------|
| Create `OperationResult<T>` generic | `packages/som-shared-types/src/operation-result.ts` | 1 hr |
| Create `AuditParams` mixin | `packages/som-shared-types/src/audit-params.ts` | 1 hr |
| Create `BaseManager` class | `apps/som-tier0/src/core/base-manager.ts` | 2 hr |
| Create test fixtures factory | `apps/som-tier0/src/test-utils/fixtures.ts` | 1 hr |

## 0.2 Shared Frontend Package

Create a shared UI component library for consistency across all 5 apps:

**Create:** `packages/ui-components/`

```
packages/ui-components/
├── src/
│   ├── components/
│   │   ├── SidebarPanel.tsx       # Slide-over detail panel
│   │   ├── SearchBar.tsx          # Unified search input
│   │   ├── OwnerPicker.tsx        # Select Org/Position/Person
│   │   ├── HealthBadge.tsx        # Green/yellow/red indicator
│   │   ├── HolonLink.tsx          # Cross-app navigation link
│   │   ├── LoadingState.tsx       # Consistent loading UI
│   │   ├── EmptyState.tsx         # Consistent empty state
│   │   └── ErrorBoundary.tsx      # Error handling wrapper
│   ├── hooks/
│   │   ├── useApi.ts              # Base API fetching hook
│   │   ├── useHolon.ts            # Fetch any holon by ID
│   │   └── useDebounce.ts         # Debounced input
│   ├── styles/
│   │   └── blueprint.css          # Shared blueprint aesthetic
│   └── index.ts
├── package.json
└── tsconfig.json
```

## 0.3 API Client Library

Create a shared API client that all apps use:

**Create:** `packages/api-client/`

```typescript
// packages/api-client/src/client.ts
export class SOMClient {
  constructor(private baseUrl: string) {}

  // Holons
  async getHolon(id: string): Promise<Holon>
  async queryHolons(type: HolonType, filters?: HolonFilters): Promise<Holon[]>
  async search(query: string, types?: HolonType[]): Promise<SearchResult[]>

  // Events
  async submitEvent(event: Event): Promise<EventResult>

  // Relationships
  async getRelationships(holonId: string, type?: RelationshipType): Promise<Relationship[]>

  // Temporal
  async getHolonAsOf(id: string, timestamp: Date): Promise<Holon>
  async getOrgStructure(orgId: string, asOf?: Date): Promise<OrgStructure>
}
```

## 0.4 Seed Data

Create realistic seed data for development:

**Create:** `apps/som-tier0/src/seed/`

```typescript
// seed/index.ts - Creates a realistic NSW organizational structure
export async function seedDevelopmentData(services: ServiceContainer) {
  // Create command structure
  const nswc = await createOrganization({ name: 'Naval Special Warfare Command', ... });
  const group1 = await createOrganization({ name: 'Naval Special Warfare Group 1', parent: nswc, ... });
  const team1 = await createOrganization({ name: 'SEAL Team 1', parent: group1, ... });

  // Create positions
  const co = await createPosition({ title: 'Commanding Officer', org: team1, ... });
  const xo = await createPosition({ title: 'Executive Officer', org: team1, ... });

  // Create people and assignments
  const commander = await createPerson({ name: 'John Smith', rank: 'O-5', ... });
  await assignToPosition(commander, co);

  // Create processes, policies, objectives, tasks
  // ...
}
```

## Phase 0 Deliverables

- [ ] Backend simplifications complete
- [ ] `packages/ui-components` created with core components
- [ ] `packages/api-client` created with SOMClient
- [ ] Seed data script populates realistic test data
- [ ] All apps can import shared packages

---

# Phase 1: Core Read (Weeks 2-3)

Get all 5 apps displaying real data from the SOM API.

## 1.1 Org Chart - Read

**Goal:** Display org structure from API, select nodes, view details

| Task | Component | Description |
|------|-----------|-------------|
| Connect to API | `useOrgStructure.ts` | Fetch real org data, not mocks |
| Person nodes | `PersonNode.tsx` | Display people within positions |
| Selection state | `useSelection.ts` | Track selected holon |
| Sidebar panel | `SidebarPanel.tsx` | Show details for selected holon |
| Org sidebar | `OrganizationSidebar.tsx` | Name, description, roster |
| Position sidebar | `PositionSidebar.tsx` | Title, billet status, occupant |
| Person sidebar | `PersonSidebar.tsx` | Name, rank, qualifications |

**API Endpoints Used:**
- `GET /api/v1/temporal/organizations/{id}/structure`
- `GET /api/v1/holons/{id}`
- `GET /api/v1/relationships?source={id}`

## 1.2 How-Do - Read

**Goal:** Display processes from API, view steps and owners

| Task | Component | Description |
|------|-----------|-------------|
| Process list | `ProcessList.tsx` | List all processes from API |
| Connect to API | `useProcesses.ts` | Fetch Process holons |
| Swimlane viewer | `SwimlaneViewer.tsx` | Read-only process view |
| Step cards | `StepCard.tsx` | Display step details |
| Owner display | `OwnerBadge.tsx` | Show owning position/org |

**API Endpoints Used:**
- `GET /api/v1/holons/Process`
- `GET /api/v1/holons/{processId}`
- `GET /api/v1/relationships?source={processId}&type=CONTAINS`

## 1.3 Policy Governance - Read

**Goal:** Display policy documents from API, view obligations

| Task | Component | Description |
|------|-----------|-------------|
| Policy list | `PolicyList.tsx` | List all Document holons (type=Policy) |
| Connect to API | `usePolicies.ts` | Fetch Document holons |
| Policy viewer | `PolicyViewer.tsx` | Read-only document display |
| Obligations list | `ObligationsList.tsx` | Show constraints from document |

**API Endpoints Used:**
- `GET /api/v1/holons/Document?filters[documentType]=Policy`
- `GET /api/v1/holons/{documentId}`
- `GET /api/v1/relationships?source={documentId}&type=DEFINES`

## 1.4 Task Management - Read

**Goal:** Display tasks from API, view task details

| Task | Component | Description |
|------|-----------|-------------|
| Task inbox | `TaskInbox.tsx` | List tasks for current user/position |
| Connect to API | `useTasks.ts` | Fetch Task holons |
| Task card | `TaskCard.tsx` | Display task summary |
| Task detail | `TaskDetailPanel.tsx` | Full task details in sidebar |
| Status groups | `TaskGroups.tsx` | Group by status (pending, in-progress, etc.) |

**API Endpoints Used:**
- `GET /api/v1/holons/Task?filters[ownerId]={positionId}`
- `GET /api/v1/holons/{taskId}`
- `GET /api/v1/relationships?source={taskId}`

## 1.5 Objectives/OKR - Read

**Goal:** Display LOEs, Objectives, Key Results from API

| Task | Component | Description |
|------|-----------|-------------|
| LOE list | `LOEList.tsx` | List all Lines of Effort |
| Connect to API | `useOKRs.ts` | Fetch LOE, Objective holons |
| LOE view | `LOEView.tsx` | Show LOE with child objectives |
| Objective card | `ObjectiveCard.tsx` | Display objective with KRs |
| Progress display | `ProgressBar.tsx` | Show KR progress |

**API Endpoints Used:**
- `GET /api/v1/holons/LOE`
- `GET /api/v1/holons/Objective`
- `GET /api/v1/relationships?source={loeId}&type=CONTAINS`

## Phase 1 Deliverables

- [ ] All 5 apps fetch and display real data from SOM API
- [ ] Selection/detail pattern works in all apps
- [ ] No mock data in production code paths
- [ ] Shared components used consistently

---

# Phase 2: Core Write (Weeks 4-5)

Enable creating and editing primary entities in each app.

## 2.1 Org Chart - Write

| Task | Component | Description |
|------|-----------|-------------|
| Create org modal | `CreateOrgModal.tsx` | Form to create organization |
| Create position modal | `CreatePositionModal.tsx` | Form to create position |
| Assign person modal | `AssignPersonModal.tsx` | Assign person to position |
| Event submission | `useSubmitEvent.ts` | Submit events to API |
| Optimistic updates | - | Update UI before API confirms |

**Events Emitted:**
- `OrganizationCreated`
- `PositionCreated`
- `AssignmentStarted`
- `AssignmentEnded`

## 2.2 How-Do - Write

| Task | Component | Description |
|------|-----------|-------------|
| Create process | `CreateProcessModal.tsx` | New process form |
| Step editor | `StepEditor.tsx` | Add/edit/delete steps |
| Drag reorder | `useDragReorder.ts` | Reorder steps via drag |
| Owner picker | `OwnerPicker.tsx` | Select step owner from org |
| Save process | `useSaveProcess.ts` | Submit ProcessDefined event |

**Events Emitted:**
- `ProcessDefined` (custom event with steps payload)
- `ProcessUpdated`

## 2.3 Policy Governance - Write

| Task | Component | Description |
|------|-----------|-------------|
| Create policy | `CreatePolicyModal.tsx` | New policy document |
| Section editor | `SectionEditor.tsx` | Edit policy sections |
| Obligation creator | `ObligationCreator.tsx` | Define obligations from text |
| Publish workflow | `PublishButton.tsx` | Change status draft→active |

**Events Emitted:**
- `DocumentIssued`
- `DocumentSuperseded`
- `ConstraintDefined`

## 2.4 Task Management - Write

| Task | Component | Description |
|------|-----------|-------------|
| Create task | `CreateTaskModal.tsx` | Manual task creation |
| Complete task | `CompleteTaskModal.tsx` | Mark task done with notes |
| Reassign task | `ReassignModal.tsx` | Change task owner |
| Update status | `StatusDropdown.tsx` | Change task status |

**Events Emitted:**
- `TaskCreated`
- `TaskAssigned`
- `TaskStarted`
- `TaskCompleted`
- `TaskCancelled`

## 2.5 Objectives/OKR - Write

| Task | Component | Description |
|------|-----------|-------------|
| Create LOE | `LOEComposer.tsx` | New Line of Effort |
| Create objective | `ObjectiveComposer.tsx` | New objective under LOE |
| Create KR | `KRComposer.tsx` | New key result |
| Update progress | `ProgressUpdater.tsx` | Record KR evidence |

**Events Emitted:**
- `LOECreated`
- `ObjectiveCreated`
- `KeyResultDefined`
- `MeasureEmitted` (for KR updates)

## Phase 2 Deliverables

- [ ] All 5 apps can create their primary entities
- [ ] All 5 apps can edit/update entities
- [ ] Events flow through SOM API correctly
- [ ] Validation errors display properly
- [ ] Optimistic updates provide responsive UX

---

# Phase 3: Cross-App Integration (Weeks 6-7)

Connect the apps to each other - the real power of the semantic model.

## 3.1 Org Chart as Foundation

All other apps reference Org Chart for:
- Owner selection (Position/Organization picker)
- Person lookup
- Organizational context

| Task | Component | Description |
|------|-----------|-------------|
| Owner picker integration | `OwnerPicker.tsx` | Shared component fetches from Org API |
| Deep links | `HolonLink.tsx` | Click owner → opens Org Chart to that node |
| Context header | `OrgContext.tsx` | Show current org context in all apps |

## 3.2 How-Do ↔ Policy Governance

| Task | Description |
|------|-------------|
| Obligation linking | Steps can link to policy obligations |
| Obligation badges | Show which obligations a step satisfies |
| Policy viewer link | Click obligation → opens Policy app |
| Coverage report | Policy app shows which obligations have process steps |

## 3.3 How-Do ↔ Task Management

| Task | Description |
|------|-------------|
| Process step → Task | "Start this process" creates tasks for steps |
| Task origin context | Task shows "From: Onboarding Process, Step 3" |
| Process link | Click origin → opens How-Do to that step |

## 3.4 Task Management ↔ Objectives/OKR

| Task | Description |
|------|-------------|
| Task alignment | Tasks can link to Objectives/KRs |
| Initiative tasks | Initiative creates child tasks |
| Progress inference | Completing tasks updates KR progress |
| Objective link | Task detail shows aligned objective |

## 3.5 Policy Governance ↔ Objectives/OKR

| Task | Description |
|------|-------------|
| Policy-derived objectives | Obligations suggest objectives |
| Compliance KRs | KRs can measure policy compliance |
| Policy link | Objective shows grounding documents |

## 3.6 Universal Navigation

| Task | Component | Description |
|------|-----------|-------------|
| App switcher | `AppSwitcher.tsx` | Quick switch between apps |
| Universal search | `UniversalSearch.tsx` | Search across all holon types |
| Breadcrumbs | `Breadcrumbs.tsx` | Show navigation path |
| Back navigation | - | Browser back works correctly |

## Phase 3 Deliverables

- [ ] Owner picker works from any app
- [ ] Deep links between apps work
- [ ] Semantic relationships visible across apps
- [ ] Universal search returns results from all apps
- [ ] Navigation feels cohesive

---

# Phase 4: Advanced Features (Weeks 8-10)

Add the features that make each app powerful.

## 4.1 Org Chart Advanced

| Feature | Description |
|---------|-------------|
| Discovery bar | Centered search with typeahead |
| Natural language queries | "vacant billets in training" |
| Health indicators | Green/yellow/red dots on orgs |
| Vacancy badges | Count of unfilled positions |
| Tiger team highlighting | Visual indicator for cross-functional teams |
| Roster preview | Hover org → see people |
| Keyboard navigation | Arrow keys, `/` for search, `?` for help |

## 4.2 How-Do Advanced

| Feature | Description |
|---------|-------------|
| Process search | "How do I...?" natural language |
| Filters | By domain, owner, obligation |
| Linear timeline view | Mobile-friendly vertical layout |
| "Show my steps" | Filter to user's responsibilities |
| Decision branches | Visual branch/merge in swimlanes |
| Version history | View previous versions, diff |
| Process health | Freshness, coverage, complexity scores |

## 4.3 Policy Governance Advanced

| Feature | Description |
|---------|-------------|
| Rich text editor | Formatting, lists, links |
| Auto-detect obligations | Find "shall/must" statements |
| Constraint builder | Define constraints visually |
| Effective dates | Schedule activation/expiration |
| Supersession chains | Show document lineage |
| Version diff | Compare document versions |
| Compliance dashboard | Obligation status overview |

## 4.4 Task Management Advanced

| Feature | Description |
|---------|-------------|
| Position inbox | Tasks by position, not just person |
| Workload dashboard | Heat map by position/org |
| SLA indicators | Time remaining, overdue warnings |
| Task dependencies | Blocked-by relationships |
| Bulk actions | Complete/reassign multiple tasks |
| Filters | By source, priority, due date |
| Calendar view | Tasks on timeline |

## 4.5 Objectives/OKR Advanced

| Feature | Description |
|---------|-------------|
| KR linter | Validate measurability, ownership |
| Health model | On-track/at-risk/off-track |
| Trend charts | KR progress over time |
| Alignment visualization | Tree view: LOE → Obj → KR → Work |
| Quarterly review view | Leadership summary |
| Overload detection | Flag orgs with too many objectives |
| Evidence log | Track KR updates with notes |

## Phase 4 Deliverables

- [ ] Search and filters work in all apps
- [ ] Health indicators visible where specified
- [ ] Advanced editing features complete
- [ ] Dashboards and visualizations work
- [ ] All spec'd features implemented

---

# Phase 5: Polish (Weeks 11-12)

Refinement and optimization.

## 5.1 UX Polish

| Task | Description |
|------|-------------|
| Loading states | Consistent skeletons/spinners |
| Error handling | Graceful error messages |
| Empty states | Helpful messages when no data |
| Confirmation dialogs | Before destructive actions |
| Toast notifications | Success/error feedback |
| Keyboard shortcuts | Documented, consistent |
| Help overlays | `?` shows available shortcuts |

## 5.2 Performance

| Task | Description |
|------|-------------|
| Query caching | React Query stale times tuned |
| Lazy loading | Large lists virtualized |
| Code splitting | Route-based chunks |
| Bundle analysis | Remove unused dependencies |
| Lighthouse audit | Address performance issues |

## 5.3 Testing

| Task | Description |
|------|-------------|
| Unit tests | Business logic coverage |
| Component tests | Key UI components |
| Integration tests | API flows |
| E2E tests | Critical user journeys |

## 5.4 Documentation

| Task | Description |
|------|-------------|
| User guide | How to use each app |
| API documentation | OpenAPI spec complete |
| Developer docs | How to extend/contribute |

## Phase 5 Deliverables

- [ ] All apps feel polished and responsive
- [ ] No console errors in normal usage
- [ ] Test coverage > 70%
- [ ] Documentation complete

---

# Dependency Graph

```
Phase 0 (Foundation)
    │
    ├── Shared packages (ui-components, api-client)
    │
    └── Backend simplifications
            │
            ▼
Phase 1 (Core Read) ─────────────────────────────────────┐
    │                                                     │
    ├── Org Chart Read ◄── foundation for owner selection │
    │       │                                             │
    │       ▼                                             │
    ├── How-Do Read (uses OwnerPicker)                    │
    ├── Policy Read                                       │
    ├── Task Read                                         │
    └── OKR Read                                          │
            │                                             │
            ▼                                             │
Phase 2 (Core Write) ────────────────────────────────────┤
    │                                                     │
    ├── All apps: Create/Edit forms                       │
    └── Event submission working                          │
            │                                             │
            ▼                                             │
Phase 3 (Integration) ───────────────────────────────────┤
    │                                                     │
    ├── Cross-app links                                   │
    ├── Semantic relationships visible                    │
    └── Universal search                                  │
            │                                             │
            ▼                                             │
Phase 4 (Advanced) ──────────────────────────────────────┤
    │                                                     │
    ├── Search/filters                                    │
    ├── Health indicators                                 │
    └── Dashboards                                        │
            │                                             │
            ▼                                             │
Phase 5 (Polish) ────────────────────────────────────────┘
```

---

# Weekly Schedule

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 1 | Phase 0 | Shared packages, simplifications, seed data |
| 2 | Phase 1a | Org Chart + How-Do read |
| 3 | Phase 1b | Policy + Task + OKR read |
| 4 | Phase 2a | Org Chart + How-Do write |
| 5 | Phase 2b | Policy + Task + OKR write |
| 6 | Phase 3a | Org integration, owner picker |
| 7 | Phase 3b | Cross-app links, universal search |
| 8 | Phase 4a | Org + How-Do advanced |
| 9 | Phase 4b | Policy + Task advanced |
| 10 | Phase 4c | OKR advanced |
| 11 | Phase 5a | UX polish, performance |
| 12 | Phase 5b | Testing, documentation |

---

# Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Scope creep in advanced features | Define MVP for each feature, defer enhancements |
| API gaps discovered | Address in Phase 1; backend is flexible |
| Cross-app complexity | Build integration incrementally, test each link |
| Performance with real data | Test with realistic seed data from Phase 0 |
| Time pressure | Phases 4-5 can be compressed; core value is in 1-3 |

---

# Success Metrics

After Phase 5, you should be able to:

1. **Org Chart**: See any org, find any person, understand the structure
2. **How-Do**: Define a process, see who owns each step, find "how do I do X?"
3. **Policy**: Write a policy, extract obligations, see what's enforced
4. **Tasks**: See your inbox, complete tasks, track workload
5. **OKR**: Define objectives, track key results, see strategic alignment

And critically:
- **Click any owner → see them in Org Chart**
- **Click any obligation → see the policy**
- **Click any task → see where it came from**
- **Search across everything**
