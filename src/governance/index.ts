/**
 * Governance module for the Semantic Operating Model
 * Manages schema change proposals, validation, decision logging, and impact analysis
 */

import { HolonType, DocumentID } from '../core/types/holon';
import { RelationshipType } from '../core/types/relationship';
import { randomUUID } from 'crypto';
import { DocumentRegistry, RegisterDocumentParams } from '../document-registry';
import { SchemaVersioningEngine, HolonTypeDefinition, RelationshipTypeDefinition } from '../schema-versioning';

export type ProposalID = string;

export interface SchemaChangeProposal {
  id: ProposalID;
  proposalType: 'add_holon_type' | 'add_constraint' | 'add_measure' | 'add_lens' | 'modify_type' | 'deprecate_type';
  proposedAt: Date;
  proposedBy: string; // Actor who proposed the change
  status: 'proposed' | 'approved' | 'rejected';
  
  // Completeness requirements
  referenceDocuments: DocumentID[]; // Required for all proposals
  exampleUseCases?: string[]; // Required for holon types
  collisionAnalysis?: CollisionAnalysis; // Required for holon types
  impactAnalysis?: ImpactAnalysis; // Required for all proposals
  
  // Type-specific data
  holonTypeDefinition?: HolonTypeDefinition;
  relationshipTypeDefinition?: RelationshipTypeDefinition;
  constraintDefinition?: ConstraintProposal;
  measureDefinition?: MeasureProposal;
  lensDefinition?: LensProposal;
  
  // Decision tracking
  decisionDocument?: DocumentID; // Created when approved/rejected
  decisionRationale?: string;
  decidedAt?: Date;
  decidedBy?: string;
}

export interface ConstraintProposal {
  name: string;
  type: string;
  definition: string;
  scope: {
    holonTypes?: HolonType[];
    relationshipTypes?: RelationshipType[];
    eventTypes?: string[];
  };
  validationLogic: string;
  definingDocuments: DocumentID[];
}

export interface MeasureProposal {
  name: string;
  description: string;
  unit: string;
  calculationMethod: string;
  samplingFrequency: string;
  definingDocuments: DocumentID[];
}

export interface LensProposal {
  name: string;
  description: string;
  inputMeasures: string[];
  logic: string;
  thresholds: Record<string, any>;
  outputs: string[];
  definingDocuments: DocumentID[];
}

export interface CollisionAnalysis {
  hasCollisions: boolean;
  collisions: TypeCollision[];
  analysisDate: Date;
  analysisNotes: string;
}

export interface TypeCollision {
  typeName: string;
  collisionType: 'name_conflict' | 'property_conflict' | 'semantic_overlap';
  description: string;
  affectedTypes: (HolonType | RelationshipType)[];
}

export interface ImpactAnalysis {
  affectedHolonTypes: HolonType[];
  affectedRelationshipTypes: RelationshipType[];
  affectedConstraints: string[];
  estimatedDataMigrationRequired: boolean;
  breakingChange: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  mitigationStrategies: string[];
  analysisDate: Date;
  analysisNotes: string;
}

export interface ProposalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * GovernanceEngine manages schema change proposals and decision logging
 */
export class GovernanceEngine {
  private proposals: Map<ProposalID, SchemaChangeProposal>;
  private documentRegistry: DocumentRegistry;
  private schemaVersioningEngine: SchemaVersioningEngine;

  constructor(documentRegistry: DocumentRegistry, schemaVersioningEngine: SchemaVersioningEngine) {
    this.proposals = new Map();
    this.documentRegistry = documentRegistry;
    this.schemaVersioningEngine = schemaVersioningEngine;
  }

  /**
   * Generate a unique proposal ID
   */
  private generateProposalID(): ProposalID {
    return randomUUID();
  }

  /**
   * Create a new schema change proposal
   * @param proposal - The proposal data (without id, proposedAt, status)
   * @returns The created proposal
   */
  createProposal(
    proposal: Omit<SchemaChangeProposal, 'id' | 'proposedAt' | 'status'>
  ): SchemaChangeProposal {
    const id = this.generateProposalID();
    
    const fullProposal: SchemaChangeProposal = {
      ...proposal,
      id,
      proposedAt: new Date(),
      status: 'proposed',
    };

    this.proposals.set(id, fullProposal);
    return fullProposal;
  }

