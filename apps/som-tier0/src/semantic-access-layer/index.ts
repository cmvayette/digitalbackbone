/**
 * Semantic Access Layer module for the Semantic Operating Model
 * Maps external system data to SOM holons and events
 */

import { HolonID, DocumentID, Timestamp } from '@som/shared-types';
import { Event, EventType } from '@som/shared-types';
import { IEventStore as EventStore } from '../event-store';
import { ConstraintEngine, ValidationResult } from '../constraint-engine';
import { IHolonRepository as HolonRegistry } from '../core/interfaces/holon-repository';
import { DocumentRegistry } from '../document-registry';

/**
 * External system identifier
 */
export type ExternalSystemID = string;
export type ExternalEntityID = string;

/**
 * ID mapping between external system IDs and SOM holon IDs
 */
export interface IDMapping {
  externalSystem: ExternalSystemID;
  externalID: ExternalEntityID;
  holonID: HolonID;
  createdAt: Timestamp;
  lastVerified?: Timestamp;
  confidence: number; // 0-1 scale
}

/**
 * External data submission format
 */
export interface ExternalData {
  externalSystem: ExternalSystemID;
  externalID: ExternalEntityID;
  dataType: string;
  payload: Record<string, any>;
  timestamp: Timestamp;
  sourceDocument?: DocumentID;
}

/**
 * Conflict resolution strategy
 */
export enum ConflictResolutionStrategy {
  DocumentPrecedence = 'DocumentPrecedence', // Use document-grounded precedence rules
  MostRecent = 'MostRecent', // Use most recent data
  HighestConfidence = 'HighestConfidence', // Use highest confidence mapping
  Manual = 'Manual', // Require manual resolution
}

/**
 * Conflict detected during data transformation
 */
export interface DataConflict {
  externalSystem: ExternalSystemID;
  externalID: ExternalEntityID;
  conflictType: 'duplicate_mapping' | 'inconsistent_data' | 'validation_failure';
  description: string;
  conflictingData: ExternalData[];
  suggestedResolution?: HolonID;
}

/**
 * Result of external data transformation
 */
export interface TransformationResult {
  success: boolean;
  events: Event[];
  holonID?: HolonID;
  errors?: string[];
  conflicts?: DataConflict[];
}

/**
 * Precedence rule for conflict resolution
 */
export interface PrecedenceRule {
  sourceDocument: DocumentID;
  externalSystems: ExternalSystemID[];
  priority: number; // Higher number = higher priority
  effectiveDates: { start: Date; end?: Date };
}

/**
 * Semantic Access Layer - Maps external system data to SOM holons and events
 */
export class SemanticAccessLayer {
  private idMappings: Map<string, IDMapping>; // Key: externalSystem:externalID
  private reverseIdMappings: Map<HolonID, IDMapping[]>; // Holon ID -> all external mappings
  private eventStore: EventStore;
  private constraintEngine: ConstraintEngine;
  private holonRegistry: HolonRegistry;
  private documentRegistry: DocumentRegistry;
  private precedenceRules: PrecedenceRule[];

  constructor(
    eventStore: EventStore,
    constraintEngine: ConstraintEngine,
    holonRegistry: HolonRegistry,
    documentRegistry: DocumentRegistry
  ) {
    this.idMappings = new Map();
    this.reverseIdMappings = new Map();
    this.eventStore = eventStore;
    this.constraintEngine = constraintEngine;
    this.holonRegistry = holonRegistry;
    this.documentRegistry = documentRegistry;
    this.precedenceRules = [];
  }

  /**
   * Generate a mapping key from external system and ID
   */
  private getMappingKey(externalSystem: ExternalSystemID, externalID: ExternalEntityID): string {
    return `${externalSystem}:${externalID}`;
  }

  /**
   * Map an external system ID to a SOM holon ID
   * Creates a bidirectional mapping
   */
  mapExternalID(
    externalSystem: ExternalSystemID,
    externalID: ExternalEntityID,
    holonID: HolonID,
    confidence: number = 1.0
  ): void {
    const key = this.getMappingKey(externalSystem, externalID);

    // Check for existing mapping
    const existing = this.idMappings.get(key);
    if (existing && existing.holonID !== holonID) {
      throw new Error(
        `Mapping conflict: ${externalSystem}:${externalID} already mapped to ${existing.holonID}, cannot remap to ${holonID}`
      );
    }

    const mapping: IDMapping = {
      externalSystem,
      externalID,
      holonID,
      createdAt: new Date(),
      lastVerified: new Date(),
      confidence,
    };

    // Store forward mapping
    this.idMappings.set(key, mapping);

    // Store reverse mapping
    if (!this.reverseIdMappings.has(holonID)) {
      this.reverseIdMappings.set(holonID, []);
    }
    const reverseMappings = this.reverseIdMappings.get(holonID)!;

    // Update existing or add new
    const existingIndex = reverseMappings.findIndex(
      m => m.externalSystem === externalSystem && m.externalID === externalID
    );
    if (existingIndex >= 0) {
      reverseMappings[existingIndex] = mapping;
    } else {
      reverseMappings.push(mapping);
    }
  }

