/**
 * Seed Data Script
 * Creates realistic NSW organizational structure for development and testing
 */

import { HolonType, HolonID, RelationshipType, EventType, DocumentType } from '@som/shared-types';
import { InMemoryHolonRepository } from '../core/holon-registry';
import { RelationshipRegistry } from '../relationship-registry';
import { InMemoryEventStore } from '../event-store';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';

// Seed actor for all operations
const SEED_ACTOR = 'system-seed';
const SEED_SYSTEM = 'seed-script';

/**
 * Seed context containing all registries
 */
export interface SeedContext {
  holonRegistry: InMemoryHolonRepository;
  relationshipRegistry: RelationshipRegistry;
  eventStore: InMemoryEventStore;
  constraintEngine: ConstraintEngine;
  documentRegistry: DocumentRegistry;
}

/**
 * IDs of created seed data for reference
 */
export interface SeedDataIds {
  organizations: Record<string, HolonID>;
  positions: Record<string, HolonID>;
  people: Record<string, HolonID>;
  processes: Record<string, HolonID>;
  policies: Record<string, HolonID>;
  objectives: Record<string, HolonID>;
  loes: Record<string, HolonID>;
  tasks: Record<string, HolonID>;
}

/**
 * Seed the database with realistic NSW data
 */
export async function seedDevelopmentData(ctx: SeedContext): Promise<SeedDataIds> {
  const ids: SeedDataIds = {
    organizations: {},
    positions: {},
    people: {},
    processes: {},
    policies: {},
    objectives: {},
    loes: {},
    tasks: {},
  };

  console.log('🌱 Starting seed data generation...');

  // ==================== Organizations ====================
  console.log('  Creating organizations...');

  // NSWC (Naval Special Warfare Command)
  ids.organizations.nswc = await createOrganization(ctx, {
    name: 'Naval Special Warfare Command',
    uics: ['00000'],
    type: 'command',
    echelonLevel: 'O-8',
    missionStatement: 'Organize, man, train, equip, and deploy combat-ready Naval Special Warfare forces.',
    isTigerTeam: false,
  });

  // Groups under NSWC
  ids.organizations.nswg1 = await createOrganization(ctx, {
    name: 'Naval Special Warfare Group 1',
    uics: ['10000'],
    type: 'group',
    echelonLevel: 'O-6',
    missionStatement: 'Provide combat-ready SEAL and SDV forces.',
    isTigerTeam: false,
    parentId: ids.organizations.nswc,
  });

  ids.organizations.nswg2 = await createOrganization(ctx, {
    name: 'Naval Special Warfare Group 2',
    uics: ['20000'],
    type: 'group',
    echelonLevel: 'O-6',
    missionStatement: 'Provide combat-ready SEAL forces for East Coast operations.',
    isTigerTeam: false,
    parentId: ids.organizations.nswc,
  });

  // SEAL Teams under Group 1
  ids.organizations.st1 = await createOrganization(ctx, {
    name: 'SEAL Team 1',
    uics: ['11000'],
    type: 'team',
    echelonLevel: 'O-5',
    missionStatement: 'Conduct special operations in maritime, littoral, and riverine environments.',
    isTigerTeam: false,
    parentId: ids.organizations.nswg1,
  });

  ids.organizations.st3 = await createOrganization(ctx, {
    name: 'SEAL Team 3',
    uics: ['13000'],
    type: 'team',
    echelonLevel: 'O-5',
    missionStatement: 'Conduct special operations and direct action missions.',
    isTigerTeam: false,
    parentId: ids.organizations.nswg1,
  });

  // Staff sections
  ids.organizations.n1 = await createOrganization(ctx, {
    name: 'N1 - Manpower',
    uics: ['00100'],
    type: 'staff',
    echelonLevel: 'O-5',
    missionStatement: 'Personnel management and manpower planning.',
    isTigerTeam: false,
    parentId: ids.organizations.nswc,
  });

  ids.organizations.n3 = await createOrganization(ctx, {
    name: 'N3 - Operations',
    uics: ['00300'],
    type: 'staff',
    echelonLevel: 'O-5',
    missionStatement: 'Operations planning and execution.',
    isTigerTeam: false,
    parentId: ids.organizations.nswc,
  });

  ids.organizations.n6 = await createOrganization(ctx, {
    name: 'N6 - Communications',
    uics: ['00600'],
    type: 'staff',
    echelonLevel: 'O-5',
    missionStatement: 'Communications and information systems.',
    isTigerTeam: false,
    parentId: ids.organizations.nswc,
  });

  // Tiger Team example
  ids.organizations.digiTransform = await createOrganization(ctx, {
    name: 'Digital Transformation Tiger Team',
    uics: ['TT001'],
    type: 'tiger_team',
    echelonLevel: 'O-4',
    missionStatement: 'Drive digital modernization across NSW.',
    isTigerTeam: true,
    parentId: ids.organizations.nswc,
  });

  // ==================== Positions ====================
  console.log('  Creating positions...');

  // NSWC Leadership
  ids.positions.nswcCO = await createPosition(ctx, {
    title: 'Commander, Naval Special Warfare Command',
    billetIDs: ['NSWC-CO'],
    gradeRange: { min: 'O-7', max: 'O-8' },
    designatorExpectations: ['1130'],
    criticality: 'critical',
    billetType: 'command',
    orgId: ids.organizations.nswc,
  });

  ids.positions.nswcXO = await createPosition(ctx, {
    title: 'Deputy Commander',
    billetIDs: ['NSWC-XO'],
    gradeRange: { min: 'O-6', max: 'O-7' },
    designatorExpectations: ['1130'],
    criticality: 'critical',
    billetType: 'command',
    orgId: ids.organizations.nswc,
  });

  // ST1 Positions
  ids.positions.st1CO = await createPosition(ctx, {
    title: 'Commanding Officer, SEAL Team 1',
    billetIDs: ['ST1-CO'],
    gradeRange: { min: 'O-5', max: 'O-5' },
    designatorExpectations: ['1130'],
    criticality: 'critical',
    billetType: 'command',
    orgId: ids.organizations.st1,
  });

  ids.positions.st1XO = await createPosition(ctx, {
    title: 'Executive Officer, SEAL Team 1',
    billetIDs: ['ST1-XO'],
    gradeRange: { min: 'O-4', max: 'O-4' },
    designatorExpectations: ['1130'],
    criticality: 'critical',
    billetType: 'command',
    orgId: ids.organizations.st1,
  });

  ids.positions.st1CMC = await createPosition(ctx, {
    title: 'Command Master Chief, SEAL Team 1',
    billetIDs: ['ST1-CMC'],
    gradeRange: { min: 'E-9', max: 'E-9' },
    designatorExpectations: ['5326'],
    criticality: 'critical',
    billetType: 'command',
    orgId: ids.organizations.st1,
  });

  ids.positions.st1OpsO = await createPosition(ctx, {
    title: 'Operations Officer',
    billetIDs: ['ST1-N3'],
    gradeRange: { min: 'O-3', max: 'O-4' },
    designatorExpectations: ['1130'],
    criticality: 'important',
    billetType: 'staff',
    orgId: ids.organizations.st1,
  });

  // N6 Positions
  ids.positions.n6Dir = await createPosition(ctx, {
    title: 'Director, N6',
    billetIDs: ['N6-DIR'],
    gradeRange: { min: 'O-5', max: 'O-6' },
    designatorExpectations: ['1820'],
    criticality: 'important',
    billetType: 'staff',
    orgId: ids.organizations.n6,
  });

  ids.positions.n6Tech = await createPosition(ctx, {
    title: 'Senior Systems Engineer',
    billetIDs: ['N6-ENG1'],
    gradeRange: { min: 'GS-13', max: 'GS-14' },
    designatorExpectations: [],
    criticality: 'standard',
    billetType: 'staff',
    orgId: ids.organizations.n6,
  });

  // Vacant position example
  ids.positions.st1TrainO = await createPosition(ctx, {
    title: 'Training Officer',
    billetIDs: ['ST1-N7'],
    gradeRange: { min: 'O-3', max: 'O-4' },
    designatorExpectations: ['1130'],
    criticality: 'important',
    billetType: 'staff',
    orgId: ids.organizations.st1,
  });

  // ==================== People ====================
  console.log('  Creating people...');

  ids.people.admiral = await createPerson(ctx, {
    edipi: '1234567890',
    name: 'RADM James Wilson',
    serviceBranch: 'Navy',
    designatorRating: '1130',
    category: 'active_duty',
    positionId: ids.positions.nswcCO,
  });

  ids.people.st1co = await createPerson(ctx, {
    edipi: '2345678901',
    name: 'CDR Michael Chen',
    serviceBranch: 'Navy',
    designatorRating: '1130',
    category: 'active_duty',
    positionId: ids.positions.st1CO,
  });

  ids.people.st1xo = await createPerson(ctx, {
    edipi: '3456789012',
    name: 'LCDR Sarah Martinez',
    serviceBranch: 'Navy',
    designatorRating: '1130',
    category: 'active_duty',
    positionId: ids.positions.st1XO,
  });

  ids.people.st1cmc = await createPerson(ctx, {
    edipi: '4567890123',
    name: 'CMDCM Robert Jackson',
    serviceBranch: 'Navy',
    designatorRating: '5326',
    category: 'active_duty',
    positionId: ids.positions.st1CMC,
  });

  ids.people.n6engineer = await createPerson(ctx, {
    edipi: '5678901234',
    name: 'David Thompson',
    serviceBranch: 'Navy',
    designatorRating: '',
    category: 'civilian',
    positionId: ids.positions.n6Tech,
  });

  // ==================== Policies/Documents ====================
  console.log('  Creating policies...');

  ids.policies.personnelPolicy = await createPolicy(ctx, {
    title: 'NSW Personnel Management Instruction',
    referenceNumber: 'NSWINST 1000.1A',
    documentType: 'Instruction',
    content: 'This instruction establishes policies and procedures for personnel management...',
  });

  ids.policies.trainingPolicy = await createPolicy(ctx, {
    title: 'NSW Training Standards',
    referenceNumber: 'NSWINST 1500.1B',
    documentType: 'Instruction',
    content: 'This instruction establishes training standards and requirements...',
  });

  ids.policies.opsecPolicy = await createPolicy(ctx, {
    title: 'Operations Security Policy',
    referenceNumber: 'NSWINST 3070.1',
    documentType: 'Policy',
    content: 'This policy establishes OPSEC procedures and requirements...',
  });

  // ==================== Processes ====================
  console.log('  Creating processes...');

  ids.processes.onboarding = await createProcess(ctx, {
    name: 'New Member Onboarding',
    description: 'Standard onboarding process for new personnel',
    inputs: ['Transfer orders', 'Personnel record'],
    outputs: ['Completed check-in', 'Account access'],
    estimatedDuration: 5 * 24 * 60 * 60 * 1000, // 5 days
  });

  ids.processes.leaveRequest = await createProcess(ctx, {
    name: 'Leave Request Process',
    description: 'Process for requesting and approving leave',
    inputs: ['Leave request form'],
    outputs: ['Approved/denied leave chit'],
    estimatedDuration: 3 * 24 * 60 * 60 * 1000, // 3 days
  });

  ids.processes.qualTracking = await createProcess(ctx, {
    name: 'Qualification Tracking',
    description: 'Process for tracking and renewing qualifications',
    inputs: ['Qualification records'],
    outputs: ['Updated qual status'],
    estimatedDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // ==================== Lines of Effort ====================
  console.log('  Creating Lines of Effort...');

  ids.loes.readiness = await createLOE(ctx, {
    name: 'Force Readiness',
    description: 'Maintain combat-ready forces capable of immediate deployment',
    sponsoringEchelon: 'NSWC',
  });

  ids.loes.modernization = await createLOE(ctx, {
    name: 'Modernization',
    description: 'Modernize equipment, tactics, and procedures',
    sponsoringEchelon: 'NSWC',
  });

  ids.loes.talentMgmt = await createLOE(ctx, {
    name: 'Talent Management',
    description: 'Recruit, develop, and retain the best personnel',
    sponsoringEchelon: 'NSWC',
  });

  // ==================== Objectives ====================
  console.log('  Creating objectives...');

  ids.objectives.deployReady = await createObjective(ctx, {
    description: 'Achieve 95% deployment readiness across all SEAL Teams',
    level: 'strategic',
    status: 'active',
    loeId: ids.loes.readiness,
  });

  ids.objectives.qualCurrency = await createObjective(ctx, {
    description: 'Maintain 100% currency on critical qualifications',
    level: 'operational',
    status: 'active',
    loeId: ids.loes.readiness,
  });

  ids.objectives.digitalTransform = await createObjective(ctx, {
    description: 'Complete digital backbone implementation',
    level: 'strategic',
    status: 'active',
    loeId: ids.loes.modernization,
  });

  ids.objectives.retention = await createObjective(ctx, {
    description: 'Improve retention rate to 85%',
    level: 'strategic',
    status: 'active',
    loeId: ids.loes.talentMgmt,
  });

  // ==================== Tasks ====================
  console.log('  Creating tasks...');

  ids.tasks.reviewQuals = await createTask(ctx, {
    description: 'Review Q4 qualification status for all personnel',
    type: 'review',
    priority: 'high',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
    status: 'assigned',
    ownerId: ids.positions.st1OpsO,
  });

  ids.tasks.updateSOP = await createTask(ctx, {
    description: 'Update standard operating procedures for new equipment',
    type: 'documentation',
    priority: 'medium',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    status: 'created',
    ownerId: ids.positions.n6Tech,
  });

  ids.tasks.trainingPlan = await createTask(ctx, {
    description: 'Develop Q1 training plan',
    type: 'planning',
    priority: 'high',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    status: 'started',
    ownerId: ids.positions.st1TrainO,
  });

  console.log('✅ Seed data generation complete!');
  console.log(`   Organizations: ${Object.keys(ids.organizations).length}`);
  console.log(`   Positions: ${Object.keys(ids.positions).length}`);
  console.log(`   People: ${Object.keys(ids.people).length}`);
  console.log(`   Processes: ${Object.keys(ids.processes).length}`);
  console.log(`   Policies: ${Object.keys(ids.policies).length}`);
  console.log(`   LOEs: ${Object.keys(ids.loes).length}`);
  console.log(`   Objectives: ${Object.keys(ids.objectives).length}`);
  console.log(`   Tasks: ${Object.keys(ids.tasks).length}`);

  return ids;
}

// ==================== Helper Functions ====================

async function createOrganization(
  ctx: SeedContext,
  params: {
    name: string;
    uics: string[];
    type: string;
    echelonLevel: string;
    missionStatement: string;
    isTigerTeam: boolean;
    parentId?: HolonID;
  }
): Promise<HolonID> {
  const holon = await ctx.holonRegistry.createHolon({
    type: HolonType.Organization,
    properties: {
      uics: params.uics,
      name: params.name,
      type: params.type,
      echelonLevel: params.echelonLevel,
      missionStatement: params.missionStatement,
      isTigerTeam: params.isTigerTeam,
    },
    createdBy: SEED_ACTOR,
    sourceDocuments: [],
  });

  // Create parent relationship if specified
  if (params.parentId) {
    await ctx.relationshipRegistry.createRelationship({
      type: RelationshipType.BELONGS_TO,
      sourceHolonID: holon.id,
      sourceHolonType: HolonType.Organization,
      targetHolonID: params.parentId,
      targetHolonType: HolonType.Organization,
      effectiveStart: new Date(),
      sourceDocuments: [],
      actor: SEED_ACTOR,
      sourceSystem: SEED_SYSTEM,
    });
  }

  return holon.id;
}

async function createPosition(
  ctx: SeedContext,
  params: {
    title: string;
    billetIDs: string[];
    gradeRange: { min: string; max: string };
    designatorExpectations: string[];
    criticality: 'critical' | 'important' | 'standard';
    billetType: 'command' | 'staff' | 'support';
    orgId: HolonID;
  }
): Promise<HolonID> {
  const holon = await ctx.holonRegistry.createHolon({
    type: HolonType.Position,
    properties: {
      billetIDs: params.billetIDs,
      title: params.title,
      gradeRange: params.gradeRange,
      designatorExpectations: params.designatorExpectations,
      criticality: params.criticality,
      billetType: params.billetType,
    },
    createdBy: SEED_ACTOR,
    sourceDocuments: [],
  });

  // Create relationship to organization
  await ctx.relationshipRegistry.createRelationship({
    type: RelationshipType.BELONGS_TO,
    sourceHolonID: holon.id,
    sourceHolonType: HolonType.Position,
    targetHolonID: params.orgId,
    targetHolonType: HolonType.Organization,
    effectiveStart: new Date(),
    sourceDocuments: [],
    actor: SEED_ACTOR,
    sourceSystem: SEED_SYSTEM,
  });

  return holon.id;
}

async function createPerson(
  ctx: SeedContext,
  params: {
    edipi: string;
    name: string;
    serviceBranch: string;
    designatorRating: string;
    category: 'active_duty' | 'reserve' | 'civilian' | 'contractor';
    positionId?: HolonID;
  }
): Promise<HolonID> {
  const holon = await ctx.holonRegistry.createHolon({
    type: HolonType.Person,
    properties: {
      edipi: params.edipi,
      serviceNumbers: [params.edipi],
      name: params.name,
      dob: new Date('1980-01-01'),
      serviceBranch: params.serviceBranch,
      designatorRating: params.designatorRating,
      category: params.category,
    },
    createdBy: SEED_ACTOR,
    sourceDocuments: [],
  });

  // Create assignment if position specified
  if (params.positionId) {
    await ctx.relationshipRegistry.createRelationship({
      type: RelationshipType.OCCUPIES,
      sourceHolonID: holon.id,
      sourceHolonType: HolonType.Person,
      targetHolonID: params.positionId,
      targetHolonType: HolonType.Position,
      effectiveStart: new Date(),
      sourceDocuments: [],
      actor: SEED_ACTOR,
      sourceSystem: SEED_SYSTEM,
    });
  }

  return holon.id;
}

async function createPolicy(
  ctx: SeedContext,
  params: {
    title: string;
    referenceNumber: string;
    documentType: string;
    content: string;
  }
): Promise<HolonID> {
  const holon = await ctx.holonRegistry.createHolon({
    type: HolonType.Document,
    properties: {
      referenceNumbers: [params.referenceNumber],
      title: params.title,
      documentType: params.documentType,
      version: '1.0',
      effectiveDates: { start: new Date() },
      classificationMetadata: 'UNCLASSIFIED',
      content: params.content,
    },
    createdBy: SEED_ACTOR,
    sourceDocuments: [],
  });

  return holon.id;
}

async function createProcess(
  ctx: SeedContext,
  params: {
    name: string;
    description: string;
    inputs: string[];
    outputs: string[];
    estimatedDuration: number;
  }
): Promise<HolonID> {
  const holon = await ctx.holonRegistry.createHolon({
    type: HolonType.Process,
    properties: {
      name: params.name,
      description: params.description,
      inputs: params.inputs,
      outputs: params.outputs,
      estimatedDuration: params.estimatedDuration,
    },
    createdBy: SEED_ACTOR,
    sourceDocuments: [],
  });

  return holon.id;
}

async function createLOE(
  ctx: SeedContext,
  params: {
    name: string;
    description: string;
    sponsoringEchelon: string;
  }
): Promise<HolonID> {
  const holon = await ctx.holonRegistry.createHolon({
    type: HolonType.LOE,
    properties: {
      name: params.name,
      description: params.description,
      sponsoringEchelon: params.sponsoringEchelon,
      timeframe: {
        start: new Date(),
        end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    },
    createdBy: SEED_ACTOR,
    sourceDocuments: [],
  });

  return holon.id;
}

async function createObjective(
  ctx: SeedContext,
  params: {
    description: string;
    level: 'strategic' | 'operational' | 'tactical';
    status: 'proposed' | 'approved' | 'active' | 'achieved' | 'abandoned' | 'revised';
    loeId: HolonID;
  }
): Promise<HolonID> {
  const holon = await ctx.holonRegistry.createHolon({
    type: HolonType.Objective,
    properties: {
      description: params.description,
      level: params.level,
      timeHorizon: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: params.status,
    },
    createdBy: SEED_ACTOR,
    sourceDocuments: [],
  });

  // Link to LOE
  await ctx.relationshipRegistry.createRelationship({
    type: RelationshipType.ALIGNED_TO,
    sourceHolonID: holon.id,
    sourceHolonType: HolonType.Objective,
    targetHolonID: params.loeId,
    targetHolonType: HolonType.LOE,
    effectiveStart: new Date(),
    sourceDocuments: [],
    actor: SEED_ACTOR,
    sourceSystem: SEED_SYSTEM,
  });

  return holon.id;
}

async function createTask(
  ctx: SeedContext,
  params: {
    description: string;
    type: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    dueDate: Date;
    status: 'created' | 'assigned' | 'started' | 'blocked' | 'completed' | 'cancelled';
    ownerId: HolonID;
  }
): Promise<HolonID> {
  const holon = await ctx.holonRegistry.createHolon({
    type: HolonType.Task,
    properties: {
      description: params.description,
      type: params.type,
      priority: params.priority,
      dueDate: params.dueDate,
      status: params.status,
    },
    createdBy: SEED_ACTOR,
    sourceDocuments: [],
  });

  // Assign to position
  await ctx.relationshipRegistry.createRelationship({
    type: RelationshipType.ASSIGNED_TO,
    sourceHolonID: holon.id,
    sourceHolonType: HolonType.Task,
    targetHolonID: params.ownerId,
    targetHolonType: HolonType.Position,
    effectiveStart: new Date(),
    sourceDocuments: [],
    actor: SEED_ACTOR,
    sourceSystem: SEED_SYSTEM,
  });

  return holon.id;
}
