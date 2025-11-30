/**
 * Constraint Engine module for the Semantic Operating Model
 * Validates holons, relationships, and events against document-grounded constraints
 */

import {
  HolonID,
  DocumentID,
  Timestamp,
  HolonType,
  ConstraintType,
  ConstraintHolon,
  Holon,
} from '../core/types/holon';
import { Relationship, RelationshipType } from '../core/types/relationship';
import { Event, EventType } from '../core/types/event';
import { DocumentRegistry } from '../document-registry';
import { randomUUID } from 'crypto';

export type ConstraintID = string;

/**
 * Validation result for constraint checks
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  constraintID: ConstraintID;
  message: string;
  violatedRule: string;
  affectedHolons: HolonID[];
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  constraintID: ConstraintID;
  message: string;
  affectedHolons: HolonID[];
}

/**
 * Constraint validation function type
 */
export type ValidationFunction = (
  target: Holon | Relationship | Event,
  context?: ValidationContext
) => ValidationResult;

/**
 * Context for constraint validation
 */
export interface ValidationContext {
  timestamp?: Timestamp;
  relatedHolons?: Map<HolonID, Holon>;
  relatedRelationships?: Relationship[];
  documentRegistry?: DocumentRegistry;
}

/**
 * Constraint definition with validation logic
 */
export interface Constraint {
  id: ConstraintID;
  type: ConstraintType;
  name: string;
  definition: string;
  scope: {
    holonTypes?: HolonType[];
    relationshipTypes?: RelationshipType[];
    eventTypes?: EventType[];
  };
  effectiveDates: { start: Date; end?: Date };
  sourceDocuments: DocumentID[];
  validationLogic: ValidationFunction;
  precedence: number;
  inheritanceRules?: InheritanceRule;
}

/**
 * Inheritance rule for constraint propagation
 */
export interface InheritanceRule {
  inheritsFrom?: HolonType[];
  canOverride: boolean;
  overridePrecedence?: number;
}

/**
 * Parameters for registering a new constraint
 */
export interface RegisterConstraintParams {
  type: ConstraintType;
  name: string;
  definition: string;
  scope: {
    holonTypes?: HolonType[];
    relationshipTypes?: RelationshipType[];
    eventTypes?: EventType[];
  };
  effectiveDates: { start: Date; end?: Date };
  sourceDocuments: DocumentID[];
  validationLogic: ValidationFunction;
  precedence?: number;
  inheritanceRules?: InheritanceRule;
}

/**
 * ConstraintEngine manages and enforces constraints on holons, relationships, and events
 */
export class ConstraintEngine {
  private constraints: Map<ConstraintID, Constraint>;
  private constraintsByType: Map<ConstraintType, Set<ConstraintID>>;
  private constraintsByHolonType: Map<HolonType, Set<ConstraintID>>;
  private constraintsByRelationshipType: Map<RelationshipType, Set<ConstraintID>>;
  private constraintsByEventType: Map<EventType, Set<ConstraintID>>;
  private documentRegistry: DocumentRegistry;

  constructor(documentRegistry: DocumentRegistry) {
    this.constraints = new Map();
    this.constraintsByType = new Map();
    this.constraintsByHolonType = new Map();
    this.constraintsByRelationshipType = new Map();
    this.constraintsByEventType = new Map();
    this.documentRegistry = documentRegistry;

    // Initialize type indices
    Object.values(ConstraintType).forEach(type => {
      this.constraintsByType.set(type, new Set());
    });
    Object.values(HolonType).forEach(type => {
      this.constraintsByHolonType.set(type, new Set());
    });
    Object.values(RelationshipType).forEach(type => {
      this.constraintsByRelationshipType.set(type, new Set());
    });
    Object.values(EventType).forEach(type => {
      this.constraintsByEventType.set(type, new Set());
    });
  }

  /**
   * Generate a unique UUID-based constraint ID
   */
  private generateConstraintID(): ConstraintID {
    return randomUUID();
  }

