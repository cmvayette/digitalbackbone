/**
 * Relationship type definitions for the Semantic Operating Model
 */

import { HolonID, DocumentID, EventID, Timestamp } from './holon';

export type RelationshipID = string;

export enum RelationshipType {
  // Structural
  CONTAINS = 'CONTAINS',
  HAS = 'HAS',
  OCCUPIES = 'OCCUPIES',
  MEMBER_OF = 'MEMBER_OF',
  BELONGS_TO = 'BELONGS_TO',
  PART_OF = 'PART_OF',

  // Responsibility
  RESPONSIBLE_FOR = 'RESPONSIBLE_FOR',
  OWNED_BY = 'OWNED_BY',
  OPERATED_BY = 'OPERATED_BY',

  // Alignment
  GROUPED_UNDER = 'GROUPED_UNDER',
  ALIGNED_TO = 'ALIGNED_TO',

  // Support
  SUPPORTS = 'SUPPORTS',
  ENABLES = 'ENABLES',
  USES = 'USES',

  // Qualification
  HELD_BY = 'HELD_BY',
  REQUIRED_FOR = 'REQUIRED_FOR',
  HAS_QUAL = 'HAS_QUAL',

  // Governance
  DEFINES = 'DEFINES',
  AUTHORIZES = 'AUTHORIZES',
  SUPERSEDES = 'SUPERSEDES',
  DERIVED_FROM = 'DERIVED_FROM',

  // Temporal/Causal
  CAUSED_BY = 'CAUSED_BY',
  FOLLOWS = 'FOLLOWS',
  GROUPED_WITH = 'GROUPED_WITH',

  // Location
  LOCATED_AT = 'LOCATED_AT',
  HOSTS = 'HOSTS',
  STAGING_FOR = 'STAGING_FOR',
  OCCURS_AT = 'OCCURS_AT',

  // Work
  ASSIGNED_TO = 'ASSIGNED_TO',
  PARTICIPATES_IN = 'PARTICIPATES_IN',
  PRODUCES = 'PRODUCES',
  PROVIDES = 'PROVIDES',
  DEPENDS_ON = 'DEPENDS_ON',

  // Measurement
  MEASURED_BY = 'MEASURED_BY',
  EMITS_MEASURE = 'EMITS_MEASURE',
  GROUNDED_IN = 'GROUNDED_IN',
  AFFECTS = 'AFFECTS',
  APPLIES_TO = 'APPLIES_TO'
}

export interface Relationship {
  id: RelationshipID;
  type: RelationshipType;
  sourceHolonID: HolonID;
  targetHolonID: HolonID;
  properties: Record<string, any>;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceSystem: string;
  sourceDocuments: DocumentID[];
  createdBy: EventID;
  authorityLevel: 'authoritative' | 'derived' | 'inferred';
  confidenceScore?: number;
}
