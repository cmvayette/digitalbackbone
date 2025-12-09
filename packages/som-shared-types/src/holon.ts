/**
 * Core holon type definitions for the Semantic Operating Model
 */

export type HolonID = string;
export type DocumentID = string;
export type EventID = string;
export type Timestamp = Date;

export enum HolonType {
  Person = 'Person',
  Position = 'Position',
  Organization = 'Organization',
  System = 'System',
  Asset = 'Asset',
  Mission = 'Mission',
  Capability = 'Capability',
  Qualification = 'Qualification',
  // Event = 'Event', // Events are not Holons
  Location = 'Location',
  Document = 'Document',
  Objective = 'Objective',
  LOE = 'LOE',
  Initiative = 'Initiative',
  Task = 'Task',
  MeasureDefinition = 'MeasureDefinition',
  LensDefinition = 'LensDefinition',
  Constraint = 'Constraint',

  Process = 'Process',
  Agent = 'Agent',
  KeyResult = 'KeyResult'
}

export type Actor = Person | Agent | Position | System;

export interface Agent extends Holon {
  type: HolonType.Agent;
  properties: {
    name: string;
    description: string;
    version: string;
    capabilities: string[];
    model?: string;
  };
}

export interface Holon {
  id: HolonID;
  type: HolonType;
  properties: Record<string, any>;
  createdAt: Timestamp;
  createdBy: EventID;
  status: 'active' | 'inactive' | 'archived' | 'draft';
  sourceDocuments: DocumentID[];
}

export interface Person extends Holon {
  type: HolonType.Person;
  properties: {
    edipi: string;
    serviceNumbers: string[];
    name: string;
    dob: Date;
    serviceBranch: string;
    designatorRating: string;
    category: 'active_duty' | 'reserve' | 'civilian' | 'contractor';
    certificates: string[]; // Held qualifications (e.g. "CompTIA Security+")
    workLoad: number; // Current load (0-100)
    capacity: number; // Max load (0-100)
  };
}

export interface Position extends Holon {
  type: HolonType.Position;
  properties: {
    billetIDs: string[];
    title: string;
    gradeRange: { min: string; max: string };
    designatorExpectations: string[];
    criticality: 'critical' | 'important' | 'standard';
    billetType: 'command' | 'staff' | 'support';
    qualifications: RequiredQualification[];
  };
}

export interface RequiredQualification {
  id: string;
  name: string; // e.g. "IAM Level 2"
  source: string; // e.g. "DoD Manual 8570.01"
  strictness: 'mandatory' | 'desired';
}

export interface Organization extends Holon {
  type: HolonType.Organization;
  properties: {
    uics: string[];
    name: string;
    type: string;
    echelonLevel: string;
    missionStatement: string;
    isTigerTeam: boolean;
  };
}

export interface ObligationLink {
  id: string;
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  owner: string;
  obligations: ObligationLink[];
  source?: 'native' | 'external';
  externalId?: string;
  externalSource?: string;
}

export interface ProcessProperties {
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  steps: ProcessStep[];
  estimatedDuration: number; // in milliseconds
}

export interface Process extends Holon {
  type: HolonType.Process;
  status: 'active' | 'inactive' | 'archived' | 'draft';
  properties: ProcessProperties;
}

export interface Mission extends Holon {
  type: HolonType.Mission;
  properties: {
    operationName: string;
    operationNumber: string;
    type: 'training' | 'real_world';
    classificationMetadata: string;
    startTime: Timestamp;
    endTime: Timestamp;
  };
}

export interface Capability extends Holon {
  type: HolonType.Capability;
  properties: {
    capabilityCode: string;
    name: string;
    description: string;
    level: 'strategic' | 'operational' | 'tactical';
    domain: string;
  };
}

export interface Qualification extends Holon {
  type: HolonType.Qualification;
  properties: {
    nec?: string;
    pqsID?: string;
    courseCode?: string;
    certificationID?: string;
    name: string;
    type: string;
    validityPeriod: number; // Duration in milliseconds
    renewalRules: string;
    issuingAuthority: string;
  };
}

export interface Objective extends Holon {
  type: HolonType.Objective;
  properties: {
    statement: string;
    narrative?: string;
    ownerId: string; // Position or Organization
    level: 'strategic' | 'operational' | 'tactical';
    timeHorizon: Date;
    linkedKRs: string[]; // KeyResult Holon IDs
    status: 'proposed' | 'approved' | 'active' | 'achieved' | 'abandoned' | 'revised';
    source?: 'native' | 'external';
    externalId?: string;
    externalSource?: string;
  };
}

