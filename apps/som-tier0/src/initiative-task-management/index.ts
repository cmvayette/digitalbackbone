/**
 * Initiative and Task Management module for the Semantic Operating Model
 * Manages Initiative and Task holon creation, relationships, and validation
 */

import { HolonRegistry } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { EventStore } from '../event-store';
import { ConstraintEngine, ValidationResult } from '../constraint-engine';
import { Initiative, Task, HolonType, HolonID, DocumentID, EventID, Timestamp } from '../core/types/holon';
import { RelationshipType } from '../core/types/relationship';
import { EventType } from '../core/types/event';

/**
 * Parameters for creating an Initiative holon
 */
export interface CreateInitiativeParams {
  name: string;
  scope: string;
  sponsor: string;
  targetOutcomes: string[];
  stage: 'proposed' | 'approved' | 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating a Task holon
 */
export interface CreateTaskParams {
  description: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate: Date;
  status: 'created' | 'assigned' | 'started' | 'blocked' | 'completed' | 'cancelled';
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating an Initiative ALIGNED_TO Objective relationship
 */
export interface AlignInitiativeToObjectiveParams {
  initiativeID: HolonID;
  objectiveID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating a Task PART_OF Initiative relationship
 */
export interface AddTaskToInitiativeParams {
  taskID: HolonID;
  initiativeID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating DEPENDS_ON relationships
 */
export interface CreateDependencyParams {
  sourceID: HolonID; // Initiative or Task that depends on target
  targetID: HolonID; // Initiative or Task that is depended upon
  dependencyType: string;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Result of an Initiative/Task operation
 */
export interface InitiativeTaskOperationResult {
  success: boolean;
  holonID?: HolonID;
  relationshipID?: string;
  validation: ValidationResult;
  eventID?: EventID;
}

/**
 * InitiativeTaskManager handles Initiative and Task holon lifecycle and relationships
 */
export class InitiativeTaskManager {
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
   * Create a new Initiative holon with required fields
   * Validates Requirements 10.1: WHEN a multi-step effort is undertaken THEN the SOM SHALL create 
   * an Initiative holon with SOM Initiative ID, name, scope, sponsor, and stage
   */
  createInitiative(params: CreateInitiativeParams): InitiativeTaskOperationResult {
    // Validate required fields
    const validationErrors: any[] = [];

    if (!params.name || params.name.trim().length === 0) {
      validationErrors.push({
        constraintID: 'initiative-name-requirement',
        message: 'Initiative must have a name',
        violatedRule: 'initiative_name_requirement',
        affectedHolons: [],
      });
    }

    if (!params.scope || params.scope.trim().length === 0) {
      validationErrors.push({
        constraintID: 'initiative-scope-requirement',
        message: 'Initiative must have a scope',
        violatedRule: 'initiative_scope_requirement',
        affectedHolons: [],
      });
    }

    if (!params.sponsor || params.sponsor.trim().length === 0) {
      validationErrors.push({
        constraintID: 'initiative-sponsor-requirement',
        message: 'Initiative must have a sponsor',
        violatedRule: 'initiative_sponsor_requirement',
        affectedHolons: [],
      });
    }

    if (!params.stage) {
      validationErrors.push({
        constraintID: 'initiative-stage-requirement',
        message: 'Initiative must have a stage',
        violatedRule: 'initiative_stage_requirement',
        affectedHolons: [],
      });
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: validationErrors,
        },
      };
    }

    // Trim whitespace from string fields before storing
    const trimmedName = params.name.trim();
    const trimmedScope = params.scope.trim();
    const trimmedSponsor = params.sponsor.trim();

