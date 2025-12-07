/**
 * Schema Versioning module for the Semantic Operating Model
 * Manages schema evolution, version tracking, and type collision detection
 */

import { HolonType, DocumentID } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';
import { randomUUID } from 'crypto';

export type SchemaVersionID = string;

export interface SchemaVersion {
  id: SchemaVersionID;
  majorVersion: number;
  minorVersion: number;
  versionString: string; // e.g., "1.2"
  createdAt: Date;
  description: string;
  changeType: 'breaking' | 'non-breaking';
  sourceDocument?: DocumentID;
  previousVersion?: SchemaVersionID;
}

export interface HolonTypeDefinition {
  type: HolonType;
  schemaVersion: SchemaVersionID;
  requiredProperties: string[];
  optionalProperties: string[];
  description: string;
  sourceDocuments: DocumentID[];
  introducedInVersion: string;
  deprecatedInVersion?: string;
}

export interface RelationshipTypeDefinition {
  type: RelationshipType;
  schemaVersion: SchemaVersionID;
  sourceHolonTypes: HolonType[];
  targetHolonTypes: HolonType[];
  multiplicityConstraints?: {
    sourceMin?: number;
    sourceMax?: number;
    targetMin?: number;
    targetMax?: number;
  };
  description: string;
  sourceDocuments: DocumentID[];
  introducedInVersion: string;
  deprecatedInVersion?: string;
}

export interface TypeCollision {
  typeName: string;
  existingDefinition: HolonTypeDefinition | RelationshipTypeDefinition;
  proposedDefinition: HolonTypeDefinition | RelationshipTypeDefinition;
  collisionReason: string;
}

export interface SchemaChangeProposal {
  id: string;
  proposalType: 'add_holon_type' | 'add_relationship_type' | 'modify_type' | 'deprecate_type';
  changeDescription: string;
  isBreaking: boolean;
  holonTypeDefinition?: HolonTypeDefinition;
  relationshipTypeDefinition?: RelationshipTypeDefinition;
  sourceDocument?: DocumentID;
  proposedAt: Date;
  status: 'proposed' | 'approved' | 'rejected';
}

export interface MigrationPath {
  fromVersion: string;
  toVersion: string;
  migrationSteps: MigrationStep[];
  isBreaking: boolean;
}

export interface MigrationStep {
  stepNumber: number;
  description: string;
  transformationLogic: string;
  affectedTypes: (HolonType | RelationshipType)[];
}

/**
 * SchemaVersioningEngine manages schema evolution and version tracking
 */
export class SchemaVersioningEngine {
  private versions: Map<SchemaVersionID, SchemaVersion>;
  private holonTypeDefinitions: Map<HolonType, HolonTypeDefinition[]>; // Type -> versions
  private relationshipTypeDefinitions: Map<RelationshipType, RelationshipTypeDefinition[]>;
  private currentVersion: SchemaVersion;
  private proposals: Map<string, SchemaChangeProposal>;
  private migrationPaths: Map<string, MigrationPath>; // Key: "fromVersion->toVersion"

  constructor() {
    this.versions = new Map();
    this.holonTypeDefinitions = new Map();
    this.relationshipTypeDefinitions = new Map();
    this.proposals = new Map();
    this.migrationPaths = new Map();

    // Initialize with version 1.0
    this.currentVersion = this.createInitialVersion();
    this.versions.set(this.currentVersion.id, this.currentVersion);
  }

  /**
   * Create the initial schema version (1.0)
   */
  private createInitialVersion(): SchemaVersion {
    return {
      id: randomUUID(),
      majorVersion: 1,
      minorVersion: 0,
      versionString: '1.0',
      createdAt: new Date(),
      description: 'Initial schema version',
      changeType: 'non-breaking',
    };
  }

  /**
   * Generate a unique schema version ID
   */
  private generateVersionID(): SchemaVersionID {
    return randomUUID();
  }

  /**
   * Create a new schema version
   * @param changeType - Whether this is a breaking or non-breaking change
   * @param description - Description of the changes
   * @param sourceDocument - Optional document authorizing the change
   * @returns The new schema version
   */
  createSchemaVersion(
    changeType: 'breaking' | 'non-breaking',
    description: string,
    sourceDocument?: DocumentID
  ): SchemaVersion {
    const id = this.generateVersionID();
    
    let majorVersion = this.currentVersion.majorVersion;
    let minorVersion = this.currentVersion.minorVersion;

    // Increment version based on change type
    if (changeType === 'breaking') {
      majorVersion += 1;
      minorVersion = 0;
    } else {
      minorVersion += 1;
    }

    const newVersion: SchemaVersion = {
      id,
      majorVersion,
      minorVersion,
      versionString: `${majorVersion}.${minorVersion}`,
      createdAt: new Date(),
      description,
      changeType,
      sourceDocument,
      previousVersion: this.currentVersion.id,
    };

    this.versions.set(id, newVersion);
    this.currentVersion = newVersion;

    return newVersion;
  }

