# Org Chart Modernization Plan

This plan outlines the steps to bring the `apps/org-chart` application to full parity with the `org_chart.md` and `org_chart_ui_components.md` specifications, while strictly adhering to the SOM Event Sourcing architecture and the **Universal UI Design System** (`docs/design/ui/universal_ui_spec.md`).

## Epic 1: High-Fidelity Inspector Panel (Organization Sidebar)
**Goal:** Transform the current `OrganizationSidebar` into the rich "Inspector Panel" defined in the UI components spec, focusing on Service Tiles and ownership clarity.

### Issue 1.1: Enhance Domain Types for Services
**Description**:
Update `apps/org-chart/src/types/domain.ts` to support the rich metadata required for Service Tiles. The current `Service` interface is too simple.
- **User Story**: As a developer, I need types that support "Point of Contact" vs "Team" ownership to match the UI spec.
- **Acceptance Criteria**:
  - [x] Extend `Service` interface to include `ownerType` ('person' | 'team').
  - [x] Add `ownerId` (referencing a Person or Organization/TigerTeam ID).
  - [x] Add `ownerMetadata` (avatarUrl, name, role) for UI convenience (or derive from store).
  - [x] Ensure backward compatibility or update mock data.

### Issue 1.2: Implement Service Tile Component with Popover
**Description**: 
Create a dedicated `ServiceTile` component that matches the "Prototype HTML" in `org_chart_ui_components.md`.
- **User Story**: As a user, I want to see who owns a service (Team vs POC) so I can contact the right person.
- **Acceptance Criteria**:
  - [x] Component matches `service-tile` CSS structure (flex layout, hover states).
  - [x] Displays Service Name and Icon.
  - [x] Displays "Owner" section (Right side) with Avatar or Team Icon.
  - [x] **Hovering** the Owner section triggers a `TeamPopover` showing members/more info.
  - [x] Clicking the tile launches the service URL.

### Issue 1.3: Upgrade Organization Sidebar Layout
**Description**: 
Update `OrganizationSidebar.tsx` to match the "Max Density" header and layout from the spec.
- **User Story**: As a user, I want a standardized, professional look for organization details.
- **Acceptance Criteria**:
  - [x] Update Header to use "Unit Identity" layout (Logo + Title + Subtitle).
  - [x] Section Headers should match `section-label` style (uppercase, mono font).
  - [x] Replace current list of services with the new `ServiceTile` component.

## Epic 2: Advanced Discovery Bar
**Goal:** Move `DiscoveryBar` from simple string matching to "Lite Natural Language" and Filter-based discovery.

### Issue 2.1: Add Filter Controls
**Description**: 
Add visual filter toggles to the Discovery Bar for quick slicing of the org chart.
- **User Story**: As a user, I want to toggle "Vacancies" or "Tiger Teams" to quickly see those nodes on the graph.
- **Acceptance Criteria**:
  - [x] Add Filter Buttons (e.g., "Vacancies", "Funded Only", "Tiger Teams") below or inside the search bar.
  - [x] Toggling "Vacancies" highlights or filters the graph/search results to show only vacant positions.
  - [x] Toggling "Tiger Teams" filters to show Tiger Team orgs.

### Issue 2.2: Implement "Lite" Natural Language Querying
**Description**: 
Enhance `useSearch` hook to parse intent-based queries.
- **User Story**: As a user, I want to type "vacant in N3" and see results without manually filtering.
- **Acceptance Criteria**:
  - [x] Support "vacant" keyword -> filters for `isVacant: true`.
  - [x] Support "who is [Role]" -> searches Position titles.
  - [x] Support "show [Org]" -> focuses Organization.
  - [x] Parse "in [OrgName]" context to scope search.

## Epic 3: Tiger Team Support & Event Alignment
**Goal:** Ensure Tiger Teams are first-class citizens and all actions emit correct SOM Events.

### Issue 3.1: Tiger Team Visualization & Sidebar
**Description**: 
Ensure Tiger Teams render with distinct visual cues and specialized sidebar data, leveraging `holon.ts` `isTigerTeam` property.
- **User Story**: As a user, I distinguish Tiger Teams from permanent hierarchy.
- **Acceptance Criteria**:
  - [x] "Tiger Team" Organizations should have a distinct badge/border style in `OrganizationNode`.
  - [x] Sidebar for Tiger Teams should show "Duration" and "Sponsor" (mapped from `properties`).
  - [x] List "Members" (dual-hatted persons) explicitly.
  - [x] **Technical**: Verify `Organization` interface in `domain.ts` aligns with `holon.ts` (Shared) properties.

### Issue 3.2: Verify Event Emission for Actions
**Description**:
Audit buttons in Sidebars (e.g., "Add Sub-Unit", "Assign") to ensure they flow through `useOrgMutations` and seemingly map to SOM Events (even if mocked locally for now).
- **User Story**: As a user, when I create a team, it should persist via the correct architectural path.
- **Acceptance Criteria**:
  - [x] "Add Sub-Unit" -> Emits `OrganizationCreated`.
  - [x] "Add Position" -> Emits `PositionCreated`.
  - [x] "Assign" -> Emits `AssignmentStarted`.

---
**Summary of Gaps**:
- **Critical**: `ServiceTile` is missing the "Owner/POC" fidelity.
- **Critical**: `DiscoveryBar` lacks Filters and NL capabilities.
- **Infrastructure**: `Service` type definition needs expansion to support UI specs.
