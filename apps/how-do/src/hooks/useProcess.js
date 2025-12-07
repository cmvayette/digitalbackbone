import { useState, useEffect } from 'react';
import orgStructure from '../mocks/org-structure.json';
export function useProcess(initialProcessId) {
    const [steps, setSteps] = useState([]);
    // Load mock data or initialize empty
    useEffect(() => {
        if (initialProcessId) {
            // Mock load
        }
    }, [initialProcessId]);
    const addStep = (ownerId, ownerType) => {
        const newStep = {
            id: `step_${Date.now()}`,
            title: 'New Step',
            ownerId,
            ownerType
        };
        setSteps([...steps, newStep]);
    };
    const [selectedStepId, setSelectedStepId] = useState(null);
    const moveStep = (stepId, newOwnerId, newOwnerType) => {
        setSteps(currentSteps => currentSteps.map(step => {
            if (step.id === stepId) {
                return { ...step, ownerId: newOwnerId, ownerType: newOwnerType };
            }
            return step;
        }));
    };
    const updateStep = (stepId, updates) => {
        setSteps(currentSteps => currentSteps.map(step => {
            if (step.id === stepId) {
                return { ...step, ...updates };
            }
            return step;
        }));
    };
    const selectStep = (stepId) => setSelectedStepId(stepId);
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
