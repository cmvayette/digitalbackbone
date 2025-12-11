/**
 * Semantic Graph Store for the Semantic Operating Model
 * Provides materialized views of holons and relationships with efficient querying
 */

import { Holon, HolonID, HolonType, Timestamp } from '@som/shared-types';
import { Relationship, RelationshipID, RelationshipType } from '@som/shared-types';
import { StateProjectionEngine, HolonState, RelationshipState } from '../state-projection';
import { RelationshipRegistry } from '../relationship-registry';

/**
 * Query filters for holons
 */
export interface HolonQueryFilters {
  status?: 'active' | 'inactive';
  properties?: Record<string, any>;
  createdAfter?: Timestamp;
  createdBefore?: Timestamp;
}

/**
 * Query filters for relationships
 */
export interface RelationshipQueryFilters {
  effectiveAt?: Timestamp;
  includeEnded?: boolean;
  authorityLevel?: 'authoritative' | 'derived' | 'inferred';
  properties?: Record<string, any>;
  sourceHolonID?: HolonID;
  targetHolonID?: HolonID;
}

/**
 * Graph pattern for pattern matching queries
 */
export interface GraphPattern {
  holonPatterns?: HolonPattern[];
  relationshipPatterns?: RelationshipPattern[];
}

export interface HolonPattern {
  type?: HolonType;
  properties?: Record<string, any>;
  alias?: string;
}

export interface RelationshipPattern {
  type?: RelationshipType;
  sourceAlias?: string;
  targetAlias?: string;
  properties?: Record<string, any>;
}

/**
 * Result of a graph pattern match
 */
export interface PatternMatch {
  holons: Map<string, Holon>;
  relationships: Relationship[];
}

/**
 * Semantic Graph Store
 * Maintains materialized views of current state for efficient querying
 */
export class GraphStore {
  private stateProjection: StateProjectionEngine;
  private relationshipRegistry?: RelationshipRegistry;
  private holonsByType: Map<HolonType, Set<HolonID>>;
  private relationshipsByType: Map<RelationshipType, Set<RelationshipID>>;
  private relationshipsBySource: Map<HolonID, Set<RelationshipID>>;
  private relationshipsByTarget: Map<HolonID, Set<RelationshipID>>;

  constructor(
    stateProjection: StateProjectionEngine,
    relationshipRegistry?: RelationshipRegistry
  ) {
    this.stateProjection = stateProjection;
    this.relationshipRegistry = relationshipRegistry;
    this.holonsByType = new Map();
    this.relationshipsByType = new Map();
    this.relationshipsBySource = new Map();
    this.relationshipsByTarget = new Map();

    // Initialize type indices
    Object.values(HolonType).forEach(type => {
      this.holonsByType.set(type, new Set());
    });

    Object.values(RelationshipType).forEach(type => {
      this.relationshipsByType.set(type, new Set());
    });

    // Build initial indices from current state
    // Note: rebuildIndices is now async and must be called explicitly or via initialize()
    // this.rebuildIndices();
  }

  async initialize(): Promise<void> {
    await this.rebuildIndices();
  }

  /**
   * Rebuild all indices from the current state projection AND registries
   * This combines event-sourced state with current registry state
   */
  async rebuildIndices(): Promise<void> {
    // Clear existing indices
    this.holonsByType.forEach(set => set.clear());
    this.relationshipsByType.forEach(set => set.clear());
    this.relationshipsBySource.clear();
    this.relationshipsByTarget.clear();

    // Index holons from state projection (event-sourced)
    // Always replay events to ensure we have the latest state before indexing
    const currentState = await this.stateProjection.replayAllEvents();
    for (const [holonId, holonState] of currentState.holons) {
      const typeSet = this.holonsByType.get(holonState.holon.type);
      if (typeSet) {
        typeSet.add(holonId);
      }
    }

    // Index relationships from state projection
    for (const [relationshipId, relationshipState] of currentState.relationships) {
      const rel = relationshipState.relationship;

      // By type
      const typeSet = this.relationshipsByType.get(rel.type);
      if (typeSet) {
        typeSet.add(relationshipId);
      }

      // By source
      if (!this.relationshipsBySource.has(rel.sourceHolonID)) {
        this.relationshipsBySource.set(rel.sourceHolonID, new Set());
      }
      this.relationshipsBySource.get(rel.sourceHolonID)!.add(relationshipId);

      // By target
      if (!this.relationshipsByTarget.has(rel.targetHolonID)) {
        this.relationshipsByTarget.set(rel.targetHolonID, new Set());
      }
      this.relationshipsByTarget.get(rel.targetHolonID)!.add(relationshipId);
    }

    // ALSO index relationships directly from registry (if available)
    if (this.relationshipRegistry) {
      for (const type of Object.values(RelationshipType)) {
        const relationships = await this.relationshipRegistry.getRelationshipsByType(type);
        const typeSet = this.relationshipsByType.get(type);
        if (typeSet) {
          relationships.forEach(rel => {
            typeSet.add(rel.id);

            // Update source/target indices
            if (!this.relationshipsBySource.has(rel.sourceHolonID)) {
              this.relationshipsBySource.set(rel.sourceHolonID, new Set());
            }
            this.relationshipsBySource.get(rel.sourceHolonID)!.add(rel.id);

            if (!this.relationshipsByTarget.has(rel.targetHolonID)) {
              this.relationshipsByTarget.set(rel.targetHolonID, new Set());
            }
            this.relationshipsByTarget.get(rel.targetHolonID)!.add(rel.id);
          });
        }
      }
    }
  }

