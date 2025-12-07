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
  Event = 'Event',
  Location = 'Location',
  Document = 'Document',
  Objective = 'Objective',
  LOE = 'LOE',
  Initiative = 'Initiative',
  Task = 'Task',
  MeasureDefinition = 'MeasureDefinition',
  LensDefinition = 'LensDefinition',
  Constraint = 'Constraint'
}

export interface Holon {
  id: HolonID;
  type: HolonType;
  properties: Record<string, any>;
  createdAt: Timestamp;
  createdBy: EventID;
  status: 'active' | 'inactive';
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
  };
}

export interface Organization extends Holon {
  type: HolonType.Organization;
  properties: {
    uics: string[];
    name: string;
    type: string;
    echelonLevel: string;
    missionStatement: string;
  };
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
    description: string;
    level: 'strategic' | 'operational' | 'tactical';
    timeHorizon: Date;
    status: 'proposed' | 'approved' | 'active' | 'achieved' | 'abandoned' | 'revised';
  };
}

export interface LOE extends Holon {
  type: HolonType.LOE;
  properties: {
    name: string;
    description: string;
    sponsoringEchelon: string;
    timeframe: { start: Date; end: Date };
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
    description: string;
    type: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    dueDate: Date;
    status: 'created' | 'assigned' | 'started' | 'blocked' | 'completed' | 'cancelled';
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

export interface SystemHolon extends Holon {
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

export interface LocationHolon extends Holon {
  type: HolonType.Location;
  properties: {
    name: string;
    coordinates?: { latitude: number; longitude: number };
    locationType: string;
  };
}

export interface DocumentHolon extends Holon {
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

export interface ConstraintHolon extends Holon {
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
