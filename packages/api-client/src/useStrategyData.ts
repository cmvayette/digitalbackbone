import { useState, useEffect, useCallback } from 'react';
import { HolonType, type LOE, type Objective, type KeyResult } from '@som/shared-types';
import { createSOMClient } from './factory';

export function useStrategyData() {
    const [loes, setLoes] = useState<LOE[]>([]);
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [krs, setKRs] = useState<KeyResult[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const client = createSOMClient();
            const [loeRes, objRes, krRes] = await Promise.all([
                client.queryHolons(HolonType.LOE),
                client.queryHolons(HolonType.Objective),
                client.queryHolons(HolonType.KeyResult)
            ]);

            if (loeRes.success && loeRes.data) {
                setLoes(loeRes.data.map((h: any) => ({ ...h, properties: h.properties } as LOE)));
            }
            if (objRes.success && objRes.data) {
                setObjectives(objRes.data.map((h: any) => ({ ...h, properties: h.properties } as Objective)));
            }
            if (krRes.success && krRes.data) {
                setKRs(krRes.data.map((h: any) => ({ ...h, properties: h.properties } as KeyResult)));
            }
        } catch (err) {
            console.error("Failed to fetch strategy data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(); // Initial fetch

        const intervalId = setInterval(fetchData, 5000); // Poll every 5 seconds

        return () => clearInterval(intervalId); // Cleanup
    }, [fetchData]);

    // Deprecated: Write operations should use useStrategyComposer
    const addLOE = useCallback((loe: LOE) => {
        console.warn('useStrategyData.addLOE is deprecated. Use useStrategyComposer instead.');
        fetchData();
    }, [fetchData]);

    const addObjective = useCallback((obj: Objective) => {
        console.warn('useStrategyData.addObjective is deprecated. Use useStrategyComposer instead.');
        fetchData();
    }, [fetchData]);

    const addKR = useCallback((kr: KeyResult, parentObjectiveId: string) => {
        console.warn('useStrategyData.addKR is deprecated. Use useStrategyComposer instead.');
        fetchData();
    }, [fetchData]);

    return {
        loes,
        objectives,
        krs,
        loading,
        addLOE,
        addObjective,
        addKR,
        refresh: fetchData,
        // Helper to get full tree for an LoE
        getTreeForLOE: useCallback((loeId: string) => {
            // In full implementation, verify hierarchy. For now/MVP return all.
            return objectives;
        }, [objectives])
    };
}