  /**
   * Update indices when a new event is processed
   * This is more efficient than full rebuild for incremental updates
   */
  async updateFromNewEvent(): Promise<void> {
    // For now, just rebuild indices
    // In production, this would be optimized to only update affected indices
    await this.rebuildIndices();
  }

  /**
   * Query holons by type with optional filters
   * Queries from both state projection and registry
   */
  queryHolonsByType(type: HolonType, filters?: HolonQueryFilters): Holon[] {
    const holonIds = this.holonsByType.get(type) || new Set();
    const currentState = this.stateProjection.getCurrentState();
    const results: Holon[] = [];

    for (const holonId of holonIds) {
      // Try to get from state projection first
      let holon: Holon | undefined;
      const holonState = currentState.holons.get(holonId);
      if (holonState) {
        holon = holonState.holon;
      }

      if (holon && this.matchesHolonFilters(holon, filters)) {
        results.push(holon);
      }
    }

    return results;
  }

  /**
   * Get a specific holon by ID
   * Checks both state projection and registry
   */
  getHolon(holonId: HolonID): Holon | undefined {
    // Try state projection first
    const holonState = this.stateProjection.getHolonState(holonId);
    if (holonState) {
      return holonState.holon;
    }

    return undefined;
  }

  /**
   * Get all holons (for testing/debugging)
   */
  getAllHolons(): Holon[] {
    const currentState = this.stateProjection.getCurrentState();
    return Array.from(currentState.holons.values()).map(state => state.holon);
  }

  /**
   * Query relationships by type with optional filters
   * Queries from both state projection and registry
   */
  async queryRelationshipsByType(type: RelationshipType, filters?: RelationshipQueryFilters): Promise<Relationship[]> {
    const relationshipIds = this.relationshipsByType.get(type) || new Set();
    const currentState = this.stateProjection.getCurrentState();
    const results: Relationship[] = [];

    for (const relationshipId of relationshipIds) {
      // Try to get from state projection first
      let relationship: Relationship | undefined;
      const relationshipState = currentState.relationships.get(relationshipId);
      if (relationshipState) {
        relationship = relationshipState.relationship;
      } else if (this.relationshipRegistry) {
        // Fall back to registry if not in state projection
        relationship = await this.relationshipRegistry.getRelationship(relationshipId);
      }

      if (relationship && this.matchesRelationshipFilters(relationship, filters)) {
        results.push(relationship);
      }
    }

    return results;
  }

  /**
   * Get all relationships (for testing/debugging)
   */
  getAllRelationships(): Relationship[] {
    const currentState = this.stateProjection.getCurrentState();
    return Array.from(currentState.relationships.values()).map(state => state.relationship);
  }

  /**
   * Get all relationships connected to a specific holon (both incoming and outgoing).
   * This method retrieves relationships from both the state projection and the registry.
   */
  async getHolonRelationships(holonId: HolonID): Promise<Relationship[]> {
    const outgoingIds = this.relationshipsBySource.get(holonId) || new Set<RelationshipID>();
    const incomingIds = this.relationshipsByTarget.get(holonId) || new Set<RelationshipID>();
    const allRelatedIds = new Set<RelationshipID>([...outgoingIds, ...incomingIds]);

    const currentState = this.stateProjection.getCurrentState();
    const results: Relationship[] = [];

    for (const relationshipId of allRelatedIds) {
      let relationship: Relationship | undefined;
      const relationshipState = currentState.relationships.get(relationshipId);
      if (relationshipState) {
        relationship = relationshipState.relationship;
      } else if (this.relationshipRegistry) {
        relationship = await this.relationshipRegistry.getRelationship(relationshipId);
      }

      if (relationship) {
        results.push(relationship);
      }
    }
    return results;
  }

