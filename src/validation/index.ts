/**
 * Validation and Error Handling module for the Semantic Operating Model
 * Provides comprehensive validation with detailed error reporting, temporal constraint validation,
 * batch event validation with atomicity, and compensating event support
 */

import { Event, EventType } from '../core/types/event';
import { EventID, HolonID, Timestamp, DocumentID } from '../core/types/holon';
import { ConstraintEngine, ValidationResult, ValidationError, ValidationContext } from '../constraint-engine';
import { EventStore } from '../event-store';
import { DocumentRegistry } from '../document-registry';
import { randomUUID } from 'crypto';

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  Validation = 'VALIDATION',
  Temporal = 'TEMPORAL',
  Authorization = 'AUTHORIZATION',
  Consistency = 'CONSISTENCY',
  Integration = 'INTEGRATION',
}

/**
 * Detailed validation error with categorization
 */
export interface DetailedValidationError extends ValidationError {
  category: ErrorCategory;
  timestamp: Timestamp;
  eventId?: EventID;
  context?: Record<string, any>;
}

/**
 * Enhanced validation result with detailed errors
 */
export interface EnhancedValidationResult extends ValidationResult {
  errors?: DetailedValidationError[];
  timestamp: Timestamp;
  documentsUsed: DocumentID[];
}

/**
 * Batch validation result
 */
export interface BatchValidationResult {
  valid: boolean;
  validatedCount: number;
  errors: Map<number, DetailedValidationError[]>; // Index -> errors
  timestamp: Timestamp;
}

/**
 * Compensating event metadata
 */
export interface CompensatingEventMetadata {
  originalEventId: EventID;
  reason: string;
  correctionType: 'reversal' | 'adjustment' | 'cancellation';
  authorizedBy: HolonID;
}

/**
 * Validation log entry
 */
export interface ValidationLogEntry {
  id: string;
  timestamp: Timestamp;
  eventId?: EventID;
  result: EnhancedValidationResult;
  category: ErrorCategory;
}

/**
 * ValidationEngine provides comprehensive validation and error handling
 */
export class ValidationEngine {
  private constraintEngine: ConstraintEngine;
  private eventStore: EventStore;
  private documentRegistry: DocumentRegistry;
  private validationLog: ValidationLogEntry[] = [];

  constructor(
    constraintEngine: ConstraintEngine,
    eventStore: EventStore,
    documentRegistry: DocumentRegistry
  ) {
    this.constraintEngine = constraintEngine;
    this.eventStore = eventStore;
    this.documentRegistry = documentRegistry;
  }

  /**
   * Validate an event with detailed error reporting
   * Uses documents in force at the event timestamp for validation
   */
  validateEventWithDetails(event: Event): EnhancedValidationResult {
    const timestamp = event.occurredAt;
    
    // Get documents in force at event timestamp
    const documentsInForce = this.documentRegistry.getDocumentsInForce(timestamp);
    const documentIds = documentsInForce.map(doc => doc.id);

    // Create validation context with temporal information
    const context: ValidationContext = {
      timestamp,
      documentRegistry: this.documentRegistry,
    };

    // Validate using constraint engine with temporal context
    const baseResult = this.constraintEngine.validateEvent(event, context);

    // Enhance errors with categorization and context
    const enhancedErrors: DetailedValidationError[] = [];
    
    if (baseResult.errors) {
      for (const error of baseResult.errors) {
        enhancedErrors.push({
          ...error,
          category: this.categorizeError(error, event),
          timestamp,
          eventId: event.id,
          context: {
            eventType: event.type,
            occurredAt: event.occurredAt,
            actor: event.actor,
            subjects: event.subjects,
          },
        });
      }
    }

    const result: EnhancedValidationResult = {
      valid: baseResult.valid,
      errors: enhancedErrors.length > 0 ? enhancedErrors : undefined,
      warnings: baseResult.warnings,
      timestamp,
      documentsUsed: documentIds,
    };

    // Log validation result
    this.logValidation(event.id, result);

    return result;
  }