  /**
   * Get the current schema version
   */
  getCurrentVersion(): SchemaVersion {
    return this.currentVersion;
  }

  /**
   * Get a specific schema version by ID
   */
  getVersion(versionId: SchemaVersionID): SchemaVersion | undefined {
    return this.versions.get(versionId);
  }

  /**
   * Get all schema versions
   */
  getAllVersions(): SchemaVersion[] {
    return Array.from(this.versions.values()).sort((a, b) => {
      if (a.majorVersion !== b.majorVersion) {
        return a.majorVersion - b.majorVersion;
      }
      return a.minorVersion - b.minorVersion;
    });
  }

  /**
   * Register a holon type definition
   * @param definition - The holon type definition
   */
  registerHolonTypeDefinition(definition: HolonTypeDefinition): void {
    const existing = this.holonTypeDefinitions.get(definition.type) || [];
    existing.push(definition);
    this.holonTypeDefinitions.set(definition.type, existing);
  }

  /**
   * Register a relationship type definition
   * @param definition - The relationship type definition
   */
  registerRelationshipTypeDefinition(definition: RelationshipTypeDefinition): void {
    const existing = this.relationshipTypeDefinitions.get(definition.type) || [];
    existing.push(definition);
    this.relationshipTypeDefinitions.set(definition.type, existing);
  }

  /**
   * Get all definitions for a holon type across versions
   * @param type - The holon type
   * @returns Array of definitions for this type
   */
  getHolonTypeDefinitions(type: HolonType): HolonTypeDefinition[] {
    return this.holonTypeDefinitions.get(type) || [];
  }

  /**
   * Get the current definition for a holon type
   * @param type - The holon type
   * @returns The most recent non-deprecated definition
   */
  getCurrentHolonTypeDefinition(type: HolonType): HolonTypeDefinition | undefined {
    const definitions = this.holonTypeDefinitions.get(type) || [];
    // Return the most recent non-deprecated definition
    return definitions
      .filter(def => !def.deprecatedInVersion)
      .sort((a, b) => {
        const [aMajor, aMinor] = a.introducedInVersion.split('.').map(Number);
        const [bMajor, bMinor] = b.introducedInVersion.split('.').map(Number);
        if (aMajor !== bMajor) return bMajor - aMajor;
        return bMinor - aMinor;
      })[0];
  }

  /**
   * Get all definitions for a relationship type across versions
   * @param type - The relationship type
   * @returns Array of definitions for this type
   */
  getRelationshipTypeDefinitions(type: RelationshipType): RelationshipTypeDefinition[] {
    return this.relationshipTypeDefinitions.get(type) || [];
  }

  /**
   * Detect collisions when adding a new holon type
   * @param proposedDefinition - The proposed holon type definition
   * @returns Array of detected collisions
   */
  detectHolonTypeCollisions(proposedDefinition: HolonTypeDefinition): TypeCollision[] {
    const collisions: TypeCollision[] = [];
    const existingDefinitions = this.holonTypeDefinitions.get(proposedDefinition.type) || [];

    for (const existing of existingDefinitions) {
      // Skip deprecated definitions
      if (existing.deprecatedInVersion) {
        continue;
      }

      // Check if the type already exists in the current version
      if (existing.schemaVersion === this.currentVersion.id) {
        collisions.push({
          typeName: proposedDefinition.type,
          existingDefinition: existing,
          proposedDefinition,
          collisionReason: `Type ${proposedDefinition.type} already exists in current schema version`,
        });
      }

      // Check for incompatible property changes
      const existingRequired = new Set(existing.requiredProperties);
      const proposedRequired = new Set(proposedDefinition.requiredProperties);
      
      // Check if required properties are being removed (breaking change)
      for (const prop of existingRequired) {
        if (!proposedRequired.has(prop) && !proposedDefinition.optionalProperties.includes(prop)) {
          collisions.push({
            typeName: proposedDefinition.type,
            existingDefinition: existing,
            proposedDefinition,
            collisionReason: `Required property '${prop}' is being removed, which is a breaking change`,
          });
        }
      }
    }

    return collisions;
  }

  /**
   * Detect collisions when adding a new relationship type
   * @param proposedDefinition - The proposed relationship type definition
   * @returns Array of detected collisions
   */
  detectRelationshipTypeCollisions(proposedDefinition: RelationshipTypeDefinition): TypeCollision[] {
    const collisions: TypeCollision[] = [];
    const existingDefinitions = this.relationshipTypeDefinitions.get(proposedDefinition.type) || [];

    for (const existing of existingDefinitions) {
      // Skip deprecated definitions
      if (existing.deprecatedInVersion) {
        continue;
      }

      // Check if the type already exists in the current version
      if (existing.schemaVersion === this.currentVersion.id) {
        collisions.push({
          typeName: proposedDefinition.type,
          existingDefinition: existing,
          proposedDefinition,
          collisionReason: `Relationship type ${proposedDefinition.type} already exists in current schema version`,
        });
      }

      // Check for incompatible holon type changes
      const existingSourceTypes = new Set(existing.sourceHolonTypes);
      const proposedSourceTypes = new Set(proposedDefinition.sourceHolonTypes);
      
      // Check if source types are being restricted (potentially breaking)
      if (proposedSourceTypes.size < existingSourceTypes.size) {
        const removed = Array.from(existingSourceTypes).filter(t => !proposedSourceTypes.has(t));
        if (removed.length > 0) {
          collisions.push({
            typeName: proposedDefinition.type,
            existingDefinition: existing,
            proposedDefinition,
            collisionReason: `Source holon types are being restricted (removed: ${removed.join(', ')}), which may be a breaking change`,
          });
        }
      }
    }

    return collisions;
  }

