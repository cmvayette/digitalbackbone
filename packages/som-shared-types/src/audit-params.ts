/**
 * Common audit/tracking fields required for all state-changing operations.
 * Eliminates duplication of sourceDocuments, actor, sourceSystem across 38+ param interfaces.
 */

import { DocumentID, HolonID } from './holon.js';

/**
 * Audit parameters required for all state-changing operations.
 * Provides traceability for who did what and under what authority.
 *
 * @example
 * interface CreatePersonParams extends AuditParams {
 *   name: string;
 *   edipi: string;
 *   // ... domain-specific fields
 * }
 */
export interface AuditParams {
  /**
   * Source documents that authorize this operation.
   * Links to Document holons that provide authority for this change.
   */
  sourceDocuments: DocumentID[];

  /**
   * The actor (person or system) performing this operation.
   * Should be a Person holon ID or System holon ID.
   */
  actor: HolonID;

  /**
   * The system originating this operation.
   * Examples: 'som-api', 'nsips-adapter', 'manual-entry'
   */
  sourceSystem: string;
}

/**
 * Helper type to add audit params to any interface.
 *
 * @example
 * type CreatePersonParams = WithAudit<{
 *   name: string;
 *   edipi: string;
 * }>;
 */
export type WithAudit<T> = T & AuditParams;

/**
 * Creates default audit params for testing or internal operations.
 * Should NOT be used in production code paths.
 */
export function createTestAuditParams(overrides?: Partial<AuditParams>): AuditParams {
  return {
    sourceDocuments: overrides?.sourceDocuments ?? [],
    actor: overrides?.actor ?? 'system',
    sourceSystem: overrides?.sourceSystem ?? 'test',
  };
}
