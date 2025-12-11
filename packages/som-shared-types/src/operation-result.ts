/**
 * Generic operation result types for all manager operations.
 * Eliminates duplication across PersonOperationResult, OrganizationOperationResult, etc.
 */

import { HolonID, EventID } from './holon.js';

/**
 * Validation error from constraint or schema validation
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  constraint?: string;
}

/**
 * Validation warning (non-blocking)
 */
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

/**
 * Result of validation checks
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Generic operation result for all manager operations.
 *
 * @typeParam T - Optional metadata type for operation-specific data
 *
 * @example
 * // Basic usage
 * const result: OperationResult = await manager.createPerson(params);
 * if (result.success) {
 *   console.log('Created:', result.holonID);
 * }
 *
 * @example
 * // With metadata
 * interface AssignmentMetadata { previousPosition?: string; }
 * const result: OperationResult<AssignmentMetadata> = await manager.assignPerson(params);
 */
export interface OperationResult<T extends Record<string, unknown> = Record<string, never>> {
  /** Whether the operation succeeded */
  success: boolean;

  /** ID of the created/affected holon (if applicable) */
  holonID?: HolonID;

  /** ID of the created/affected relationship (if applicable) */
  relationshipID?: string;

  /** ID of the event that recorded this operation */
  eventID?: EventID;

  /** Validation results */
  validation: ValidationResult;

  /** Operation-specific metadata */
  metadata?: T;
}

/**
 * Helper to create a successful operation result
 */
export function successResult(
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
 * Helper to create a failed operation result
 */
export function failureResult(
  errors: ValidationError[],
  warnings: ValidationWarning[] = []
): OperationResult {
  return {
    success: false,
    validation: { valid: false, errors, warnings },
  };
}

/**
 * Helper to create a validation error
 */
export function validationError(
  code: string,
  message: string,
  field?: string,
  constraint?: string
): ValidationError {
  return { code, message, field, constraint };
}

/**
 * Helper to create a validation warning
 */
export function validationWarning(
  code: string,
  message: string,
  field?: string
): ValidationWarning {
  return { code, message, field };
}
