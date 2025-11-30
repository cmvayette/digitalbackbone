/**
 * Tests for Mission Management module
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { MissionManager, CreateMissionParams, CreateCapabilityParams, CreateAssetParams } from './index';
import { HolonRegistry } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { EventStore, InMemoryEventStore } from '../event-store';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';
import { HolonType } from '../core/types/holon';

describe('MissionManager', () => {
  let missionManager: MissionManager;
  let holonRegistry: HolonRegistry;
  let relationshipRegistry: RelationshipRegistry;
  let eventStore: EventStore;
  let constraintEngine: ConstraintEngine;
  let documentRegistry: DocumentRegistry;

  beforeEach(() => {
    holonRegistry = new HolonRegistry();
    documentRegistry = new DocumentRegistry();
    eventStore = new InMemoryEventStore();
    constraintEngine = new ConstraintEngine(documentRegistry);
    relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);
    missionManager = new MissionManager(holonRegistry, relationshipRegistry, eventStore, constraintEngine);
  });

  // **Feature: semantic-operating-model, Property 24: Mission holon completeness**
  // **Validates: Requirements 7.1**
  test('Property 24: Mission holon completeness - For any Mission holon created, it must contain SOM Mission ID, name, type, classification metadata, and time bounds', () => {
    fc.assert(
      fc.property(
        fc.record({
          operationName: fc.string({ minLength: 1, maxLength: 100 }),
          operationNumber: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('training' as const, 'real_world' as const),
          classificationMetadata: fc.string({ minLength: 1, maxLength: 200 }),
          startTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          endTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          sourceDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
          actor: fc.uuid(),
          sourceSystem: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (params) => {
          // Ensure endTime is after startTime
          if (params.endTime <= params.startTime) {
            params.endTime = new Date(params.startTime.getTime() + 24 * 60 * 60 * 1000);
          }

          const result = missionManager.createMission(params);

          // Mission creation should succeed
          expect(result.success).toBe(true);
          expect(result.holonID).toBeDefined();

          // Retrieve the created mission
          const mission = holonRegistry.getHolon(result.holonID!);
          expect(mission).toBeDefined();

          // Verify all required fields are present
          expect(mission!.id).toBeDefined(); // SOM Mission ID
          expect(mission!.type).toBe(HolonType.Mission);
          expect(mission!.properties.operationName).toBe(params.operationName); // name
          expect(mission!.properties.operationNumber).toBeDefined();
          expect(mission!.properties.type).toBe(params.type); // type
          expect(mission!.properties.classificationMetadata).toBe(params.classificationMetadata); // classification metadata
          expect(mission!.properties.startTime).toBeDefined(); // time bounds
          expect(mission!.properties.endTime).toBeDefined(); // time bounds

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Feature: semantic-operating-model, Property 25: Mission lifecycle tracking**
  // **Validates: Requirements 7.5**
  test('Property 25: Mission lifecycle tracking - For any mission with phase transitions, all phase transition events must be recorded and mission state must reflect the current phase', () => {
    fc.assert(
      fc.property(
        fc.record({
          mission: fc.record({
            operationName: fc.string({ minLength: 1, maxLength: 100 }),
            operationNumber: fc.string({ minLength: 1, maxLength: 50 }),
            type: fc.constantFrom('training' as const, 'real_world' as const),
            classificationMetadata: fc.string({ minLength: 1, maxLength: 200 }),
            // Use dates in the past to avoid timestamp validation issues
            startTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-06-01') }),
            endTime: fc.date({ min: new Date('2024-06-01'), max: new Date('2024-12-31') }),
            sourceDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
            actor: fc.uuid(),
            sourceSystem: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          phases: fc.array(
            fc.record({
              fromPhase: fc.string({ minLength: 1, maxLength: 50 }),
              toPhase: fc.string({ minLength: 1, maxLength: 50 }),
              reason: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        ({ mission, phases }) => {
          // Ensure endTime is after startTime
          if (mission.endTime <= mission.startTime) {
            mission.endTime = new Date(mission.startTime.getTime() + 24 * 60 * 60 * 1000);
          }

          // Create mission
          const missionResult = missionManager.createMission(mission);
          expect(missionResult.success).toBe(true);
          const missionID = missionResult.holonID!;

          // Record phase transitions - use times within the mission timeframe
          const transitionEventIDs: string[] = [];
          let currentTime = new Date(mission.startTime.getTime() + 1000);

          for (const phase of phases) {
            // Ensure transition time doesn't exceed mission end time or current time
            const now = new Date();
            const maxTime = mission.endTime < now ? mission.endTime : now;
            if (currentTime > maxTime) {
              currentTime = new Date(maxTime.getTime() - 1000);
            }

            const transitionResult = missionManager.recordMissionPhaseTransition({
              missionID,
              fromPhase: phase.fromPhase,
              toPhase: phase.toPhase,
              transitionTime: currentTime,
              reason: phase.reason ?? undefined,
              actor: mission.actor,
              sourceSystem: mission.sourceSystem,
            });

            expect(transitionResult.success).toBe(true);
            expect(transitionResult.eventID).toBeDefined();
            transitionEventIDs.push(transitionResult.eventID!);

            // Advance time for next transition (but not beyond mission end or current time)
            currentTime = new Date(Math.min(
              currentTime.getTime() + 60 * 60 * 1000,
              maxTime.getTime() - 1000
            ));
          }

          // Verify all phase transition events were recorded
          const phaseHistory = missionManager.getMissionPhaseHistory(missionID);
          expect(phaseHistory.length).toBe(phases.length);

          // Verify all recorded event IDs are in the history
          for (const eventID of transitionEventIDs) {
            expect(phaseHistory).toContain(eventID);
          }

          // Verify events contain correct phase information
          for (let i = 0; i < phases.length; i++) {
            const event = eventStore.getEvent(transitionEventIDs[i]);
            expect(event).toBeDefined();
            expect(event!.payload.fromPhase).toBe(phases[i].fromPhase);
            expect(event!.payload.toPhase).toBe(phases[i].toPhase);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Unit tests for basic functionality
  describe('Mission creation', () => {
    test('should create a mission with all required fields', () => {
      const params: CreateMissionParams = {
        operationName: 'Operation Neptune Spear',
        operationNumber: 'OP-2011-001',
        type: 'real_world',
        classificationMetadata: 'TOP SECRET//SI//NOFORN',
        startTime: new Date('2011-05-01'),
        endTime: new Date('2011-05-02'),
        sourceDocuments: ['doc-001'],
        actor: 'actor-001',
        sourceSystem: 'mission-planning',
      };

      const result = missionManager.createMission(params);

      expect(result.success).toBe(true);
      expect(result.holonID).toBeDefined();
      expect(result.eventID).toBeDefined();

      const mission = holonRegistry.getHolon(result.holonID!);
      expect(mission).toBeDefined();
      expect(mission!.type).toBe(HolonType.Mission);
      expect(mission!.properties.operationName).toBe(params.operationName);
    });
  });

  describe('Capability creation', () => {
    test('should create a capability with all required fields', () => {
      const params: CreateCapabilityParams = {
        capabilityCode: 'CAP-001',
        name: 'Direct Action',
        description: 'Capability to conduct direct action operations',
        level: 'tactical',
        domain: 'special_operations',
        sourceDocuments: ['doc-001'],
        actor: 'actor-001',
        sourceSystem: 'capability-registry',
      };

      const result = missionManager.createCapability(params);

      expect(result.success).toBe(true);
      expect(result.holonID).toBeDefined();

      const capability = holonRegistry.getHolon(result.holonID!);
      expect(capability).toBeDefined();
      expect(capability!.type).toBe(HolonType.Capability);
      expect(capability!.properties.name).toBe(params.name);
    });
  });

  describe('Asset creation', () => {
    test('should create an asset with all required fields', () => {
      const params: CreateAssetParams = {
        hullNumberOrSerial: 'DDG-51',
        assetType: 'destroyer',
        configuration: 'baseline_9',
        status: 'operational',
        sourceDocuments: ['doc-001'],
        actor: 'actor-001',
        sourceSystem: 'asset-registry',
      };

      const result = missionManager.createAsset(params);

      expect(result.success).toBe(true);
      expect(result.holonID).toBeDefined();

      const asset = holonRegistry.getHolon(result.holonID!);
      expect(asset).toBeDefined();
      expect(asset!.type).toBe(HolonType.Asset);
      expect(asset!.properties.hullNumberOrSerial).toBe(params.hullNumberOrSerial);
    });
  });

  describe('Mission-Capability relationships', () => {
    test('should assign a capability to a mission', () => {
      // Create mission
      const missionResult = missionManager.createMission({
        operationName: 'Test Mission',
        operationNumber: 'TM-001',
        type: 'training',
        classificationMetadata: 'UNCLASSIFIED',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-01-02'),
        sourceDocuments: ['doc-001'],
        actor: 'actor-001',
        sourceSystem: 'test',
      });

      // Create capability
      const capabilityResult = missionManager.createCapability({
        capabilityCode: 'CAP-001',
        name: 'Test Capability',
        description: 'Test',
        level: 'tactical',
        domain: 'test',
        sourceDocuments: ['doc-001'],
        actor: 'actor-001',
        sourceSystem: 'test',
      });

      // Assign capability to mission
      const assignResult = missionManager.assignCapabilityToMission({
        missionID: missionResult.holonID!,
        capabilityID: capabilityResult.holonID!,
        effectiveStart: new Date('2024-01-01'),
        sourceDocuments: ['doc-001'],
        actor: 'actor-001',
        sourceSystem: 'test',
      });

      expect(assignResult.success).toBe(true);
      expect(assignResult.relationshipID).toBeDefined();

      // Verify relationship
      const capabilities = missionManager.getMissionCapabilities(missionResult.holonID!);
      expect(capabilities).toContain(capabilityResult.holonID);
    });
  });

  describe('Asset-Mission relationships', () => {
    test('should assign an asset to support a mission', () => {
      // Create mission
      const missionResult = missionManager.createMission({
        operationName: 'Test Mission',
        operationNumber: 'TM-001',
        type: 'training',
        classificationMetadata: 'UNCLASSIFIED',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-01-02'),
        sourceDocuments: ['doc-001'],
        actor: 'actor-001',
        sourceSystem: 'test',
      });

      // Create asset
      const assetResult = missionManager.createAsset({
        hullNumberOrSerial: 'TEST-001',
        assetType: 'test_asset',
        configuration: 'standard',
        status: 'operational',
        sourceDocuments: ['doc-001'],
        actor: 'actor-001',
        sourceSystem: 'test',
      });

      // Assign asset to mission
      const assignResult = missionManager.assignAssetToMission({
        assetID: assetResult.holonID!,
        missionID: missionResult.holonID!,
        effectiveStart: new Date('2024-01-01'),
        sourceDocuments: ['doc-001'],
        actor: 'actor-001',
        sourceSystem: 'test',
      });

      expect(assignResult.success).toBe(true);
      expect(assignResult.relationshipID).toBeDefined();

      // Verify relationship
      const assets = missionManager.getMissionAssets(missionResult.holonID!);
      expect(assets).toContain(assetResult.holonID);
    });
  });

  describe('Mission phase transitions', () => {
    test('should record mission phase transitions', () => {
      // Create mission
      const missionResult = missionManager.createMission({
        operationName: 'Test Mission',
        operationNumber: 'TM-001',
        type: 'training',
        classificationMetadata: 'UNCLASSIFIED',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-01-02'),
        sourceDocuments: ['doc-001'],
        actor: 'actor-001',
        sourceSystem: 'test',
      });

      // Record phase transition
      const transitionResult = missionManager.recordMissionPhaseTransition({
        missionID: missionResult.holonID!,
        fromPhase: 'planning',
        toPhase: 'execution',
        transitionTime: new Date('2024-01-01T12:00:00Z'),
        reason: 'Mission approved',
        actor: 'actor-001',
        sourceSystem: 'test',
      });

      expect(transitionResult.success).toBe(true);
      expect(transitionResult.eventID).toBeDefined();

      // Verify phase history
      const phaseHistory = missionManager.getMissionPhaseHistory(missionResult.holonID!);
      expect(phaseHistory.length).toBe(1);
      expect(phaseHistory).toContain(transitionResult.eventID);
    });
  });
});
