/**
 * Measure and Lens Engine module for the Semantic Operating Model
 * Manages measure definitions, lens definitions, measure emission, and lens evaluation
 */

import { HolonID, DocumentID, Timestamp, EventID, MeasureDefinition, LensDefinition, HolonType, Event, TypedEvent } from '@som/shared-types';
import { DocumentRegistry } from '../document-registry';
import { IHolonRepository as HolonRegistry } from '../core/interfaces/holon-repository';
import { IEventStore as EventStore } from '../event-store';
import { EventType } from '@som/shared-types';

export interface CreateMeasureDefinitionParams {
  name: string;
  description: string;
  unit: string;
  calculationMethod: string;
  samplingFrequency: number; // Duration in milliseconds
  dataSources: string[];
  type: 'state' | 'flow';
  leadingOrLagging: 'leading' | 'lagging';
  quantitativeOrQualitative: 'quantitative' | 'qualitative';
  sourceDocuments: DocumentID[];
  createdBy: EventID;
}

export interface CreateLensDefinitionParams {
  name: string;
  description: string;
  inputMeasures: string[]; // MeasureDefinitionIDs
  logic: string;
  thresholds: Record<string, any>;
  outputs: string[];
  sourceDocuments: DocumentID[];
  createdBy: EventID;
}

export interface MeasureValue {
  measureDefinitionID: HolonID;
  value: number | string;
  holonID?: HolonID;
  eventID?: EventID;
  timestamp: Timestamp;
  confidence?: number;
}

export interface LensOutput {
  lensDefinitionID: HolonID;
  output: string;
  inputValues: MeasureValue[];
  holonID: HolonID;
  timestamp: Timestamp;
  explanation: string;
}

/**
 * MeasureLensEngine manages measure and lens definitions, emissions, and evaluations
 */
export class MeasureLensEngine {
  private eventStore: EventStore;
  private holonRegistry: HolonRegistry;
  private measureVersions: Map<string, HolonID[]>; // Maps measure name to version history
  private lensVersions: Map<string, HolonID[]>; // Maps lens name to version history

  constructor(eventStore: EventStore, holonRegistry: HolonRegistry) {
    this.eventStore = eventStore;
    this.holonRegistry = holonRegistry;
    this.measureVersions = new Map();
    this.lensVersions = new Map();
  }

  /**
   * Create a new measure definition
   * @param params - Measure definition parameters
   * @returns The created MeasureDefinition holon
   */
  async createMeasureDefinition(params: CreateMeasureDefinitionParams): Promise<MeasureDefinition> {
    // Validate required fields
    this.validateMeasureDefinition(params);

    // Determine version number
    const version = await this.getNextVersion(params.name, this.measureVersions);

    // Create the measure definition holon
    const measureDef = (await this.holonRegistry.createHolon({
      type: HolonType.MeasureDefinition,
      properties: {
        name: params.name,
        description: params.description,
        unit: params.unit,
        calculationMethod: params.calculationMethod,
        samplingFrequency: params.samplingFrequency,
        dataSources: params.dataSources,
        type: params.type,
        leadingOrLagging: params.leadingOrLagging,
        quantitativeOrQualitative: params.quantitativeOrQualitative,
        version,
      },
      createdBy: params.createdBy,
      sourceDocuments: params.sourceDocuments,
    })) as MeasureDefinition;

    // Track version history
    this.addToVersionHistory(params.name, measureDef.id, this.measureVersions);

    return measureDef;
  }

  /**
   * Create a new lens definition
   * @param params - Lens definition parameters
   * @returns The created LensDefinition holon
   */
  async createLensDefinition(params: CreateLensDefinitionParams): Promise<LensDefinition> {
    // Validate required fields
    this.validateLensDefinition(params);

    // Determine version number
    const version = await this.getNextVersion(params.name, this.lensVersions);

    // Create the lens definition holon
    const lensDef = (await this.holonRegistry.createHolon({
      type: HolonType.LensDefinition,
      properties: {
        name: params.name,
        description: params.description,
        inputMeasures: params.inputMeasures,
        logic: params.logic,
        thresholds: params.thresholds,
        outputs: params.outputs,
        version,
      },
      createdBy: params.createdBy,
      sourceDocuments: params.sourceDocuments,
    })) as LensDefinition;

    // Track version history
    this.addToVersionHistory(params.name, lensDef.id, this.lensVersions);

    return lensDef;
  }