  /**
   * Validate a batch of events atomically
   * All events must be valid or the entire batch is rejected
   */
  validateBatch(events: Omit<Event, 'id' | 'recordedAt'>[]): BatchValidationResult {
    const timestamp = new Date();
    const errors = new Map<number, DetailedValidationError[]>();
    let allValid = true;

    // Validate each event in the batch
    for (let i = 0; i < events.length; i++) {
      const eventData = events[i];
      
      // Create temporary event for validation
      const tempEvent: Event = {
        ...eventData,
        id: `temp-${i}`,
        recordedAt: timestamp,
      };

      const result = this.validateEventWithDetails(tempEvent);
      
      if (!result.valid && result.errors) {
        errors.set(i, result.errors);
        allValid = false;
      }
    }

    return {
      valid: allValid,
      validatedCount: events.length,
      errors,
      timestamp,
    };
  }

  /**
   * Create a compensating event to correct a previous event
   */
  createCompensatingEvent(
    originalEventId: EventID,
    metadata: CompensatingEventMetadata,
    correctionPayload: Record<string, any>
  ): Omit<Event, 'id' | 'recordedAt'> {
    const originalEvent = this.eventStore.getEvent(originalEventId);
    
    if (!originalEvent) {
      throw new Error(`Original event ${originalEventId} not found`);
    }

    // Determine compensating event type based on correction type
    const compensatingType = this.getCompensatingEventType(
      originalEvent.type,
      metadata.correctionType
    );

    // Create compensating event
    const compensatingEvent: Omit<Event, 'id' | 'recordedAt'> = {
      type: compensatingType,
      occurredAt: new Date(),
      actor: metadata.authorizedBy,
      subjects: originalEvent.subjects,
      payload: {
        ...correctionPayload,
        compensatingMetadata: {
          originalEventId,
          reason: metadata.reason,
          correctionType: metadata.correctionType,
          originalPayload: originalEvent.payload,
        },
      },
      sourceSystem: 'SOM-Validation',
      sourceDocument: originalEvent.sourceDocument,
      validityWindow: originalEvent.validityWindow,
      causalLinks: {
        causedBy: [originalEventId],
      },
    };

    return compensatingEvent;
  }

