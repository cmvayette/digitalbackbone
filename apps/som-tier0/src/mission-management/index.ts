/**
 * Mission Management module for the Semantic Operating Model
 * Manages Mission, Capability, and Asset holon creation, relationships, and lifecycle
 */

import { IHolonRepository as HolonRegistry } from '../core/interfaces/holon-repository';
import { RelationshipRegistry } from '../relationship-registry';
import { IEventStore as EventStore } from '../event-store';
import { ConstraintEngine, ValidationResult } from '../constraint-engine';
import { Mission, Capability, Asset, HolonType, HolonID, DocumentID, EventID, Timestamp } from '@som/shared-types';
import { RelationshipType } from '@som/shared-types';
import { EventType } from '@som/shared-types';

/**
 * Parameters for creating a Mission holon
 */
export interface CreateMissionParams {
  operationName: string;
  operationNumber: string;
  type: 'training' | 'real_world';
  classificationMetadata: string;
  startTime: Timestamp;
  endTime: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating a Capability holon
 */
export interface CreateCapabilityParams {
  capabilityCode: string;
  name: string;
  description: string;
  level: 'strategic' | 'operational' | 'tactical';
  domain: string;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating an Asset holon
 */
export interface CreateAssetParams {
  hullNumberOrSerial: string;
  assetType: string;
  configuration: string;
  status: string;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating a Mission USES Capability relationship
 */
export interface AssignCapabilityToMissionParams {
  missionID: HolonID;
  capabilityID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for creating an Asset SUPPORTS Mission relationship
 */
export interface AssignAssetToMissionParams {
  assetID: HolonID;
  missionID: HolonID;
  effectiveStart: Timestamp;
  effectiveEnd?: Timestamp;
  sourceDocuments: DocumentID[];
  actor: HolonID;
  sourceSystem: string;
}

/**
 * Parameters for recording a mission phase transition
 */
export interface MissionPhaseTransitionParams {
  missionID: HolonID;
  fromPhase: string;
  toPhase: string;
  transitionTime: Timestamp;
  reason?: string;
  actor: HolonID;
  sourceSystem: string;
  sourceDocument?: DocumentID;
}

/**
 * Result of a Mission operation
 */
export interface MissionOperationResult {
  success: boolean;
  holonID?: HolonID;
  relationshipID?: string;
  validation: ValidationResult;
  eventID?: EventID;
}

/**
 * MissionManager handles Mission, Capability, and Asset holon lifecycle and relationships
 */
export class MissionManager {
  private holonRegistry: HolonRegistry;
  private relationshipRegistry: RelationshipRegistry;
  private eventStore: EventStore;
  private constraintEngine: ConstraintEngine;

  constructor(
    holonRegistry: HolonRegistry,
    relationshipRegistry: RelationshipRegistry,
    eventStore: EventStore,
    constraintEngine: ConstraintEngine
  ) {
    this.holonRegistry = holonRegistry;
    this.relationshipRegistry = relationshipRegistry;
    this.eventStore = eventStore;
    this.constraintEngine = constraintEngine;
  }