    // Create event for initiative creation
    const eventId = this.eventStore.submitEvent({
      type: EventType.InitiativeStageChange,
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [],
      payload: {
        action: 'create_initiative',
        name: trimmedName,
        scope: trimmedScope,
        sponsor: trimmedSponsor,
        stage: params.stage,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create Initiative holon
    const initiative = this.holonRegistry.createHolon({
      type: HolonType.Initiative,
      properties: {
        name: trimmedName,
        scope: trimmedScope,
        sponsor: trimmedSponsor,
        targetOutcomes: params.targetOutcomes,
        stage: params.stage,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate the created initiative
    const validation = this.constraintEngine.validateHolon(initiative);

    if (!validation.valid) {
      // Rollback: mark initiative as inactive
      this.holonRegistry.markHolonInactive(initiative.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    return {
      success: true,
      holonID: initiative.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Create a new Task holon with required fields
   * Validates Requirements 10.2: WHEN actionable work is defined THEN the SOM SHALL create 
   * a Task holon with SOM Task ID, description, type, priority, due date, and status
   */
  createTask(params: CreateTaskParams): InitiativeTaskOperationResult {
    // Validate required fields
    const validationErrors: any[] = [];

    if (!params.description || params.description.trim().length === 0) {
      validationErrors.push({
        constraintID: 'task-description-requirement',
        message: 'Task must have a description',
        violatedRule: 'task_description_requirement',
        affectedHolons: [],
      });
    }

    if (!params.type || params.type.trim().length === 0) {
      validationErrors.push({
        constraintID: 'task-type-requirement',
        message: 'Task must have a type',
        violatedRule: 'task_type_requirement',
        affectedHolons: [],
      });
    }

    if (!params.priority) {
      validationErrors.push({
        constraintID: 'task-priority-requirement',
        message: 'Task must have a priority',
        violatedRule: 'task_priority_requirement',
        affectedHolons: [],
      });
    }

    if (!params.dueDate) {
      validationErrors.push({
        constraintID: 'task-duedate-requirement',
        message: 'Task must have a due date',
        violatedRule: 'task_duedate_requirement',
        affectedHolons: [],
      });
    }

    if (!params.status) {
      validationErrors.push({
        constraintID: 'task-status-requirement',
        message: 'Task must have a status',
        violatedRule: 'task_status_requirement',
        affectedHolons: [],
      });
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: validationErrors,
        },
      };
    }

    // Trim whitespace from string fields before storing
    const trimmedDescription = params.description.trim();
    const trimmedType = params.type.trim();

    // Create event for task creation
    const eventId = this.eventStore.submitEvent({
      type: EventType.TaskCreated,
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [],
      payload: {
        action: 'create_task',
        description: trimmedDescription,
        type: trimmedType,
        priority: params.priority,
        status: params.status,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create Task holon
    const task = this.holonRegistry.createHolon({
      type: HolonType.Task,
      properties: {
        description: trimmedDescription,
        type: trimmedType,
        priority: params.priority,
        dueDate: params.dueDate,
        status: params.status,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate the created task
    const validation = this.constraintEngine.validateHolon(task);

    if (!validation.valid) {
      // Rollback: mark task as inactive
      this.holonRegistry.markHolonInactive(task.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    return {
      success: true,
      holonID: task.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Create an Initiative ALIGNED_TO Objective relationship
   * Validates Requirements 10.3: WHEN initiatives support objectives THEN the SOM SHALL create 
   * Initiative ALIGNED_TO Objective relationships
   */
  alignInitiativeToObjective(params: AlignInitiativeToObjectiveParams): InitiativeTaskOperationResult {
    // Get initiative and objective holons
    const initiative = this.holonRegistry.getHolon(params.initiativeID);
    const objective = this.holonRegistry.getHolon(params.objectiveID);

    if (!initiative) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Initiative not found',
            violatedRule: 'existence',
            affectedHolons: [params.initiativeID],
          }],
        },
      };
    }

    if (!objective) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Objective not found',
            violatedRule: 'existence',
            affectedHolons: [params.objectiveID],
          }],
        },
      };
    }

    // Create the ALIGNED_TO relationship
    const result = this.relationshipRegistry.createRelationship({
      type: RelationshipType.ALIGNED_TO,
      sourceHolonID: params.initiativeID,
      targetHolonID: params.objectiveID,
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
   * Create a Task PART_OF Initiative relationship
   * Validates Requirements 10.4: WHEN tasks are part of initiatives THEN the SOM SHALL create 
   * Task PART_OF Initiative relationships
   */
  addTaskToInitiative(params: AddTaskToInitiativeParams): InitiativeTaskOperationResult {
    // Get task and initiative holons
    const task = this.holonRegistry.getHolon(params.taskID);
    const initiative = this.holonRegistry.getHolon(params.initiativeID);

    if (!task) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Task not found',
            violatedRule: 'existence',
            affectedHolons: [params.taskID],
          }],
        },
      };
    }

    if (!initiative) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Initiative not found',
            violatedRule: 'existence',
            affectedHolons: [params.initiativeID],
          }],
        },
      };
    }

    // Create the PART_OF relationship
    const result = this.relationshipRegistry.createRelationship({
      type: RelationshipType.PART_OF,
      sourceHolonID: params.taskID,
      targetHolonID: params.initiativeID,
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
   * Create DEPENDS_ON relationships with cycle detection
   * Validates Requirements 10.5: WHERE initiatives or tasks have dependencies THEN the SOM SHALL 
   * create DEPENDS_ON relationships for sequencing and risk analysis
   */
  createDependency(params: CreateDependencyParams): InitiativeTaskOperationResult {
    // Get source and target holons
    const source = this.holonRegistry.getHolon(params.sourceID);
    const target = this.holonRegistry.getHolon(params.targetID);

    if (!source) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Source holon not found',
            violatedRule: 'existence',
            affectedHolons: [params.sourceID],
          }],
        },
      };
    }

