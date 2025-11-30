/**
 * Relationship Registry module for the Semantic Operating Model
 * Manages relationship creation, storage, and retrieval with temporal support
 */

import { randomUUID } from 'crypto';
import { Relationship, RelationshipID, RelationshipType } from '../core/types/relationship';
import { HolonID, DocumentID, EventID, Timestamp } from '../core/types/holon';
import { Event, EventType } from '../core/types/event';
import { ConstraintEngine, ValidationResult } from '../constraint-engine';
import { EventStore } from '../event-store';

/**
 * Parameters for creating a new relationship
 */
export interface CreateRelationshipParams {
  type: RelationshipType;
  sourceHolonID: HolonID;
  targetHolonID: HolonID;
  properties: Record<string, any>;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceSystem: string;
  sourceDocuments: DocumentID[];
  authorityLevel?: 'authoritative' | 'derived' | 'inferred';
  confidenceScore?: number;
  actor: HolonID;
}

/**
 * Parameters for ending a relationship
 */
export interface EndRelationshipParams {
  relationshipID: RelationshipID;
  endDate: Timestamp;
  reason: string;
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Query filters for relationships
 */
export interface RelationshipQueryFilters {
  effectiveAt?: Timestamp;
  includeEnded?: boolean;
  authorityLevel?: 'authoritative' | 'derived' | 'inferred';
}

/**
 * RelationshipRegistry manages the lifecycle and storage of all relationships
 */
export class RelationshipRegistry {
  private relationships: Map<RelationshipID, Relationship>;
  private relationshipsBySource: Map<HolonID, Set<RelationshipID>>;
  private relationshipsByTarget: Map<HolonID, Set<RelationshipID>>;
  private relationshipsByType: Map<RelationshipType, Set<RelationshipID>>;
  private constraintEngine: ConstraintEngine;
  private eventStore: EventStore;

  constructor(constraintEngine: ConstraintEngine, eventStore: EventStore) {
    this.relationships = new Map();
    this.relationshipsBySource = new Map();
    this.relationshipsByTarget = new Map();
    this.relationshipsByType = new Map();
    this.constraintEngine = constraintEngine;
    this.eventStore = eventStore;

    // Initialize type index for all relationship types
    Object.values(RelationshipType).forEach(type => {
      this.relationshipsByType.set(type, new Set());
    });
  }

  /**
   * Generate a unique UUID-based relationship ID
   */
  private generateRelationshipID(): RelationshipID {
    return randomUUID();
  }

  /**
   * Create a new relationship with constraint validation
   * @param params - Relationship creation parameters
   * @returns The created relationship with assigned ID, or validation errors
   */
  createRelationship(params: CreateRelationshipParams): { relationship?: Relationship; validation: ValidationResult } {
    const id = this.generateRelationshipID();

    // Create the relationship object
    const relationship: Relationship = {
      id,
      type: params.type,
      sourceHolonID: params.sourceHolonID,
      targetHolonID: params.targetHolonID,
      properties: params.properties,
      effectiveStart: params.effectiveStart,
      effectiveEnd: params.effectiveEnd,
      sourceSystem: params.sourceSystem,
      sourceDocuments: params.sourceDocuments,
      createdBy: '', // Will be set after event creation
      authorityLevel: params.authorityLevel || 'authoritative',
      confidenceScore: params.confidenceScore,
    };

    // Validate against constraints
    const validation = this.constraintEngine.validateRelationship(relationship, {
      timestamp: params.effectiveStart,
    });

    if (!validation.valid) {
      return { validation };
    }

    // Generate event for relationship creation
    const eventId = this.generateRelationshipCreationEvent(relationship, params.actor);
    relationship.createdBy = eventId;

    // Store relationship
    this.relationships.set(id, relationship);

    // Update indices
    this.updateIndices(relationship);

    return { relationship, validation };
  }

  /**
   * Get a relationship by its ID
   */
  getRelationship(relationshipID: RelationshipID): Relationship | undefined {
    return this.relationships.get(relationshipID);
  }

  /**
   * Get all relationships from a specific holon
   */
  getRelationshipsFrom(
    holonID: HolonID,
    relationshipType?: RelationshipType,
    filters?: RelationshipQueryFilters
  ): Relationship[] {
    const relationshipIds = this.relationshipsBySource.get(holonID) || new Set();
    let relationships: Relationship[] = [];

    for (const id of relationshipIds) {
      const rel = this.relationships.get(id);
      if (rel && this.matchesFilters(rel, relationshipType, filters)) {
        relationships.push(rel);
      }
    }

    return relationships;
  }

  /**
   * Get all relationships to a specific holon
   */
  getRelationshipsTo(
    holonID: HolonID,
    relationshipType?: RelationshipType,
    filters?: RelationshipQueryFilters
  ): Relationship[] {
    const relationshipIds = this.relationshipsByTarget.get(holonID) || new Set();
    let relationships: Relationship[] = [];

    for (const id of relationshipIds) {
      const rel = this.relationships.get(id);
      if (rel && this.matchesFilters(rel, relationshipType, filters)) {
        relationships.push(rel);
      }
    }

    return relationships;
  }

