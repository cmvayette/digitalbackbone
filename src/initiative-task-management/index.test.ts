/**
 * Tests for Initiative and Task Management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { 
  InitiativeTaskManager, 
  CreateInitiativeParams, 
  CreateTaskParams,
  CreateDependencyParams 
} from './index';
import { HolonRegistry } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { EventStore, InMemoryEventStore } from '../event-store';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';
import { HolonType, HolonID } from '../core/types/holon';

describe('InitiativeTaskManager', () => {
  let manager: InitiativeTaskManager;
  let holonRegistry: HolonRegistry;
  let relationshipRegistry: RelationshipRegistry;
  let eventStore: EventStore;
  let constraintEngine: ConstraintEngine;
  let documentRegistry: DocumentRegistry;
  let systemActorID: HolonID;
  let testDocID: string;

  beforeEach(() => {
    holonRegistry = new HolonRegistry();
    documentRegistry = new DocumentRegistry();
    eventStore = new InMemoryEventStore();
    constraintEngine = new ConstraintEngine(documentRegistry);
    relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    manager = new InitiativeTaskManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

    // Create a system actor for operations
    const systemEvent = eventStore.submitEvent({
      type: 'SystemDeployed' as any,
      occurredAt: new Date(),
      actor: 'system',
      subjects: [],
      payload: {},
      sourceSystem: 'test',
      causalLinks: {},
    });

    const systemActor = holonRegistry.createHolon({
      type: HolonType.System,
      properties: {
        systemName: 'Test System',
        systemType: 'test',
        version: '1.0',
        status: 'active',
      },
      createdBy: systemEvent,
      sourceDocuments: ['test-doc-1'],
    });

    systemActorID = systemActor.id;
    testDocID = 'test-doc-1';
  });

  describe('Initiative Management', () => {
    it('should create an initiative with all required fields', () => {
      const params: CreateInitiativeParams = {
        name: 'Digital Transformation Initiative',
        scope: 'Enterprise-wide digital modernization',
        sponsor: 'CTO',
        targetOutcomes: ['Improved efficiency', 'Better user experience'],
        stage: 'proposed',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = manager.createInitiative(params);

      expect(result.success).toBe(true);
      expect(result.holonID).toBeDefined();
      expect(result.validation.valid).toBe(true);

      const initiative = holonRegistry.getHolon(result.holonID!);
      expect(initiative).toBeDefined();
      expect(initiative?.type).toBe(HolonType.Initiative);
      expect(initiative?.properties.name).toBe(params.name);
      expect(initiative?.properties.scope).toBe(params.scope);
      expect(initiative?.properties.sponsor).toBe(params.sponsor);
      expect(initiative?.properties.stage).toBe(params.stage);
    });

    it('should reject initiative creation without a name', () => {
      const params: CreateInitiativeParams = {
        name: '',
        scope: 'Test scope',
        sponsor: 'Test sponsor',
        targetOutcomes: [],
        stage: 'proposed',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = manager.createInitiative(params);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors![0].message).toContain('name');
    });

    it('should reject initiative creation without a scope', () => {
      const params: CreateInitiativeParams = {
        name: 'Test Initiative',
        scope: '',
        sponsor: 'Test sponsor',
        targetOutcomes: [],
        stage: 'proposed',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = manager.createInitiative(params);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors![0].message).toContain('scope');
    });

    it('should reject initiative creation without a sponsor', () => {
      const params: CreateInitiativeParams = {
        name: 'Test Initiative',
        scope: 'Test scope',
        sponsor: '',
        targetOutcomes: [],
        stage: 'proposed',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = manager.createInitiative(params);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors![0].message).toContain('sponsor');
    });
  });

  describe('Task Management', () => {
    it('should create a task with all required fields', () => {
      const params: CreateTaskParams = {
        description: 'Implement user authentication',
        type: 'development',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = manager.createTask(params);

      expect(result.success).toBe(true);
      expect(result.holonID).toBeDefined();
      expect(result.validation.valid).toBe(true);

      const task = holonRegistry.getHolon(result.holonID!);
      expect(task).toBeDefined();
      expect(task?.type).toBe(HolonType.Task);
      expect(task?.properties.description).toBe(params.description);
      expect(task?.properties.type).toBe(params.type);
      expect(task?.properties.priority).toBe(params.priority);
      expect(task?.properties.status).toBe(params.status);
    });

    it('should reject task creation without a description', () => {
      const params: CreateTaskParams = {
        description: '',
        type: 'development',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = manager.createTask(params);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors![0].message).toContain('description');
    });

    it('should reject task creation without a type', () => {
      const params: CreateTaskParams = {
        description: 'Test task',
        type: '',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = manager.createTask(params);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors![0].message).toContain('type');
    });

    it('should reject task creation without a priority', () => {
      const params: CreateTaskParams = {
        description: 'Test task',
        type: 'development',
        priority: null as any,
        dueDate: new Date('2024-12-31'),
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = manager.createTask(params);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors![0].message).toContain('priority');
    });

    it('should reject task creation without a due date', () => {
      const params: CreateTaskParams = {
        description: 'Test task',
        type: 'development',
        priority: 'high',
        dueDate: null as any,
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = manager.createTask(params);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors![0].message).toContain('due date');
    });

    it('should reject task creation without a status', () => {
      const params: CreateTaskParams = {
        description: 'Test task',
        type: 'development',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        status: null as any,
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = manager.createTask(params);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors![0].message).toContain('status');
    });
  });

  describe('Initiative-Objective Relationships', () => {
    it('should create ALIGNED_TO relationship between initiative and objective', () => {
      // Create an objective first
      const objectiveEvent = eventStore.submitEvent({
        type: 'ObjectiveCreated' as any,
        occurredAt: new Date(),
        actor: systemActorID,
        subjects: [],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      const objective = holonRegistry.createHolon({
        type: HolonType.Objective,
        properties: {
          description: 'Test Objective',
          level: 'strategic',
          timeHorizon: new Date('2024-12-31'),
          status: 'active',
        },
        createdBy: objectiveEvent,
        sourceDocuments: [testDocID],
      });

      // Create an initiative
      const initiativeResult = manager.createInitiative({
        name: 'Test Initiative',
        scope: 'Test scope',
        sponsor: 'Test sponsor',
        targetOutcomes: [],
        stage: 'proposed',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Align initiative to objective
      const alignResult = manager.alignInitiativeToObjective({
        initiativeID: initiativeResult.holonID!,
        objectiveID: objective.id,
        effectiveStart: new Date(),
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      expect(alignResult.success).toBe(true);
      expect(alignResult.relationshipID).toBeDefined();

      // Verify relationship
      const objectives = manager.getInitiativeObjectives(initiativeResult.holonID!);
      expect(objectives).toContain(objective.id);

      const initiatives = manager.getObjectiveInitiatives(objective.id);
      expect(initiatives).toContain(initiativeResult.holonID);
    });
  });

  describe('Task-Initiative Relationships', () => {
    it('should create PART_OF relationship between task and initiative', () => {
      // Create an initiative
      const initiativeResult = manager.createInitiative({
        name: 'Test Initiative',
        scope: 'Test scope',
        sponsor: 'Test sponsor',
        targetOutcomes: [],
        stage: 'proposed',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Create a task
      const taskResult = manager.createTask({
        description: 'Test task',
        type: 'development',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Add task to initiative
      const addResult = manager.addTaskToInitiative({
        taskID: taskResult.holonID!,
        initiativeID: initiativeResult.holonID!,
        effectiveStart: new Date(),
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      expect(addResult.success).toBe(true);
      expect(addResult.relationshipID).toBeDefined();

      // Verify relationship
      const tasks = manager.getInitiativeTasks(initiativeResult.holonID!);
      expect(tasks).toContain(taskResult.holonID);

      const initiative = manager.getTaskInitiative(taskResult.holonID!);
      expect(initiative).toBe(initiativeResult.holonID);
    });
  });

  describe('Dependency Relationships', () => {
    it('should create DEPENDS_ON relationship between tasks', () => {
      // Create two tasks
      const task1Result = manager.createTask({
        description: 'Task 1',
        type: 'development',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      const task2Result = manager.createTask({
        description: 'Task 2',
        type: 'development',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Create dependency: task2 depends on task1
      const depResult = manager.createDependency({
        sourceID: task2Result.holonID!,
        targetID: task1Result.holonID!,
        dependencyType: 'prerequisite',
        effectiveStart: new Date(),
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      expect(depResult.success).toBe(true);
      expect(depResult.relationshipID).toBeDefined();

      // Verify dependency
      const dependencies = manager.getDependencies(task2Result.holonID!);
      expect(dependencies).toContain(task1Result.holonID);

      const dependents = manager.getDependents(task1Result.holonID!);
      expect(dependents).toContain(task2Result.holonID);
    });

    it('should reject dependency that would create a cycle', () => {
      // Create two tasks
      const task1Result = manager.createTask({
        description: 'Task 1',
        type: 'development',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      const task2Result = manager.createTask({
        description: 'Task 2',
        type: 'development',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Create dependency: task2 depends on task1
      manager.createDependency({
        sourceID: task2Result.holonID!,
        targetID: task1Result.holonID!,
        dependencyType: 'prerequisite',
        effectiveStart: new Date(),
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Try to create reverse dependency: task1 depends on task2 (would create cycle)
      const cycleResult = manager.createDependency({
        sourceID: task1Result.holonID!,
        targetID: task2Result.holonID!,
        dependencyType: 'prerequisite',
        effectiveStart: new Date(),
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      expect(cycleResult.success).toBe(false);
      expect(cycleResult.validation.valid).toBe(false);
      expect(cycleResult.validation.errors).toBeDefined();
      expect(cycleResult.validation.errors![0].message).toContain('cycle');
    });

    it('should detect cycles in longer dependency chains', () => {
      // Create three tasks
      const task1Result = manager.createTask({
        description: 'Task 1',
        type: 'development',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      const task2Result = manager.createTask({
        description: 'Task 2',
        type: 'development',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      const task3Result = manager.createTask({
        description: 'Task 3',
        type: 'development',
        priority: 'high',
        dueDate: new Date('2024-12-31'),
        status: 'created',
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Create chain: task2 -> task1, task3 -> task2
      manager.createDependency({
        sourceID: task2Result.holonID!,
        targetID: task1Result.holonID!,
        dependencyType: 'prerequisite',
        effectiveStart: new Date(),
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      manager.createDependency({
        sourceID: task3Result.holonID!,
        targetID: task2Result.holonID!,
        dependencyType: 'prerequisite',
        effectiveStart: new Date(),
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Try to create: task1 -> task3 (would create cycle)
      const cycleResult = manager.createDependency({
        sourceID: task1Result.holonID!,
        targetID: task3Result.holonID!,
        dependencyType: 'prerequisite',
        effectiveStart: new Date(),
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      expect(cycleResult.success).toBe(false);
      expect(cycleResult.validation.valid).toBe(false);
      expect(cycleResult.validation.errors).toBeDefined();
      expect(cycleResult.validation.errors![0].message).toContain('cycle');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: semantic-operating-model, Property 29: Initiative holon completeness**
     * **Validates: Requirements 10.1**
     * 
     * For any Initiative holon created, it must contain SOM Initiative ID, name, scope, sponsor, and stage.
     */
    it('Property 29: Initiative holon completeness', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 200 }),
            scope: fc.string({ minLength: 1, maxLength: 500 }),
            sponsor: fc.string({ minLength: 1, maxLength: 100 }),
            targetOutcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { maxLength: 10 }),
            stage: fc.constantFrom('proposed', 'approved', 'planned', 'active', 'paused', 'completed', 'cancelled'),
          }),
          (testCase) => {
            const params: CreateInitiativeParams = {
              name: testCase.name,
              scope: testCase.scope,
              sponsor: testCase.sponsor,
              targetOutcomes: testCase.targetOutcomes,
              stage: testCase.stage as any,
              sourceDocuments: [testDocID],
              actor: systemActorID,
              sourceSystem: 'test',
            };

            const result = manager.createInitiative(params);

            // Check if any required field is whitespace-only (would be rejected)
            const hasEmptyName = testCase.name.trim().length === 0;
            const hasEmptyScope = testCase.scope.trim().length === 0;
            const hasEmptySponsor = testCase.sponsor.trim().length === 0;
            const hasInvalidField = hasEmptyName || hasEmptyScope || hasEmptySponsor;

            if (hasInvalidField) {
              // Should fail validation
              return !result.success && !result.validation.valid;
            }

            // Initiative creation should succeed for valid inputs
            if (!result.success) {
              return false;
            }

            // Verify the initiative has all required fields
            const initiative = holonRegistry.getHolon(result.holonID!);
            if (!initiative) {
              return false;
            }

            // Check that all required fields are present
            // Note: values are trimmed during creation
            return (
              initiative.id !== undefined &&
              initiative.id !== '' &&
              initiative.properties.name === testCase.name.trim() &&
              initiative.properties.scope === testCase.scope.trim() &&
              initiative.properties.sponsor === testCase.sponsor.trim() &&
              initiative.properties.stage === testCase.stage
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: semantic-operating-model, Property 30: Task holon completeness**
     * **Validates: Requirements 10.2**
     * 
     * For any Task holon created, it must contain SOM Task ID, description, type, priority, due date, and status.
     */
    it('Property 30: Task holon completeness', () => {
      fc.assert(
        fc.property(
          fc.record({
            description: fc.string({ minLength: 1, maxLength: 500 }),
            type: fc.string({ minLength: 1, maxLength: 50 }),
            priority: fc.constantFrom('critical', 'high', 'medium', 'low'),
            dueDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
            status: fc.constantFrom('created', 'assigned', 'started', 'blocked', 'completed', 'cancelled'),
          }),
          (testCase) => {
            const params: CreateTaskParams = {
              description: testCase.description,
              type: testCase.type,
              priority: testCase.priority as any,
              dueDate: testCase.dueDate,
              status: testCase.status as any,
              sourceDocuments: [testDocID],
              actor: systemActorID,
              sourceSystem: 'test',
            };

            const result = manager.createTask(params);

            // Check if any required field is whitespace-only (would be rejected)
            const hasEmptyDescription = testCase.description.trim().length === 0;
            const hasEmptyType = testCase.type.trim().length === 0;
            const hasInvalidField = hasEmptyDescription || hasEmptyType;

            if (hasInvalidField) {
              // Should fail validation
              return !result.success && !result.validation.valid;
            }

            // Task creation should succeed for valid inputs
            if (!result.success) {
              return false;
            }

            // Verify the task has all required fields
            const task = holonRegistry.getHolon(result.holonID!);
            if (!task) {
              return false;
            }

            // Check that all required fields are present
            // Note: values are trimmed during creation
            return (
              task.id !== undefined &&
              task.id !== '' &&
              task.properties.description === testCase.description.trim() &&
              task.properties.type === testCase.type.trim() &&
              task.properties.priority === testCase.priority &&
              task.properties.dueDate !== undefined &&
              task.properties.status === testCase.status
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: semantic-operating-model, Property 31: Dependency relationship validity**
     * **Validates: Requirements 10.5**
     * 
     * For any set of DEPENDS_ON relationships among tasks or initiatives, they must form a directed acyclic graph without cycles.
     */
    it('Property 31: Dependency relationship validity - no cycles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }),
          fc.array(fc.tuple(fc.nat(), fc.nat()), { minLength: 1, maxLength: 20 }),
          (numTasks, edgePairs) => {
            // Create tasks
            const taskIDs: HolonID[] = [];
            for (let i = 0; i < numTasks; i++) {
              const taskResult = manager.createTask({
                description: `Task ${i}`,
                type: 'development',
                priority: 'medium',
                dueDate: new Date('2024-12-31'),
                status: 'created',
                sourceDocuments: [testDocID],
                actor: systemActorID,
                sourceSystem: 'test',
              });
              taskIDs.push(taskResult.holonID!);
            }

            // Try to create dependencies based on edge pairs
            // Filter to valid edges (source != target, within bounds)
            const validEdges = edgePairs
              .map(([s, t]) => [s % numTasks, t % numTasks])
              .filter(([s, t]) => s !== t);

            // Track which edges were successfully created
            const createdEdges = new Set<string>();

            for (const [sourceIdx, targetIdx] of validEdges) {
              const result = manager.createDependency({
                sourceID: taskIDs[sourceIdx],
                targetID: taskIDs[targetIdx],
                dependencyType: 'prerequisite',
                effectiveStart: new Date(),
                sourceDocuments: [testDocID],
                actor: systemActorID,
                sourceSystem: 'test',
              });

              if (result.success) {
                createdEdges.add(`${sourceIdx}->${targetIdx}`);
              }
            }

            // Verify no cycles exist by checking that we can't create a dependency
            // that would close any cycle
            for (const [sourceIdx, targetIdx] of validEdges) {
              const edgeKey = `${sourceIdx}->${targetIdx}`;
              if (createdEdges.has(edgeKey)) {
                // This edge was created, so the reverse should fail
                const reverseResult = manager.createDependency({
                  sourceID: taskIDs[targetIdx],
                  targetID: taskIDs[sourceIdx],
                  dependencyType: 'prerequisite',
                  effectiveStart: new Date(),
                  sourceDocuments: [testDocID],
                  actor: systemActorID,
                  sourceSystem: 'test',
                });

                // If the reverse edge succeeds, we have a cycle - this is bad
                if (reverseResult.success) {
                  return false;
                }
              }
            }

            // If we got here, no cycles were created
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