  /**
   * Validate a schema change proposal for completeness
   * @param proposal - The proposal to validate
   * @returns Validation result with errors and warnings
   */
  validateProposal(proposal: SchemaChangeProposal): ProposalValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // All proposals must have reference documents
    if (!proposal.referenceDocuments || proposal.referenceDocuments.length === 0) {
      errors.push('Proposal must include at least one reference document');
    }

    // Validate based on proposal type
    switch (proposal.proposalType) {
      case 'add_holon_type':
        this.validateHolonTypeProposal(proposal, errors, warnings);
        break;
      
      case 'add_constraint':
        this.validateConstraintProposal(proposal, errors, warnings);
        break;
      
      case 'add_measure':
        this.validateMeasureProposal(proposal, errors, warnings);
        break;
      
      case 'add_lens':
        this.validateLensProposal(proposal, errors, warnings);
        break;
      
      case 'modify_type':
      case 'deprecate_type':
        this.validateTypeModificationProposal(proposal, errors, warnings);
        break;
    }

    // All proposals should have impact analysis
    if (!proposal.impactAnalysis) {
      warnings.push('Proposal should include impact analysis');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate holon type proposal completeness
   */
  private validateHolonTypeProposal(
    proposal: SchemaChangeProposal,
    errors: string[],
    warnings: string[]
  ): void {
    // Holon type proposals must have the definition
    if (!proposal.holonTypeDefinition) {
      errors.push('Holon type proposal must include holon type definition');
      return;
    }

    // Must have example use cases
    if (!proposal.exampleUseCases || proposal.exampleUseCases.length === 0) {
      errors.push('Holon type proposal must include example use cases');
    }

    // Must have collision analysis
    if (!proposal.collisionAnalysis) {
      errors.push('Holon type proposal must include collision analysis');
    }

    // Validate the holon type definition itself
    const def = proposal.holonTypeDefinition;
    if (!def.type) {
      errors.push('Holon type definition must specify a type');
    }
    if (!def.description || def.description.length < 10) {
      errors.push('Holon type definition must include a meaningful description (at least 10 characters)');
    }
    if (!def.requiredProperties || def.requiredProperties.length === 0) {
      warnings.push('Holon type definition should specify required properties');
    }
    if (!def.sourceDocuments || def.sourceDocuments.length === 0) {
      errors.push('Holon type definition must reference source documents');
    }
  }

  /**
   * Validate constraint proposal completeness
   */
  private validateConstraintProposal(
    proposal: SchemaChangeProposal,
    errors: string[],
    warnings: string[]
  ): void {
    if (!proposal.constraintDefinition) {
      errors.push('Constraint proposal must include constraint definition');
      return;
    }

    const def = proposal.constraintDefinition;
    if (!def.name || def.name.length === 0) {
      errors.push('Constraint definition must have a name');
    }
    if (!def.definition || def.definition.length < 10) {
      errors.push('Constraint definition must include a meaningful definition (at least 10 characters)');
    }
    if (!def.definingDocuments || def.definingDocuments.length === 0) {
      errors.push('Constraint definition must reference defining documents');
    }
    if (!def.validationLogic || def.validationLogic.length === 0) {
      errors.push('Constraint definition must include validation logic');
    }

    // Should have impact analysis showing affected holons/relationships
    if (!proposal.impactAnalysis) {
      errors.push('Constraint proposal must include impact analysis showing affected holons and relationships');
    }
  }

  /**
   * Validate measure proposal completeness
   */
  private validateMeasureProposal(
    proposal: SchemaChangeProposal,
    errors: string[],
    warnings: string[]
  ): void {
    if (!proposal.measureDefinition) {
      errors.push('Measure proposal must include measure definition');
      return;
    }

    const def = proposal.measureDefinition;
    if (!def.name || def.name.length === 0) {
      errors.push('Measure definition must have a name');
    }
    if (!def.description || def.description.length < 10) {
      errors.push('Measure definition must include a meaningful description (at least 10 characters)');
    }
    if (!def.definingDocuments || def.definingDocuments.length === 0) {
      errors.push('Measure definition must reference defining documents');
    }
    if (!def.unit || def.unit.length === 0) {
      warnings.push('Measure definition should specify a unit of measurement');
    }
    if (!def.calculationMethod || def.calculationMethod.length === 0) {
      errors.push('Measure definition must include calculation method');
    }

    // Check for validation against existing measures
    if (!proposal.impactAnalysis) {
      warnings.push('Measure proposal should include validation against existing measures');
    }
  }

  /**
   * Validate lens proposal completeness
   */
  private validateLensProposal(
    proposal: SchemaChangeProposal,
    errors: string[],
    warnings: string[]
  ): void {
    if (!proposal.lensDefinition) {
      errors.push('Lens proposal must include lens definition');
      return;
    }

    const def = proposal.lensDefinition;
    if (!def.name || def.name.length === 0) {
      errors.push('Lens definition must have a name');
    }
    if (!def.description || def.description.length < 10) {
      errors.push('Lens definition must include a meaningful description (at least 10 characters)');
    }
    if (!def.definingDocuments || def.definingDocuments.length === 0) {
      errors.push('Lens definition must reference defining documents');
    }
    if (!def.inputMeasures || def.inputMeasures.length === 0) {
      errors.push('Lens definition must specify input measures');
    }
    if (!def.logic || def.logic.length === 0) {
      errors.push('Lens definition must include evaluation logic');
    }
    if (!def.outputs || def.outputs.length === 0) {
      errors.push('Lens definition must specify possible outputs');
    }

    // Check for validation against existing measures
    if (!proposal.impactAnalysis) {
      warnings.push('Lens proposal should include validation against existing measures');
    }
  }

  /**
   * Validate type modification proposal
   */
  private validateTypeModificationProposal(
    proposal: SchemaChangeProposal,
    errors: string[],
    warnings: string[]
  ): void {
    // Must have impact analysis for modifications
    if (!proposal.impactAnalysis) {
      errors.push('Type modification proposal must include impact analysis');
    }

    // Should specify what is being modified
    if (!proposal.holonTypeDefinition && !proposal.relationshipTypeDefinition) {
      errors.push('Type modification proposal must specify which type is being modified');
    }
  }

  /**
   * Perform collision analysis for a holon type
   * @param holonTypeDef - The holon type definition to analyze
   * @returns Collision analysis result
   */
  performCollisionAnalysis(holonTypeDef: HolonTypeDefinition): CollisionAnalysis {
    const collisions: TypeCollision[] = [];
    
    // Use schema versioning engine to detect collisions
    const schemaCollisions = this.schemaVersioningEngine.detectHolonTypeCollisions(holonTypeDef);
    
    for (const collision of schemaCollisions) {
      collisions.push({
        typeName: collision.typeName,
        collisionType: collision.collisionReason.includes('property') ? 'property_conflict' : 'name_conflict',
        description: collision.collisionReason,
        affectedTypes: [holonTypeDef.type],
      });
    }

    return {
      hasCollisions: collisions.length > 0,
      collisions,
      analysisDate: new Date(),
      analysisNotes: collisions.length > 0 
        ? `Found ${collisions.length} collision(s) that must be resolved`
        : 'No collisions detected',
    };
  }

  /**
   * Perform impact analysis for a schema change
   * @param proposal - The proposal to analyze
   * @returns Impact analysis result
   */
  performImpactAnalysis(proposal: SchemaChangeProposal): ImpactAnalysis {
    const affectedHolonTypes: HolonType[] = [];
    const affectedRelationshipTypes: RelationshipType[] = [];
    const affectedConstraints: string[] = [];
    let breakingChange = false;
    let estimatedDataMigrationRequired = false;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const mitigationStrategies: string[] = [];

    switch (proposal.proposalType) {
      case 'add_holon_type':
        // New holon types are generally low risk
        riskLevel = 'low';
        mitigationStrategies.push('Validate holon type definition with stakeholders');
        mitigationStrategies.push('Create comprehensive documentation');
        break;

      case 'add_constraint':
        // New constraints can affect existing data
        if (proposal.constraintDefinition) {
          if (proposal.constraintDefinition.scope.holonTypes) {
            affectedHolonTypes.push(...proposal.constraintDefinition.scope.holonTypes);
          }
          if (proposal.constraintDefinition.scope.relationshipTypes) {
            affectedRelationshipTypes.push(...proposal.constraintDefinition.scope.relationshipTypes);
          }
        }
        riskLevel = 'medium';
        estimatedDataMigrationRequired = true;
        mitigationStrategies.push('Validate existing data against new constraint');
        mitigationStrategies.push('Provide grace period for compliance');
        mitigationStrategies.push('Create data remediation plan');
        break;

      case 'modify_type':
        // Type modifications can be breaking
        breakingChange = true;
        riskLevel = 'high';
        estimatedDataMigrationRequired = true;
        mitigationStrategies.push('Create migration path for existing data');
        mitigationStrategies.push('Version the type definition');
        mitigationStrategies.push('Provide backward compatibility layer');
        break;

      case 'deprecate_type':
        // Deprecation requires migration
        breakingChange = true;
        riskLevel = 'high';
        estimatedDataMigrationRequired = true;
        mitigationStrategies.push('Identify all usages of deprecated type');
        mitigationStrategies.push('Create migration timeline');
        mitigationStrategies.push('Provide alternative type or pattern');
        break;

      case 'add_measure':
      case 'add_lens':
        // Measures and lenses are generally low risk
        riskLevel = 'low';
        mitigationStrategies.push('Validate calculation logic');
        mitigationStrategies.push('Test with sample data');
        break;
    }

    return {
      affectedHolonTypes,
      affectedRelationshipTypes,
      affectedConstraints,
      estimatedDataMigrationRequired,
      breakingChange,
      riskLevel,
      mitigationStrategies,
      analysisDate: new Date(),
      analysisNotes: `Impact analysis for ${proposal.proposalType} proposal`,
    };
  }

  /**
   * Approve a schema change proposal and log the decision
   * @param proposalId - The proposal ID
   * @param decidedBy - Who approved the proposal
   * @param rationale - Rationale for approval
   * @param createdByEventId - Event ID for document creation
   * @returns The decision document
   */
  approveProposal(
    proposalId: ProposalID,
    decidedBy: string,
    rationale: string,
    createdByEventId: string
  ): DocumentID {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (proposal.status !== 'proposed') {
      throw new Error(`Proposal ${proposalId} has already been ${proposal.status}`);
    }

    // Validate proposal before approval
    const validation = this.validateProposal(proposal);
    if (!validation.isValid) {
      throw new Error(`Cannot approve invalid proposal: ${validation.errors.join(', ')}`);
    }

    // Update proposal status
    proposal.status = 'approved';
    proposal.decidedAt = new Date();
    proposal.decidedBy = decidedBy;
    proposal.decisionRationale = rationale;

    // Create decision document
    const decisionDoc = this.logDecision(proposal, 'approved', rationale, createdByEventId);
    proposal.decisionDocument = decisionDoc.id;

    // Apply the schema change through the schema versioning engine
    this.applySchemaChange(proposal);

    return decisionDoc.id;
  }

  /**
   * Reject a schema change proposal and log the decision
   * @param proposalId - The proposal ID
   * @param decidedBy - Who rejected the proposal
   * @param rationale - Rationale for rejection
   * @param createdByEventId - Event ID for document creation
   * @returns The decision document
   */
  rejectProposal(
    proposalId: ProposalID,
    decidedBy: string,
    rationale: string,
    createdByEventId: string
  ): DocumentID {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (proposal.status !== 'proposed') {
      throw new Error(`Proposal ${proposalId} has already been ${proposal.status}`);
    }

    // Update proposal status
    proposal.status = 'rejected';
    proposal.decidedAt = new Date();
    proposal.decidedBy = decidedBy;
    proposal.decisionRationale = rationale;

    // Create decision document
    const decisionDoc = this.logDecision(proposal, 'rejected', rationale, createdByEventId);
    proposal.decisionDocument = decisionDoc.id;

    return decisionDoc.id;
  }

  /**
   * Log a decision as a document
   * @param proposal - The proposal
   * @param decision - The decision (approved/rejected)
   * @param rationale - The rationale
   * @param createdByEventId - Event ID for document creation
   * @returns The created document
   */
  private logDecision(
    proposal: SchemaChangeProposal,
    decision: 'approved' | 'rejected',
    rationale: string,
    createdByEventId: string
  ): any {
    const docParams: RegisterDocumentParams = {
      referenceNumbers: [`PROPOSAL-${proposal.id}`, `DECISION-${decision.toUpperCase()}`],
      title: `Schema Change Decision: ${proposal.proposalType} - ${decision}`,
      documentType: 'Record' as any,
      version: '1.0',
      effectiveDates: {
        start: new Date(),
      },
      classificationMetadata: 'UNCLASSIFIED',
      content: JSON.stringify({
        proposalId: proposal.id,
        proposalType: proposal.proposalType,
        decision,
        rationale,
        decidedBy: proposal.decidedBy,
        decidedAt: proposal.decidedAt,
        proposedBy: proposal.proposedBy,
        proposedAt: proposal.proposedAt,
        referenceDocuments: proposal.referenceDocuments,
        impactAnalysis: proposal.impactAnalysis,
        collisionAnalysis: proposal.collisionAnalysis,
      }, null, 2),
    };

    return this.documentRegistry.registerDocument(docParams, createdByEventId);
  }

  /**
   * Apply an approved schema change
   * @param proposal - The approved proposal
   */
  private applySchemaChange(proposal: SchemaChangeProposal): void {
    switch (proposal.proposalType) {
      case 'add_holon_type':
        if (proposal.holonTypeDefinition) {
          // Create schema version and register type
          const changeType = proposal.impactAnalysis?.breakingChange ? 'breaking' : 'non-breaking';
          const version = this.schemaVersioningEngine.createSchemaVersion(
            changeType,
            `Add holon type: ${proposal.holonTypeDefinition.type}`,
            proposal.referenceDocuments[0]
          );
          
          proposal.holonTypeDefinition.schemaVersion = version.id;
          proposal.holonTypeDefinition.introducedInVersion = version.versionString;
          this.schemaVersioningEngine.registerHolonTypeDefinition(proposal.holonTypeDefinition);
        }
        break;

      case 'modify_type':
      case 'deprecate_type':
        // These would be handled by the schema versioning engine
        // For now, just create a new version
        const changeType = proposal.impactAnalysis?.breakingChange ? 'breaking' : 'non-breaking';
        this.schemaVersioningEngine.createSchemaVersion(
          changeType,
          `${proposal.proposalType}: ${proposal.decisionRationale}`,
          proposal.referenceDocuments[0]
        );
        break;

      // Other proposal types would be handled by their respective engines
      case 'add_constraint':
      case 'add_measure':
      case 'add_lens':
        // These would integrate with constraint engine, measure engine, etc.
        break;
    }
  }

  /**
   * Get a proposal by ID
   * @param proposalId - The proposal ID
   * @returns The proposal if found
   */
  getProposal(proposalId: ProposalID): SchemaChangeProposal | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * Get all proposals
   * @returns Array of all proposals
   */
  getAllProposals(): SchemaChangeProposal[] {
    return Array.from(this.proposals.values());
  }

  /**
   * Get proposals by status
   * @param status - The status to filter by
   * @returns Array of proposals with the given status
   */
  getProposalsByStatus(status: 'proposed' | 'approved' | 'rejected'): SchemaChangeProposal[] {
    return Array.from(this.proposals.values()).filter(p => p.status === status);
  }

  /**
   * Clear all proposals (for testing)
   */
  clear(): void {
    this.proposals.clear();
  }
}