  /**
   * Emit a measure value and generate a MeasureEmitted event
   * @param measureValue - The measure value to emit
   * @param actor - The actor emitting the measure
   * @param sourceSystem - The source system
   * @returns The event ID of the generated event
   */
  async emitMeasure(
    measureValue: MeasureValue,
    actor: HolonID,
    sourceSystem: string
  ): Promise<EventID> {
    // Validate that the measure definition exists
    const measureDef = await this.holonRegistry.getHolon(measureValue.measureDefinitionID);
    if (!measureDef || measureDef.type !== HolonType.MeasureDefinition) {
      throw new Error(`Measure definition ${measureValue.measureDefinitionID} not found`);
    }

    // Build subjects list
    const subjects: HolonID[] = [measureValue.measureDefinitionID];
    if (measureValue.holonID) {
      subjects.push(measureValue.holonID);
    }

    // Create the MeasureEmitted event
    const eventId = await this.eventStore.submitEvent({
      type: EventType.MeasureEmitted,
      occurredAt: measureValue.timestamp,
      actor,
      subjects,
      payload: {
        measureDefinitionID: measureValue.measureDefinitionID,
        value: measureValue.value,
        holonID: measureValue.holonID,
        eventID: measureValue.eventID,
        confidence: measureValue.confidence,
      },
      sourceSystem,
      causalLinks: measureValue.eventID ? { causedBy: [measureValue.eventID] } : {},
    });

    return eventId;
  }

  /**
   * Evaluate a lens and generate a LensEvaluated event
   * @param lensDefinitionID - The lens definition to evaluate
   * @param holonID - The holon to evaluate the lens for
   * @param timestamp - The timestamp of evaluation
   * @param actor - The actor performing the evaluation
   * @param sourceSystem - The source system
   * @returns The lens output and event ID
   */
  async evaluateLens(
    lensDefinitionID: HolonID,
    holonID: HolonID,
    timestamp: Timestamp,
    actor: HolonID,
    sourceSystem: string
  ): Promise<{ output: LensOutput; eventId: EventID }> {
    // Get the lens definition
    const lensDef = await this.holonRegistry.getHolon(lensDefinitionID) as LensDefinition | undefined;
    if (!lensDef || lensDef.type !== HolonType.LensDefinition) {
      throw new Error(`Lens definition ${lensDefinitionID} not found`);
    }

    // Gather input measure values
    const inputValues = await this.gatherInputMeasures(
      lensDef.properties.inputMeasures,
      holonID,
      timestamp
    );

    // Compute lens output
    const output = this.computeLensOutput(lensDef, inputValues);

    // Create lens output object
    const lensOutput: LensOutput = {
      lensDefinitionID,
      output,
      inputValues,
      holonID,
      timestamp,
      explanation: await this.generateExplanation(lensDef, inputValues, output),
    };

    // Create the LensEvaluated event
    const eventId = await this.eventStore.submitEvent({
      type: EventType.LensEvaluated,
      occurredAt: timestamp,
      actor,
      subjects: [lensDefinitionID, holonID],
      payload: {
        lensDefinitionID,
        holonID,
        output,
        inputValues: inputValues.map(v => ({
          measureDefinitionID: v.measureDefinitionID,
          value: v.value,
        })),
        explanation: lensOutput.explanation,
      },
      sourceSystem,
      causalLinks: {},
    });

    return { output: lensOutput, eventId };
  }

  /**
   * Get all versions of a measure definition by name
   * @param measureName - The measure name
   * @returns Array of measure definition IDs in version order
   */
  getMeasureVersions(measureName: string): HolonID[] {
    return this.measureVersions.get(measureName) || [];
  }

  /**
   * Get all versions of a lens definition by name
   * @param lensName - The lens name
   * @returns Array of lens definition IDs in version order
   */
  getLensVersions(lensName: string): HolonID[] {
    return this.lensVersions.get(lensName) || [];
  }

  /**
   * Get the latest version of a measure definition by name
   * @param measureName - The measure name
   * @returns The latest measure definition or undefined
   */
  async getLatestMeasureVersion(measureName: string): Promise<MeasureDefinition | undefined> {
    const versions = this.measureVersions.get(measureName);
    if (!versions || versions.length === 0) {
      return undefined;
    }
    const latestId = versions[versions.length - 1];
    return await this.holonRegistry.getHolon(latestId) as MeasureDefinition | undefined;
  }

  /**
   * Get the latest version of a lens definition by name
   * @param lensName - The lens name
   * @returns The latest lens definition or undefined
   */
  async getLatestLensVersion(lensName: string): Promise<LensDefinition | undefined> {
    const versions = this.lensVersions.get(lensName);
    if (!versions || versions.length === 0) {
      return undefined;
    }
    const latestId = versions[versions.length - 1];
    return await this.holonRegistry.getHolon(latestId) as LensDefinition | undefined;
  }

  /**
   * Validate measure definition parameters
   */
  private validateMeasureDefinition(params: CreateMeasureDefinitionParams): void {
    if (!params.name || params.name.trim() === '') {
      throw new Error('Measure name is required');
    }
    if (!params.description || params.description.trim() === '') {
      throw new Error('Measure description is required');
    }
    if (!params.unit || params.unit.trim() === '') {
      throw new Error('Measure unit is required');
    }
    if (!params.calculationMethod || params.calculationMethod.trim() === '') {
      throw new Error('Measure calculation method is required');
    }
    if (params.samplingFrequency <= 0) {
      throw new Error('Measure sampling frequency must be positive');
    }
  }

