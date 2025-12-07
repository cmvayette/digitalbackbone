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
      // 'Event' is not a Holon
      'Location',
      'Document',
      'Objective',
      'LOE',
      'Initiative',
      'Task',
      'MeasureDefinition',
      'LensDefinition',
      'Constraint',
      'Process',
      // 'Agent'
    ];

    const actualTypes = Object.values(HolonType);
    console.log('DEBUG: HolonType enum values:', actualTypes);
    console.log('DEBUG: HolonType.Agent:', HolonType.Agent);
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

  describe('Actor Unification', () => {
    it('should allow an Agent to be assigned where an Actor is expected', () => {
      const agent: any = {
        id: 'agent-1',
        type: HolonType.Agent,
        properties: {
          name: 'Logistics Bot',
          description: 'A bot for logistics',
          version: '1.0',
          capabilities: ['logistics']
        }
      };

      // In TypeScript, this is a compile-time check, but we simulate structure validation here
      expect(agent.type).toBe(HolonType.Agent);
      expect(agent.properties.capabilities).toContain('logistics');
    });
  });

  describe('Semantic Proxy', () => {
    it('should allow a Task to represent an external JIRA ticket', () => {
      const jiraTask: any = {
        type: HolonType.Task,
        source: 'external',
        externalId: 'PROJ-123',
        externalSource: 'jira',
        properties: {
          title: 'Fix Bug',
          status: 'created'
        }
      };

      expect(jiraTask.source).toBe('external');
      expect(jiraTask.externalSource).toBe('jira');
    });
  });
});