  /**
   * Traverse relationships from a holon in a specific direction
   * @param holonId - Starting holon ID
   * @param relationshipType - Optional type filter
   * @param direction - 'outgoing' (from), 'incoming' (to), or 'both'
   * @param filters - Optional relationship filters
   */
  async traverseRelationships(
    holonId: HolonID,
    relationshipType?: RelationshipType,
    direction: 'outgoing' | 'incoming' | 'both' = 'both',
    filters?: RelationshipQueryFilters
  ): Promise<Relationship[]> {
    const currentState = this.stateProjection.getCurrentState();
    const results: Relationship[] = [];

    // Get outgoing relationships
    if (direction === 'outgoing' || direction === 'both') {
      const outgoingIds = this.relationshipsBySource.get(holonId) || new Set();
      for (const relationshipId of outgoingIds) {
        // Try state projection first
        let relationship: Relationship | undefined;
        const relationshipState = currentState.relationships.get(relationshipId);
        if (relationshipState) {
          relationship = relationshipState.relationship;
        } else if (this.relationshipRegistry) {
          // Fall back to registry
          relationship = await this.relationshipRegistry.getRelationship(relationshipId);
        }

        if (relationship &&
          (!relationshipType || relationship.type === relationshipType) &&
          this.matchesRelationshipFilters(relationship, filters)) {
          results.push(relationship);
        }
      }
    }

    // Get incoming relationships
    if (direction === 'incoming' || direction === 'both') {
      const incomingIds = this.relationshipsByTarget.get(holonId) || new Set();
      for (const relationshipId of incomingIds) {
        // Try state projection first
        let relationship: Relationship | undefined;
        const relationshipState = currentState.relationships.get(relationshipId);
        if (relationshipState) {
          relationship = relationshipState.relationship;
        } else if (this.relationshipRegistry) {
          // Fall back to registry
          relationship = await this.relationshipRegistry.getRelationship(relationshipId);
        }

        if (relationship &&
          (!relationshipType || relationship.type === relationshipType) &&
          this.matchesRelationshipFilters(relationship, filters)) {
          results.push(relationship);
        }
      }
    }

    return results;
  }

  /**
   * Get connected holons from a starting holon
   * @param holonId - Starting holon ID
   * @param relationshipType - Optional type filter
   * @param direction - 'outgoing' (targets), 'incoming' (sources), or 'both'
   * @param filters - Optional relationship filters
   */
  async getConnectedHolons(
    holonId: HolonID,
    relationshipType?: RelationshipType,
    direction: 'outgoing' | 'incoming' | 'both' = 'both',
    filters?: RelationshipQueryFilters
  ): Promise<Holon[]> {
    const relationships = await this.traverseRelationships(holonId, relationshipType, direction, filters);
    const currentState = this.stateProjection.getCurrentState();
    const connectedHolonIds = new Set<HolonID>();

    for (const rel of relationships) {
      if (direction === 'outgoing' || direction === 'both') {
        if (rel.sourceHolonID === holonId) {
          connectedHolonIds.add(rel.targetHolonID);
        }
      }
      if (direction === 'incoming' || direction === 'both') {
        if (rel.targetHolonID === holonId) {
          connectedHolonIds.add(rel.sourceHolonID);
        }
      }
    }

    const results: Holon[] = [];
    for (const connectedId of connectedHolonIds) {
      const holonState = currentState.holons.get(connectedId);
      if (holonState) {
        results.push(holonState.holon);
      }
    }

    return results;
  }

  /**
   * Match graph patterns to find subgraphs
   * This is a simplified pattern matching implementation
   */
  async matchPattern(pattern: GraphPattern): Promise<PatternMatch[]> {
    const results: PatternMatch[] = [];
    const currentState = this.stateProjection.getCurrentState();

    // If no patterns specified, return empty results
    if (!pattern.holonPatterns || pattern.holonPatterns.length === 0) {
      return results;
    }

    // Start with the first holon pattern
    const firstPattern = pattern.holonPatterns[0];
    const candidateHolons = this.findMatchingHolons(firstPattern);

    // For each candidate, try to match the full pattern
    for (const holon of candidateHolons) {
      const match = await this.tryMatchPattern(holon, firstPattern.alias || '0', pattern, currentState);
      if (match) {
        results.push(match);
      }
    }

    return results;
  }