  /**
   * Register a new constraint in the engine
   */
  registerConstraint(params: RegisterConstraintParams): ConstraintID {
    const id = this.generateConstraintID();

    const constraint: Constraint = {
      id,
      type: params.type,
      name: params.name,
      definition: params.definition,
      scope: params.scope,
      effectiveDates: params.effectiveDates,
      sourceDocuments: params.sourceDocuments,
      validationLogic: params.validationLogic,
      precedence: params.precedence ?? 0,
      inheritanceRules: params.inheritanceRules,
    };

    // Store constraint
    this.constraints.set(id, constraint);

    // Update type index
    const typeSet = this.constraintsByType.get(params.type);
    if (typeSet) {
      typeSet.add(id);
    }

    // Update scope indices
    if (params.scope.holonTypes) {
      params.scope.holonTypes.forEach(holonType => {
        const holonSet = this.constraintsByHolonType.get(holonType);
        if (holonSet) {
          holonSet.add(id);
        }
      });
    }

    if (params.scope.relationshipTypes) {
      params.scope.relationshipTypes.forEach(relType => {
        const relSet = this.constraintsByRelationshipType.get(relType);
        if (relSet) {
          relSet.add(id);
        }
      });
    }

    if (params.scope.eventTypes) {
      params.scope.eventTypes.forEach(eventType => {
        const eventSet = this.constraintsByEventType.get(eventType);
        if (eventSet) {
          eventSet.add(id);
        }
      });
    }

    // Link constraint to documents in the document registry
    params.sourceDocuments.forEach(docId => {
      this.documentRegistry.linkToConstraints(docId, [id]);
    });

    return id;
  }

  /**
   * Get a constraint by its ID
   */
  getConstraint(constraintId: ConstraintID): Constraint | undefined {
    return this.constraints.get(constraintId);
  }

  /**
   * Get all constraints applicable to a holon type at a specific timestamp
   */
  getApplicableConstraints(
    holonType: HolonType,
    timestamp?: Timestamp
  ): Constraint[] {
    const constraintIds = this.constraintsByHolonType.get(holonType) || new Set();
    const constraints: Constraint[] = [];

    for (const id of constraintIds) {
      const constraint = this.constraints.get(id);
      if (constraint && this.isConstraintEffective(constraint, timestamp)) {
        constraints.push(constraint);
      }
    }

    // Sort by precedence (higher precedence first)
    return constraints.sort((a, b) => b.precedence - a.precedence);
  }

  /**
   * Get all constraints applicable to a relationship type at a specific timestamp
   */
  getApplicableRelationshipConstraints(
    relationshipType: RelationshipType,
    timestamp?: Timestamp
  ): Constraint[] {
    const constraintIds = this.constraintsByRelationshipType.get(relationshipType) || new Set();
    const constraints: Constraint[] = [];

    for (const id of constraintIds) {
      const constraint = this.constraints.get(id);
      if (constraint && this.isConstraintEffective(constraint, timestamp)) {
        constraints.push(constraint);
      }
    }

    return constraints.sort((a, b) => b.precedence - a.precedence);
  }

  /**
   * Get all constraints applicable to an event type at a specific timestamp
   */
  getApplicableEventConstraints(
    eventType: EventType,
    timestamp?: Timestamp
  ): Constraint[] {
    const constraintIds = this.constraintsByEventType.get(eventType) || new Set();
    const constraints: Constraint[] = [];

    for (const id of constraintIds) {
      const constraint = this.constraints.get(id);
      if (constraint && this.isConstraintEffective(constraint, timestamp)) {
        constraints.push(constraint);
      }
    }

    return constraints.sort((a, b) => b.precedence - a.precedence);
  }

  /**
   * Check if a constraint is effective at a given timestamp
   */
  private isConstraintEffective(constraint: Constraint, timestamp?: Timestamp): boolean {
    if (!timestamp) {
      return true; // No timestamp means check all constraints
    }

    const { start, end } = constraint.effectiveDates;
    return timestamp >= start && (!end || timestamp <= end);
  }

