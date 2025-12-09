import { ConstraintEngine } from './index';
import { ConstraintType, EventType, HolonType, ProcessProperties, ProcessStep } from '@som/shared-types';

/**
 * Loads default system constraints into the engine
 */
export function loadDefaultConstraints(engine: ConstraintEngine): void {

    // R1: Process Steps Must Have Owners
    engine.registerConstraint({
        type: ConstraintType.Structural,
        name: 'ProcessStepsMustHaveOwners',
        definition: 'All steps in a process must have a defined owner.',
        scope: {
            eventTypes: [EventType.ProcessDefined, EventType.ProcessUpdated],
            holonTypes: [HolonType.Process]
        },
        effectiveDates: { start: new Date('2024-01-01') }, // Always active
        sourceDocuments: [], // Mentally linked to how-do.md
        validationLogic: (target) => {
            // Handle Event
            if ('payload' in target && (target.type === EventType.ProcessDefined || target.type === EventType.ProcessUpdated)) {
                const props = target.payload.properties as ProcessProperties;
                if (!props || !props.steps) return { valid: true }; // Allow empty steps? Maybe not, but let's be safe.

                const errors = [];
                for (const step of props.steps) {
                    if (!step.owner || step.owner.trim() === '') {
                        errors.push({
                            constraintID: 'ProcessStepsMustHaveOwners', // Placeholder, the engine generates real ID
                            message: `Step "${step.title}" is missing an owner.`,
                            violatedRule: 'Step.owner must be non-empty',
                            affectedHolons: []
                        });
                    }
                }

                return {
                    valid: errors.length === 0,
                    errors: errors.length > 0 ? errors.map(e => ({ ...e, constraintID: 'generated-in-logic' })) : undefined
                    // Note: The ID mapping in the engine is cleaner, but for custom logic we construct errors manually.
                    // The engine catches this return type.
                };
            }
            return { valid: true };
        }
    });

    console.log('Default constraints loaded.');
}
