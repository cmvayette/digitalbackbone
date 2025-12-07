/**
 * Access Control module for the Semantic Operating Model
 * Implements role-based and classification-based access control
 */

import { Holon, HolonID, HolonType, Document } from '@som/shared-types';
import { Relationship, RelationshipID } from '@som/shared-types';
import { Event } from '@som/shared-types';
import { DocumentRegistry } from '../document-registry';

/**
 * User role for access control
 */
export enum Role {
  Administrator = 'Administrator',
  Operator = 'Operator',
  Analyst = 'Analyst',
  Viewer = 'Viewer',
  SchemaManager = 'SchemaManager',
  DataSubmitter = 'DataSubmitter',
  SystemIntegrator = 'SystemIntegrator',
  SchemaDesigner = 'SchemaDesigner',
  GovernanceOfficer = 'GovernanceOfficer',
}

/**
 * Classification level for documents and data
 */
export enum ClassificationLevel {
  Unclassified = 'Unclassified',
  Confidential = 'Confidential',
  Secret = 'Secret',
  TopSecret = 'TopSecret',
}

/**
 * User context for access control decisions
 */
export interface UserContext {
  userId: string;
  roles: Role[];
  clearanceLevel: ClassificationLevel;
}

/**
 * Access control decision result
 */
export interface AccessDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Role permissions configuration
 */
interface RolePermissions {
  canQueryHolons: boolean;
  canQueryRelationships: boolean;
  canQueryEvents: boolean;
  canSubmitEvents: boolean;
  canModifySchema: boolean;
  canAccessClassified: boolean;
  allowedHolonTypes?: HolonType[];
}

/**
 * Access Control Engine
 * Enforces role-based and classification-based access control
 */
export class AccessControlEngine {
  private documentRegistry: DocumentRegistry;
  private rolePermissions: Map<Role, RolePermissions>;
  private classificationHierarchy: Map<ClassificationLevel, number>;

  constructor(documentRegistry: DocumentRegistry) {
    this.documentRegistry = documentRegistry;
    this.rolePermissions = new Map();
    this.classificationHierarchy = new Map();

    this.initializeRolePermissions();
    this.initializeClassificationHierarchy();
  }

  /**
   * Initialize default role permissions
   */
  private initializeRolePermissions(): void {
    // Admin: Full access
    this.rolePermissions.set(Role.Administrator, {
      canQueryHolons: true,
      canQueryRelationships: true,
      canQueryEvents: true,
      canSubmitEvents: true,
      canModifySchema: true,
      canAccessClassified: true,
    });

    // Operator: Can query and submit events, but not modify schema
    this.rolePermissions.set(Role.Operator, {
      canQueryHolons: true,
      canQueryRelationships: true,
      canQueryEvents: true,
      canSubmitEvents: true,
      canModifySchema: false,
      canAccessClassified: false,
    });

    // Analyst: Can query everything but not submit or modify
    this.rolePermissions.set(Role.Analyst, {
      canQueryHolons: true,
      canQueryRelationships: true,
      canQueryEvents: true,
      canSubmitEvents: false,
      canModifySchema: false,
      canAccessClassified: false,
    });

    // Viewer: Read-only access to basic holons
    this.rolePermissions.set(Role.Viewer, {
      canQueryHolons: true,
      canQueryRelationships: true,
      canQueryEvents: false,
      canSubmitEvents: false,
      canModifySchema: false,
      canAccessClassified: false,
    });

    // SchemaManager: Can modify schema but limited query access
    this.rolePermissions.set(Role.SchemaManager, {
      canQueryHolons: true,
      canQueryRelationships: true,
      canQueryEvents: false,
      canSubmitEvents: false,
      canModifySchema: true,
      canAccessClassified: false,
    });
  }

  /**
   * Initialize classification hierarchy
   * Higher numbers = higher classification
   */
  private initializeClassificationHierarchy(): void {
    this.classificationHierarchy.set(ClassificationLevel.Unclassified, 0);
    this.classificationHierarchy.set(ClassificationLevel.Confidential, 1);
    this.classificationHierarchy.set(ClassificationLevel.Secret, 2);
    this.classificationHierarchy.set(ClassificationLevel.TopSecret, 3);
  }