  /**
   * Validate a holon against applicable constraints
   */
  validateHolon(holon: Holon, context?: ValidationContext): ValidationResult {
    const timestamp = context?.timestamp || new Date();
    const constraints = this.getApplicableConstraints(holon.type, timestamp);

    // Apply inherited constraints if applicable
    const inheritedConstraints = this.getInheritedConstraints(holon.type, timestamp);
    const allConstraints = this.mergeConstraintsWithPrecedence(constraints, inheritedConstraints);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const constraint of allConstraints) {
      const result = constraint.validationLogic(holon, context);
      
      if (!result.valid) {
        if (result.errors) {
          errors.push(...result.errors);
        }
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate a relationship against applicable constraints
   */
  validateRelationship(relationship: Relationship, context?: ValidationContext): ValidationResult {
    const timestamp = context?.timestamp || relationship.effectiveStart;
    const constraints = this.getApplicableRelationshipConstraints(relationship.type, timestamp);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const constraint of constraints) {
      const result = constraint.validationLogic(relationship, context);
      
      if (!result.valid) {
        if (result.errors) {
          errors.push(...result.errors);
        }
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate an event against applicable constraints
   */
  validateEvent(event: Event, context?: ValidationContext): ValidationResult {
    const timestamp = context?.timestamp || event.occurredAt;
    const constraints = this.getApplicableEventConstraints(event.type, timestamp);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const constraint of constraints) {
      const result = constraint.validationLogic(event, context);
      
      if (!result.valid) {
        if (result.errors) {
          errors.push(...result.errors);
        }
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get inherited constraints for a holon type
   */
  private getInheritedConstraints(holonType: HolonType, timestamp: Timestamp): Constraint[] {
    const inherited: Constraint[] = [];

    for (const constraint of this.constraints.values()) {
      if (
        constraint.inheritanceRules?.inheritsFrom?.includes(holonType) &&
        this.isConstraintEffective(constraint, timestamp)
      ) {
        inherited.push(constraint);
      }
    }

    return inherited;
  }

  /**
   * Merge direct and inherited constraints, respecting precedence rules
   */
  private mergeConstraintsWithPrecedence(
    direct: Constraint[],
    inherited: Constraint[]
  ): Constraint[] {
    const merged = new Map<string, Constraint>();

    // Add inherited constraints first
    for (const constraint of inherited) {
      merged.set(constraint.name, constraint);
    }

    // Override with direct constraints based on inheritance rules
    for (const constraint of direct) {
      const existing = merged.get(constraint.name);
      
      if (!existing) {
        merged.set(constraint.name, constraint);
      } else if (existing.inheritanceRules?.canOverride) {
        // Check if direct constraint has higher precedence
        const overridePrecedence = existing.inheritanceRules.overridePrecedence ?? 0;
        if (constraint.precedence >= overridePrecedence) {
          merged.set(constraint.name, constraint);
        }
      }
    }

    return Array.from(merged.values()).sort((a, b) => b.precedence - a.precedence);
  }

  /**
   * Get all constraints of a specific type
   */
  getConstraintsByType(type: ConstraintType): Constraint[] {
    const constraintIds = this.constraintsByType.get(type) || new Set();
    const constraints: Constraint[] = [];

    for (const id of constraintIds) {
      const constraint = this.constraints.get(id);
      if (constraint) {
        constraints.push(constraint);
      }
    }

    return constraints;
  }

  /**
   * Get all constraints (for testing/debugging)
   */
  getAllConstraints(): Constraint[] {
    return Array.from(this.constraints.values());
  }

  /**
   * Clear all constraints from the engine (for testing purposes)
   */
  clear(): void {
    this.constraints.clear();
    this.constraintsByType.forEach(set => set.clear());
    this.constraintsByHolonType.forEach(set => set.clear());
    this.constraintsByRelationshipType.forEach(set => set.clear());
    this.constraintsByEventType.forEach(set => set.clear());
  }
}

