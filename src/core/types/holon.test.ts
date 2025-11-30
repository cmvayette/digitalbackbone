/**
 * Basic tests to verify type definitions and fast-check setup
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { HolonType, HolonID, EventID, DocumentID } from './holon';

describe('Core Type Definitions', () => {
  it('should have all required holon types defined', () => {
    const expectedTypes = [
      'Person',
      'Position',
      'Organization',
      'System',
      'Asset',
      'Mission',
      'Capability',
      'Qualification',
      'Event',
      'Location',
      'Document',
      'Objective',
      'LOE',
      'Initiative',
      'Task',
      'MeasureDefinition',
      'LensDefinition',
      'Constraint'
    ];

    const actualTypes = Object.values(HolonType);
    expect(actualTypes).toEqual(expectedTypes);
  });

  it('should verify fast-check is working with a simple property', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        // Property: concatenation length equals sum of individual lengths
        return (a + b).length === a.length + b.length;
      }),
      { numRuns: 100 }
    );
  });

  it('should verify fast-check can generate UUIDs for IDs', () => {
    fc.assert(
      fc.property(fc.uuid(), (id: HolonID) => {
        // Property: UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
      }),
      { numRuns: 100 }
    );
  });
});
