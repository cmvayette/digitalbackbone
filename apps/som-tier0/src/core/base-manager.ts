/**
 * Base Manager class for all domain managers.
 * Eliminates duplicate constructor patterns across PersonManager, OrganizationManager, etc.
 */

import { IHolonRepository } from './interfaces/holon-repository';
import { RelationshipRegistry } from '../relationship-registry';
import { IEventStore } from '../event-store';
import { ConstraintEngine, ValidationResult } from '../constraint-engine';
import {
  OperationResult,
  ValidationError,
  ValidationWarning,
  HolonID,
  EventID,
} from '@som/shared-types';

/**
 * Dependencies required by all managers.
 * Use this interface when constructing managers.
 *
 * @example
 * const deps: ManagerDependencies = {
 *   holonRegistry,
 *   relationshipRegistry,
 *   eventStore,
 *   constraintEngine,
 * };
 * const personManager = new PersonManager(deps);
 */
export interface ManagerDependencies {
  holonRegistry: IHolonRepository;
  relationshipRegistry: RelationshipRegistry;
  eventStore: IEventStore;
  constraintEngine: ConstraintEngine;
}

/**
 * Abstract base class for all domain managers.
 * Provides common dependencies and helper methods.
 *
 * @example
 * export class PersonManager extends BaseManager {
 *   constructor(deps: ManagerDependencies) {
 *     super(deps);
 *   }
 *
 *   async createPerson(params: CreatePersonParams): Promise<OperationResult> {
 *     // ... implementation
 *     return this.successResult(personId, eventId);
 *   }
 * }
 */
export abstract class BaseManager {
  protected holonRegistry: IHolonRepository;
  protected relationshipRegistry: RelationshipRegistry;
  protected eventStore: IEventStore;
  protected constraintEngine: ConstraintEngine;

  constructor(deps: ManagerDependencies) {
    this.holonRegistry = deps.holonRegistry;
    this.relationshipRegistry = deps.relationshipRegistry;
    this.eventStore = deps.eventStore;
    this.constraintEngine = deps.constraintEngine;
  }

  /**
   * Create a successful operation result.
   */
  protected successResult(
    holonID?: HolonID,
    eventID?: EventID,
    relationshipID?: string
  ): OperationResult {
    return {
      success: true,
      holonID,
      eventID,
      relationshipID,
      validation: { valid: true, errors: [], warnings: [] },
    };
  }

  /**
   * Create a failed operation result from validation errors.
   */
  protected failureResult(
    errors: ValidationError[],
    warnings: ValidationWarning[] = []
  ): OperationResult {
    return {
      success: false,
      validation: { valid: false, errors, warnings },
    };
  }

  /**
   * Create a failed operation result from a constraint validation result.
   */
  protected failureFromValidation(validation: ValidationResult): OperationResult {
    return {
      success: false,
      validation: {
        valid: false,
        errors: (validation.errors || []).map((e) => ({
          code: e.constraintID || 'VALIDATION_ERROR',
          message: e.message,
          field: undefined,
          constraint: e.violatedRule,
        })),
        warnings: (validation.warnings || []).map((w) => ({
          code: w.constraintID || 'VALIDATION_WARNING',
          message: w.message,
        })),
      },
    };
  }

  /**
   * Create a simple validation error.
   */
  protected validationError(
    code: string,
    message: string,
    field?: string
  ): ValidationError {
    return { code, message, field };
  }
}
