
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
    /**
     * Find all transitive parents of a holon (e.g. Holon -> Team -> Dept -> Unit)
     * Limit recursion depth to avoid infinite loops
     */
    private async getAllParentHolons(startHolonId: HolonID, depth = 0, maxDepth = 5, visited = new Set<HolonID>()): Promise<Set<HolonID>> {
        const parents = new Set<HolonID>();

        if (depth >= maxDepth) return parents;
        if (visited.has(startHolonId)) return parents;

        visited.add(startHolonId);

        // Define relationship types that imply hierarchy/containment
        const hierarchyTypes = [
            RelationshipType.MEMBER_OF,
            RelationshipType.ASSIGNED_TO,
            RelationshipType.PART_OF,
            RelationshipType.BELONGS_TO
        ];

        // 1. Fetch all connection types in parallel
        const connectionPromises = hierarchyTypes.map(type =>
            this.graphStore.getConnectedHolons(
                startHolonId,
                type,
                'outgoing' // Outgoing from Child -> Parent (e.g. MemberOf)
            )
        );

        const connectionResults = await Promise.all(connectionPromises);
        const immediateParents = connectionResults.flat();

        // 2. Identify new parents to recurse on
        const recursionPromises: Promise<Set<HolonID>>[] = [];

        for (const parent of immediateParents) {
            // Avoid adding self or already processing (though visited check handles recursion)
            if (!parents.has(parent.id)) { // Add to result set
                parents.add(parent.id);
                // Recurse in parallel
                recursionPromises.push(this.getAllParentHolons(parent.id, depth + 1, maxDepth, visited));
            }
        }

        const ancestorSets = await Promise.all(recursionPromises);

        // Merge results
        for (const set of ancestorSets) {
            for (const id of set) {
                parents.add(id);
            }
        }

        return parents;
    }
}
