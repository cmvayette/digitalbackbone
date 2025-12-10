# Codebase Review Findings & Improvement Areas

After a thorough review of the `digital_backbone` monorepo, I have identified three high-impact areas for improvement. These focus on hardening the system for production, improving type safety, and reducing technical debt.

## 1. Enhance Type Safety in Shared Events (`packages/som-shared-types`)

**Current State:**
The `Event` interface in `packages/som-shared-types/src/event.ts` defines `payload` as `Record<string, any>`.
```typescript
export interface Event {
  // ...
  payload: Record<string, any>;
}
```
This bypasses TypeScript's safety features, allowing any data to be submitted as an event payload, which violates the strict schema requirements of the Semantic Operating Model.

**Proposed Improvement:**
- Refactor the `Event` interface to use a **Discriminated Union** with Generics.
- Create specific payload interfaces for each `EventType`.
- Example:
  ```typescript
  type Event = 
    | { type: EventType.PositionCreated; payload: PositionCreatedPayload; ... }
    | { type: EventType.OrganizationCreated; payload: OrganizationCreatedPayload; ... };
  ```
- This ensures that when an event type is checked, the payload structure is automatically inferred and validated at compile time.

## 2. Refactor `apps/org-chart` State Management for Production Readiness

**Current State:**
The `orgStore.ts` file contains several indicators of "prototype" quality code:
- **Hardcoded Actor**: `actor: 'system'` (Line 74, 105, 138, 172).
- **Outdated Assumptions**: A FIXME comment at line 128 questions if `PositionModified` exists. My review confirms it **does** exist in `EventType` enum, meaning the code is unnecessarily cautious or outdated.
- **Optimistic ID Generation**: Uses `Date.now()` string templates for IDs, which clashes with the UUID or content-addressable ID standards likely required by the Tier-0 core.
- **Missing Error Types**: Error handling is generic (`throw new Error`).

**Proposed Improvement:**
- Update `orgStore.ts` to use real user context for the `actor` field.
- Remove the outdated comments and fully utilize the `PositionModified` event type.
- Implement proper ID generation (or let the backend assign them/request them via a proper ID service).
- Centralize logic for event submission to reduce code duplication.

## 3. Implement Runtime Validation for SAL Ingestion (`apps/som-tier0`)

**Current State:**
The Semantic Access Layer (SAL) is responsible for mapping "dirty" external data to "clean" SOM events. However, `ApiIngestionAdapter.ts` uses `any` heavily:
```typescript
const json: any = await response.json(); 
// ...
return (Array.isArray(json) ? json : [json]) as T[];
```
This blindly casts external API responses to internal types `T[]` without validation. If an external API changes its schema, the system will crash deep in the core logic rather than failing fast at the "Gate".

**Proposed Improvement:**
- Integrate `zod` (or similar) into the `IngestionAdapter` interface.
- Require adapters to accept a schema validator.
- Validate `json` against the schema *before* casting to `T`.
- This ensures that only valid data enters the Event Transformer pipeline, protecting the integrity of the Event Store.
