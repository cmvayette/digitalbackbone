/**
 * Qualification Management module for the Semantic Operating Model
 * Manages Qualification holon creation, relationships, expiration, and prerequisites
 */

import { HolonRegistry } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { EventStore } from '../event-store';
import { ConstraintEngine, ValidationResult } from '../constraint-engine';
import { Qualification, HolonType, HolonID, DocumentID, EventID, Timestamp } from '../core/types/holon';
import { RelationshipType } from '../core/types/relationship';
import { EventType } from '../core/types/event';

/**
 * Parameters for creating a Qualification holon
 */
export interface CreateQualificationParams {
  nec?: string;
  pqsID?: string;
  courseCode?: string;
  certificationID?: string;
  name: string;
  type: string;
  validityPeriod: number; // Duration in milliseconds
  renewalRules: string;
  issuingAuthority: string;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating a Qualification HELD_BY Person relationship
 */
export interface AssignQualificationToPersonParams {
  qualificationID: HolonID;
  personID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating a Qualification REQUIRED_FOR Position relationship
 */
export interface SetQualificationRequirementParams {
  qualificationID: HolonID;
  positionID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for handling qualification expiration
 */
export interface ExpireQualificationParams {
  qualificationID: HolonID;
  personID: HolonID;
  expirationDate: Timestamp;
  reason?: string;
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating a prerequisite relationship between qualifications
 */
export interface SetQualificationPrerequisiteParams {
  qualificationID: HolonID;
  prerequisiteQualificationID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Result of a Qualification operation
 */
export interface QualificationOperationResult {
  success: boolean;
  holonID?: HolonID;
  relationshipID?: string;
  validation: ValidationResult;
  eventID?: EventID;
}

/**
 * QualificationManager handles Qualification holon lifecycle and relationships
 */
export class QualificationManager {
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
   * Create a new Qualification holon with required fields
   */
  createQualification(params: CreateQualificationParams): QualificationOperationResult {
    // Validate that at least one identifier is present (Requirement 8.1)
    const hasIdentifier = 
      params.nec !== undefined ||
      params.pqsID !== undefined ||
      params.courseCode !== undefined ||
      params.certificationID !== undefined;
    
    if (!hasIdentifier) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'qualification-identifier-required',
            message: 'At least one identifier (NEC, PQS ID, course code, or certification ID) must be provided',
            violatedRule: 'Qualification must have at least one identifier',
            affectedHolons: [],
          }],
        },
      };
    }

    // Create event for qualification creation
    const eventId = this.eventStore.submitEvent({
      type: EventType.QualificationAwarded, // Using as generic creation event
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [],
      payload: {
        action: 'create_qualification',
        name: params.name,
        type: params.type,
        nec: params.nec,
        pqsID: params.pqsID,
        courseCode: params.courseCode,
        certificationID: params.certificationID,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create Qualification holon
    const qualification = this.holonRegistry.createHolon({
      type: HolonType.Qualification,
      properties: {
        nec: params.nec,
        pqsID: params.pqsID,
        courseCode: params.courseCode,
        certificationID: params.certificationID,
        name: params.name,
        type: params.type,
        validityPeriod: params.validityPeriod,
        renewalRules: params.renewalRules,
        issuingAuthority: params.issuingAuthority,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate the created qualification
    const validation = this.constraintEngine.validateHolon(qualification);

    if (!validation.valid) {
      // Rollback: mark qualification as inactive
      this.holonRegistry.markHolonInactive(qualification.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    return {
      success: true,
      holonID: qualification.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Assign a Qualification to a Person (Qualification HELD_BY Person)
   */
  assignQualificationToPerson(params: AssignQualificationToPersonParams): QualificationOperationResult {
    // Get qualification and person holons
    const qualification = this.holonRegistry.getHolon(params.qualificationID);
    const person = this.holonRegistry.getHolon(params.personID);

    if (!qualification) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Qualification not found',
            violatedRule: 'existence',
            affectedHolons: [params.qualificationID],
          }],
        },
      };
    }

    if (!person) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Person not found',
            violatedRule: 'existence',
            affectedHolons: [params.personID],
          }],
        },
      };
    }