  /**
   * Validate lens definition parameters
   */
  private validateLensDefinition(params: CreateLensDefinitionParams): void {
    if (!params.name || params.name.trim() === '') {
      throw new Error('Lens name is required');
    }
    if (!params.description || params.description.trim() === '') {
      throw new Error('Lens description is required');
    }
    if (!params.inputMeasures || params.inputMeasures.length === 0) {
      throw new Error('Lens must have at least one input measure');
    }
    if (!params.logic || params.logic.trim() === '') {
      throw new Error('Lens logic is required');
    }
    if (!params.thresholds) {
      throw new Error('Lens thresholds are required');
    }
    if (!params.outputs || params.outputs.length === 0) {
      throw new Error('Lens must have at least one output');
    }
  }

  /**
   * Get the next version number for a definition
   */
  private async getNextVersion(name: string, versionMap: Map<string, HolonID[]>): Promise<number> {
    const versions = versionMap.get(name);
    if (!versions || versions.length === 0) {
      return 1;
    }

    // Get the last version's number
    const lastId = versions[versions.length - 1];
    const lastHolon = await this.holonRegistry.getHolon(lastId);
    if (!lastHolon) {
      return 1;
    }

    const lastVersion = (lastHolon.properties as any).version || 0;
    return lastVersion + 1;
  }

  /**
   * Add a definition to version history
   */
  private addToVersionHistory(
    name: string,
    holonId: HolonID,
    versionMap: Map<string, HolonID[]>
  ): void {
    const versions = versionMap.get(name) || [];
    versions.push(holonId);
    versionMap.set(name, versions);
  }

  /**
   * Gather input measure values for lens evaluation
   */
  private async gatherInputMeasures(
    inputMeasureIds: string[],
    holonID: HolonID,
    timestamp: Timestamp
  ): Promise<MeasureValue[]> {
    const inputValues: MeasureValue[] = [];

    // Get all MeasureEmitted events for this holon
    const events = await this.eventStore.getEvents({ subjects: [holonID] });
    const measureEvents = events.filter(e => e.type === EventType.MeasureEmitted);

    // For each required input measure, find the most recent value before timestamp
    for (const measureId of inputMeasureIds) {
      const relevantEvents = measureEvents.filter(
        e => e.payload.measureDefinitionID === measureId && e.occurredAt <= timestamp
      );

      if (relevantEvents.length > 0) {
        // Sort by timestamp descending and take the most recent
        relevantEvents.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
        const latestEvent = relevantEvents[0];

        inputValues.push({
          measureDefinitionID: measureId,
          value: (latestEvent as TypedEvent<EventType.MeasureEmitted>).payload.value,
          holonID,
          eventID: latestEvent.id,
          timestamp: latestEvent.occurredAt,
          confidence: (latestEvent as TypedEvent<EventType.MeasureEmitted>).payload.confidence as number | undefined,
        });
      }
    }

    return inputValues;
  }

  /**
   * Compute lens output from input measures
   */
  private computeLensOutput(lensDef: LensDefinition, inputValues: MeasureValue[]): string {
    const { logic, thresholds, outputs } = lensDef.properties;

    // Simple threshold-based evaluation
    // In a real implementation, this would execute the logic string
    // For now, we'll use a simple threshold comparison

    if (inputValues.length === 0) {
      return outputs[outputs.length - 1]; // Return worst case if no data
    }

    // Example: If logic is "average" and we have numeric values
    const numericValues = inputValues
      .map(v => typeof v.value === 'number' ? v.value : parseFloat(v.value as string))
      .filter(v => !isNaN(v));

    if (numericValues.length === 0) {
      return outputs[outputs.length - 1];
    }

    const average = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;

    // Apply thresholds
    if (thresholds.green !== undefined && average >= thresholds.green) {
      return 'green';
    } else if (thresholds.amber !== undefined && average >= thresholds.amber) {
      return 'amber';
    } else {
      return 'red';
    }
  }

  /**
   * Generate explanation for lens output
   */
  private async generateExplanation(
    lensDef: LensDefinition,
    inputValues: MeasureValue[],
    output: string
  ): Promise<string> {
    const measureNames = await Promise.all(inputValues.map(async v => {
      const measureDef = await this.holonRegistry.getHolon(v.measureDefinitionID);
      return measureDef ? (measureDef.properties as any).name : v.measureDefinitionID;
    }));

    return `Lens "${lensDef.properties.name}" evaluated to "${output}" based on ${inputValues.length} input measure(s): ${measureNames.join(', ')} `;
  }
}

/**
 * Create a new measure-lens engine instance
 */
export function createMeasureLensEngine(eventStore: EventStore, holonRegistry: HolonRegistry): MeasureLensEngine {
  return new MeasureLensEngine(eventStore, holonRegistry);
}