  /**
   * Check if user has permission for a specific action
   */
  private hasPermission(user: UserContext, permission: keyof RolePermissions): boolean {
    for (const role of user.roles) {
      const permissions = this.rolePermissions.get(role);
      if (permissions && permissions[permission]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Parse classification level from metadata string
   */
  private parseClassificationLevel(metadata: string): ClassificationLevel {
    const upper = metadata.toUpperCase();
    if (upper.includes('TOP SECRET') || upper.includes('TOPSECRET')) {
      return ClassificationLevel.TopSecret;
    }
    if (upper.includes('SECRET')) {
      return ClassificationLevel.Secret;
    }
    if (upper.includes('CONFIDENTIAL')) {
      return ClassificationLevel.Confidential;
    }
    return ClassificationLevel.Unclassified;
  }

  /**
   * Check if user has sufficient clearance for a classification level
   */
  private hasClearance(user: UserContext, requiredLevel: ClassificationLevel): boolean {
    const userLevel = this.classificationHierarchy.get(user.clearanceLevel) || 0;
    const required = this.classificationHierarchy.get(requiredLevel) || 0;
    return userLevel >= required;
  }

  /**
   * Check if user can access a holon based on role and classification
   */
  canAccessHolon(user: UserContext, holon: Holon): AccessDecision {
    // Check role-based permissions
    if (!this.hasPermission(user, 'canQueryHolons')) {
      return {
        allowed: false,
        reason: 'User does not have permission to query holons',
      };
    }

    // Check classification-based access
    const classificationLevel = this.getHolonClassificationLevel(holon);
    if (!this.hasClearance(user, classificationLevel)) {
      return {
        allowed: false,
        reason: 'Insufficient clearance level',
      };
    }

    return { allowed: true };
  }

  /**
   * Get the classification level for a holon based on its source documents
   */
  private getHolonClassificationLevel(holon: Holon): ClassificationLevel {
    let highestLevel = ClassificationLevel.Unclassified;
    let highestLevelValue = 0;

    // Check holon's own classification (for Mission holons)
    if (holon.type === HolonType.Mission) {
      const missionClassification = this.parseClassificationLevel(
        holon.properties.classificationMetadata || ''
      );
      const missionLevel = this.classificationHierarchy.get(missionClassification) || 0;
      if (missionLevel > highestLevelValue) {
        highestLevel = missionClassification;
        highestLevelValue = missionLevel;
      }
    }

    // Check source documents
    for (const docId of holon.sourceDocuments) {
      const doc = this.documentRegistry.getDocument(docId);
      if (doc) {
        const docClassification = this.parseClassificationLevel(
          doc.properties.classificationMetadata
        );
        const docLevel = this.classificationHierarchy.get(docClassification) || 0;
        if (docLevel > highestLevelValue) {
          highestLevel = docClassification;
          highestLevelValue = docLevel;
        }
      }
    }

    return highestLevel;
  }

  /**
   * Check if user can access a relationship
   */
  canAccessRelationship(user: UserContext, relationship: Relationship): AccessDecision {
    // Check role-based permissions
    if (!this.hasPermission(user, 'canQueryRelationships')) {
      return {
        allowed: false,
        reason: 'User does not have permission to query relationships',
      };
    }

    // Check classification based on source documents
    const classificationLevel = this.getRelationshipClassificationLevel(relationship);
    if (!this.hasClearance(user, classificationLevel)) {
      return {
        allowed: false,
        reason: 'Insufficient clearance level',
      };
    }

    return { allowed: true };
  }

  /**
   * Get the classification level for a relationship based on its source documents
   */
  private getRelationshipClassificationLevel(relationship: Relationship): ClassificationLevel {
    let highestLevel = ClassificationLevel.Unclassified;
    let highestLevelValue = 0;

    for (const docId of relationship.sourceDocuments) {
      const doc = this.documentRegistry.getDocument(docId);
      if (doc) {
        const docClassification = this.parseClassificationLevel(
          doc.properties.classificationMetadata
        );
        const docLevel = this.classificationHierarchy.get(docClassification) || 0;
        if (docLevel > highestLevelValue) {
          highestLevel = docClassification;
          highestLevelValue = docLevel;
        }
      }
    }

    return highestLevel;
  }

  /**
   * Check if user can access an event
   */
  canAccessEvent(user: UserContext, event: Event): AccessDecision {
    // Check role-based permissions
    if (!this.hasPermission(user, 'canQueryEvents')) {
      return {
        allowed: false,
        reason: 'User does not have permission to query events',
      };
    }

    // Check classification based on source document
    if (event.sourceDocument) {
      const doc = this.documentRegistry.getDocument(event.sourceDocument);
      if (doc) {
        const docClassification = this.parseClassificationLevel(
          doc.properties.classificationMetadata
        );
        if (!this.hasClearance(user, docClassification)) {
          return {
            allowed: false,
            reason: 'Insufficient clearance level',
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Check if user can submit events
   */
  canSubmitEvent(user: UserContext): AccessDecision {
    if (!this.hasPermission(user, 'canSubmitEvents')) {
      return {
        allowed: false,
        reason: 'User does not have permission to submit events',
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can modify schema
   */
  canModifySchema(user: UserContext): AccessDecision {
    if (!this.hasPermission(user, 'canModifySchema')) {
      return {
        allowed: false,
        reason: 'User does not have permission to modify schema',
      };
    }

    return { allowed: true };
  }

  /**
   * Filter holons based on user access
   * Returns only holons the user is authorized to access
   * Does not reveal existence of restricted holons
   */
  filterHolons(user: UserContext, holons: Holon[]): Holon[] {
    return holons.filter(holon => this.canAccessHolon(user, holon).allowed);
  }

  /**
   * Filter relationships based on user access
   * Returns only relationships the user is authorized to access
   * Does not reveal existence of restricted relationships
   */
  filterRelationships(user: UserContext, relationships: Relationship[]): Relationship[] {
    return relationships.filter(rel => this.canAccessRelationship(user, rel).allowed);
  }

  /**
   * Filter events based on user access
   * Returns only events the user is authorized to access
   * Does not reveal existence of restricted events
   */
  filterEvents(user: UserContext, events: Event[]): Event[] {
    return events.filter(event => this.canAccessEvent(user, event).allowed);
  }

  /**
   * Configure custom role permissions
   */
  setRolePermissions(role: Role, permissions: RolePermissions): void {
    this.rolePermissions.set(role, permissions);
  }

  /**
   * Get current permissions for a role
   */
  getRolePermissions(role: Role): RolePermissions | undefined {
    return this.rolePermissions.get(role);
  }
}

/**
 * Create a new access control engine instance
 */
export function createAccessControlEngine(documentRegistry: DocumentRegistry): AccessControlEngine {
  return new AccessControlEngine(documentRegistry);
}
