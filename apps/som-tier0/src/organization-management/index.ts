/**
 * Organization Management module for the Semantic Operating Model
 * Manages Position and Organization holon creation, hierarchies, and constraints
 */

import { HolonRegistry } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { EventStore } from '../event-store';
import { ConstraintEngine, ValidationResult } from '../constraint-engine';
import { Position, Organization, HolonType, HolonID, DocumentID, EventID, Timestamp } from '../core/types/holon';
import { RelationshipType } from '../core/types/relationship';
import { EventType } from '../core/types/event';

/**
 * Parameters for creating a Position holon
 */
export interface CreatePositionParams {
  billetIDs: string[];
  title: string;
  gradeRange: { min: string; max: string };
  designatorExpectations: string[];
  criticality: 'critical' | 'important' | 'standard';
  billetType: 'command' | 'staff' | 'support';
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating an Organization holon
 */
export interface CreateOrganizationParams {
  uics: string[];
  name: string;
  type: string;
  echelonLevel: string;
  missionStatement: string;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating a Position BELONGS_TO Organization relationship
 */
export interface AssignPositionToOrganizationParams {
  positionID: HolonID;
  organizationID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating an Organization CONTAINS Organization relationship
 */
export interface CreateOrganizationHierarchyParams {
  parentOrganizationID: HolonID;
  childOrganizationID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for linking a Qualification as required for a Position
 */
export interface SetPositionQualificationRequirementParams {
  positionID: HolonID;
  qualificationID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Result of an Organization operation
 */
export interface OrganizationOperationResult {
  success: boolean;
  holonID?: HolonID;
  relationshipID?: string;
  validation: ValidationResult;
  eventID?: EventID;
}

/**
 * OrganizationManager handles Position and Organization holon lifecycle and relationships
 */
export class OrganizationManager {
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
   * Create a new Position holon with required fields
   */
  createPosition(params: CreatePositionParams): OrganizationOperationResult {
    // Create event for position creation
    const eventId = this.eventStore.submitEvent({
      type: EventType.PositionCreated,
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [],
      payload: {
        action: 'create_position',
        title: params.title,
        billetIDs: params.billetIDs,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create Position holon
    const position = this.holonRegistry.createHolon({
      type: HolonType.Position,
      properties: {
        billetIDs: params.billetIDs,
        title: params.title,
        gradeRange: params.gradeRange,
        designatorExpectations: params.designatorExpectations,
        criticality: params.criticality,
        billetType: params.billetType,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate the created position
    const validation = this.constraintEngine.validateHolon(position);

    if (!validation.valid) {
      // Rollback: mark position as inactive
      this.holonRegistry.markHolonInactive(position.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    return {
      success: true,
      holonID: position.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Create a new Organization holon with required fields
   */
  createOrganization(params: CreateOrganizationParams): OrganizationOperationResult {
    // Create event for organization creation
    const eventId = this.eventStore.submitEvent({
      type: EventType.OrganizationCreated,
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [],
      payload: {
        action: 'create_organization',
        name: params.name,
        uics: params.uics,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create Organization holon
    const organization = this.holonRegistry.createHolon({
      type: HolonType.Organization,
      properties: {
        uics: params.uics,
        name: params.name,
        type: params.type,
        echelonLevel: params.echelonLevel,
        missionStatement: params.missionStatement,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate the created organization
    const validation = this.constraintEngine.validateHolon(organization);

    if (!validation.valid) {
      // Rollback: mark organization as inactive
      this.holonRegistry.markHolonInactive(organization.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    return {
      success: true,
      holonID: organization.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Assign a Position to an Organization
   */
  assignPositionToOrganization(params: AssignPositionToOrganizationParams): OrganizationOperationResult {
    // Get position and organization holons
    const position = this.holonRegistry.getHolon(params.positionID);
    const organization = this.holonRegistry.getHolon(params.organizationID);

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

    if (!organization) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Organization not found',
            violatedRule: 'existence',
            affectedHolons: [params.organizationID],
          }],
        },
      };
    }

    // Create the BELONGS_TO relationship
    const result = this.relationshipRegistry.createRelationship({
      type: RelationshipType.BELONGS_TO,
      sourceHolonID: params.positionID,
      targetHolonID: params.organizationID,
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
   * Create an organizational hierarchy (Organization CONTAINS Organization)
   * with cycle detection
   */
  createOrganizationHierarchy(params: CreateOrganizationHierarchyParams): OrganizationOperationResult {
    // Get parent and child organizations
    const parent = this.holonRegistry.getHolon(params.parentOrganizationID);
    const child = this.holonRegistry.getHolon(params.childOrganizationID);

    if (!parent) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Parent organization not found',
            violatedRule: 'existence',
            affectedHolons: [params.parentOrganizationID],
          }],
        },
      };
    }

    if (!child) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Child organization not found',
            violatedRule: 'existence',
            affectedHolons: [params.childOrganizationID],
          }],
        },
      };
    }

    // Prevent self-containment
    if (params.parentOrganizationID === params.childOrganizationID) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'organizational-hierarchy',
            message: 'Organization cannot contain itself',
            violatedRule: 'no_self_containment',
            affectedHolons: [params.parentOrganizationID],
          }],
        },
      };
    }

    // Check for cycles before creating the relationship
    const cycleValidation = this.detectOrganizationalCycle(
      params.parentOrganizationID,
      params.childOrganizationID
    );

    if (!cycleValidation.valid) {
      return {
        success: false,
        validation: cycleValidation,
      };
    }

    // Create the CONTAINS relationship
    const result = this.relationshipRegistry.createRelationship({
      type: RelationshipType.CONTAINS,
      sourceHolonID: params.parentOrganizationID,
      targetHolonID: params.childOrganizationID,
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
   * Set a qualification requirement for a Position
   */
  setPositionQualificationRequirement(params: SetPositionQualificationRequirementParams): OrganizationOperationResult {
    // Get position and qualification holons
    const position = this.holonRegistry.getHolon(params.positionID);
    const qualification = this.holonRegistry.getHolon(params.qualificationID);

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

    // Create the REQUIRED_FOR relationship (Qualification REQUIRED_FOR Position)
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
   * Get all positions belonging to an organization
   */
  getOrganizationPositions(organizationID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsTo(
      organizationID,
      RelationshipType.BELONGS_TO,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Get all child organizations of a parent organization
   */
  getChildOrganizations(parentOrganizationID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsFrom(
      parentOrganizationID,
      RelationshipType.CONTAINS,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Get the parent organization of a child organization
   */
  getParentOrganization(childOrganizationID: HolonID, effectiveAt?: Timestamp): HolonID | undefined {
    const relationships = this.relationshipRegistry.getRelationshipsTo(
      childOrganizationID,
      RelationshipType.CONTAINS,
      { effectiveAt, includeEnded: false }
    );

    // An organization should have at most one parent
    return relationships.length > 0 ? relationships[0].sourceHolonID : undefined;
  }

  /**
   * Get all qualification requirements for a Position
   */
  getPositionQualificationRequirements(positionID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsTo(
      positionID,
      RelationshipType.REQUIRED_FOR,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Detect if creating a CONTAINS relationship would create a cycle
   * Uses depth-first search to check if child is an ancestor of parent
   */
  private detectOrganizationalCycle(
    parentID: HolonID,
    childID: HolonID,
    visited: Set<HolonID> = new Set()
  ): ValidationResult {
    // If we've already visited this node, we have a cycle
    if (visited.has(parentID)) {
      return {
        valid: false,
        errors: [{
          constraintID: 'organizational-hierarchy',
          message: 'Creating this relationship would create a cycle in the organizational hierarchy',
          violatedRule: 'no_cycles',
          affectedHolons: [parentID, childID],
        }],
      };
    }

    visited.add(parentID);

    // Get all ancestors of the parent (organizations that contain the parent)
    const parentRelationships = this.relationshipRegistry.getRelationshipsTo(
      parentID,
      RelationshipType.CONTAINS,
      { includeEnded: false }
    );

    // Check if the child is an ancestor of the parent
    for (const rel of parentRelationships) {
      if (rel.sourceHolonID === childID) {
        // Found a cycle: child is already an ancestor of parent
        return {
          valid: false,
          errors: [{
            constraintID: 'organizational-hierarchy',
            message: 'Creating this relationship would create a cycle: child organization is already an ancestor of parent',
            violatedRule: 'no_cycles',
            affectedHolons: [parentID, childID],
          }],
        };
      }

      // Recursively check ancestors
      const ancestorCheck = this.detectOrganizationalCycle(rel.sourceHolonID, childID, visited);
      if (!ancestorCheck.valid) {
        return ancestorCheck;
      }
    }

    return { valid: true };
  }

  /**
   * Get the complete organizational hierarchy tree starting from a root organization
   */
  getOrganizationTree(rootOrganizationID: HolonID, effectiveAt?: Timestamp): OrganizationTree {
    const root = this.holonRegistry.getHolon(rootOrganizationID);
    if (!root) {
      throw new Error(`Organization ${rootOrganizationID} not found`);
    }

    const children = this.getChildOrganizations(rootOrganizationID, effectiveAt);
    const childTrees = children.map(childID => this.getOrganizationTree(childID, effectiveAt));

    return {
      organizationID: rootOrganizationID,
      organization: root as Organization,
      children: childTrees,
    };
  }
}

/**
 * Represents an organizational hierarchy tree
 */
export interface OrganizationTree {
  organizationID: HolonID;
  organization: Organization;
  children: OrganizationTree[];
}