  /**
   * Get all relationships of a specific type
   */
  getRelationshipsByType(
    type: RelationshipType,
    filters?: RelationshipQueryFilters
  ): Relationship[] {
    const relationshipIds = this.relationshipsByType.get(type) || new Set();
    let relationships: Relationship[] = [];

    for (const id of relationshipIds) {
      const rel = this.relationships.get(id);
      if (rel && this.matchesFilters(rel, type, filters)) {
        relationships.push(rel);
      }
    }

    return relationships;
  }

  /**
   * End a relationship by setting its end date
   */
  endRelationship(params: EndRelationshipParams): { success: boolean; validation: ValidationResult; event?: EventID } {
    const relationship = this.relationships.get(params.relationshipID);
    
    if (!relationship) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Relationship not found',
            violatedRule: 'existence',
            affectedHolons: [],
          }],
        },
      };
    }

    // Check if relationship is already ended
    if (relationship.effectiveEnd) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Relationship is already ended',
            violatedRule: 'temporal',
            affectedHolons: [relationship.sourceHolonID, relationship.targetHolonID],
          }],
        },
      };
    }

    // Validate end date is after start date
    if (params.endDate < relationship.effectiveStart) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'End date must be after start date',
            violatedRule: 'temporal',
            affectedHolons: [relationship.sourceHolonID, relationship.targetHolonID],
          }],
        },
      };
    }

    // Update relationship
    relationship.effectiveEnd = params.endDate;
    this.relationships.set(params.relationshipID, relationship);

    // Generate event for relationship modification
    const eventId = this.generateRelationshipModificationEvent(
      relationship,
      params.actor,
      params.reason,
      params.sourceSystem
    );

    return {
      success: true,
      validation: { valid: true },
      event: eventId,
    };
  }

  /**
   * Get all relationships (for testing/debugging)
   */
  getAllRelationships(): Relationship[] {
    return Array.from(this.relationships.values());
  }

  /**
   * Clear all relationships from the registry (for testing purposes)
   */
  clear(): void {
    this.relationships.clear();
    this.relationshipsBySource.clear();
    this.relationshipsByTarget.clear();
    this.relationshipsByType.forEach(set => set.clear());
  }

  /**
   * Update indices for a relationship
   */
  private updateIndices(relationship: Relationship): void {
    // Update source index
    if (!this.relationshipsBySource.has(relationship.sourceHolonID)) {
      this.relationshipsBySource.set(relationship.sourceHolonID, new Set());
    }
    this.relationshipsBySource.get(relationship.sourceHolonID)!.add(relationship.id);

    // Update target index
    if (!this.relationshipsByTarget.has(relationship.targetHolonID)) {
      this.relationshipsByTarget.set(relationship.targetHolonID, new Set());
    }
    this.relationshipsByTarget.get(relationship.targetHolonID)!.add(relationship.id);

    // Update type index
    const typeSet = this.relationshipsByType.get(relationship.type);
    if (typeSet) {
      typeSet.add(relationship.id);
    }
  }

  /**
   * Check if a relationship matches the provided filters
   */
  private matchesFilters(
    relationship: Relationship,
    relationshipType?: RelationshipType,
    filters?: RelationshipQueryFilters
  ): boolean {
    // Check type match
    if (relationshipType && relationship.type !== relationshipType) {
      return false;
    }

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

    return true;
  }

  /**
   * Generate an event for relationship creation
   */
  private generateRelationshipCreationEvent(relationship: Relationship, actor: HolonID): EventID {
    const event: Omit<Event, 'id' | 'recordedAt'> = {
      type: EventType.AssignmentStarted, // Using AssignmentStarted as a generic relationship creation event
      occurredAt: relationship.effectiveStart,
      actor,
      subjects: [relationship.sourceHolonID, relationship.targetHolonID],
      payload: {
        relationshipId: relationship.id,
        relationshipType: relationship.type,
        properties: relationship.properties,
      },
      sourceSystem: relationship.sourceSystem,
      sourceDocument: relationship.sourceDocuments[0],
      causalLinks: {},
    };

    return this.eventStore.submitEvent(event);
  }

  /**
   * Generate an event for relationship modification
   */
  private generateRelationshipModificationEvent(
    relationship: Relationship,
    actor: HolonID,
    reason: string,
    sourceSystem: string
  ): EventID {
    const event: Omit<Event, 'id' | 'recordedAt'> = {
      type: EventType.AssignmentEnded, // Using AssignmentEnded as a generic relationship end event
      occurredAt: relationship.effectiveEnd!,
      actor,
      subjects: [relationship.sourceHolonID, relationship.targetHolonID],
      payload: {
        relationshipId: relationship.id,
        relationshipType: relationship.type,
        reason,
        endDate: relationship.effectiveEnd,
      },
      sourceSystem,
      sourceDocument: relationship.sourceDocuments[0],
      causalLinks: {
        precededBy: [relationship.createdBy],
      },
    };

    return this.eventStore.submitEvent(event);
  }
}

