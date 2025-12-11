/**
 * Organization Management module for the Semantic Operating Model
 * Manages Position and Organization holon creation, hierarchies, and constraints
 */

import { IHolonRepository as HolonRegistry } from '../core/interfaces/holon-repository';
import { RelationshipRegistry } from '../relationship-registry';
import { IEventStore as EventStore } from '../event-store';
import { ConstraintEngine, ValidationResult } from '../constraint-engine';
import { Position, Organization, HolonType, HolonID, DocumentID, EventID, Timestamp } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';
import { EventType } from '@som/shared-types';
import { AssignPersonToPositionParams } from '../person-management';
import { randomUUID } from 'crypto';

/**
 * Parameters for creating a Position holon
 */
export interface CreatePositionParams {
  billetIDs: string[];
  title: string;
  roleCode?: string;
  description?: string;
  gradeRange: { min: string; max: string };
  designatorExpectations: string[];
  criticality: 'critical' | 'important' | 'standard';
  billetType: 'command' | 'staff' | 'support';
  isLeadership?: boolean;
  organizationId?: string;
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
  orgCode?: string;
  type: string;
  level?: string;
  echelonLevel: string;
  missionStatement: string;
  parentOrganizationId?: string;
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
 * Parameters for aligning an organization under another (reports to)
 */
export interface AlignOrganizationParams {
  childOrganizationID: HolonID;
  parentOrganizationID: HolonID;
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
   * Create a new Position holon
   */
  async createPosition(params: CreatePositionParams): Promise<OrganizationOperationResult> {
    const id = randomUUID();

    // Event creation
    const eventId = await this.eventStore.submitEvent({
      type: EventType.PositionCreated,
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [id],
      payload: {
        properties: {
          title: params.title,
          roleCode: params.roleCode,
          organizationId: params.organizationId,
          billetIDs: params.billetIDs,
          description: params.description,
          gradeRange: params.gradeRange,
          designatorExpectations: params.designatorExpectations,
          criticality: params.criticality,
          billetType: params.billetType,
          isLeadership: params.isLeadership,
        }
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create Position holon
    const position = await this.holonRegistry.createHolon({
      id,
      type: HolonType.Position,
      properties: {
        billetIDs: params.billetIDs,
        title: params.title,
        roleCode: params.roleCode,
        description: params.description,
        gradeRange: params.gradeRange,
        designatorExpectations: params.designatorExpectations,
        criticality: params.criticality,
        billetType: params.billetType,
        isLeadership: params.isLeadership,
        organizationId: params.organizationId,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate
    const validation = this.constraintEngine.validateHolon(position);

    if (!validation.valid) {
      await this.holonRegistry.markHolonInactive(position.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    // Link to organization
    if (params.organizationId) {
      await this.assignPositionToOrganization({
        positionID: position.id,
        organizationID: params.organizationId,
        effectiveStart: new Date(),
        actor: params.actor,
        sourceSystem: params.sourceSystem,
        sourceDocuments: params.sourceDocuments,
      });
    }

    return {
      success: true,
      holonID: position.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Create a new Organization holon
   */
  async createOrganization(params: CreateOrganizationParams): Promise<OrganizationOperationResult> {
    const id = randomUUID();

    const eventId = await this.eventStore.submitEvent({
      type: EventType.OrganizationCreated,
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [id],
      payload: {
        properties: {
          name: params.name,
          orgCode: params.orgCode,
          type: params.type,
          uics: params.uics,
          level: params.level,
          echelonLevel: params.echelonLevel,
          missionStatement: params.missionStatement,
          parentOrganizationId: params.parentOrganizationId,
        }
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    const organization = await this.holonRegistry.createHolon({
      id,
      type: HolonType.Organization,
      properties: {
        uics: params.uics,
        name: params.name,
        orgCode: params.orgCode,
        type: params.type,
        level: params.level,
        echelonLevel: params.echelonLevel,
        missionStatement: params.missionStatement,
        parentOrganizationId: params.parentOrganizationId,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    const validation = this.constraintEngine.validateHolon(organization);

    if (!validation.valid) {
      await this.holonRegistry.markHolonInactive(organization.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    // Link to parent organization if specified
    if (params.parentOrganizationId) {
      await this.alignOrganization({
        childOrganizationID: organization.id,
        parentOrganizationID: params.parentOrganizationId,
        effectiveStart: new Date(),
        actor: params.actor,
        sourceSystem: params.sourceSystem,
        sourceDocuments: params.sourceDocuments,
      });
    }

    return {
      success: true,
      holonID: organization.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Assign a person to a position
   */
  async assignPersonToPosition(params: AssignPersonToPositionParams): Promise<OrganizationOperationResult> {
    // Check existence
    const person = await this.holonRegistry.getHolon(params.personID);
    const position = await this.holonRegistry.getHolon(params.positionID);

    if (!person || !position) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'existence',
            message: 'Person or Position not found',
            violatedRule: 'existence',
            affectedHolons: [params.personID, params.positionID],
          }],
        },
      };
    }

    // Create assignments relationship
    const result = await this.relationshipRegistry.createRelationship({
      type: RelationshipType.ASSIGNED_TO,
      sourceHolonID: params.personID,
      targetHolonID: params.positionID,
      properties: {
        status: 'active',
      },
      effectiveStart: params.effectiveStart,
      effectiveEnd: params.effectiveEnd,
      sourceSystem: params.sourceSystem,
      sourceDocuments: params.sourceDocuments,
      actor: params.actor,
    });

    if (result.relationship) {
      // Create event
      await this.eventStore.submitEvent({
        type: EventType.AssignmentStarted,
        occurredAt: params.effectiveStart,
        actor: params.actor,
        subjects: [params.personID, params.positionID],
        payload: {
          relationshipId: result.relationship.id,
        },
        sourceSystem: params.sourceSystem,
        sourceDocument: params.sourceDocuments[0],
        causalLinks: {},
      });
    }

    return {
      success: !!result.relationship,
      relationshipID: result.relationship?.id,
      validation: result.validation,
    };
  }

  /**
   * Assign a position to an organization (reports to)
   */
  async assignPositionToOrganization(params: AssignPositionToOrganizationParams): Promise<OrganizationOperationResult> {
    const position = await this.holonRegistry.getHolon(params.positionID);
    const organization = await this.holonRegistry.getHolon(params.organizationID);

    if (!position || !organization) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{ constraintID: 'existence', message: 'Position or Organization not found', violatedRule: 'existence', affectedHolons: [params.positionID, params.organizationID] }]
        }
      };
    }

    const result = await this.relationshipRegistry.createRelationship({
      type: RelationshipType.BELONGS_TO,
      sourceHolonID: params.positionID,
      targetHolonID: params.organizationID,
      properties: {},
      effectiveStart: params.effectiveStart,
      sourceSystem: params.sourceSystem,
      sourceDocuments: params.sourceDocuments,
      actor: params.actor,
    });

    return {
      success: !!result.relationship,
      relationshipID: result.relationship?.id,
      validation: result.validation,
    };
  }

  /**
   * Align an organization under another (reports to)
   */
  async alignOrganization(params: AlignOrganizationParams): Promise<OrganizationOperationResult> {
    const child = await this.holonRegistry.getHolon(params.childOrganizationID);
    const parent = await this.holonRegistry.getHolon(params.parentOrganizationID);

    if (!child || !parent) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{ constraintID: 'existence', message: 'Organization not found', violatedRule: 'existence', affectedHolons: [params.childOrganizationID, params.parentOrganizationID] }]
        }
      };
    }

    const result = await this.relationshipRegistry.createRelationship({
      type: RelationshipType.BELONGS_TO,
      sourceHolonID: params.childOrganizationID,
      targetHolonID: params.parentOrganizationID,
      properties: {},
      effectiveStart: params.effectiveStart,
      sourceSystem: params.sourceSystem,
      sourceDocuments: params.sourceDocuments,
      actor: params.actor,
    });

    if (result.relationship) {
      await this.eventStore.submitEvent({
        type: EventType.OrganizationRealigned,
        occurredAt: params.effectiveStart,
        actor: params.actor,
        subjects: [params.childOrganizationID, params.parentOrganizationID],
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
    };
  }

  /**
   * Create an organizational hierarchy (Organization CONTAINS Organization)
   * with cycle detection
   */
  async createOrganizationHierarchy(params: CreateOrganizationHierarchyParams): Promise<OrganizationOperationResult> {
    // Get parent and child organizations
    const parent = await this.holonRegistry.getHolon(params.parentOrganizationID);
    const child = await this.holonRegistry.getHolon(params.childOrganizationID);

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
    const cycleValidation = await this.detectOrganizationalCycle(
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
    const result = await this.relationshipRegistry.createRelationship({
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
  async setPositionQualificationRequirement(params: SetPositionQualificationRequirementParams): Promise<OrganizationOperationResult> {
    // Get position and qualification holons
    const position = await this.holonRegistry.getHolon(params.positionID);
    const qualification = await this.holonRegistry.getHolon(params.qualificationID);

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
   * Get all positions belonging to an organization
   */
  async getOrganizationPositions(organizationID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsTo(
      organizationID,
      RelationshipType.BELONGS_TO,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Get all child organizations of a parent organization
   */
  async getChildOrganizations(parentOrganizationID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsFrom(
      parentOrganizationID,
      RelationshipType.CONTAINS,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Get the parent organization of a child organization
   */
  async getParentOrganization(childOrganizationID: HolonID, effectiveAt?: Timestamp): Promise<HolonID | undefined> {
    const relationships = await this.relationshipRegistry.getRelationshipsTo(
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
  async getPositionQualificationRequirements(positionID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsTo(
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
  private async detectOrganizationalCycle(
    parentID: HolonID,
    childID: HolonID,
    visited: Set<HolonID> = new Set()
  ): Promise<ValidationResult> {
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
    const parentRelationships = await this.relationshipRegistry.getRelationshipsTo(
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
      const ancestorCheck = await this.detectOrganizationalCycle(rel.sourceHolonID, childID, visited);
      if (!ancestorCheck.valid) {
        return ancestorCheck;
      }
    }

    return { valid: true };
  }

  /**
   * Get the complete organizational hierarchy tree starting from a root organization
   */
  async getOrganizationTree(rootOrganizationID: HolonID, effectiveAt?: Timestamp): Promise<OrganizationTree> {
    const root = await this.holonRegistry.getHolon(rootOrganizationID);
    if (!root) {
      throw new Error(`Organization ${rootOrganizationID} not found`);
    }

    const children = await this.getChildOrganizations(rootOrganizationID, effectiveAt);
    const childTrees = await Promise.all(children.map(childID => this.getOrganizationTree(childID, effectiveAt)));

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