  /**
   * Create a new Mission holon with required fields
   */
  async createMission(params: CreateMissionParams): Promise<MissionOperationResult> {
    // Create event for mission creation
    const eventId = await this.eventStore.submitEvent({
      type: EventType.MissionPlanned,
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [],
      payload: {
        action: 'create_mission',
        operationName: params.operationName,
        operationNumber: params.operationNumber,
        type: params.type,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create Mission holon
    const mission = await this.holonRegistry.createHolon({
      type: HolonType.Mission,
      properties: {
        operationName: params.operationName,
        operationNumber: params.operationNumber,
        type: params.type,
        classificationMetadata: params.classificationMetadata,
        startTime: params.startTime,
        endTime: params.endTime,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate the created mission
    const validation = this.constraintEngine.validateHolon(mission);

    if (!validation.valid) {
      // Rollback: mark mission as inactive
      await this.holonRegistry.markHolonInactive(mission.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    return {
      success: true,
      holonID: mission.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Create a new Capability holon with required fields
   */
  async createCapability(params: CreateCapabilityParams): Promise<MissionOperationResult> {
    // Create event for capability creation
    const eventId = await this.eventStore.submitEvent({
      type: EventType.MissionPlanned, // Using generic event type
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [],
      payload: {
        action: 'create_capability',
        capabilityCode: params.capabilityCode,
        name: params.name,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create Capability holon
    const capability = await this.holonRegistry.createHolon({
      type: HolonType.Capability,
      properties: {
        capabilityCode: params.capabilityCode,
        name: params.name,
        description: params.description,
        level: params.level,
        domain: params.domain,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate the created capability
    const validation = this.constraintEngine.validateHolon(capability);

    if (!validation.valid) {
      // Rollback: mark capability as inactive
      await this.holonRegistry.markHolonInactive(capability.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    return {
      success: true,
      holonID: capability.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Create a new Asset holon with required fields
   */
  async createAsset(params: CreateAssetParams): Promise<MissionOperationResult> {
    // Create event for asset creation
    const eventId = await this.eventStore.submitEvent({
      type: EventType.SystemDeployed, // Using system event as proxy
      occurredAt: new Date(),
      actor: params.actor,
      subjects: [],
      payload: {
        action: 'create_asset',
        hullNumberOrSerial: params.hullNumberOrSerial,
        assetType: params.assetType,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocuments[0],
      causalLinks: {},
    });

    // Create Asset holon
    const asset = await this.holonRegistry.createHolon({
      type: HolonType.Asset,
      properties: {
        hullNumberOrSerial: params.hullNumberOrSerial,
        assetType: params.assetType,
        configuration: params.configuration,
        status: params.status,
      },
      createdBy: eventId,
      sourceDocuments: params.sourceDocuments,
    });

    // Validate the created asset
    const validation = this.constraintEngine.validateHolon(asset);

    if (!validation.valid) {
      // Rollback: mark asset as inactive
      await this.holonRegistry.markHolonInactive(asset.id, 'Validation failed');
      return {
        success: false,
        validation,
      };
    }

    return {
      success: true,
      holonID: asset.id,
      validation,
      eventID: eventId,
    };
  }

  /**
   * Assign a Capability to a Mission (Mission USES Capability)
   */
  async assignCapabilityToMission(params: AssignCapabilityToMissionParams): Promise<MissionOperationResult> {
    // Get mission and capability holons
    const mission = await this.holonRegistry.getHolon(params.missionID);
    const capability = await this.holonRegistry.getHolon(params.capabilityID);

    if (!mission) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Mission not found',
            violatedRule: 'existence',
            affectedHolons: [params.missionID],
          }],
        },
      };
    }

    if (!capability) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Capability not found',
            violatedRule: 'existence',
            affectedHolons: [params.capabilityID],
          }],
        },
      };
    }

    // Create the USES relationship
    const result = await this.relationshipRegistry.createRelationship({
      type: RelationshipType.USES,
      sourceHolonID: params.missionID,
      targetHolonID: params.capabilityID,
      properties: {},
      effectiveStart: params.effectiveStart,
      effectiveEnd: params.effectiveEnd,
      sourceSystem: params.sourceSystem,
      sourceDocuments: params.sourceDocuments,
      actor: params.actor,
    });

    if (!result.relationship) {
      return {
        success: false,
        validation: result.validation,
      };
    }

    return {
      success: true,
      relationshipID: result.relationship.id,
      validation: result.validation,
      eventID: result.relationship.createdBy,
    };
  }

  /**
   * Assign an Asset to support a Mission (Asset SUPPORTS Mission)
   */
  async assignAssetToMission(params: AssignAssetToMissionParams): Promise<MissionOperationResult> {
    // Get asset and mission holons
    const asset = await this.holonRegistry.getHolon(params.assetID);
    const mission = await this.holonRegistry.getHolon(params.missionID);

    if (!asset) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Asset not found',
            violatedRule: 'existence',
            affectedHolons: [params.assetID],
          }],
        },
      };
    }

    if (!mission) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Mission not found',
            violatedRule: 'existence',
            affectedHolons: [params.missionID],
          }],
        },
      };
    }

    // Create the SUPPORTS relationship
    const result = await this.relationshipRegistry.createRelationship({
      type: RelationshipType.SUPPORTS,
      sourceHolonID: params.assetID,
      targetHolonID: params.missionID,
      properties: {},
      effectiveStart: params.effectiveStart,
      effectiveEnd: params.effectiveEnd,
      sourceSystem: params.sourceSystem,
      sourceDocuments: params.sourceDocuments,
      actor: params.actor,
    });

    if (!result.relationship) {
      return {
        success: false,
        validation: result.validation,
      };
    }

    return {
      success: true,
      relationshipID: result.relationship.id,
      validation: result.validation,
      eventID: result.relationship.createdBy,
    };
  }

  /**
   * Record a mission phase transition event
   */
  async recordMissionPhaseTransition(params: MissionPhaseTransitionParams): Promise<MissionOperationResult> {
    // Get mission holon
    const mission = await this.holonRegistry.getHolon(params.missionID);

    if (!mission) {
      return {
        success: false,
        validation: {
          valid: false,
          errors: [{
            constraintID: 'system',
            message: 'Mission not found',
            violatedRule: 'existence',
            affectedHolons: [params.missionID],
          }],
        },
      };
    }

    // Create phase transition event
    const eventId = await this.eventStore.submitEvent({
      type: EventType.MissionPhaseTransition,
      occurredAt: params.transitionTime,
      actor: params.actor,
      subjects: [params.missionID],
      payload: {
        fromPhase: params.fromPhase,
        toPhase: params.toPhase,
        reason: params.reason,
      },
      sourceSystem: params.sourceSystem,
      sourceDocument: params.sourceDocument,
      causalLinks: {},
    });

    return {
      success: true,
      validation: { valid: true },
      eventID: eventId,
    };
  }

  /**
   * Get all capabilities used by a mission
   */
  async getMissionCapabilities(missionID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsFrom(
      missionID,
      RelationshipType.USES,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Get all assets supporting a mission
   */
  async getMissionAssets(missionID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsTo(
      missionID,
      RelationshipType.SUPPORTS,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Get all missions that use a specific capability
   */
  async getCapabilityMissions(capabilityID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsTo(
      capabilityID,
      RelationshipType.USES,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.sourceHolonID);
  }

  /**
   * Get all missions supported by a specific asset
   */
  async getAssetMissions(assetID: HolonID, effectiveAt?: Timestamp): Promise<HolonID[]> {
    const relationships = await this.relationshipRegistry.getRelationshipsFrom(
      assetID,
      RelationshipType.SUPPORTS,
      { effectiveAt, includeEnded: false }
    );

    return relationships.map(r => r.targetHolonID);
  }

  /**
   * Get all phase transition events for a mission
   */
  async getMissionPhaseHistory(missionID: HolonID): Promise<EventID[]> {
    const events = await this.eventStore.getEvents({ subjects: [missionID] });
    return events
      .filter(event => event.type === EventType.MissionPhaseTransition)
      .map(event => event.id);
  }
}