  /**
   * Create a schema change proposal
   * @param proposal - The schema change proposal
   * @returns The created proposal
   */
  createProposal(proposal: Omit<SchemaChangeProposal, 'id' | 'proposedAt' | 'status'>): SchemaChangeProposal {
    const fullProposal: SchemaChangeProposal = {
      ...proposal,
      id: randomUUID(),
      proposedAt: new Date(),
      status: 'proposed',
    };

    this.proposals.set(fullProposal.id, fullProposal);
    return fullProposal;
  }

  /**
   * Approve a schema change proposal
   * @param proposalId - The proposal ID
   */
  approveProposal(proposalId: string): void {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    proposal.status = 'approved';

    // Create a new schema version if this is a breaking change
    if (proposal.isBreaking) {
      this.createSchemaVersion('breaking', proposal.changeDescription, proposal.sourceDocument);
    } else {
      this.createSchemaVersion('non-breaking', proposal.changeDescription, proposal.sourceDocument);
    }

    // Register the new type definitions
    if (proposal.holonTypeDefinition) {
      proposal.holonTypeDefinition.schemaVersion = this.currentVersion.id;
      this.registerHolonTypeDefinition(proposal.holonTypeDefinition);
    }

    if (proposal.relationshipTypeDefinition) {
      proposal.relationshipTypeDefinition.schemaVersion = this.currentVersion.id;
      this.registerRelationshipTypeDefinition(proposal.relationshipTypeDefinition);
    }
  }

  /**
   * Reject a schema change proposal
   * @param proposalId - The proposal ID
   */
  rejectProposal(proposalId: string): void {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    proposal.status = 'rejected';
  }

  /**
   * Get a proposal by ID
   * @param proposalId - The proposal ID
   */
  getProposal(proposalId: string): SchemaChangeProposal | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * Get all proposals
   */
  getAllProposals(): SchemaChangeProposal[] {
    return Array.from(this.proposals.values());
  }

  /**
   * Register a migration path between versions
   * @param migrationPath - The migration path
   */
  registerMigrationPath(migrationPath: MigrationPath): void {
    const key = `${migrationPath.fromVersion}->${migrationPath.toVersion}`;
    this.migrationPaths.set(key, migrationPath);
  }

  /**
   * Get a migration path between two versions
   * @param fromVersion - The source version
   * @param toVersion - The target version
   * @returns The migration path if it exists
   */
  getMigrationPath(fromVersion: string, toVersion: string): MigrationPath | undefined {
    const key = `${fromVersion}->${toVersion}`;
    return this.migrationPaths.get(key);
  }

  /**
   * Get all migration paths
   */
  getAllMigrationPaths(): MigrationPath[] {
    return Array.from(this.migrationPaths.values());
  }

  /**
   * Deprecate a holon type in the current version
   * @param type - The holon type to deprecate
   */
  deprecateHolonType(type: HolonType): void {
    const currentDef = this.getCurrentHolonTypeDefinition(type);
    if (currentDef) {
      currentDef.deprecatedInVersion = this.currentVersion.versionString;
    }
  }

  /**
   * Deprecate a relationship type in the current version
   * @param type - The relationship type to deprecate
   */
  deprecateRelationshipType(type: RelationshipType): void {
    const definitions = this.relationshipTypeDefinitions.get(type) || [];
    const currentDef = definitions
      .filter(def => !def.deprecatedInVersion)
      .sort((a, b) => {
        const [aMajor, aMinor] = a.introducedInVersion.split('.').map(Number);
        const [bMajor, bMinor] = b.introducedInVersion.split('.').map(Number);
        if (aMajor !== bMajor) return bMajor - aMajor;
        return bMinor - aMinor;
      })[0];

    if (currentDef) {
      currentDef.deprecatedInVersion = this.currentVersion.versionString;
    }
  }

  /**
   * Clear all data (for testing purposes)
   */
  clear(): void {
    this.versions.clear();
    this.holonTypeDefinitions.clear();
    this.relationshipTypeDefinitions.clear();
    this.proposals.clear();
    this.migrationPaths.clear();
    this.currentVersion = this.createInitialVersion();
    this.versions.set(this.currentVersion.id, this.currentVersion);
  }
}

/**
 * Export a singleton instance for convenience
 */
export const schemaVersioningEngine = new SchemaVersioningEngine();
