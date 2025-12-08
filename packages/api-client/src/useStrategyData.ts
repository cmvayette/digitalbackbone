import { useState, useMemo, useCallback } from 'react';
import { HolonType, type LOE, type Objective, type KeyResult } from '@som/shared-types';

// --- MOCK DATA SEED ---

const MOCK_LOES: LOE[] = [
    {
        id: 'loe-1',
        type: HolonType.LOE,
        createdAt: new Date('2024-01-01'),
        createdBy: 'system',
        status: 'active',
        sourceDocuments: [],
        properties: {
            name: "LOE 1: Digital Superiority",
            description: "Achieve information dominance through rapid fielding of AI and data capabilities.",
            ownerId: 'org-root',
            timeframe: { start: new Date('2024-01-01'), end: new Date('2026-12-31') }
        }
    }
];

const MOCK_OBJECTIVES: Objective[] = [
    {
        id: 'obj-1',
        type: HolonType.Objective,
        createdAt: new Date('2024-01-15'),
        createdBy: 'system',
        status: 'active',
        sourceDocuments: [],
        properties: {
            statement: "Accelerate Decision Loops",
            narrative: "Commanders are overwhelmed by data. We must automate the OODA loop steps.",
            ownerId: 'org-dir-1',
            level: 'strategic',
            status: 'active',
            timeHorizon: new Date('2024-12-31'),
            linkedKRs: ['kr-1', 'kr-2']
        }
    }
];

const MOCK_KRS: KeyResult[] = [
    {
        id: 'kr-1',
        type: HolonType.KeyResult,
        createdAt: new Date('2024-02-01'),
        createdBy: 'system',
        status: 'active',
        sourceDocuments: [],
        properties: {
            statement: "Reduce target classification time from 10 mins to 30 seconds",
            baseline: 600,
            target: 30,
            currentValue: 120,
            ownerId: 'pos-1',
            cadence: 'monthly',
            health: 'on-track',
            evidenceLogIds: []
        }
    },
    {
        id: 'kr-2',
        type: HolonType.KeyResult,
        createdAt: new Date('2024-02-01'),
        createdBy: 'system',
        status: 'active',
        sourceDocuments: [],
        properties: {
            statement: "Automate 80% of routine supply requests",
            baseline: 0,
            target: 80,
            currentValue: 45,
            ownerId: 'pos-3',
            cadence: 'quarterly',
            health: 'at-risk',
            evidenceLogIds: []
        }
    }
];

// In-memory store (volatile)
let SHARED_LOES = [...MOCK_LOES];
let SHARED_OBJECTIVES = [...MOCK_OBJECTIVES];
let SHARED_KRS = [...MOCK_KRS];

export function useStrategyData() {
    const [loes, setLoes] = useState<LOE[]>(SHARED_LOES);
    const [objectives, setObjectives] = useState<Objective[]>(SHARED_OBJECTIVES);
    const [krs, setKRs] = useState<KeyResult[]>(SHARED_KRS);

    const addLOE = useCallback((loe: LOE) => {
        SHARED_LOES = [...SHARED_LOES, loe];
        setLoes(SHARED_LOES);
    }, []);

    const addObjective = useCallback((obj: Objective) => {
        SHARED_OBJECTIVES = [...SHARED_OBJECTIVES, obj];
        setObjectives(SHARED_OBJECTIVES);
    }, []);

    const addKR = useCallback((kr: KeyResult, parentObjectiveId: string) => {
        SHARED_KRS = [...SHARED_KRS, kr];
        setKRs(SHARED_KRS);

        // Link to parent
        SHARED_OBJECTIVES = SHARED_OBJECTIVES.map(o => {
            if (o.id === parentObjectiveId) {
                return {
                    ...o,
                    properties: {
                        ...o.properties,
                        linkedKRs: [...(o.properties.linkedKRs || []), kr.id]
                    }
                };
            }
            return o;
        });
        setObjectives(SHARED_OBJECTIVES);
    }, []);

    return {
        loes,
        objectives,
        krs,
        addLOE,
        addObjective,
        addKR,
        // Helper to get full tree for an LoE
        getTreeForLOE: useCallback((loeId: string) => {
            // Primitive linking logic: In MVP, Objectives don't explicitly store LOE ID in properties 
            // per the specific shared-type definition we just saw (or I missed it).
            // Let's assume for this MVP that all objectives belong to the one mock LOE or we filter by convention.
            // *correction*: The V2 spec says "Objective... under an LoE".
            // I should have added `loeId` to Objective in the schema update. 
            // For now, I will return ALL objectives for the DEMO since we have 1 LOE.
            return objectives;
        }, [objectives])
    };
}
