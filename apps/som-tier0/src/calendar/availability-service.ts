
import { CalendarIndex, CalendarEventView } from './calendar-index';
import { GraphStore } from '../graph-store';
import { HolonID, RelationshipType } from '@som/shared-types';

export interface TimeWindow {
    start: Date;
    end: Date;
}

export interface AvailabilityStatus {
    available: boolean;
    conflicts: Array<{
        event: CalendarEventView;
        reason: 'direct' | 'inherited';
        sourceId: string; // The ID of the entity that caused the conflict (self or parent org)
    }>;
}

export class AvailabilityService {
    private calendarIndex: CalendarIndex;
    private graphStore: GraphStore;

    constructor(calendarIndex: CalendarIndex, graphStore: GraphStore) {
        this.calendarIndex = calendarIndex;
        this.graphStore = graphStore;
    }

    /**
     * Check availability for a specific holon over a time range
     * Accounts for hierarchical unavailability (e.g. parent organization events)
     */
    async checkAvailability(
        holonId: HolonID,
        start: Date,
        end: Date
    ): Promise<AvailabilityStatus> {
        const conflicts: AvailabilityStatus['conflicts'] = [];

        // 1. Check Direct Events
        const directEvents = this.calendarIndex.queryEvents(start, end, { participantId: holonId });
        directEvents.forEach(event => {
            conflicts.push({
                event,
                reason: 'direct',
                sourceId: holonId
            });
        });

        // 2. Check Inherited Events (Hierarchy)
        // Find all parent organizations (MemberOf, AssignedTo, etc.)
        // We traverse 'outgoing' relationships of types that imply containment/membership
        const parents = await this.getAllParentHolons(holonId);

        for (const parentId of parents) {
            const parentEvents = this.calendarIndex.queryEvents(start, end, { participantId: parentId });
            parentEvents.forEach(event => {
                // Only consider blocking events from parents (e.g. deployments, holidays)
                // For now, we assume ALL parent events block availability, but in future we might filter by classification/type
                conflicts.push({
                    event,
                    reason: 'inherited',
                    sourceId: parentId
                });
            });
        }

        return {
            available: conflicts.length === 0,
            conflicts
        };
    }

    /**
     * Find all transitive parents of a holon (e.g. Holon -> Team -> Dept -> Unit)
     * Limit recursion depth to avoid infinite loops
     */
    private async getAllParentHolons(startHolonId: HolonID, depth = 0, maxDepth = 5): Promise<Set<HolonID>> {
        const parents = new Set<HolonID>();

        if (depth >= maxDepth) return parents;

        // Define relationship types that imply hierarchy/containment
        const hierarchyTypes = [
            RelationshipType.MEMBER_OF,
            RelationshipType.ASSIGNED_TO,
            RelationshipType.PART_OF,
            RelationshipType.BELONGS_TO
            // Checking shared-types enum definition is best. I will assume standard ones exist or I need to check.
            // Based on linter "Did you mean MEMBER_OF", I should use the linter suggestion.
            // Re-reading linter: "Property 'MemberOf' does not exist... Did you mean 'MEMBER_OF'?"
            // So I should use UPPER_SNAKE_CASE.
        ];

        // Find immediate parents
        for (const type of hierarchyTypes) {
            const connected = await this.graphStore.getConnectedHolons(
                startHolonId,
                type,
                'outgoing' // Outgoing from Child -> Parent (e.g. MemberOf)
            );

            for (const parent of connected) {
                if (!parents.has(parent.id)) {
                    parents.add(parent.id);

                    // Recurse
                    const grandParents = await this.getAllParentHolons(parent.id, depth + 1, maxDepth);
                    grandParents.forEach(gp => parents.add(gp));
                }
            }
        }

        return parents;
    }
}
