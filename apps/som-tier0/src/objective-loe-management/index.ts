/**
 * Objective and LOE Management module for the Semantic Operating Model
 * Manages Objective and LOE holon creation, relationships, and validation
 */

import { IHolonRepository as HolonRegistry } from '../core/interfaces/holon-repository';
import { RelationshipRegistry } from '../relationship-registry';
import { IEventStore as EventStore } from '../event-store';
import { ConstraintEngine, ValidationResult } from '../constraint-engine';
import { Objective, LOE, HolonType, HolonID, DocumentID, EventID, Timestamp } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';
import { EventType } from '@som/shared-types';

/**
 * Parameters for creating an Objective holon
 */
export interface CreateObjectiveParams {
  description: string;
  level: 'strategic' | 'operational' | 'tactical';
  timeHorizon: Date;
  status: 'proposed' | 'approved' | 'active' | 'achieved' | 'abandoned' | 'revised';
  measureIDs: HolonID[]; // At least one measure required
  ownerID: HolonID; // At least one owner required
  loeID: HolonID; // At least one LOE link required
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating an LOE holon
 */
export interface CreateLOEParams {
  name: string;
  description: string;
  sponsoringEchelon: string;
  timeframe: { start: Date; end: Date };
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating an Objective GROUPED_UNDER LOE relationship
 */
export interface GroupObjectiveUnderLOEParams {
  objectiveID: HolonID;
  loeID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating objective decomposition through DEPENDS_ON relationships
 */
export interface CreateObjectiveDependencyParams {
  sourceObjectiveID: HolonID;
  targetObjectiveID: HolonID;
  dependencyType: string;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Result of an Objective/LOE operation
 */
export interface ObjectiveLOEOperationResult {
  success: boolean;
  holonID?: HolonID;
  relationshipID?: string;
  validation: ValidationResult;
  eventID?: EventID;
}

/**
 * ObjectiveLOEManager handles Objective and LOE holon lifecycle and relationships
 */
export class ObjectiveLOEManager {
  private holonRegistry: HolonRegistry;
  private relationshipRegistry: RelationshipRegistry;
  private eventStore: EventStore;
  private constraintEngine: ConstraintEngine;

  constructor(
    holonRegistry: HolonRegistry,
    relationshipRegistry: RelationshipRegistry,
    eventStore: EventStore,
    constraintEngine: ConstraintEngine
  ) {
    this.holonRegistry = holonRegistry;
    this.relationshipRegistry = relationshipRegistry;
    this.eventStore = eventStore;
    this.constraintEngine = constraintEngine;
  }

  /**
   * Create a new Objective holon with validation for required measure, owner, and LOE link
   * Validates Requirements 9.4: WHEN an objective is created THEN the SOM SHALL require 
   * at least one measure, one owner, and one LOE link
   */
  async createObjective(params: CreateObjectiveParams): Promise<ObjectiveLOEOperationResult> {
    // Validate required fields per Requirements 9.4
    const validationErrors: any[] = [];

    if (!params.measureIDs || params.measureIDs.length === 0) {
      validationErrors.push({
        constraintID: 'objective-measure-requirement',
        message: 'Objective must have at least one measure',
        violatedRule: 'objective_measure_requirement',
        affectedHolons: [],
      });
    }

    if (!params.ownerID) {
      validationErrors.push({
        constraintID: 'objective-owner-requirement',
        message: 'Objective must have at least one owner',
        violatedRule: 'objective_owner_requirement',
        affectedHolons: [],
      });
    }

    if (!params.loeID) {
      validationErrors.push({
        constraintID: 'objective-loe-requirement',
        message: 'Objective must have at least one LOE link',
        violatedRule: 'objective_loe_requirement',
        affectedHolons: [],
      });
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: validationErrors,
        },
      };
    }

