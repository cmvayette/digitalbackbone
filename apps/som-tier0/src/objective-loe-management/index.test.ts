/**
 * Tests for Objective and LOE Management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ObjectiveLOEManager, CreateObjectiveParams, CreateLOEParams } from './index';
import { InMemoryHolonRepository as HolonRegistry } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { IEventStore as EventStore, InMemoryEventStore } from '../event-store';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';
import { HolonType, HolonID } from '@som/shared-types';

describe('ObjectiveLOEManager', () => {
  let manager: ObjectiveLOEManager;
  let holonRegistry: HolonRegistry;
  let relationshipRegistry: RelationshipRegistry;
  let eventStore: EventStore;
  let constraintEngine: ConstraintEngine;
  let documentRegistry: DocumentRegistry;
  let systemActorID: HolonID;
  let testDocID: string;

  beforeEach(async () => {
    holonRegistry = new HolonRegistry();
    documentRegistry = new DocumentRegistry();
    eventStore = new InMemoryEventStore();
    constraintEngine = new ConstraintEngine(documentRegistry);
    relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    manager = new ObjectiveLOEManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);

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

    const systemActor = await holonRegistry.createHolon({
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

  describe('LOE Management', () => {
    it('should create an LOE with required fields', async () => {
      const params: CreateLOEParams = {
        name: 'Strategic Initiative Alpha',
        description: 'Focus on strategic capabilities',
        sponsoringEchelon: 'NSWC',
        timeframe: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = await manager.createLOE(params);

      expect(result.success).toBe(true);
      expect(result.holonID).toBeDefined();
      expect(result.validation.valid).toBe(true);

      const loe = await holonRegistry.getHolon(result.holonID!);
      expect(loe).toBeDefined();
      expect(loe?.type).toBe(HolonType.LOE);
      expect(loe?.properties.name).toBe(params.name);
      expect(loe?.properties.description).toBe(params.description);
    });
  });

  describe('Objective Management', () => {
    it('should reject objective creation without a measure', async () => {
      // Create LOE and owner first
      const loeResult = await manager.createLOE({
        name: 'Test LOE',
        description: 'Test',
        sponsoringEchelon: 'NSWC',
        timeframe: { start: new Date(), end: new Date() },
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      const params: CreateObjectiveParams = {
        description: 'Test Objective',
        level: 'strategic',
        timeHorizon: new Date('2024-12-31'),
        status: 'proposed',
        measureIDs: [], // No measures - should fail
        ownerID: systemActorID,
        loeID: loeResult.holonID!,
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = await manager.createObjective(params);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors![0].message).toContain('measure');
    });

    it('should reject objective creation without an owner', async () => {
      // Create LOE and measure first
      const loeResult = await manager.createLOE({
        name: 'Test LOE',
        description: 'Test',
        sponsoringEchelon: 'NSWC',
        timeframe: { start: new Date(), end: new Date() },
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      const measureEvent = eventStore.submitEvent({
        type: 'MeasureEmitted' as any,
        occurredAt: new Date(),
        actor: systemActorID,
        subjects: [],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      const measure = await holonRegistry.createHolon({
        type: HolonType.MeasureDefinition,
        properties: {
          name: 'Test Measure',
          description: 'Test',
          unit: 'count',
          calculationMethod: 'sum',
          samplingFrequency: 86400000,
          dataSources: [],
          type: 'state',
          leadingOrLagging: 'leading',
          quantitativeOrQualitative: 'quantitative',
          version: 1,
        },
        createdBy: measureEvent,
        sourceDocuments: [testDocID],
      });

      const params: CreateObjectiveParams = {
        description: 'Test Objective',
        level: 'strategic',
        timeHorizon: new Date('2024-12-31'),
        status: 'proposed',
        measureIDs: [measure.id],
        ownerID: '', // No owner - should fail
        loeID: loeResult.holonID!,
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = await manager.createObjective(params);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors![0].message).toContain('owner');
    });

    it('should reject objective creation without an LOE link', async () => {
      // Create measure first
      const measureEvent = eventStore.submitEvent({
        type: 'MeasureEmitted' as any,
        occurredAt: new Date(),
        actor: systemActorID,
        subjects: [],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      const measure = await holonRegistry.createHolon({
        type: HolonType.MeasureDefinition,
        properties: {
          name: 'Test Measure',
          description: 'Test',
          unit: 'count',
          calculationMethod: 'sum',
          samplingFrequency: 86400000,
          dataSources: [],
          type: 'state',
          leadingOrLagging: 'leading',
          quantitativeOrQualitative: 'quantitative',
          version: 1,
        },
        createdBy: measureEvent,
        sourceDocuments: [testDocID],
      });

      const params: CreateObjectiveParams = {
        description: 'Test Objective',
        level: 'strategic',
        timeHorizon: new Date('2024-12-31'),
        status: 'proposed',
        measureIDs: [measure.id],
        ownerID: systemActorID,
        loeID: '', // No LOE - should fail
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = await manager.createObjective(params);

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.errors![0].message).toContain('LOE');
    });

    it('should create an objective with all required fields', async () => {
      // Create LOE
      const loeResult = await manager.createLOE({
        name: 'Test LOE',
        description: 'Test',
        sponsoringEchelon: 'NSWC',
        timeframe: { start: new Date(), end: new Date() },
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Create measure
      const measureEvent = eventStore.submitEvent({
        type: 'MeasureEmitted' as any,
        occurredAt: new Date(),
        actor: systemActorID,
        subjects: [],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      const measure = await holonRegistry.createHolon({
        type: HolonType.MeasureDefinition,
        properties: {
          name: 'Test Measure',
          description: 'Test',
          unit: 'count',
          calculationMethod: 'sum',
          samplingFrequency: 86400000,
          dataSources: [],
          type: 'state',
          leadingOrLagging: 'leading',
          quantitativeOrQualitative: 'quantitative',
          version: 1,
        },
        createdBy: measureEvent,
        sourceDocuments: [testDocID],
      });

      const params: CreateObjectiveParams = {
        description: 'Test Objective',
        level: 'strategic',
        timeHorizon: new Date('2024-12-31'),
        status: 'proposed',
        measureIDs: [measure.id],
        ownerID: systemActorID,
        loeID: loeResult.holonID!,
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      };

      const result = await manager.createObjective(params);

      expect(result.success).toBe(true);
      expect(result.holonID).toBeDefined();
      expect(result.validation.valid).toBe(true);

      const objective = await holonRegistry.getHolon(result.holonID!);
      expect(objective).toBeDefined();
      expect(objective?.type).toBe(HolonType.Objective);
      expect(objective?.properties.description).toBe(params.description);

      // Verify relationships were created
      const loeRel = await manager.getObjectiveLOE(result.holonID!);
      expect(loeRel).toBe(loeResult.holonID);

      const owner = await manager.getObjectiveOwner(result.holonID!);
      expect(owner).toBe(systemActorID);

      const measures = await manager.getObjectiveMeasures(result.holonID!);
      expect(measures).toContain(measure.id);
    });
  });

  describe('Objective Decomposition', () => {
    it('should create dependency relationships between objectives', async () => {
      // Create LOE
      const loeResult = await manager.createLOE({
        name: 'Test LOE',
        description: 'Test',
        sponsoringEchelon: 'NSWC',
        timeframe: { start: new Date(), end: new Date() },
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Create measure
      const measureEvent = eventStore.submitEvent({
        type: 'MeasureEmitted' as any,
        occurredAt: new Date(),
        actor: systemActorID,
        subjects: [],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      const measure = await holonRegistry.createHolon({
        type: HolonType.MeasureDefinition,
        properties: {
          name: 'Test Measure',
          description: 'Test',
          unit: 'count',
          calculationMethod: 'sum',
          samplingFrequency: 86400000,
          dataSources: [],
          type: 'state',
          leadingOrLagging: 'leading',
          quantitativeOrQualitative: 'quantitative',
          version: 1,
        },
        createdBy: measureEvent,
        sourceDocuments: [testDocID],
      });

      // Create two objectives
      const obj1Result = await manager.createObjective({
        description: 'Parent Objective',
        level: 'strategic',
        timeHorizon: new Date('2024-12-31'),
        status: 'proposed',
        measureIDs: [measure.id],
        ownerID: systemActorID,
        loeID: loeResult.holonID!,
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      const obj2Result = await manager.createObjective({
        description: 'Child Objective',
        level: 'operational',
        timeHorizon: new Date('2024-12-31'),
        status: 'proposed',
        measureIDs: [measure.id],
        ownerID: systemActorID,
        loeID: loeResult.holonID!,
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Create dependency: obj2 depends on obj1
      const depResult = await manager.createObjectiveDependency({
        sourceObjectiveID: obj2Result.holonID!,
        targetObjectiveID: obj1Result.holonID!,
        dependencyType: 'prerequisite',
        effectiveStart: new Date(),
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      expect(depResult.success).toBe(true);
      expect(depResult.relationshipID).toBeDefined();

      // Verify dependency
      const dependencies = await manager.getObjectiveDependencies(obj2Result.holonID!);
      expect(dependencies).toContain(obj1Result.holonID);

      const dependents = await manager.getObjectiveDependents(obj1Result.holonID!);
      expect(dependents).toContain(obj2Result.holonID);
    });

    it('should reject dependency that would create a cycle', async () => {
      // Create LOE
      const loeResult = await manager.createLOE({
        name: 'Test LOE',
        description: 'Test',
        sponsoringEchelon: 'NSWC',
        timeframe: { start: new Date(), end: new Date() },
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Create measure
      const measureEvent = eventStore.submitEvent({
        type: 'MeasureEmitted' as any,
        occurredAt: new Date(),
        actor: systemActorID,
        subjects: [],
        payload: {},
        sourceSystem: 'test',
        causalLinks: {},
      });

      const measure = await holonRegistry.createHolon({
        type: HolonType.MeasureDefinition,
        properties: {
          name: 'Test Measure',
          description: 'Test',
          unit: 'count',
          calculationMethod: 'sum',
          samplingFrequency: 86400000,
          dataSources: [],
          type: 'state',
          leadingOrLagging: 'leading',
          quantitativeOrQualitative: 'quantitative',
          version: 1,
        },
        createdBy: measureEvent,
        sourceDocuments: [testDocID],
      });

      // Create two objectives
      const obj1Result = await manager.createObjective({
        description: 'Objective 1',
        level: 'strategic',
        timeHorizon: new Date('2024-12-31'),
        status: 'proposed',
        measureIDs: [measure.id],
        ownerID: systemActorID,
        loeID: loeResult.holonID!,
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      const obj2Result = await manager.createObjective({
        description: 'Objective 2',
        level: 'operational',
        timeHorizon: new Date('2024-12-31'),
        status: 'proposed',
        measureIDs: [measure.id],
        ownerID: systemActorID,
        loeID: loeResult.holonID!,
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Create dependency: obj2 depends on obj1
      await manager.createObjectiveDependency({
        sourceObjectiveID: obj2Result.holonID!,
        targetObjectiveID: obj1Result.holonID!,
        dependencyType: 'prerequisite',
        effectiveStart: new Date(),
        sourceDocuments: [testDocID],
        actor: systemActorID,
        sourceSystem: 'test',
      });

      // Try to create reverse dependency: obj1 depends on obj2 (would create cycle)
      const cycleResult = await manager.createObjectiveDependency({
        sourceObjectiveID: obj1Result.holonID!,
        targetObjectiveID: obj2Result.holonID!,
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
     * **Feature: semantic-operating-model, Property 28: Objective validation**
     * **Validates: Requirements 9.4**
     * 
     * For any Objective holon created without at least one measure, one owner, and one LOE link,
     * the SOM must reject the creation.
     */
    it('Property 28: Objective validation - rejects objectives without required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            description: fc.string({ minLength: 1, maxLength: 200 }),
            level: fc.constantFrom('strategic', 'operational', 'tactical'),
            hasMeasure: fc.boolean(),
            hasOwner: fc.boolean(),
            hasLOE: fc.boolean(),
          }),
          async (testCase) => {
            // Create LOE
            const loeResult = await manager.createLOE({
              name: 'Test LOE',
              description: 'Test',
              sponsoringEchelon: 'NSWC',
              timeframe: { start: new Date(), end: new Date() },
              sourceDocuments: [testDocID],
              actor: systemActorID,
              sourceSystem: 'test',
            });

            // Create measure
            const measureEvent = eventStore.submitEvent({
              type: 'MeasureEmitted' as any,
              occurredAt: new Date(),
              actor: systemActorID,
              subjects: [],
              payload: {},
              sourceSystem: 'test',
              causalLinks: {},
            });

            const measure = await holonRegistry.createHolon({
              type: HolonType.MeasureDefinition,
              properties: {
                name: 'Test Measure',
                description: 'Test',
                unit: 'count',
                calculationMethod: 'sum',
                samplingFrequency: 86400000,
                dataSources: [],
                type: 'state',
                leadingOrLagging: 'leading',
                quantitativeOrQualitative: 'quantitative',
                version: 1,
              },
              createdBy: measureEvent,
              sourceDocuments: [testDocID],
            });

            const params: CreateObjectiveParams = {
              description: testCase.description,
              level: testCase.level as any,
              timeHorizon: new Date('2024-12-31'),
              status: 'proposed',
              measureIDs: testCase.hasMeasure ? [measure.id] : [],
              ownerID: testCase.hasOwner ? systemActorID : '',
              loeID: testCase.hasLOE ? loeResult.holonID! : '',
              sourceDocuments: [testDocID],
              actor: systemActorID,
              sourceSystem: 'test',
            };

            const result = await manager.createObjective(params);

            // If all required fields are present, creation should succeed
            // If any required field is missing, creation should fail
            const hasAllRequired = testCase.hasMeasure && testCase.hasOwner && testCase.hasLOE;

            if (hasAllRequired) {
              return result.success === true && result.validation.valid === true;
            } else {
              return result.success === false && result.validation.valid === false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
