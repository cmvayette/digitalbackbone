import { useState, useEffect, useCallback } from 'react';
import { HolonType, type LOE, type Objective, type KeyResult } from '@som/shared-types';
import { createSOMClient } from './client';

export function useStrategyData() {
    const [loes, setLoes] = useState<LOE[]>([]);
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [krs, setKRs] = useState<KeyResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
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
        };

        fetchData();
    }, []);

    const addLOE = useCallback((loe: LOE) => {
        // Optimistic update - Real write implementation requires Event Sourcing backend support
        setLoes(prev => [...prev, loe]);
        console.warn("Write to server not implemented yet for LOE");
    }, []);

    const addObjective = useCallback((obj: Objective) => {
        setObjectives(prev => [...prev, obj]);
        console.warn("Write to server not implemented yet for Objective");
    }, []);

    const addKR = useCallback((kr: KeyResult, parentObjectiveId: string) => {
        setKRs(prev => [...prev, kr]);

        // Optimistically update the parent objective's linkedKRs
        setObjectives(prev => prev.map(o => {
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
        }));
        console.warn("Write to server not implemented yet for KeyResult");
    }, []);

    return {
        loes,
        objectives,
        krs,
        loading,
        addLOE,
        addObjective,
        addKR,
        // Helper to get full tree for an LoE
        getTreeForLOE: useCallback((loeId: string) => {
            // In full implementation, verify hierarchy. For now/MVP return all.
            return objectives;
        }, [objectives])
    };
}