  /**
   * Get the SOM holon ID for an external system entity
   * Returns undefined if no mapping exists
   */
  getHolonID(externalSystem: ExternalSystemID, externalID: ExternalEntityID): HolonID | undefined {
    const key = this.getMappingKey(externalSystem, externalID);
    const mapping = this.idMappings.get(key);
    return mapping?.holonID;
  }

  /**
   * Get all external IDs mapped to a SOM holon ID
   */
  getExternalIDs(holonID: HolonID): IDMapping[] {
    return this.reverseIdMappings.get(holonID) || [];
  }

  /**
   * Check if an external entity is already mapped
   */
  hasMappingFor(externalSystem: ExternalSystemID, externalID: ExternalEntityID): boolean {
    const key = this.getMappingKey(externalSystem, externalID);
    return this.idMappings.has(key);
  }

  /**
   * Register a precedence rule for conflict resolution
   */
  registerPrecedenceRule(rule: PrecedenceRule): void {
    this.precedenceRules.push(rule);
    // Sort by priority (highest first)
    this.precedenceRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get the precedence rule for an external system at a timestamp
   */
  private getPrecedenceRule(
    externalSystem: ExternalSystemID,
    timestamp: Timestamp
  ): PrecedenceRule | undefined {
    for (const rule of this.precedenceRules) {
      if (
        rule.externalSystems.includes(externalSystem) &&
        timestamp >= rule.effectiveDates.start &&
        (!rule.effectiveDates.end || timestamp <= rule.effectiveDates.end)
      ) {
        return rule;
      }
    }
    return undefined;
  }

  /**
   * Resolve conflicts between multiple external data sources
   */
  private resolveConflict(
    conflictingData: ExternalData[],
    strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.DocumentPrecedence
  ): ExternalData | null {
    if (conflictingData.length === 0) {
      return null;
    }

    if (conflictingData.length === 1) {
      return conflictingData[0];
    }

    switch (strategy) {
      case ConflictResolutionStrategy.DocumentPrecedence:
        // Use precedence rules based on source documents
        let highestPriority = -1;
        let selected: ExternalData | null = null;

        for (const data of conflictingData) {
          const rule = this.getPrecedenceRule(data.externalSystem, data.timestamp);
          if (rule && rule.priority > highestPriority) {
            highestPriority = rule.priority;
            selected = data;
          }
        }

        return selected || conflictingData[0]; // Fallback to first if no rules match

      case ConflictResolutionStrategy.MostRecent:
        // Use most recent timestamp
        return conflictingData.reduce((latest, current) =>
          current.timestamp > latest.timestamp ? current : latest
        );

      case ConflictResolutionStrategy.HighestConfidence:
        // Use highest confidence mapping (if available in payload)
        return conflictingData.reduce((highest, current) => {
          const currentConf = (current.payload.confidence as number) || 0;
          const highestConf = (highest.payload.confidence as number) || 0;
          return currentConf > highestConf ? current : highest;
        });

      case ConflictResolutionStrategy.Manual:
        // Return null to indicate manual resolution needed
        return null;

      default:
        return conflictingData[0];
    }
  }

  /**
   * Transform external data into SOM events
   * Validates events before acceptance
   */
  submitExternalData(
    data: ExternalData,
    strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.DocumentPrecedence
  ): TransformationResult {
    const errors: string[] = [];
    const conflicts: DataConflict[] = [];
    const events: Event[] = [];

    try {
      // Check if entity is already mapped
      let holonID = this.getHolonID(data.externalSystem, data.externalID);

      // If not mapped, check for conflicts with other systems
      if (!holonID) {
        // Look for potential duplicates based on payload data
        const potentialDuplicates = this.findPotentialDuplicates(data);

        if (potentialDuplicates.length > 0) {
          // Conflict detected - multiple systems may reference same entity
          const conflict: DataConflict = {
            externalSystem: data.externalSystem,
            externalID: data.externalID,
            conflictType: 'duplicate_mapping',
            description: 'Multiple external systems may reference the same entity',
            conflictingData: [data, ...potentialDuplicates],
          };

          // Try to resolve using strategy
          const resolved = this.resolveConflict([data, ...potentialDuplicates], strategy);
          if (resolved) {
            conflict.suggestedResolution = this.getHolonID(
              resolved.externalSystem,
              resolved.externalID
            );
          }

          conflicts.push(conflict);

          if (!resolved || strategy === ConflictResolutionStrategy.Manual) {
            return {
              success: false,
              events: [],
              errors: ['Manual conflict resolution required'],
              conflicts,
            };
          }
        }
      }

      // Transform external data to event
      const partialEvent = this.transformToEvent(data, holonID);

      // Create a temporary complete event for validation purposes
      // We need id and recordedAt for validateEvent, but we'll discard this after validation
      const tempEventForValidation: Event = {
        ...partialEvent,
        id: 'temp-validation-id',
        recordedAt: new Date(),
      };

      // Validate event against constraints BEFORE submitting
      const validationResult = this.constraintEngine.validateEvent(tempEventForValidation, {
        timestamp: data.timestamp,
      });

      if (!validationResult.valid) {
        const validationErrors = validationResult.errors?.map(e => e.message) || [];
        errors.push(...validationErrors);

        conflicts.push({
          externalSystem: data.externalSystem,
          externalID: data.externalID,
          conflictType: 'validation_failure',
          description: 'Event failed constraint validation',
          conflictingData: [data],
        });

        return {
          success: false,
          events: [],
          errors,
          conflicts,
        };
      }

      // Only submit to event store after validation passes
      const eventID = this.eventStore.submitEvent(partialEvent);
      const submittedEvent = this.eventStore.getEvent(eventID);

      if (!submittedEvent) {
        errors.push('Failed to create event in event store');
        return {
          success: false,
          events: [],
          errors,
          conflicts: conflicts.length > 0 ? conflicts : undefined,
        };
      }

      events.push(submittedEvent);

      // If this created a new holon, establish mapping
      if (!holonID && submittedEvent.subjects.length > 0) {
        holonID = submittedEvent.subjects[0];
        this.mapExternalID(data.externalSystem, data.externalID, holonID);
      }

      return {
        success: true,
        events,
        holonID,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        success: false,
        events: [],
        errors,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };
    }
  }

  /**
   * Find potential duplicate entities from other systems
   */
  private findPotentialDuplicates(data: ExternalData): ExternalData[] {
    // This is a simplified implementation
    // In a real system, this would use sophisticated matching logic
    // based on entity attributes (e.g., EDIPI for persons, UIC for orgs)

    // For now, return empty array (no duplicates detected)
    return [];
  }

  /**
   * Transform external data into a SOM event
   */
  private transformToEvent(data: ExternalData, holonID?: HolonID): Omit<Event, 'id' | 'recordedAt'> {
    // Determine event type based on data type
    const eventType = this.mapDataTypeToEventType(data.dataType);

    // Use existing holon ID or create placeholder for new entity
    const subjects = holonID ? [holonID] : [];

    return {
      type: eventType,
      occurredAt: data.timestamp,
      actor: data.externalSystem, // External system acts as the actor
      subjects,
      payload: data.payload,
      sourceSystem: data.externalSystem,
      sourceDocument: data.sourceDocument,
      causalLinks: {},
    };
  }

  /**
   * Map external data type to SOM event type
   */
  private mapDataTypeToEventType(dataType: string): EventType {
    // Simple mapping - in real system this would be more sophisticated
    const typeMap: Record<string, EventType> = {
      'person_created': EventType.AssignmentStarted,
      'organization_created': EventType.OrganizationCreated,
      'position_created': EventType.PositionCreated,
      'assignment_started': EventType.AssignmentStarted,
      'assignment_ended': EventType.AssignmentEnded,
      'qualification_awarded': EventType.QualificationAwarded,
      'mission_planned': EventType.MissionPlanned,
      'task_created': EventType.TaskCreated,
    };

    return typeMap[dataType] || EventType.DocumentIssued;
  }

  /**
   * Query for system-specific format
   * Transforms SOM data into external system format
   */
  async queryForSystem(
    externalSystem: ExternalSystemID,
    holonID: HolonID
  ): Promise<Record<string, any> | null> {
    // Get the holon
    const holon = await this.holonRegistry.getHolon(holonID);
    if (!holon) {
      return null;
    }

    // Get external ID for this system
    const mappings = this.getExternalIDs(holonID);
    const systemMapping = mappings.find(m => m.externalSystem === externalSystem);

    // Transform to system-specific format
    return {
      externalID: systemMapping?.externalID,
      holonID: holon.id,
      type: holon.type,
      properties: holon.properties,
      status: holon.status,
      lastUpdated: holon.createdAt,
    };
  }

  /**
   * Ensure multi-system entity consistency
   * Verifies that all external references map to the same holon
   */
  ensureMultiSystemConsistency(
    externalReferences: Array<{ system: ExternalSystemID; id: ExternalEntityID }>
  ): { consistent: boolean; holonID?: HolonID; conflicts?: string[] } {
    const holonIDs = new Set<HolonID>();
    const conflicts: string[] = [];

    for (const ref of externalReferences) {
      const holonID = this.getHolonID(ref.system, ref.id);
      if (holonID) {
        holonIDs.add(holonID);
      }
    }

    if (holonIDs.size === 0) {
      return { consistent: true }; // No mappings yet
    }

    if (holonIDs.size === 1) {
      return { consistent: true, holonID: Array.from(holonIDs)[0] };
    }

    // Multiple holon IDs - inconsistency detected
    for (const ref of externalReferences) {
      const holonID = this.getHolonID(ref.system, ref.id);
      if (holonID) {
        conflicts.push(`${ref.system}:${ref.id} -> ${holonID}`);
      }
    }

    return {
      consistent: false,
      conflicts,
    };
  }

  /**
   * Get all mappings (for testing/debugging)
   */
  getAllMappings(): IDMapping[] {
    return Array.from(this.idMappings.values());
  }

  /**
   * Clear all mappings (for testing purposes)
   */
  clear(): void {
    this.idMappings.clear();
    this.reverseIdMappings.clear();
    this.precedenceRules = [];
  }
}