    // Create the HELD_BY relationship
    const result = this.relationshipRegistry.createRelationship({
      type: RelationshipType.HELD_BY,
      sourceHolonID: params.qualificationID,
      targetHolonID: params.personID,
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

    // Generate qualification awarded event
    const eventId = this.eventStore.submitEvent({
      type: EventType.QualificationAwarded,
      occurredAt: params.effectiveStart,
      actor: params.actor,
      subjects: [params.personID, params.qualificationID],
      payload: {
        relationshipId: result.relationship.id,
        qualificationId: params.qualificationID,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    return {
      success: true,
      relationshipID: result.relationship.id,
      validation: result.validation,
      eventID: eventId,
    };
  }

  /**
   * Set a Qualification as required for a Position (Qualification REQUIRED_FOR Position)
   */
  setQualificationRequirement(params: SetQualificationRequirementParams): QualificationOperationResult {
    // Get qualification and position holons
    const qualification = this.holonRegistry.getHolon(params.qualificationID);
    const position = this.holonRegistry.getHolon(params.positionID);

    if (!qualification) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Qualification not found',
            violatedRule: 'existence',
            affectedHolons: [params.qualificationID],
          }],
        },
      };
    }

    if (!position) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Position not found',
            violatedRule: 'existence',
            affectedHolons: [params.positionID],
          }],
        },
      };
    }

    // Create the REQUIRED_FOR relationship
    const result = this.relationshipRegistry.createRelationship({
      type: RelationshipType.REQUIRED_FOR,
      sourceHolonID: params.qualificationID,
      targetHolonID: params.positionID,
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
   * Handle qualification expiration by ending the HELD_BY relationship and recording an event
   */
  expireQualification(params: ExpireQualificationParams): QualificationOperationResult {
    // Find the HELD_BY relationship
    const relationships = this.relationshipRegistry.getRelationshipsFrom(
      params.qualificationID,
      RelationshipType.HELD_BY,
      { includeEnded: false }
    );

    const relationship = relationships.find(r => r.targetHolonID === params.personID);

    if (!relationship) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Qualification relationship not found',
            violatedRule: 'existence',
            affectedHolons: [params.qualificationID, params.personID],
          }],
        },
      };
    }

    // End the relationship
    const result = this.relationshipRegistry.endRelationship({
      relationshipID: relationship.id,
      endDate: params.expirationDate,
      reason: params.reason || 'Qualification expired',
      actor: params.actor,
      sourceSystem: params.sourceSystem,
    });

    if (!result.success) {
      return {
        success: false,
        validation: result.validation,
      };
    }

    // Generate qualification expiration event
    const eventId = this.eventStore.submitEvent({
      type: EventType.QualificationExpired,
      occurredAt: params.expirationDate,
      actor: params.actor,
      subjects: [params.personID, params.qualificationID],
      payload: {
        relationshipId: relationship.id,
        reason: params.reason || 'Qualification expired',
      },
      sourceSystem: params.sourceSystem,
      causalLinks: {
        precededBy: [relationship.createdBy],
      },
    });

    return {
      success: true,
      relationshipID: relationship.id,
      validation: result.validation,
      eventID: eventId,
    };
  }

  /**
   * Set a prerequisite relationship between qualifications
   * Uses DEPENDS_ON relationship to represent prerequisite chains
   */
  setQualificationPrerequisite(params: SetQualificationPrerequisiteParams): QualificationOperationResult {
    // Get both qualification holons
    const qualification = this.holonRegistry.getHolon(params.qualificationID);
    const prerequisite = this.holonRegistry.getHolon(params.prerequisiteQualificationID);

    if (!qualification) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Qualification not found',
            violatedRule: 'existence',
            affectedHolons: [params.qualificationID],
          }],
        },
      };
    }

    if (!prerequisite) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Prerequisite qualification not found',
            violatedRule: 'existence',
            affectedHolons: [params.prerequisiteQualificationID],
          }],
        },
      };
    }

    // Prevent self-prerequisite
    if (params.qualificationID === params.prerequisiteQualificationID) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'qualification-prerequisite',
            message: 'Qualification cannot be a prerequisite of itself',
            violatedRule: 'no_self_prerequisite',
            affectedHolons: [params.qualificationID],
          }],
        },
      };
    }

    // Check for cycles in prerequisite chain
    const cycleValidation = this.detectPrerequisiteCycle(
      params.qualificationID,
      params.prerequisiteQualificationID
    );

    if (!cycleValidation.valid) {
      return {
        success: false,
        validation: cycleValidation,
      };
    }

    // Create the DEPENDS_ON relationship (qualification depends on prerequisite)
    const result = this.relationshipRegistry.createRelationship({
      type: RelationshipType.DEPENDS_ON,
      sourceHolonID: params.qualificationID,
      targetHolonID: params.prerequisiteQualificationID,
      properties: {
        prerequisiteType: 'qualification',
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
   * Get all people who hold a specific qualification
   */
  getQualificationHolders(qualificationID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsFrom(
      qualificationID,
      RelationshipType.HELD_BY,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Get all qualifications held by a person
   */
  getPersonQualifications(personID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsTo(
      personID,
      RelationshipType.HELD_BY,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Get all positions that require a specific qualification
   */
  getPositionsRequiringQualification(qualificationID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsFrom(
      qualificationID,
      RelationshipType.REQUIRED_FOR,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Get all qualifications required for a position
   */
  getPositionRequiredQualifications(positionID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsTo(
      positionID,
      RelationshipType.REQUIRED_FOR,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Get all prerequisites for a qualification
   */
  getQualificationPrerequisites(qualificationID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsFrom(
      qualificationID,
      RelationshipType.DEPENDS_ON,
      { effectiveAt, includeEnded: false }
    );

    // Filter to only qualification prerequisites
    return relationships
      .filter(r => r.properties.prerequisiteType === 'qualification')
      .map(r => r.targetHolonID);
  }

  /**
   * Get all qualifications that have this qualification as a prerequisite
   */
  getQualificationsDependingOn(prerequisiteID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsTo(
      prerequisiteID,
      RelationshipType.DEPENDS_ON,
      { effectiveAt, includeEnded: false }
    );

    // Filter to only qualification prerequisites
    return relationships
      .filter(r => r.properties.prerequisiteType === 'qualification')
      .map(r => r.sourceHolonID);
  }

  /**
   * Get the complete prerequisite chain for a qualification
   */
  getPrerequisiteChain(qualificationID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const chain: HolonID[] = [];
    const visited = new Set<HolonID>();

    const traverse = (currentID: HolonID) => {
      if (visited.has(currentID)) {
        return; // Avoid infinite loops
      }
      visited.add(currentID);

      const prerequisites = this.getQualificationPrerequisites(currentID, effectiveAt);
      for (const prereqID of prerequisites) {
        chain.push(prereqID);
        traverse(prereqID);
      }
    };

    traverse(qualificationID);
    return chain;
  }

  /**
   * Detect if creating a prerequisite relationship would create a cycle
   * Uses depth-first search to check if prerequisite is a dependent of qualification
   */
  private detectPrerequisiteCycle(
    qualificationID: HolonID,
    prerequisiteID: HolonID,
    visited: Set<HolonID> = new Set()
  ): ValidationResult {
    // If we've already visited this node, we have a cycle
    if (visited.has(qualificationID)) {
      return {
        valid: false,
        errors: [{
          constraintID: 'qualification-prerequisite',
          message: 'Creating this prerequisite would create a cycle in the prerequisite chain',
          violatedRule: 'no_cycles',
          affectedHolons: [qualificationID, prerequisiteID],
        }],
      };
    }

    visited.add(qualificationID);

    // Get all qualifications that depend on this qualification
    const dependents = this.getQualificationsDependingOn(qualificationID, undefined);

    // Check if the prerequisite is a dependent of the qualification
    for (const dependentID of dependents) {
      if (dependentID === prerequisiteID) {
        // Found a cycle: prerequisite already depends on qualification
        return {
          valid: false,
          errors: [{
            constraintID: 'qualification-prerequisite',
            message: 'Creating this prerequisite would create a cycle: prerequisite qualification already depends on this qualification',
            violatedRule: 'no_cycles',
            affectedHolons: [qualificationID, prerequisiteID],
          }],
        };
      }

      // Recursively check dependents
      const dependentCheck = this.detectPrerequisiteCycle(dependentID, prerequisiteID, visited);
      if (!dependentCheck.valid) {
        return dependentCheck;
      }
    }

    return { valid: true };
  }
}
