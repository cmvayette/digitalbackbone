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
                const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to fetch processes';
                setError(errorMessage);
            }
        } catch (err) {
            console.error(err);
            setError('Network error fetching processes');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch and polling
    useEffect(() => {
        fetchProcesses();
        const interval = setInterval(fetchProcesses, 5000); // 5s polling
        return () => clearInterval(interval);
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

    const searchProcesses = useCallback(async (query: string): Promise<Process[]> => {
        if (!query.trim()) return processes;

        setIsLoading(true);
        try {
            const client = createSOMClient();
            client.setAuthToken('dev-token-123'); // Dev default

            // Assuming client.search exists and returns SearchResult[]
            const response = await client.search(query, [HolonType.Process]);

            if (response.success && response.data) {
                // Map SearchResult back to Process structure
                return response.data.map(result => ({
                    id: result.id,
                    type: HolonType.Process,
                    properties: result.properties,
                    createdAt: new Date(), // Mock or missing from search result
                    createdBy: 'system',
                    status: (result.properties?.status || 'active') as any, // Fallback
                    sourceDocuments: []
                } as Process));
            }
            return [];
        } catch (e) {
            console.error('Search failed', e);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [processes]);

    return {
        processes,
        isLoading,
        error,
        addProcess,
        getProcessById,
        searchProcesses, // Added searchProcesses
        refresh: fetchProcesses
    };
}
