import { useState, useCallback, useEffect } from 'react';
import { HolonType, type Process, type Holon } from '@som/shared-types';
import { createSOMClient } from './client';

export function useExternalProcessData() {
    const [processes, setProcesses] = useState<Process[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProcesses = useCallback(async () => {
        setIsLoading(true);
        try {
            const client = createSOMClient();
            client.setAuthToken('dev-token-123'); // Dev default

            const result = await client.queryHolons(
                HolonType.Process,
                undefined,
                { page: 1, pageSize: 100 }
            );

            if (result.success && result.data) {
                // Type guard or cast
                const processHolons = result.data.filter((h: Holon) => h.type === HolonType.Process) as Process[];
                setProcesses(processHolons);
                setError(null);
            } else {
                setError(result.error || 'Failed to fetch processes');
            }
        } catch (err) {
            console.error(err);
            setError('Network error fetching processes');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchProcesses();
    }, [fetchProcesses]);

    const addProcess = useCallback(async (process: Process) => {
        // Optimistic update
        setProcesses(prev => [...prev, process]);

        try {
            const client = createSOMClient();
            client.setAuthToken('dev-token-123');
            // TODO: client.createHolon(process);
            console.warn("Write support not yet fully implemented in client hook");
        } catch (e) {
            console.error("Failed to persist process", e);
            // Revert?
        }
    }, []);

    const getProcessById = useCallback((id: string) => {
        return processes.find(p => p.id === id);
    }, [processes]);

    return {
        processes,
        isLoading,
        error,
        addProcess,
        getProcessById,
        refresh: fetchProcesses
    };
}

