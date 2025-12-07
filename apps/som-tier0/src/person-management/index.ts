/**
 * Person Management module for the Semantic Operating Model
 * Manages Person holon creation, assignments, qualifications, and constraints
 */

import { IHolonRepository as HolonRegistry } from '../core/interfaces/holon-repository';
import { RelationshipRegistry } from '../relationship-registry';
import { IEventStore as EventStore } from '../event-store';
import { ConstraintEngine, ValidationResult } from '../constraint-engine';
import { Person, HolonType, HolonID, DocumentID, EventID, Timestamp } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';
import { EventType } from '@som/shared-types';
import { randomUUID } from 'crypto';

/**
 * Parameters for creating a Person holon
 */
export interface CreatePersonParams {
  edipi: string;
  serviceNumbers: string[];
  name: string;
  email?: string;
  employeeId?: string;
  dob: Date;
  serviceBranch: string;
  designatorRating: string;
  category: 'active_duty' | 'reserve' | 'civilian' | 'contractor';
  securityClearance?: string;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating a Person OCCUPIES Position relationship
 */
export interface AssignPersonToPositionParams {
  personID: HolonID;
  positionID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating a Person HAS_QUAL Qualification relationship
 */
export interface AssignQualificationParams {
  personID: HolonID;
  qualificationID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Result of a Person operation
 */
export interface PersonOperationResult {
  success: boolean;
  personID?: HolonID;
  relationshipID?: string;
  validation: ValidationResult;
  eventID?: EventID;
}

/**
 * PersonManager handles Person holon lifecycle and relationships
 */
export class PersonManager {
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
   * Create a new Person holon
   */
  async createPerson(params: CreatePersonParams): Promise<PersonOperationResult> {
    const id = randomUUID();

    // Create event
    const eventId = this.eventStore.submitEvent({
      type: EventType.PersonCreated, // Using generic type if specific not available, or reuse existing
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [id],
      payload: {
        properties: {
          name: params.name,
          email: params.email,
          employeeId: params.employeeId,
          edipi: params.edipi,
          serviceNumbers: params.serviceNumbers,
          dob: params.dob,
          serviceBranch: params.serviceBranch,
          designatorRating: params.designatorRating,
          category: params.category,
          securityClearance: params.securityClearance,
        }
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create Person holon
    const person = await this.holonRegistry.createHolon({
      id,
      type: HolonType.Person,
      properties: {
        edipi: params.edipi,
        serviceNumbers: params.serviceNumbers,
        name: params.name,
        email: params.email,
        employeeId: params.employeeId,
        dob: params.dob,
        serviceBranch: params.serviceBranch,
        designatorRating: params.designatorRating,
        category: params.category,
        securityClearance: params.securityClearance,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate
    const validation = this.constraintEngine.validateHolon(person);

    if (!validation.valid) {
      await this.holonRegistry.markHolonInactive(person.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    return {
      success: true,
      personID: person.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Assign a Person to a Position with qualification validation
   */
  async assignPersonToPosition(params: AssignPersonToPositionParams): Promise<PersonOperationResult> {
    // Get person and position holons
    const person = await this.holonRegistry.getHolon(params.personID);
    const position = await this.holonRegistry.getHolon(params.positionID);

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

    // Check concurrent position constraints
    const concurrentValidation = await this.validateConcurrentPositions(params.personID, params.effectiveStart);
    if (!concurrentValidation.valid) {
      return {
        success: false,
        validation: concurrentValidation,
      };
    }

    // Check qualification requirements
    const qualificationValidation = await this.validateQualifications(person, position);
    if (!qualificationValidation.valid) {
      return {
        success: false,
        validation: qualificationValidation,
      };
    }

    // Create the OCCUPIES relationship
    const result = await this.relationshipRegistry.createRelationship({
      type: RelationshipType.OCCUPIES,
      sourceHolonID: params.personID,
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
   * Assign a qualification to a Person
   */
  async assignQualification(params: AssignQualificationParams): Promise<PersonOperationResult> {
    // Get person and qualification holons
    const person = await this.holonRegistry.getHolon(params.personID);
    const qualification = await this.holonRegistry.getHolon(params.qualificationID);

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

    // Create the HAS_QUAL relationship
    const result = await this.relationshipRegistry.createRelationship({
      type: RelationshipType.HAS_QUAL,
      sourceHolonID: params.personID,
      targetHolonID: params.qualificationID,
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

    // Generate qualification change event
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
   * Remove a qualification from a Person
   */
  async removeQualification(
    personID: HolonID,
    qualificationID: HolonID,
    endDate: Timestamp,
    reason: string,
    actor: HolonID,
    sourceSystem: string
  ): Promise<PersonOperationResult> {
    // Find the HAS_QUAL relationship
    const relationships = await this.relationshipRegistry.getRelationshipsFrom(
      personID,
      RelationshipType.HAS_QUAL,
      { includeEnded: false }
    );

    const relationship = relationships.find(r => r.targetHolonID === qualificationID);

    if (!relationship) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Qualification relationship not found',
            violatedRule: 'existence',
            affectedHolons: [personID, qualificationID],
          }],
        },
      };
    }

    // End the relationship
    const result = await this.relationshipRegistry.endRelationship({
      relationshipID: relationship.id,
      endDate,
      reason,
      actor,
      sourceSystem,
    });

    if (!result.success) {
      return {
        success: false,
        validation: result.validation,
      };
    }

    // Generate qualification change event
    const eventId = this.eventStore.submitEvent({
      type: EventType.QualificationExpired,
      occurredAt: endDate,
      actor,
      subjects: [personID, qualificationID],
      payload: {
        relationshipId: relationship.id,
        reason,
      },
      sourceSystem,
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
   * Get all qualifications for a Person at a specific time
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
   * Get all positions occupied by a Person at a specific time
   */
  async getPersonPositions(personID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsFrom(
      personID,
      RelationshipType.OCCUPIES,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Validate that a Person has the required qualifications for a Position
   */
  private async validateQualifications(person: any, position: any): Promise<ValidationResult> {
    // Get required qualifications for the position
    const requiredQuals = await this.relationshipRegistry.getRelationshipsTo(
      position.id,
      RelationshipType.REQUIRED_FOR,
      { includeEnded: false }
    );

    if (requiredQuals.length === 0) {
      // No qualifications required
      return { valid: true };
    }

    // Get person's current qualifications
    const personQuals = await this.getPersonQualifications(person.id);

    // Check if person has all required qualifications
    const missingQuals: string[] = [];
    for (const reqQual of requiredQuals) {
      if (!personQuals.includes(reqQual.sourceHolonID)) {
        missingQuals.push(reqQual.sourceHolonID);
      }
    }

    if (missingQuals.length > 0) {
      return {
        valid: false,
        errors: [{
          constraintID: 'qualification-requirement',
          message: `Person lacks required qualifications: ${missingQuals.join(', ')}`,
          violatedRule: 'qualification_requirement',
          affectedHolons: [person.id, position.id],
        }],
      };
    }

    return { valid: true };
  }

  /**
   * Validate concurrent position constraints
   */
  private async validateConcurrentPositions(personID: HolonID, effectiveAt: Timestamp): Promise<ValidationResult> {
    const currentPositions = await this.getPersonPositions(personID, effectiveAt);

    // For now, we'll implement a simple constraint: max 3 concurrent positions
    // This should be configurable via the constraint engine in a real implementation
    const MAX_CONCURRENT_POSITIONS = 3;

    if (currentPositions.length >= MAX_CONCURRENT_POSITIONS) {
      return {
        valid: false,
        errors: [{
          constraintID: 'concurrent-position-limit',
          message: `Person already has ${currentPositions.length} concurrent positions (max: ${MAX_CONCURRENT_POSITIONS})`,
          violatedRule: 'concurrent_position_constraint',
          affectedHolons: [personID],
        }],
      };
    }

    return { valid: true };
  }
}
