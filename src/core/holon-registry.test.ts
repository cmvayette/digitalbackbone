/**
 * Property-based tests for Holon Registry
 * 
 * These tests verify the correctness properties defined in the design document
 * using fast-check for property-based testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { HolonRegistry } from './holon-registry';
import { HolonType, Holon } from './types/holon';

describe('Holon Registry - Property-Based Tests', () => {
  let registry: HolonRegistry;

  beforeEach(() => {
    registry = new HolonRegistry();
  });

  /**
   * **Feature: semantic-operating-model, Property 1: Holon ID uniqueness and persistence**
   * **Validates: Requirements 1.1**
   * 
   * For any holon created in the SOM, the assigned SOM ID must be unique across all holons
   * and must never change regardless of system migrations or state changes.
   */
  describe('Property 1: Holon ID uniqueness and persistence', () => {
    it('should assign unique IDs to all created holons', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom(...Object.values(HolonType)),
              properties: fc.dictionary(fc.string(), fc.anything()),
              createdBy: fc.uuid(),
              sourceDocuments: fc.array(fc.uuid(), { maxLength: 5 })
            }),
            { minLength: 2, maxLength: 100 }
          ),
          (holonParams) => {
            const registry = new HolonRegistry();
            const createdHolons = holonParams.map(params => 
              registry.createHolon(params)
            );

            // Extract all IDs
            const ids = createdHolons.map(h => h.id);
            
            // Check uniqueness: all IDs should be distinct
            const uniqueIds = new Set(ids);
            
            return ids.length === uniqueIds.size;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should persist holon IDs across state changes (inactivation)', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom(...Object.values(HolonType)),
            properties: fc.dictionary(fc.string(), fc.anything()),
            createdBy: fc.uuid(),
            sourceDocuments: fc.array(fc.uuid(), { maxLength: 5 })
          }),
          (holonParams) => {
            const registry = new HolonRegistry();
            const holon = registry.createHolon(holonParams);
            const originalId = holon.id;

            // Mark as inactive
            registry.markHolonInactive(originalId);

            // Retrieve the holon
            const retrievedHolon = registry.getHolon(originalId);

            // ID should remain the same
            return retrievedHolon !== undefined && retrievedHolon.id === originalId;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never reuse holon IDs', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom(...Object.values(HolonType)),
              properties: fc.dictionary(fc.string(), fc.anything()),
              createdBy: fc.uuid(),
              sourceDocuments: fc.array(fc.uuid(), { maxLength: 5 })
            }),
            { minLength: 10, maxLength: 50 }
          ),
          (holonParams) => {
            const registry = new HolonRegistry();
            const allIds = new Set<string>();

            // Create holons in multiple batches
            for (const params of holonParams) {
              const holon = registry.createHolon(params);
              
              // Check that this ID has never been seen before
              if (allIds.has(holon.id)) {
                return false;
              }
              
              allIds.add(holon.id);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: semantic-operating-model, Property 3: Holon query completeness**
   * **Validates: Requirements 1.3**
   * 
   * For any holon, querying it must return all required fields: identity, purpose, properties,
   * relationships, lifecycle state, and document lineage.
   */
  describe('Property 3: Holon query completeness', () => {
    it('should return all required fields when querying a holon by ID', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom(...Object.values(HolonType)),
            properties: fc.dictionary(fc.string(), fc.anything()),
            createdBy: fc.uuid(),
            sourceDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 })
          }),
          (holonParams) => {
            const registry = new HolonRegistry();
            const createdHolon = registry.createHolon(holonParams);

            // Query the holon
            const queriedHolon = registry.getHolon(createdHolon.id);

            if (!queriedHolon) {
              return false;
            }

            // Verify all required fields are present
            const hasId = queriedHolon.id !== undefined && queriedHolon.id !== null;
            const hasType = queriedHolon.type !== undefined && queriedHolon.type !== null;
            const hasProperties = queriedHolon.properties !== undefined;
            const hasCreatedAt = queriedHolon.createdAt !== undefined && queriedHolon.createdAt instanceof Date;
            const hasCreatedBy = queriedHolon.createdBy !== undefined && queriedHolon.createdBy !== null;
            const hasStatus = queriedHolon.status === 'active' || queriedHolon.status === 'inactive';
            const hasSourceDocuments = Array.isArray(queriedHolon.sourceDocuments);

            return hasId && hasType && hasProperties && hasCreatedAt && 
                   hasCreatedBy && hasStatus && hasSourceDocuments;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return complete holons when querying by type', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom(...Object.values(HolonType)),
              properties: fc.dictionary(fc.string(), fc.anything()),
              createdBy: fc.uuid(),
              sourceDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 })
            }),
            { minLength: 5, maxLength: 20 }
          ),
          (holonParams) => {
            const registry = new HolonRegistry();
            
            // Create holons
            holonParams.forEach(params => registry.createHolon(params));

            // Query by each type
            for (const type of Object.values(HolonType)) {
              const holons = registry.getHolonsByType(type);
              
              // Check that all returned holons have complete fields
              for (const holon of holons) {
                const hasAllFields = 
                  holon.id !== undefined &&
                  holon.type === type &&
                  holon.properties !== undefined &&
                  holon.createdAt instanceof Date &&
                  holon.createdBy !== undefined &&
                  (holon.status === 'active' || holon.status === 'inactive') &&
                  Array.isArray(holon.sourceDocuments);
                
                if (!hasAllFields) {
                  return false;
                }
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all holon data through query operations', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom(...Object.values(HolonType)),
            properties: fc.dictionary(fc.string(), fc.string(), { minKeys: 1, maxKeys: 10 }),
            createdBy: fc.uuid(),
            sourceDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 })
          }),
          (holonParams) => {
            const registry = new HolonRegistry();
            const created = registry.createHolon(holonParams);

            // Query the holon
            const queried = registry.getHolon(created.id);

            if (!queried) {
              return false;
            }

            // Verify data integrity
            const idMatches = queried.id === created.id;
            const typeMatches = queried.type === created.type;
            const createdByMatches = queried.createdBy === created.createdBy;
            const statusMatches = queried.status === created.status;
            
            // Check properties match
            const propertiesMatch = JSON.stringify(queried.properties) === JSON.stringify(created.properties);
            
            // Check source documents match
            const docsMatch = JSON.stringify(queried.sourceDocuments) === JSON.stringify(created.sourceDocuments);

            return idMatches && typeMatches && createdByMatches && 
                   statusMatches && propertiesMatch && docsMatch;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: semantic-operating-model, Property 4: Inactive holon preservation**
   * **Validates: Requirements 1.4, 5.4**
   * 
   * For any holon marked inactive, the holon and its complete event history must remain
   * queryable and unchanged.
   */
  describe('Property 4: Inactive holon preservation', () => {
    it('should preserve inactive holons and keep them queryable', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom(...Object.values(HolonType)),
              properties: fc.dictionary(fc.string(), fc.anything()),
              createdBy: fc.uuid(),
              sourceDocuments: fc.array(fc.uuid(), { maxLength: 5 })
            }),
            { minLength: 5, maxLength: 20 }
          ),
          fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 1, maxLength: 10 }),
          (holonParams, indicesToInactivate) => {
            const registry = new HolonRegistry();
            
            // Create holons
            const holons = holonParams.map(params => registry.createHolon(params));

            // Mark some as inactive
            const inactivatedIds = new Set<string>();
            for (const idx of indicesToInactivate) {
              if (idx < holons.length) {
                const holon = holons[idx];
                registry.markHolonInactive(holon.id);
                inactivatedIds.add(holon.id);
              }
            }

            // Verify all holons (active and inactive) are still queryable
            for (const holon of holons) {
              const queried = registry.getHolon(holon.id);
              
              if (!queried) {
                return false; // Holon was deleted instead of inactivated
              }

              // Verify status is correct
              if (inactivatedIds.has(holon.id)) {
                if (queried.status !== 'inactive') {
                  return false;
                }
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all holon data when marking as inactive', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.constantFrom(...Object.values(HolonType)),
            properties: fc.dictionary(fc.string(), fc.string(), { minKeys: 1, maxKeys: 10 }),
            createdBy: fc.uuid(),
            sourceDocuments: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 })
          }),
          (holonParams) => {
            const registry = new HolonRegistry();
            const holon = registry.createHolon(holonParams);

            // Capture original data
            const originalId = holon.id;
            const originalType = holon.type;
            const originalProperties = JSON.stringify(holon.properties);
            const originalCreatedBy = holon.createdBy;
            const originalCreatedAt = holon.createdAt.getTime();
            const originalSourceDocs = JSON.stringify(holon.sourceDocuments);

            // Mark as inactive
            registry.markHolonInactive(originalId);

            // Query the inactive holon
            const inactiveHolon = registry.getHolon(originalId);

            if (!inactiveHolon) {
              return false;
            }

            // Verify all data is preserved except status
            return (
              inactiveHolon.id === originalId &&
              inactiveHolon.type === originalType &&
              JSON.stringify(inactiveHolon.properties) === originalProperties &&
              inactiveHolon.createdBy === originalCreatedBy &&
              inactiveHolon.createdAt.getTime() === originalCreatedAt &&
              JSON.stringify(inactiveHolon.sourceDocuments) === originalSourceDocs &&
              inactiveHolon.status === 'inactive'
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never delete holons when marking them inactive', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom(...Object.values(HolonType)),
              properties: fc.dictionary(fc.string(), fc.anything()),
              createdBy: fc.uuid(),
              sourceDocuments: fc.array(fc.uuid(), { maxLength: 5 })
            }),
            { minLength: 10, maxLength: 30 }
          ),
          (holonParams) => {
            const registry = new HolonRegistry();
            
            // Create holons
            const holons = holonParams.map(params => registry.createHolon(params));
            const totalCount = holons.length;

            // Mark all as inactive
            holons.forEach(holon => registry.markHolonInactive(holon.id));

            // Count all holons (should still be the same)
            const allHolons = registry.getAllHolons();
            
            return allHolons.length === totalCount;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow querying inactive holons by type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(HolonType)),
          fc.array(
            fc.record({
              properties: fc.dictionary(fc.string(), fc.anything()),
              createdBy: fc.uuid(),
              sourceDocuments: fc.array(fc.uuid(), { maxLength: 5 })
            }),
            { minLength: 5, maxLength: 15 }
          ),
          (holonType, holonParams) => {
            const registry = new HolonRegistry();
            
            // Create holons of the same type
            const holons = holonParams.map(params => 
              registry.createHolon({ ...params, type: holonType })
            );

            // Mark all as inactive
            holons.forEach(holon => registry.markHolonInactive(holon.id));

            // Query by type without filters (should include inactive)
            const allOfType = registry.getHolonsByType(holonType);
            
            // Query by type with inactive filter
            const inactiveOfType = registry.getHolonsByType(holonType, { status: 'inactive' });

            return allOfType.length === holons.length && 
                   inactiveOfType.length === holons.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
