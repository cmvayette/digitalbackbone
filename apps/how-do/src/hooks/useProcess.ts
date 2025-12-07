import { useState, useEffect } from 'react';
import orgStructure from '../mocks/org-structure.json';

export interface ProcessStep {
    id: string;
    title: string;
    ownerId: string;
    ownerType: 'Position' | 'Organization' | 'RoleTag';
}

export function useProcess(initialProcessId?: string) {
    const [steps, setSteps] = useState<ProcessStep[]>([]);

    // Load mock data or initialize empty
    useEffect(() => {
        if (initialProcessId) {
            // Mock load
        }
    }, [initialProcessId]);

    const addStep = (ownerId: string, ownerType: 'Position' | 'Organization' | 'RoleTag') => {
        const newStep: ProcessStep = {
            id: `step_${Date.now()}`,
            title: 'New Step',
            ownerId,
            ownerType
        };
        setSteps([...steps, newStep]);
    };

    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

    const moveStep = (stepId: string, newOwnerId: string, newOwnerType: 'Position' | 'Organization' | 'RoleTag') => {
        setSteps(currentSteps => currentSteps.map(step => {
            if (step.id === stepId) {
                return { ...step, ownerId: newOwnerId, ownerType: newOwnerType };
            }
            return step;
        }));
    };

    const updateStep = (stepId: string, updates: Partial<ProcessStep>) => {
        setSteps(currentSteps => currentSteps.map(step => {
            if (step.id === stepId) {
                return { ...step, ...updates };
            }
            return step;
        }));
    };

    const selectStep = (stepId: string | null) => setSelectedStepId(stepId);

    return {
        steps,
        addStep,
        moveStep,
        updateStep,
        selectedStepId,
        selectStep,
        orgStructure
    };
}
