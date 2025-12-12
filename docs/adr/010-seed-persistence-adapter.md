# ADR 010: Event Sourcing Adapter for Seed Data Persistence

## Status
Accepted

## Date
2025-12-10

## Context
We needed to seed the `apps/som-tier0` SQLite database with realistic development data (NSW Command Hierarchy). 
We had existing, rich seed logic in `apps/som-tier0/src/seed/index.ts`, but it was written to use `InMemoryHolonRepository` and `InMemoryEventStore`, which do not persist data to the file system or emit events to the main `SQLiteEventStore`.

Rewriting the complex domain logic in `seed/index.ts` to manually construct and emit events for every entity (Org, Position, Person, Process, etc.) would be error-prone and duplicate business logic.

## Decision
We decided to implement the **Adapter Pattern** by creating `EventSourcingHolonRepository` (`src/seed/persistence-adapter.ts`).

This adapter:
1. Implements the standard `IHolonRepository` interface.
2. Wraps an inner `InMemoryHolonRepository` to handle read operations and ID generation.
3. **Intercepts write operations** (`createHolon`, `markHolonInactive`).
4. Automatically constructs relevant `Event` objects (e.g., `OrganizationCreated`, `PositionCreated`) based on the operation.
5. Submits these events to the injected `SQLiteEventStore`.

## Consequences
### Positive
*   **Reuse**: We reused 100% of the existing complex seed logic in `seed/index.ts` without modification.
*   **Consistency**: The seed script now generates the exact same Event Sourcing history as the real application would.
*   **Maintainability**: Any new entity types added to the seed logic only need minor mapping updates in the adapter, rather than rewriting event construction logic.

### Negative
*   **Indirection**: There is now a layer of indirection during seeding. Developers must ensure the adapter maps `HolonType` to `EventType` correctly.
*   **Type Safety**: The casting in `run-seed.ts` is slightly loose (`as any`), as we are injecting a wrapper where a concrete implementation was expected, though strict interface compliance is maintained.