    if (!target) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Target holon not found',
            violatedRule: 'existence',
            affectedHolons: [params.targetID],
          }],
        },
      };
    }

    // Verify both are Initiative or Task holons
    if (source.type !== HolonType.Initiative && source.type !== HolonType.Task) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'dependency-type-constraint',
            message: 'Source must be an Initiative or Task',
            violatedRule: 'dependency_type_constraint',
            affectedHolons: [params.sourceID],
          }],
        },
      };
    }

    if (target.type !== HolonType.Initiative && target.type !== HolonType.Task) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'dependency-type-constraint',
            message: 'Target must be an Initiative or Task',
            violatedRule: 'dependency_type_constraint',
            affectedHolons: [params.targetID],
          }],
        },
      };
    }

    // Check for cycles before creating the relationship
    const cycleCheck = this.checkForCycles(params.sourceID, params.targetID);
    if (!cycleCheck.valid) {
      return {
        success: false,
        validation: cycleCheck,
      };
    }

    // Create the DEPENDS_ON relationship
    const result = this.relationshipRegistry.createRelationship({
      type: RelationshipType.DEPENDS_ON,
      sourceHolonID: params.sourceID,
      targetHolonID: params.targetID,
      properties: {
        dependencyType: params.dependencyType,
      },
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
   * Get all objectives that an initiative is aligned to
   */
  getInitiativeObjectives(initiativeID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsFrom(
      initiativeID,
      RelationshipType.ALIGNED_TO,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Get all initiatives aligned to a specific objective
   */
  getObjectiveInitiatives(objectiveID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsTo(
      objectiveID,
      RelationshipType.ALIGNED_TO,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Get all tasks that are part of an initiative
   */
  getInitiativeTasks(initiativeID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsTo(
      initiativeID,
      RelationshipType.PART_OF,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Get the initiative that a task is part of
   */
  getTaskInitiative(taskID: HolonID, effectiveAt?: Timestamp): HolonID | null {
    const relationships = this.relationshipRegistry.getRelationshipsFrom(
      taskID,
      RelationshipType.PART_OF,
      { effectiveAt, includeEnded: false }
    );

    return relationships.length > 0 ? relationships[0].targetHolonID : null;
  }

  /**
   * Get all dependencies for an initiative or task
   */
  getDependencies(holonID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsFrom(
      holonID,
      RelationshipType.DEPENDS_ON,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Get all dependents of an initiative or task
   */
  getDependents(holonID: HolonID, effectiveAt?: Timestamp): HolonID[] {
    const relationships = this.relationshipRegistry.getRelationshipsTo(
      holonID,
      RelationshipType.DEPENDS_ON,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Check for cycles in dependency relationships
   * Uses depth-first search to detect cycles
   */
  private checkForCycles(sourceID: HolonID, targetID: HolonID): ValidationResult {
    // If source depends on target, and target already depends on source (directly or indirectly),
    // we have a cycle
    const visited = new Set<HolonID>();
    const stack = [targetID];

    while (stack.length > 0) {
      const current = stack.pop()!;
      
      if (current === sourceID) {
        // Found a cycle
        return {
          valid: false,
          errors: [{
            constraintID: 'dependency-cycle',
            message: 'Creating this dependency would create a cycle',
            violatedRule: 'dependency_acyclic',
            affectedHolons: [sourceID, targetID],
          }],
        };
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      // Get all holons that current depends on
      const dependencies = this.getDependencies(current);
      stack.push(...dependencies);
    }

    return { valid: true };
  }
}