  /**
   * Validate temporal constraints using documents in force at event timestamp
   */
  validateTemporalConstraints(event: Event): EnhancedValidationResult {
    const timestamp = event.occurredAt;
    
    // Validate timestamp is within acceptable range
    const now = new Date();
    const maxPast = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    const maxFuture = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour ahead
    
    const errors: DetailedValidationError[] = [];
    
    if (timestamp < maxPast) {
      errors.push({
        constraintID: 'TEMPORAL-001',
        message: 'Event timestamp is too far in the past',
        violatedRule: 'Events must be within 1 year of current time',
        affectedHolons: event.subjects,
        category: ErrorCategory.Temporal,
        timestamp: now,
        eventId: event.id,
        context: { occurredAt: timestamp, maxPast },
      });
    }
    
    if (timestamp > maxFuture) {
      errors.push({
        constraintID: 'TEMPORAL-002',
        message: 'Event timestamp is too far in the future',
        violatedRule: 'Events cannot be more than 1 hour in the future',
        affectedHolons: event.subjects,
        category: ErrorCategory.Temporal,
        timestamp: now,
        eventId: event.id,
        context: { occurredAt: timestamp, maxFuture },
      });
    }

    // Get documents in force at event timestamp
    const documentsInForce = this.documentRegistry.getDocumentsInForce(timestamp);
    const documentIds = documentsInForce.map(doc => doc.id);

    // Validate event ordering if there are causal links
    if (event.causalLinks.precededBy || event.causalLinks.causedBy) {
      const precedingEventIds = [
        ...(event.causalLinks.precededBy || []),
        ...(event.causalLinks.causedBy || []),
      ];

      for (const precedingId of precedingEventIds) {
        const precedingEvent = this.eventStore.getEvent(precedingId);
        
        if (precedingEvent && precedingEvent.occurredAt > timestamp) {
          errors.push({
            constraintID: 'TEMPORAL-003',
            message: 'Event occurs before its causal predecessor',
            violatedRule: 'Events must occur after their causal predecessors',
            affectedHolons: event.subjects,
            category: ErrorCategory.Temporal,
            timestamp: now,
            eventId: event.id,
            context: {
              eventTime: timestamp,
              precedingEventId: precedingId,
              precedingEventTime: precedingEvent.occurredAt,
            },
          });
        }
      }
    }

    // Validate validity window if present
    if (event.validityWindow) {
      if (event.validityWindow.start > event.validityWindow.end) {
        errors.push({
          constraintID: 'TEMPORAL-004',
          message: 'Validity window start is after end',
          violatedRule: 'Validity window start must be before or equal to end',
          affectedHolons: event.subjects,
          category: ErrorCategory.Temporal,
          timestamp: now,
          eventId: event.id,
          context: { validityWindow: event.validityWindow },
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now,
      documentsUsed: documentIds,
    };
  }

  /**
   * Get validation log entries
   */
  getValidationLog(filter?: {
    startTime?: Timestamp;
    endTime?: Timestamp;
    category?: ErrorCategory;
    eventId?: EventID;
  }): ValidationLogEntry[] {
    let filtered = this.validationLog;

    if (filter) {
      if (filter.startTime) {
        filtered = filtered.filter(entry => entry.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        filtered = filtered.filter(entry => entry.timestamp <= filter.endTime!);
      }
      if (filter.category) {
        filtered = filtered.filter(entry => entry.category === filter.category);
      }
      if (filter.eventId) {
        filtered = filtered.filter(entry => entry.eventId === filter.eventId);
      }
    }

    return filtered;
  }

  /**
   * Categorize an error based on its characteristics
   */
  private categorizeError(error: ValidationError, event: Event): ErrorCategory {
    // Check for temporal-related errors
    if (
      error.violatedRule.toLowerCase().includes('time') ||
      error.violatedRule.toLowerCase().includes('date') ||
      error.violatedRule.toLowerCase().includes('temporal')
    ) {
      return ErrorCategory.Temporal;
    }

    // Check for consistency-related errors
    if (
      error.violatedRule.toLowerCase().includes('cycle') ||
      error.violatedRule.toLowerCase().includes('circular') ||
      error.violatedRule.toLowerCase().includes('orphan')
    ) {
      return ErrorCategory.Consistency;
    }

    // Check for authorization-related errors
    if (
      error.violatedRule.toLowerCase().includes('permission') ||
      error.violatedRule.toLowerCase().includes('authorization') ||
      error.violatedRule.toLowerCase().includes('access')
    ) {
      return ErrorCategory.Authorization;
    }

    // Default to validation error
    return ErrorCategory.Validation;
  }

  /**
   * Log a validation result
   */
  private logValidation(eventId: EventID | undefined, result: EnhancedValidationResult): void {
    const category = result.errors && result.errors.length > 0
      ? result.errors[0].category
      : ErrorCategory.Validation;

    const entry: ValidationLogEntry = {
      id: randomUUID(),
      timestamp: new Date(),
      eventId,
      result,
      category,
    };

    this.validationLog.push(entry);
  }

  /**
   * Determine the compensating event type based on original event and correction type
   */
  private getCompensatingEventType(
    originalType: EventType,
    correctionType: 'reversal' | 'adjustment' | 'cancellation'
  ): EventType {
    // Map original event types to their compensating types
    // For now, we'll use a simple mapping - in production this would be more sophisticated
    
    if (correctionType === 'cancellation') {
      // Most events can be cancelled with a generic cancellation event
      return EventType.TaskCancelled; // Using as a generic cancellation type
    }

    // For reversals and adjustments, we need specific compensating events
    // This is a simplified mapping - production would have more comprehensive mappings
    const compensatingMap: Partial<Record<EventType, EventType>> = {
      [EventType.AssignmentStarted]: EventType.AssignmentEnded,
      [EventType.QualificationAwarded]: EventType.QualificationRevoked,
      [EventType.TaskStarted]: EventType.TaskCompleted,
      [EventType.MissionLaunched]: EventType.MissionCompleted,
    };

    return compensatingMap[originalType] || EventType.AssignmentCorrected;
  }

  /**
   * Clear validation log (for testing)
   */
  clearLog(): void {
    this.validationLog = [];
  }
}

/**
 * Create a new validation engine instance
 */
export function createValidationEngine(
  constraintEngine: ConstraintEngine,
  eventStore: EventStore,
  documentRegistry: DocumentRegistry
): ValidationEngine {
  return new ValidationEngine(constraintEngine, eventStore, documentRegistry);
}