export interface KeyResult extends Holon {
  type: HolonType.KeyResult;
  properties: {
    statement: string; // "From X to Y by T"
    baseline: number;
    target: number;
    currentValue: number;
    measureRefId?: string; // Link to MeasureDefinition
    ownerId: string;
    cadence: 'weekly' | 'monthly' | 'quarterly';
    health: 'on-track' | 'at-risk' | 'off-track' | 'unknown';
    evidenceLogIds: string[]; // Links to EvidenceLog (if we had them as holons) or just keep internal
  };
}

export interface LOE extends Holon {
  type: HolonType.LOE;
  properties: {
    name: string;
    description: string;
    ownerId: string; // Org/Position
    timeframe: { start: Date; end: Date };
    relatedPolicyIds?: string[];
  };
}

export interface Initiative extends Holon {
  type: HolonType.Initiative;
  properties: {
    name: string;
    scope: string;
    sponsor: string;
    targetOutcomes: string[];
    stage: 'proposed' | 'approved' | 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
  };
}

export interface Task extends Holon {
  type: HolonType.Task;
  properties: {
    title: string;
    description: string;
    type: string;
    assigneeId: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    dueDate: Date;

    status: 'created' | 'assigned' | 'started' | 'blocked' | 'completed' | 'cancelled';
    source?: 'native' | 'external';
    externalId?: string;
    externalSource?: string; // e.g., 'jira', 'trello'
  };
}

export interface MeasureDefinition extends Holon {
  type: HolonType.MeasureDefinition;
  properties: {
    name: string;
    description: string;
    unit: string;
    calculationMethod: string;
    samplingFrequency: number; // Duration in milliseconds
    dataSources: string[];
    type: 'state' | 'flow';
    leadingOrLagging: 'leading' | 'lagging';
    quantitativeOrQualitative: 'quantitative' | 'qualitative';
    version: number;
  };
}

export interface LensDefinition extends Holon {
  type: HolonType.LensDefinition;
  properties: {
    name: string;
    description: string;
    inputMeasures: string[]; // MeasureDefinitionIDs
    logic: string;
    thresholds: Record<string, any>;
    outputs: string[];
    version: number;
  };
}

export interface System extends Holon {
  type: HolonType.System;
  properties: {
    systemName: string;
    systemType: string;
    version: string;
    status: string;
  };
}

export interface Asset extends Holon {
  type: HolonType.Asset;
  properties: {
    hullNumberOrSerial: string;
    assetType: string;
    configuration: string;
    status: string;
  };
}

export interface Location extends Holon {
  type: HolonType.Location;
  properties: {
    name: string;
    coordinates?: { latitude: number; longitude: number };
    locationType: string;
  };
}

export interface Document extends Holon {
  type: HolonType.Document;
  properties: {
    referenceNumbers: string[];
    title: string;
    documentType: DocumentType;
    version: string;
    effectiveDates: { start: Date; end?: Date };
    classificationMetadata: string;
    content?: string;
    supersedes?: DocumentID[];
    derivedFrom?: DocumentID[];
  };
}

export enum DocumentType {
  Policy = 'Policy',
  Order = 'Order',
  Plan = 'Plan',
  SOP = 'SOP',
  Record = 'Record',
  Instruction = 'Instruction',
  Manual = 'Manual',
  Charter = 'Charter',
  Framework = 'Framework',
  CONOPS = 'CONOPS',
  OPLAN = 'OPLAN',
  EXORD = 'EXORD'
}

export interface Constraint extends Holon {
  type: HolonType.Constraint;
  properties: {
    constraintType: ConstraintType;
    name: string;
    definition: string;
    scope: {
      holonTypes?: HolonType[];
      relationshipTypes?: string[];
      eventTypes?: string[];
    };
    effectiveDates: { start: Date; end?: Date };
    precedence: number;
    inheritanceRules?: string;
  };
}

export enum ConstraintType {
  Structural = 'Structural',
  Policy = 'Policy',
  Eligibility = 'Eligibility',
  Temporal = 'Temporal',
  Capacity = 'Capacity',
  Dependency = 'Dependency',
  Risk = 'Risk'
}
