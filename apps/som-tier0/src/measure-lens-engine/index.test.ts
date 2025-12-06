/**
 * Tests for Measure and Lens Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { MeasureLensEngine, createMeasureLensEngine, CreateMeasureDefinitionParams, CreateLensDefinitionParams, MeasureValue } from './index';
import { createEventStore, EventStore } from '../event-store';
import { holonRegistry } from '../core/holon-registry';
import { HolonType, HolonID } from '../core/types/holon';
import { EventType } from '../core/types/event';

describe('Measure and Lens Engine', () => {
  let engine: MeasureLensEngine;
  let eventStore: EventStore;

  beforeEach(() => {
    holonRegistry.clear();
    eventStore = createEventStore();
    engine = createMeasureLensEngine(eventStore);
  });

  // Helper to create a valid non-whitespace string generator
  const nonWhitespaceString = (options: { minLength: number; maxLength: number }) =>
    fc.string(options).filter(s => s.trim().length > 0);

  describe('Basic Functionality', () => {
    it('should create a measure definition with all required fields', () => {
      const params: CreateMeasureDefinitionParams = {
        name: 'Readiness Score',
        description: 'Overall readiness metric',
        unit: 'percentage',
        calculationMethod: 'weighted average',
        samplingFrequency: 86400000, // 1 day
        dataSources: ['DRRS', 'Training System'],
        type: 'state',
        leadingOrLagging: 'lagging',
        quantitativeOrQualitative: 'quantitative',
        sourceDocuments: ['doc-1'],
        createdBy: 'event-1',
      };

      const measureDef = engine.createMeasureDefinition(params);

      expect(measureDef.type).toBe(HolonType.MeasureDefinition);
      expect(measureDef.properties.name).toBe(params.name);
      expect(measureDef.properties.description).toBe(params.description);
      expect(measureDef.properties.unit).toBe(params.unit);
      expect(measureDef.properties.calculationMethod).toBe(params.calculationMethod);
      expect(measureDef.properties.samplingFrequency).toBe(params.samplingFrequency);
      expect(measureDef.properties.version).toBe(1);
    });

    it('should create a lens definition with all required fields', () => {
      const params: CreateLensDefinitionParams = {
        name: 'Health Status',
        description: 'Overall health indicator',
        inputMeasures: ['measure-1', 'measure-2'],
        logic: 'average',
        thresholds: { green: 80, amber: 60 },
        outputs: ['green', 'amber', 'red'],
        sourceDocuments: ['doc-1'],
        createdBy: 'event-1',
      };

      const lensDef = engine.createLensDefinition(params);

      expect(lensDef.type).toBe(HolonType.LensDefinition);
      expect(lensDef.properties.name).toBe(params.name);
      expect(lensDef.properties.description).toBe(params.description);
      expect(lensDef.properties.inputMeasures).toEqual(params.inputMeasures);
      expect(lensDef.properties.logic).toBe(params.logic);
      expect(lensDef.properties.thresholds).toEqual(params.thresholds);
      expect(lensDef.properties.outputs).toEqual(params.outputs);
      expect(lensDef.properties.version).toBe(1);
    });

    it('should emit a measure and generate MeasureEmitted event', () => {
      const measureDef = engine.createMeasureDefinition({
        name: 'Test Measure',
        description: 'Test',
        unit: 'count',
        calculationMethod: 'sum',
        samplingFrequency: 1000,
        dataSources: ['test'],
        type: 'state',
        leadingOrLagging: 'leading',
        quantitativeOrQualitative: 'quantitative',
        sourceDocuments: ['doc-1'],
        createdBy: 'event-1',
      });

      const measureValue: MeasureValue = {
        measureDefinitionID: measureDef.id,
        value: 42,
        holonID: 'holon-1',
        timestamp: new Date(),
      };

      const eventId = engine.emitMeasure(measureValue, 'actor-1', 'test-system');

      expect(eventId).toBeDefined();
      const event = eventStore.getEvent(eventId);
      expect(event).toBeDefined();
      expect(event!.type).toBe(EventType.MeasureEmitted);
      expect(event!.payload.measureDefinitionID).toBe(measureDef.id);
      expect(event!.payload.value).toBe(42);
    });

    it('should evaluate a lens and generate LensEvaluated event', () => {
      // Create measure definition
      const measureDef = engine.createMeasureDefinition({
        name: 'Test Measure',
        description: 'Test',
        unit: 'percentage',
        calculationMethod: 'direct',
        samplingFrequency: 1000,
        dataSources: ['test'],
        type: 'state',
        leadingOrLagging: 'leading',
        quantitativeOrQualitative: 'quantitative',
        sourceDocuments: ['doc-1'],
        createdBy: 'event-1',
      });

      // Create lens definition
      const lensDef = engine.createLensDefinition({
        name: 'Test Lens',
        description: 'Test lens',
        inputMeasures: [measureDef.id],
        logic: 'average',
        thresholds: { green: 80, amber: 60 },
        outputs: ['green', 'amber', 'red'],
        sourceDocuments: ['doc-1'],
        createdBy: 'event-1',
      });

      // Emit a measure value
      const holonId = 'holon-1';
      const timestamp = new Date();
      engine.emitMeasure(
        {
          measureDefinitionID: measureDef.id,
          value: 85,
          holonID: holonId,
          timestamp,
        },
        'actor-1',
        'test-system'
      );

      // Evaluate lens
      const result = engine.evaluateLens(
        lensDef.id,
        holonId,
        new Date(timestamp.getTime() + 1000),
        'actor-1',
        'test-system'
      );

      expect(result.output.output).toBe('green');
      expect(result.output.inputValues.length).toBe(1);
      expect(result.eventId).toBeDefined();

      const event = eventStore.getEvent(result.eventId);
      expect(event).toBeDefined();
      expect(event!.type).toBe(EventType.LensEvaluated);
    });

    it('should version measure definitions', () => {
      const params: CreateMeasureDefinitionParams = {
        name: 'Versioned Measure',
        description: 'Test versioning',
        unit: 'count',
        calculationMethod: 'sum',
        samplingFrequency: 1000,
        dataSources: ['test'],
        type: 'state',
        leadingOrLagging: 'leading',
        quantitativeOrQualitative: 'quantitative',
        sourceDocuments: ['doc-1'],
        createdBy: 'event-1',
      };

      const v1 = engine.createMeasureDefinition(params);
      expect(v1.properties.version).toBe(1);

      const v2 = engine.createMeasureDefinition(params);
      expect(v2.properties.version).toBe(2);

      const versions = engine.getMeasureVersions('Versioned Measure');
      expect(versions).toHaveLength(2);
      expect(versions[0]).toBe(v1.id);
      expect(versions[1]).toBe(v2.id);
    });

    it('should version lens definitions', () => {
      const params: CreateLensDefinitionParams = {
        name: 'Versioned Lens',
        description: 'Test versioning',
        inputMeasures: ['measure-1'],
        logic: 'average',
        thresholds: { green: 80 },
        outputs: ['green', 'red'],
        sourceDocuments: ['doc-1'],
        createdBy: 'event-1',
      };

      const v1 = engine.createLensDefinition(params);
      expect(v1.properties.version).toBe(1);

      const v2 = engine.createLensDefinition(params);
      expect(v2.properties.version).toBe(2);

      const versions = engine.getLensVersions('Versioned Lens');
      expect(versions).toHaveLength(2);
      expect(versions[0]).toBe(v1.id);
      expect(versions[1]).toBe(v2.id);
    });
  });

  // **Feature: semantic-operating-model, Property 32: Measure definition completeness**
  describe('Property 32: Measure definition completeness', () => {
    it('should ensure all measure definitions contain required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: nonWhitespaceString({ minLength: 1, maxLength: 50 }),
            description: nonWhitespaceString({ minLength: 1, maxLength: 200 }),
            unit: nonWhitespaceString({ minLength: 1, maxLength: 20 }),
            calculationMethod: nonWhitespaceString({ minLength: 1, maxLength: 100 }),
            samplingFrequency: fc.integer({ min: 1, max: 86400000 }),
            dataSources: fc.array(nonWhitespaceString({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
            type: fc.constantFrom('state' as const, 'flow' as const),
            leadingOrLagging: fc.constantFrom('leading' as const, 'lagging' as const),
            quantitativeOrQualitative: fc.constantFrom('quantitative' as const, 'qualitative' as const),
          }),
          (params) => {
            const measureDef = engine.createMeasureDefinition({
              ...params,
              sourceDocuments: ['doc-1'],
              createdBy: 'event-1',
            });

            // Verify all required fields are present
            return (
              measureDef.properties.name === params.name &&
              measureDef.properties.description === params.description &&
              measureDef.properties.unit === params.unit &&
              measureDef.properties.calculationMethod === params.calculationMethod &&
              measureDef.properties.samplingFrequency === params.samplingFrequency &&
              measureDef.properties.dataSources.length > 0 &&
              (measureDef.properties.type === 'state' || measureDef.properties.type === 'flow') &&
              (measureDef.properties.leadingOrLagging === 'leading' || measureDef.properties.leadingOrLagging === 'lagging') &&
              (measureDef.properties.quantitativeOrQualitative === 'quantitative' || measureDef.properties.quantitativeOrQualitative === 'qualitative')
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: semantic-operating-model, Property 33: Lens definition completeness**
  describe('Property 33: Lens definition completeness', () => {
    it('should ensure all lens definitions contain required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: nonWhitespaceString({ minLength: 1, maxLength: 50 }),
            description: nonWhitespaceString({ minLength: 1, maxLength: 200 }),
            inputMeasures: fc.array(nonWhitespaceString({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
            logic: nonWhitespaceString({ minLength: 1, maxLength: 100 }),
            thresholds: fc.dictionary(fc.string(), fc.oneof(fc.integer(), fc.double())),
            outputs: fc.array(nonWhitespaceString({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
          }),
          (params) => {
            const lensDef = engine.createLensDefinition({
              ...params,
              sourceDocuments: ['doc-1'],
              createdBy: 'event-1',
            });

            // Verify all required fields are present
            return (
              lensDef.properties.name === params.name &&
              lensDef.properties.description === params.description &&
              lensDef.properties.inputMeasures.length > 0 &&
              lensDef.properties.logic === params.logic &&
              lensDef.properties.thresholds !== undefined &&
              lensDef.properties.outputs.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: semantic-operating-model, Property 34: Measure emission event generation**
  describe('Property 34: Measure emission event generation', () => {
    it('should generate MeasureEmitted event for any measure emission', () => {
      fc.assert(
        fc.property(
          fc.record({
            measureName: nonWhitespaceString({ minLength: 1, maxLength: 50 }),
            value: fc.oneof(fc.integer({ min: 0, max: 100 }), fc.double({ min: 0, max: 100 })),
            holonID: nonWhitespaceString({ minLength: 1, maxLength: 50 }),
          }),
          (params) => {
            // Create measure definition
            const measureDef = engine.createMeasureDefinition({
              name: params.measureName,
              description: 'Test measure',
              unit: 'units',
              calculationMethod: 'direct',
              samplingFrequency: 1000,
              dataSources: ['test'],
              type: 'state',
              leadingOrLagging: 'leading',
              quantitativeOrQualitative: 'quantitative',
              sourceDocuments: ['doc-1'],
              createdBy: 'event-1',
            });

            // Emit measure
            const eventId = engine.emitMeasure(
              {
                measureDefinitionID: measureDef.id,
                value: params.value,
                holonID: params.holonID,
                timestamp: new Date(),
              },
              'actor-1',
              'test-system'
            );

            // Verify event was created
            const event = eventStore.getEvent(eventId);
            return (
              event !== undefined &&
              event.type === EventType.MeasureEmitted &&
              event.payload.measureDefinitionID === measureDef.id &&
              event.subjects.includes(measureDef.id)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: semantic-operating-model, Property 35: Lens evaluation correctness**
  describe('Property 35: Lens evaluation correctness', () => {
    it('should compute lens output correctly from input measures', () => {
      fc.assert(
        fc.property(
          fc.record({
            measureValues: fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 5 }),
            greenThreshold: fc.integer({ min: 70, max: 90 }),
            amberThreshold: fc.integer({ min: 50, max: 69 }),
          }),
          (params) => {
            // Create measure definitions
            const measureDefs = params.measureValues.map((_, i) =>
              engine.createMeasureDefinition({
                name: `Measure ${i}`,
                description: 'Test',
                unit: 'percentage',
                calculationMethod: 'direct',
                samplingFrequency: 1000,
                dataSources: ['test'],
                type: 'state',
                leadingOrLagging: 'leading',
                quantitativeOrQualitative: 'quantitative',
                sourceDocuments: ['doc-1'],
                createdBy: 'event-1',
              })
            );

            // Create lens
            const lensDef = engine.createLensDefinition({
              name: 'Test Lens',
              description: 'Test',
              inputMeasures: measureDefs.map(m => m.id),
              logic: 'average',
              thresholds: { green: params.greenThreshold, amber: params.amberThreshold },
              outputs: ['green', 'amber', 'red'],
              sourceDocuments: ['doc-1'],
              createdBy: 'event-1',
            });

            // Emit measures
            const holonId = 'test-holon';
            const timestamp = new Date();
            params.measureValues.forEach((value, i) => {
              engine.emitMeasure(
                {
                  measureDefinitionID: measureDefs[i].id,
                  value,
                  holonID: holonId,
                  timestamp,
                },
                'actor-1',
                'test-system'
              );
            });

            // Evaluate lens
            const result = engine.evaluateLens(
              lensDef.id,
              holonId,
              new Date(timestamp.getTime() + 1000),
              'actor-1',
              'test-system'
            );

            // Compute expected output
            const average = params.measureValues.reduce((sum, v) => sum + v, 0) / params.measureValues.length;
            let expectedOutput: string;
            if (average >= params.greenThreshold) {
              expectedOutput = 'green';
            } else if (average >= params.amberThreshold) {
              expectedOutput = 'amber';
            } else {
              expectedOutput = 'red';
            }

            // Verify output matches expected
            return result.output.output === expectedOutput;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: semantic-operating-model, Property 36: Definition versioning**
  describe('Property 36: Definition versioning', () => {
    it('should create new versions while preserving old versions for measures', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: nonWhitespaceString({ minLength: 1, maxLength: 50 }),
            versionCount: fc.integer({ min: 1, max: 5 }),
          }),
          (params) => {
            // Create a fresh engine for each test run to avoid state pollution
            const testEventStore = createEventStore();
            const testEngine = createMeasureLensEngine(testEventStore);
            const versions: HolonID[] = [];

            // Create multiple versions
            for (let i = 0; i < params.versionCount; i++) {
              const measureDef = testEngine.createMeasureDefinition({
                name: params.name,
                description: `Version ${i + 1}`,
                unit: 'units',
                calculationMethod: 'direct',
                samplingFrequency: 1000,
                dataSources: ['test'],
                type: 'state',
                leadingOrLagging: 'leading',
                quantitativeOrQualitative: 'quantitative',
                sourceDocuments: ['doc-1'],
                createdBy: 'event-1',
              });
              versions.push(measureDef.id);
            }

            // Verify all versions exist and are accessible
            const storedVersions = testEngine.getMeasureVersions(params.name);
            if (storedVersions.length !== params.versionCount) {
              return false;
            }

            // Verify each version is still accessible
            for (let i = 0; i < versions.length; i++) {
              const holon = holonRegistry.getHolon(versions[i]);
              if (!holon || holon.properties.version !== i + 1) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create new versions while preserving old versions for lenses', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: nonWhitespaceString({ minLength: 1, maxLength: 50 }),
            versionCount: fc.integer({ min: 1, max: 5 }),
          }),
          (params) => {
            // Create a fresh engine for each test run to avoid state pollution
            const testEventStore = createEventStore();
            const testEngine = createMeasureLensEngine(testEventStore);
            const versions: HolonID[] = [];

            // Create multiple versions
            for (let i = 0; i < params.versionCount; i++) {
              const lensDef = testEngine.createLensDefinition({
                name: params.name,
                description: `Version ${i + 1}`,
                inputMeasures: ['measure-1'],
                logic: 'average',
                thresholds: { green: 80 },
                outputs: ['green', 'red'],
                sourceDocuments: ['doc-1'],
                createdBy: 'event-1',
              });
              versions.push(lensDef.id);
            }

            // Verify all versions exist and are accessible
            const storedVersions = testEngine.getLensVersions(params.name);
            if (storedVersions.length !== params.versionCount) {
              return false;
            }

            // Verify each version is still accessible
            for (let i = 0; i < versions.length; i++) {
              const holon = holonRegistry.getHolon(versions[i]);
              if (!holon || holon.properties.version !== i + 1) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
