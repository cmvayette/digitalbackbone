/**
 * Access Control module for the Semantic Operating Model
 * Implements role-based and classification-based access control
 */

import { Holon, HolonType } from '@som/shared-types';
import { Relationship } from '@som/shared-types';
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

import { config } from '../config';

/**
 * Access Control Engine
 * Enforces role-based and classification-based access control via OPA
 */
export class AccessControlEngine {
  private documentRegistry: DocumentRegistry;

  constructor(documentRegistry: DocumentRegistry) {
    this.documentRegistry = documentRegistry;
  }

  /**
   * Check policy against OPA
   */
  private async checkPolicy(input: any): Promise<AccessDecision> {
    try {
      const response = await fetch(config.auth.opaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        console.error(`OPA check failed: ${response.statusText}`);
        return { allowed: false, reason: 'Authorization service unavailable' };
      }

      const result = await response.json() as { result?: boolean };

      // OPA returns { result: boolean } for simple queries or full object
      // Our policy 'allow' rule returns boolean by default if queried directly
      // But usually we query data/som/authz/allow

      if (result.result === true) {
        return { allowed: true };
      }

      return { allowed: false, reason: 'Access denied by policy' };
    } catch (error) {
      console.error('OPA check error:', error);
      return { allowed: false, reason: 'Authorization check failed' };
    }
  }

  /**
   * Check if user can access a holon based on role and classification
   */
  async canAccessHolon(user: UserContext, holon: Holon): Promise<AccessDecision> {
    const classification = this.getHolonClassificationLevel(holon);

    return this.checkPolicy({
      user,
      action: 'read',
      resource: {
        type: 'holon',
        classification,
        subtype: holon.type,
        properties: holon.properties
      }
    });
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
      const missionLevel = this.classificationHierarchy(missionClassification);
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
        const docLevel = this.classificationHierarchy(docClassification);
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
  async canAccessRelationship(user: UserContext, relationship: Relationship): Promise<AccessDecision> {
    const classification = this.getRelationshipClassificationLevel(relationship);

    return this.checkPolicy({
      user,
      action: 'read',
      resource: {
        type: 'relationship',
        classification,
        subtype: relationship.type
      }
    });
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
        const docLevel = this.classificationHierarchy(docClassification);
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
  async canAccessEvent(user: UserContext, event: Event): Promise<AccessDecision> {
    let classification = ClassificationLevel.Unclassified;

    // Check classification based on source document
    if (event.sourceDocument) {
      const doc = this.documentRegistry.getDocument(event.sourceDocument);
      if (doc) {
        classification = this.parseClassificationLevel(
          doc.properties.classificationMetadata
        );
      }
    }

    return this.checkPolicy({
      user,
      action: 'read',
      resource: {
        type: 'event',
        classification,
        subtype: event.type
      }
    });
  }

  /**
   * Check if user can submit events
   */
  async canSubmitEvent(user: UserContext): Promise<AccessDecision> {
    return this.checkPolicy({
      user,
      action: 'submit_event',
      resource: { type: 'system' }
    });
  }

  /**
   * Check if user can modify schema
   */
  async canModifySchema(user: UserContext): Promise<AccessDecision> {
    return this.checkPolicy({
      user,
      action: 'modify_schema',
      resource: { type: 'system' }
    });
  }

  /**
   * Check if user can propose schema
   */
  async canProposeSchemaChanges(user: UserContext): Promise<AccessDecision> {
    return this.checkPolicy({
      user,
      action: 'propose_schema',
      resource: { type: 'system' }
    });
  }

  /**
   * Check if user can access system health
   */
  async canAccessSystemHealth(user: UserContext): Promise<AccessDecision> {
    return this.checkPolicy({
      user,
      action: 'view_health',
      resource: { type: 'system' }
    });
  }


  /**
   * Filter holons based on user access
   * Returns only holons the user is authorized to access
   * Does not reveal existence of restricted holons
   */
  async filterHolons(user: UserContext, holons: Holon[]): Promise<Holon[]> {
    const results = await Promise.all(holons.map(async h => {
      const decision = await this.canAccessHolon(user, h);
      return decision.allowed ? h : null;
    }));
    return results.filter((h): h is Holon => h !== null);
  }

  /**
   * Filter relationships based on user access
   * Returns only relationships the user is authorized to access
   * Does not reveal existence of restricted relationships
   */
  async filterRelationships(user: UserContext, relationships: Relationship[]): Promise<Relationship[]> {
    const results = await Promise.all(relationships.map(async r => {
      const decision = await this.canAccessRelationship(user, r);
      return decision.allowed ? r : null;
    }));
    return results.filter((r): r is Relationship => r !== null);
  }

  /**
   * Filter events based on user access
   * Returns only events the user is authorized to access
   * Does not reveal existence of restricted events
   */
  async filterEvents(user: UserContext, events: Event[]): Promise<Event[]> {
    const results = await Promise.all(events.map(async e => {
      const decision = await this.canAccessEvent(user, e);
      return decision.allowed ? e : null;
    }));
    return results.filter((e): e is Event => e !== null);
  }

  // --- Helpers ---

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

  private classificationHierarchy(level: ClassificationLevel): number {
    const map = {
      [ClassificationLevel.Unclassified]: 0,
      [ClassificationLevel.Confidential]: 1,
      [ClassificationLevel.Secret]: 2,
      [ClassificationLevel.TopSecret]: 3,
    };
    return map[level] || 0;
  }

}

/**
 * Create a new access control engine instance
 */
export function createAccessControlEngine(documentRegistry: DocumentRegistry): AccessControlEngine {
  return new AccessControlEngine(documentRegistry);
}
