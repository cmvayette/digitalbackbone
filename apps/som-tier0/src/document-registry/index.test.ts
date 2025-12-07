/**
 * Property-based tests for Document Registry
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { DocumentRegistry, RegisterDocumentParams } from './index';
import { DocumentType, HolonType } from '@som/shared-types';

describe('Document Registry - Property-Based Tests', () => {
  let registry: DocumentRegistry;

  beforeEach(() => {
    registry = new DocumentRegistry();
  });

  // Generator for valid document registration parameters
  const genDocumentParams = (): fc.Arbitrary<RegisterDocumentParams> => {
    return fc.record({
      referenceNumbers: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      documentType: fc.constantFrom(...Object.values(DocumentType)),
      version: fc.string({ minLength: 1, maxLength: 10 }),
      effectiveDates: fc.record({
        start: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }),
        end: fc.option(fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }), { nil: undefined }),
      }).map(dates => {
        // Ensure end date is after start date if it exists
        if (dates.end && dates.end < dates.start) {
          return { start: dates.end, end: dates.start };
        }
        return dates;
      }),
      classificationMetadata: fc.constantFrom('UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'),
      content: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
      supersedes: fc.option(fc.array(fc.uuid(), { maxLength: 3 }), { nil: undefined }),
      derivedFrom: fc.option(fc.array(fc.uuid(), { maxLength: 3 }), { nil: undefined }),
    });
  };

  // Generator for timestamps
  const genTimestamp = (): fc.Arbitrary<Date> => {
    return fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') });
  };

  /**
   * **Feature: semantic-operating-model, Property 37: Document holon completeness**
   * **Validates: Requirements 12.1**
   * 
   * For any Document holon created, it must contain SOM Document ID, reference numbers,
   * title, type, version, and effective dates.
   */
  test('Property 37: Document holon completeness', () => {
    fc.assert(
      fc.property(
        genDocumentParams(),
        fc.string({ minLength: 1 }), // createdBy event ID
        (params, createdBy) => {
          const document = registry.registerDocument(params, createdBy);

          // Verify all required fields are present
          expect(document.id).toBeDefined();
          expect(typeof document.id).toBe('string');
          expect(document.id.length).toBeGreaterThan(0);

          expect(document.properties.referenceNumbers).toBeDefined();
          expect(Array.isArray(document.properties.referenceNumbers)).toBe(true);
          expect(document.properties.referenceNumbers.length).toBeGreaterThan(0);

          expect(document.properties.title).toBeDefined();
          expect(typeof document.properties.title).toBe('string');
          expect(document.properties.title.length).toBeGreaterThan(0);

          expect(document.properties.documentType).toBeDefined();
          expect(Object.values(DocumentType)).toContain(document.properties.documentType);

          expect(document.properties.version).toBeDefined();
          expect(typeof document.properties.version).toBe('string');
          expect(document.properties.version.length).toBeGreaterThan(0);

          expect(document.properties.effectiveDates).toBeDefined();
          expect(document.properties.effectiveDates.start).toBeInstanceOf(Date);

          expect(document.properties.classificationMetadata).toBeDefined();
          expect(typeof document.properties.classificationMetadata).toBe('string');

          // Verify the document matches the input parameters
          expect(document.properties.referenceNumbers).toEqual(params.referenceNumbers);
          expect(document.properties.title).toBe(params.title);
          expect(document.properties.documentType).toBe(params.documentType);
          expect(document.properties.version).toBe(params.version);
          expect(document.properties.effectiveDates).toEqual(params.effectiveDates);
          expect(document.properties.classificationMetadata).toBe(params.classificationMetadata);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: semantic-operating-model, Property 38: Document temporal validity**
   * **Validates: Requirements 12.5**
   * 
   * For any timestamp T, querying documents in force at T must return only documents
   * whose effective date ranges include T.
   */
  test('Property 38: Document temporal validity', () => {
    fc.assert(
      fc.property(
        fc.array(genDocumentParams(), { minLength: 5, maxLength: 20 }),
        genTimestamp(),
        fc.string({ minLength: 1 }), // createdBy event ID
        (paramsArray, queryTimestamp, createdBy) => {
          // Register all documents
          const registeredDocs = paramsArray.map(params => 
            registry.registerDocument(params, createdBy)
          );

          // Query documents in force at the timestamp
          const docsInForce = registry.getDocumentsInForce(queryTimestamp);

          // Verify that all returned documents have effective dates that include the query timestamp
          for (const doc of docsInForce) {
            const { start, end } = doc.properties.effectiveDates;
            
            expect(queryTimestamp >= start).toBe(true);
            if (end) {
              expect(queryTimestamp <= end).toBe(true);
            }
          }

          // Verify that all documents with effective dates including the query timestamp are returned
          for (const doc of registeredDocs) {
            const { start, end } = doc.properties.effectiveDates;
            const shouldBeIncluded = queryTimestamp >= start && (!end || queryTimestamp <= end);

            if (shouldBeIncluded) {
              expect(docsInForce.some(d => d.id === doc.id)).toBe(true);
            } else {
              expect(docsInForce.some(d => d.id === doc.id)).toBe(false);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional unit tests for core functionality
  describe('Document Registration', () => {
    test('should register a document with all required fields', () => {
      const params: RegisterDocumentParams = {
        referenceNumbers: ['DOC-001', 'REF-123'],
        title: 'Test Document',
        documentType: DocumentType.Policy,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
        classificationMetadata: 'UNCLASSIFIED',
        content: 'Test content',
      };

      const document = registry.registerDocument(params, 'event-123');

      expect(document.id).toBeDefined();
      expect(document.type).toBe(HolonType.Document);
      expect(document.properties.title).toBe('Test Document');
      expect(document.status).toBe('active');
    });

    test('should generate unique IDs for each document', () => {
      const params: RegisterDocumentParams = {
        referenceNumbers: ['DOC-001'],
        title: 'Test Document',
        documentType: DocumentType.Policy,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01') },
        classificationMetadata: 'UNCLASSIFIED',
      };

      const doc1 = registry.registerDocument(params, 'event-1');
      const doc2 = registry.registerDocument(params, 'event-2');

      expect(doc1.id).not.toBe(doc2.id);
    });
  });

  describe('Document Supersession', () => {
    test('should create supersession relationships', () => {
      const oldDoc = registry.registerDocument({
        referenceNumbers: ['DOC-001'],
        title: 'Old Document',
        documentType: DocumentType.Policy,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01'), end: new Date('2024-06-30') },
        classificationMetadata: 'UNCLASSIFIED',
      }, 'event-1');

      const newDoc = registry.registerDocument({
        referenceNumbers: ['DOC-002'],
        title: 'New Document',
        documentType: DocumentType.Policy,
        version: '2.0',
        effectiveDates: { start: new Date('2024-07-01') },
        classificationMetadata: 'UNCLASSIFIED',
      }, 'event-2');

      registry.supersede(newDoc.id, oldDoc.id);

      const chain = registry.getSupersessionChain(newDoc.id);
      expect(chain).toContain(oldDoc.id);
    });
  });

  describe('Document Linkage', () => {
    test('should link documents to holon types', () => {
      const doc = registry.registerDocument({
        referenceNumbers: ['DOC-001'],
        title: 'Person Definition',
        documentType: DocumentType.Policy,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01') },
        classificationMetadata: 'UNCLASSIFIED',
      }, 'event-1');

      registry.linkToHolonTypes(doc.id, [HolonType.Person, HolonType.Position]);

      const linkage = registry.getDocumentLinkage(doc.id);
      expect(linkage?.linkedHolonTypes).toContain(HolonType.Person);
      expect(linkage?.linkedHolonTypes).toContain(HolonType.Position);
    });

    test('should link documents to constraints', () => {
      const doc = registry.registerDocument({
        referenceNumbers: ['DOC-001'],
        title: 'Constraint Definition',
        documentType: DocumentType.Policy,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01') },
        classificationMetadata: 'UNCLASSIFIED',
      }, 'event-1');

      registry.linkToConstraints(doc.id, ['constraint-1', 'constraint-2']);

      const linkage = registry.getDocumentLinkage(doc.id);
      expect(linkage?.linkedConstraintIds).toContain('constraint-1');
      expect(linkage?.linkedConstraintIds).toContain('constraint-2');
    });
  });

  describe('Temporal Queries', () => {
    test('should return documents in force at a specific timestamp', () => {
      const doc1 = registry.registerDocument({
        referenceNumbers: ['DOC-001'],
        title: 'Document 1',
        documentType: DocumentType.Policy,
        version: '1.0',
        effectiveDates: { start: new Date('2024-01-01'), end: new Date('2024-06-30') },
        classificationMetadata: 'UNCLASSIFIED',
      }, 'event-1');

      const doc2 = registry.registerDocument({
        referenceNumbers: ['DOC-002'],
        title: 'Document 2',
        documentType: DocumentType.Policy,
        version: '1.0',
        effectiveDates: { start: new Date('2024-07-01') },
        classificationMetadata: 'UNCLASSIFIED',
      }, 'event-2');

      // Query at a time when only doc1 is in force
      const docsInForce1 = registry.getDocumentsInForce(new Date('2024-03-15'));
      expect(docsInForce1.some(d => d.id === doc1.id)).toBe(true);
      expect(docsInForce1.some(d => d.id === doc2.id)).toBe(false);

      // Query at a time when only doc2 is in force
      const docsInForce2 = registry.getDocumentsInForce(new Date('2024-08-15'));
      expect(docsInForce2.some(d => d.id === doc1.id)).toBe(false);
      expect(docsInForce2.some(d => d.id === doc2.id)).toBe(true);
    });
  });
});