  /**
   * Find holons matching a pattern
   */
  private findMatchingHolons(pattern: HolonPattern): Holon[] {
    let candidates: Holon[];

    if (pattern.type !== undefined) {
      candidates = this.queryHolonsByType(pattern.type);
    } else {
      candidates = this.getAllHolons();
    }

    // Filter by properties if specified
    if (pattern.properties) {
      candidates = candidates.filter(holon =>
        this.propertiesMatch(holon.properties, pattern.properties!)
      );
    }

    return candidates;
  }

  /**
   * Try to match a full pattern starting from a holon
   */
  private async tryMatchPattern(
    startHolon: Holon,
    startAlias: string,
    pattern: GraphPattern,
    currentState: any
  ): Promise<PatternMatch | null> {
    const matchedHolons = new Map<string, Holon>();
    const matchedRelationships: Relationship[] = [];

    matchedHolons.set(startAlias, startHolon);

    // If there are relationship patterns, try to match them
    if (pattern.relationshipPatterns && pattern.relationshipPatterns.length > 0) {
      for (const relPattern of pattern.relationshipPatterns) {
        // Find relationships matching this pattern
        const sourceAlias = relPattern.sourceAlias || startAlias;
        const sourceHolon = matchedHolons.get(sourceAlias);

        if (!sourceHolon) {
          continue; // Can't match this relationship pattern yet
        }

        // Get relationships from this holon
        const relationships = await this.traverseRelationships(
          sourceHolon.id,
          relPattern.type,
          'outgoing'
        );

        // Filter by properties if specified
        const matchingRels = relationships.filter(rel =>
          !relPattern.properties || this.propertiesMatch(rel.properties, relPattern.properties)
        );

        if (matchingRels.length === 0) {
          return null; // Pattern doesn't match
        }

        // Take the first matching relationship
        const matchedRel = matchingRels[0];
        matchedRelationships.push(matchedRel);

        // Add target holon if it has an alias
        if (relPattern.targetAlias) {
          const targetHolonState = currentState.holons.get(matchedRel.targetHolonID);
          if (targetHolonState) {
            matchedHolons.set(relPattern.targetAlias, targetHolonState.holon);
          }
        }
      }
    }

    return {
      holons: matchedHolons,
      relationships: matchedRelationships,
    };
  }

  /**
   * Check if holon matches filters
   */
  private matchesHolonFilters(holon: Holon, filters?: HolonQueryFilters): boolean {
    if (!filters) {
      return true;
    }

    if (filters.status && holon.status !== filters.status) {
      return false;
    }

    if (filters.createdAfter && holon.createdAt < filters.createdAfter) {
      return false;
    }

    if (filters.createdBefore && holon.createdAt > filters.createdBefore) {
      return false;
    }

    if (filters.properties && !this.propertiesMatch(holon.properties, filters.properties)) {
      return false;
    }

    return true;
  }

  /**
   * Check if relationship matches filters
   */
  private matchesRelationshipFilters(relationship: Relationship, filters?: RelationshipQueryFilters): boolean {
    if (!filters) {
      return true;
    }

    // Check if relationship is effective at a specific time
    if (filters.effectiveAt) {
      const isEffective =
        relationship.effectiveStart <= filters.effectiveAt &&
        (!relationship.effectiveEnd || relationship.effectiveEnd >= filters.effectiveAt);

      if (!isEffective) {
        return false;
      }
    }

    // Check if ended relationships should be included
    if (!filters.includeEnded && relationship.effectiveEnd) {
      return false;
    }

    // Check authority level
    if (filters.authorityLevel && relationship.authorityLevel !== filters.authorityLevel) {
      return false;
    }

    // Check properties
    if (filters.properties && !this.propertiesMatch(relationship.properties, filters.properties)) {
      return false;
    }

    // Check source holon
    if (filters.sourceHolonID && relationship.sourceHolonID !== filters.sourceHolonID) {
      return false;
    }

    // Check target holon
    if (filters.targetHolonID && relationship.targetHolonID !== filters.targetHolonID) {
      return false;
    }

    return true;
  }

  /**
   * Check if actual properties match expected properties
   */
  private propertiesMatch(actual: Record<string, any>, expected: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(expected)) {
      if (actual[key] !== value) {
        return false;
      }
    }
    return true;
  }
}

/**
 * Create a new graph store instance
 */
export function createGraphStore(stateProjection: StateProjectionEngine): GraphStore {
  return new GraphStore(stateProjection);
}