    // Verify that the owner exists
    const owner = await this.holonRegistry.getHolon(params.ownerID);
    if (!owner) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Owner holon not found',
            violatedRule: 'existence',
            affectedHolons: [params.ownerID],
          }],
        },
      };
    }

    // Verify that the LOE exists
    const loe = await this.holonRegistry.getHolon(params.loeID);
    if (!loe) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'LOE holon not found',
            violatedRule: 'existence',
            affectedHolons: [params.loeID],
          }],
        },
      };
    }

    // Verify that all measures exist
    for (const measureID of params.measureIDs) {
      const measure = await this.holonRegistry.getHolon(measureID);
      if (!measure) {
        return {
          success: false,
          validation: {
            valid: false,
            errors: [{
              constraintID: 'system',
              message: `Measure holon not found: ${measureID}`,
              violatedRule: 'existence',
              affectedHolons: [measureID],
            }],
          },
        };
      }
    }

    // Create event for objective creation
    const eventId = this.eventStore.submitEvent({
      type: EventType.ObjectiveCreated,
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [],
      payload: {
        action: 'create_objective',
        description: params.description,
        level: params.level,
        measureIDs: params.measureIDs,
        ownerID: params.ownerID,
        loeID: params.loeID,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create Objective holon
    const objective = await this.holonRegistry.createHolon({
      type: HolonType.Objective,
      properties: {
        description: params.description,
        level: params.level,
        timeHorizon: params.timeHorizon,
        status: params.status,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate the created objective
    const validation = this.constraintEngine.validateHolon(objective);

    if (!validation.valid) {
      // Rollback: mark objective as inactive
      await this.holonRegistry.markHolonInactive(objective.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    // Create OWNED_BY relationship with owner
    const ownerRelResult = await this.relationshipRegistry.createRelationship({
      type: RelationshipType.OWNED_BY,
      sourceHolonID: objective.id,
      targetHolonID: params.ownerID,
      properties: {},
      effectiveStart: new Date(),
      sourceSystem: params.sourceSystem,
      sourceDocuments: params.sourceDocuments,
      actor: params.actor,
    });

    if (!ownerRelResult.relationship) {
      // Rollback: mark objective as inactive
      await this.holonRegistry.markHolonInactive(objective.id, 'Failed to create owner relationship');
      return {
        success: false,
        validation: ownerRelResult.validation,
      };
    }

    // Create GROUPED_UNDER relationship with LOE
    const loeRelResult = await this.relationshipRegistry.createRelationship({
      type: RelationshipType.GROUPED_UNDER,
      sourceHolonID: objective.id,
      targetHolonID: params.loeID,
      properties: {},
      effectiveStart: new Date(),
      sourceSystem: params.sourceSystem,
      sourceDocuments: params.sourceDocuments,
      actor: params.actor,
    });

    if (!loeRelResult.relationship) {
      // Rollback: mark objective as inactive
      await this.holonRegistry.markHolonInactive(objective.id, 'Failed to create LOE relationship');
      return {
        success: false,
        validation: loeRelResult.validation,
      };
    }

    // Create MEASURED_BY relationships with all measures
    for (const measureID of params.measureIDs) {
      const measureRelResult = await this.relationshipRegistry.createRelationship({
        type: RelationshipType.MEASURED_BY,
        sourceHolonID: objective.id,
        targetHolonID: measureID,
        properties: {},
        effectiveStart: new Date(),
        sourceSystem: params.sourceSystem,
        sourceDocuments: params.sourceDocuments,
        actor: params.actor,
      });

      if (!measureRelResult.relationship) {
        // Rollback: mark objective as inactive
        await this.holonRegistry.markHolonInactive(objective.id, 'Failed to create measure relationship');
        return {
          success: false,
          validation: measureRelResult.validation,
        };
      }
    }

    return {
      success: true,
      holonID: objective.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Create a new LOE holon with required fields
   */
  async createLOE(params: CreateLOEParams): Promise<ObjectiveLOEOperationResult> {
    // Create event for LOE creation
    const eventId = this.eventStore.submitEvent({
      type: EventType.LOECreated,
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [],
      payload: {
        action: 'create_loe',
        name: params.name,
        description: params.description,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create LOE holon
    const loe = await this.holonRegistry.createHolon({
      type: HolonType.LOE,
      properties: {
        name: params.name,
        description: params.description,
        sponsoringEchelon: params.sponsoringEchelon,
        timeframe: params.timeframe,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate the created LOE
    const validation = this.constraintEngine.validateHolon(loe);

    if (!validation.valid) {
      // Rollback: mark LOE as inactive
      await this.holonRegistry.markHolonInactive(loe.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    return {
      success: true,
      holonID: loe.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Create an Objective GROUPED_UNDER LOE relationship
   */
  async groupObjectiveUnderLOE(params: GroupObjectiveUnderLOEParams): Promise<ObjectiveLOEOperationResult> {
    // Get objective and LOE holons
    const objective = await this.holonRegistry.getHolon(params.objectiveID);
    const loe = await this.holonRegistry.getHolon(params.loeID);

    if (!objective) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Objective not found',
            violatedRule: 'existence',
            affectedHolons: [params.objectiveID],
          }],
        },
      };
    }

    if (!loe) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'LOE not found',
            violatedRule: 'existence',
            affectedHolons: [params.loeID],
          }],
        },
      };
    }

    // Create the GROUPED_UNDER relationship
    const result = await this.relationshipRegistry.createRelationship({
      type: RelationshipType.GROUPED_UNDER,
      sourceHolonID: params.objectiveID,
      targetHolonID: params.loeID,
      properties: {},
      effectiveStart: params.effectiveStart,
      effectiveEnd: params.effectiveEnd,
      sourceSystem: params.sourceSystem,
      sourceDocuments: params.sourceDocuments,
      actor: params.actor,
    });

    if (!result.relationship) {
      return {
        success: false,
        validation: result.validation,
      };
    }

    return {
      success: true,
      relationshipID: result.relationship.id,
      validation: result.validation,
      eventID: result.relationship.createdBy,
    };
  }

  /**
   * Create objective decomposition through DEPENDS_ON relationships
   * Validates that no cycles are created
   */
  async createObjectiveDependency(params: CreateObjectiveDependencyParams): Promise<ObjectiveLOEOperationResult> {
    // Get source and target objectives
    const sourceObjective = await this.holonRegistry.getHolon(params.sourceObjectiveID);
    const targetObjective = await this.holonRegistry.getHolon(params.targetObjectiveID);

    if (!sourceObjective) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Source objective not found',
            violatedRule: 'existence',
            affectedHolons: [params.sourceObjectiveID],
          }],
        },
      };
    }

    if (!targetObjective) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Target objective not found',
            violatedRule: 'existence',
            affectedHolons: [params.targetObjectiveID],
          }],
        },
      };
    }

    // Check for cycles before creating the relationship
    const cycleCheck = await this.checkForCycles(params.sourceObjectiveID, params.targetObjectiveID);
    if (!cycleCheck.valid) {
      return {
        success: false,
        validation: cycleCheck,
      };
    }

    // Create the DEPENDS_ON relationship
    const result = await this.relationshipRegistry.createRelationship({
      type: RelationshipType.DEPENDS_ON,
      sourceHolonID: params.sourceObjectiveID,
      targetHolonID: params.targetObjectiveID,
      properties: {
        dependencyType: params.dependencyType,
      },
      effectiveStart: params.effectiveStart,
      effectiveEnd: params.effectiveEnd,
      sourceSystem: params.sourceSystem,
      sourceDocuments: params.sourceDocuments,
      actor: params.actor,
    });

    if (!result.relationship) {
      return {
        success: false,
        validation: result.validation,
      };
    }

    return {
      success: true,
      relationshipID: result.relationship.id,
      validation: result.validation,
      eventID: result.relationship.createdBy,
    };
  }

  /**
   * Get all objectives grouped under a specific LOE
   */
  async getObjectivesUnderLOE(loeID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsTo(
      loeID,
      RelationshipType.GROUPED_UNDER,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Get the LOE that an objective is grouped under
   */
  async getObjectiveLOE(objectiveID: HolonID, effectiveAt?: Timestamp): Promise<HolonID | null> {
    const relationships = await this.relationshipRegistry.getRelationshipsFrom(
      objectiveID,
      RelationshipType.GROUPED_UNDER,
      { effectiveAt, includeEnded: false }
    );

    return relationships.length > 0 ? relationships[0].targetHolonID : null;
  }

  /**
   * Get all objectives that a specific objective depends on
   */
  async getObjectiveDependencies(objectiveID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsFrom(
      objectiveID,
      RelationshipType.DEPENDS_ON,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Get all objectives that depend on a specific objective
   */
  async getObjectiveDependents(objectiveID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsTo(
      objectiveID,
      RelationshipType.DEPENDS_ON,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Get all measures for an objective
   */
  async getObjectiveMeasures(objectiveID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsFrom(
      objectiveID,
      RelationshipType.MEASURED_BY,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Get the owner of an objective
   */
  async getObjectiveOwner(objectiveID: HolonID, effectiveAt?: Timestamp): Promise<HolonID | null> {
    const relationships = await this.relationshipRegistry.getRelationshipsFrom(
      objectiveID,
      RelationshipType.OWNED_BY,
      { effectiveAt, includeEnded: false }
    );

    return relationships.length > 0 ? relationships[0].targetHolonID : null;
  }

  /**
   * Check for cycles in objective dependencies
   * Uses depth-first search to detect cycles
   */
  private async checkForCycles(sourceID: HolonID, targetID: HolonID): Promise<ValidationResult> {
    // If source depends on target, and target already depends on source (directly or indirectly),
    // we have a cycle
    const visited = new Set<HolonID>();
    const stack = [targetID];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (current === sourceID) {
        // Found a cycle
        return {
          valid: false,
          errors: [{
            constraintID: 'objective-dependency-cycle',
            message: 'Creating this dependency would create a cycle',
            violatedRule: 'dependency_acyclic',
            affectedHolons: [sourceID, targetID],
          }],
        };
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      // Get all objectives that current depends on
      const dependencies = await this.getObjectiveDependencies(current);
      stack.push(...dependencies);
    }

    return { valid: true };
  }
}
