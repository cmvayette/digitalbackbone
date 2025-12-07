/**
 * Qualification Management module for the Semantic Operating Model
 * Manages Qualification holon creation, relationships, expiration, and prerequisites
 */

import { IHolonRepository as HolonRegistry } from '../core/interfaces/holon-repository';
import { RelationshipRegistry } from '../relationship-registry';
import { IEventStore as EventStore } from '../event-store';
import { ConstraintEngine, ValidationResult } from '../constraint-engine';
import { Qualification, HolonType, HolonID, DocumentID, EventID, Timestamp } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';
import { EventType } from '@som/shared-types';

/**
 * Parameters for creating a Qualification holon
 */
export interface CreateQualificationParams {
  nec?: string;
  pqsID?: string;
  courseCode?: string;
  certificationID?: string;
  code?: string;
  name: string;
  type: string;
  domain?: string;
  level?: string;
  description?: string;
  validityPeriod: number; // Duration in milliseconds
  validityPeriodDays?: number;
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
 * Parameters for awarding a qualification to a person
 */
export interface AwardQualificationParams {
  personID: HolonID;
  qualificationID: HolonID;
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
  async createQualification(params: CreateQualificationParams): Promise<QualificationOperationResult> {
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
            message: 'At least one identifier (NEC, PQS ID, course code, certification ID, or code) must be provided',
            violatedRule: 'Qualification must have at least one identifier',
            affectedHolons: [],
          }],
        },
      };
    }

    // Create event for qualification creation
    const eventId = this.eventStore.submitEvent({
      type: EventType.QualificationDefined, // Changed event type
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
        // New fields from snippet
        code: params.code,
        description: params.description,
        domain: params.domain,
        level: params.level,
        validityPeriodDays: params.validityPeriodDays,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create Qualification holon
    const qualification = await this.holonRegistry.createHolon({ // Await holonRegistry call
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
        // New fields from snippet
        code: params.code,
        description: params.description,
        domain: params.domain,
        level: params.level,
        validityPeriodDays: params.validityPeriodDays,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate the created qualification
    const validation = this.constraintEngine.validateHolon(qualification);

    if (!validation.valid) {
      // Rollback: mark qualification as inactive
      await this.holonRegistry.markHolonInactive(qualification.id, 'Validation failed'); // Await holonRegistry call
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
   * Award a qualification to a person
   */
  async awardQualification(params: AwardQualificationParams): Promise<QualificationOperationResult> {
    const person = await this.holonRegistry.getHolon(params.personID);
    const qualification = await this.holonRegistry.getHolon(params.qualificationID);

    if (!person || !qualification) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{ constraintID: 'existence', message: 'Person or Qualification not found', violatedRule: 'existence', affectedHolons: [params.personID, params.qualificationID] }]
        }
      };
    }

    // Create HAS_QUAL relationship
    const result = await this.relationshipRegistry.createRelationship({
      type: RelationshipType.HAS_QUAL,
      sourceHolonID: params.personID,
      targetHolonID: params.qualificationID,
      properties: {
        status: 'active',
        awardedDate: params.effectiveStart,
        expiryDate: params.effectiveEnd,
      },
      effectiveStart: params.effectiveStart,
      effectiveEnd: params.effectiveEnd,
      sourceSystem: params.sourceSystem,
      sourceDocuments: params.sourceDocuments,
      actor: params.actor,
    });

    if (result.relationship) {
      this.eventStore.submitEvent({
        type: EventType.QualificationAwarded,
        occurredAt: params.effectiveStart,
        actor: params.actor,
        subjects: [params.personID, params.qualificationID],
        payload: { relationshipId: result.relationship.id },
        sourceSystem: params.sourceSystem,
        sourceDocument: params.sourceDocuments[0],
        causalLinks: {},
      });
    }

    return {
      success: !!result.relationship,
      relationshipID: result.relationship?.id,
      validation: result.validation,
      eventID: result.relationship ? result.relationship.createdBy : undefined, // Assuming eventID comes from relationship creation if successful
    };
  }

  /**
   * Set a Qualification as required for a Position (Qualification REQUIRED_FOR Position)
   */
  async setQualificationRequirement(params: SetQualificationRequirementParams): Promise<QualificationOperationResult> {
    // Get qualification and position holons
    const qualification = await this.holonRegistry.getHolon(params.qualificationID);
    const position = await this.holonRegistry.getHolon(params.positionID);

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
    const result = await this.relationshipRegistry.createRelationship({
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
  async expireQualification(params: ExpireQualificationParams): Promise<QualificationOperationResult> {
    // Find the HAS_QUAL relationship (Person -> Qualification)
    const relationships = await this.relationshipRegistry.getRelationshipsTo(
      params.qualificationID,
      RelationshipType.HAS_QUAL,
      { includeEnded: false }
    );

    const relationship = relationships.find(r => r.sourceHolonID === params.personID);

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
    const result = await this.relationshipRegistry.endRelationship({
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
  async setQualificationPrerequisite(params: SetQualificationPrerequisiteParams): Promise<QualificationOperationResult> {
    // Get both qualification holons
    const qualification = await this.holonRegistry.getHolon(params.qualificationID);
    const prerequisite = await this.holonRegistry.getHolon(params.prerequisiteQualificationID);

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
    const cycleValidation = await this.detectPrerequisiteCycle(
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
    const result = await this.relationshipRegistry.createRelationship({
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
  async getQualificationHolders(qualificationID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsTo(
      qualificationID,
      RelationshipType.HAS_QUAL,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Get all qualifications held by a person
   */
  async getPersonQualifications(personID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsFrom(
      personID,
      RelationshipType.HAS_QUAL,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Get all positions that require a specific qualification
   */
  async getPositionsRequiringQualification(qualificationID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsFrom(
      qualificationID,
      RelationshipType.REQUIRED_FOR,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Get all qualifications required for a position
   */
  async getPositionRequiredQualifications(positionID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsTo(
      positionID,
      RelationshipType.REQUIRED_FOR,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Get all prerequisites for a qualification
   */
  async getQualificationPrerequisites(qualificationID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsFrom(
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
  async getQualificationsDependingOn(prerequisiteID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsTo(
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
  async getPrerequisiteChain(qualificationID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const chain: HolonID[] = [];
    const visited = new Set<HolonID>();

    const traverse = async (currentID: HolonID) => {
      if (visited.has(currentID)) {
        return; // Avoid infinite loops
      }
      visited.add(currentID);

      const prerequisites = await this.getQualificationPrerequisites(currentID, effectiveAt);
      for (const prereqID of prerequisites) {
        chain.push(prereqID);
        await traverse(prereqID);
      }
    };

    await traverse(qualificationID);
    return chain;
  }

  /**
   * Detect if creating a prerequisite relationship would create a cycle
   * Uses depth-first search to check if prerequisite is a dependent of qualification
   */
  private async detectPrerequisiteCycle(
    qualificationID: HolonID,
    prerequisiteID: HolonID,
    visited: Set<HolonID> = new Set()
  ): Promise<ValidationResult> {
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
    const dependents = await this.getQualificationsDependingOn(qualificationID, undefined);

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
      const dependentCheck = await this.detectPrerequisiteCycle(dependentID, prerequisiteID, visited);
      if (!dependentCheck.valid) {
        return dependentCheck;
      }
    }

    return { valid: true };
  }
}
