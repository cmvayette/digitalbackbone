import { useState, useEffect, useRef } from 'react';
import orgStructure from '../mocks/org-structure.json';
import type { ProcessStep } from '@som/shared-types';
import { useExternalProcessData, useProcessEditor, useProcessDetail } from '@som/api-client';

// Extend shared type for local UI needs if necessary, or just use it.
// The app currently uses ownerType for UI icons. We'll keep it as a local extension.
export interface LocalProcessStep extends Omit<ProcessStep, 'obligations'> {
    ownerType: 'Position' | 'Organization' | 'RoleTag';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obligations: any[]; // relax for now or use shared ObligationLink[]
}

export function useProcess(initialProcessId?: string) {
    const { process, isLoading } = useProcessDetail(initialProcessId);

    // We don't need getProcessById anymore since useProcessDetail handles it
    // const { getProcessById, isLoading } = useExternalProcessData();

    const [steps, setSteps] = useState<LocalProcessStep[]>([]);
    const initializedRef = useRef(false);

    // Load process data when available
    useEffect(() => {
        if (process && !isLoading) {
            // Map shared process steps to local UI steps
            // In a real app, this mapping might happen in the API layer or specific view model adapters
            const mappedSteps: LocalProcessStep[] = (process.properties.steps || []).map((s: ProcessStep) => ({
                ...s,
                ownerType: 'Position', // Defaulting for now
                obligations: s.obligations
            }));
            setSteps(mappedSteps);
            initializedRef.current = true;
        }
    }, [process, isLoading]);

    const addStep = (ownerId: string, ownerType: 'Position' | 'Organization' | 'RoleTag') => {
        const newStep: LocalProcessStep = {
            id: `step_${Date.now()}`,
            title: 'New Step',
            description: '',
            owner: ownerId, // Shared type uses 'owner'
            ownerType,
            obligations: []
        };
        setSteps([...steps, newStep]);
    };

    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

    const moveStep = (stepId: string, newOwnerId: string, newOwnerType: 'Position' | 'Organization' | 'RoleTag') => {
        setSteps(currentSteps => currentSteps.map(step => {
            if (step.id === stepId) {
                return { ...step, owner: newOwnerId, ownerType: newOwnerType };
            }
            return step;
        }));
    };

    const updateStep = (stepId: string, updates: Partial<LocalProcessStep>) => {
        setSteps(currentSteps => currentSteps.map(step => {
            if (step.id === stepId) {
                return { ...step, ...updates };
            }
            return step;
        }));
    };

    const selectStep = (stepId: string | null) => setSelectedStepId(stepId);

    const { createProcess, isSubmitting } = useProcessEditor();

    const saveProcess = async (name: string, description: string) => {
        // Map local steps back to shared ProcessStep structure
        const processSteps: ProcessStep[] = steps.map(s => ({
            id: s.id,
            title: s.title,
            description: s.description,
            owner: s.owner,
            obligations: s.obligations, // assuming structure matches or is compatible
            source: 'native'
        }));

        const actorId = 'user-123'; // Hardcoded for MVP
        await createProcess(name, description, processSteps, actorId);
    };

    return {
        steps,
        addStep,
        moveStep,
        updateStep,
        selectedStepId,
        selectStep,
        orgStructure,
        saveProcess,
        isSubmitting
    };
}
