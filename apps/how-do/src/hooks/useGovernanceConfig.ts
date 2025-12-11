import { useState, useCallback, useEffect } from 'react';
import { GovernanceConfig } from '@som/shared-types';
import { createSOMClient, APIResponse } from '@som/api-client';

export function useGovernanceConfig(options?: import('@som/api-client').SOMClientOptions) {
    const [config, setConfig] = useState<GovernanceConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        try {
            const client = createSOMClient(
                options?.mode === 'mock' ? undefined : 'http://localhost:3333/api/v1',
                { ...options, mode: 'mock' } // Forcing mock for now to use local mock data
            );

            const result = await client.getGovernanceConfig();

            if (result.success && result.data) {
                setConfig(result.data);
                setError(null);
            } else {
                const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to fetch config';
                setError(errorMessage);
            }
        } catch (err) {
            console.error(err);
            setError('Network error fetching config');
        } finally {
            setIsLoading(false);
        }
    }, [options]);

    // Initial fetch
    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const updateConfig = useCallback(async (newConfig: Partial<GovernanceConfig['properties']>) => {
        // Optimistic update (partial) - tough with deep structure, better to wait for response or do smarter merge locally
        // For now, let's just call API and update state on success
        setIsLoading(true);
        try {
            const client = createSOMClient(
                options?.mode === 'mock' ? undefined : 'http://localhost:3333/api/v1',
                { ...options, mode: 'mock' }
            );

            const result = await client.updateGovernanceConfig(newConfig);

            if (result.success && result.data) {
                setConfig(result.data);
                setError(null);
            } else {
                setError(result.error?.message || 'Update failed');
            }
        } catch (e) {
            setError('Network error updating config');
        } finally {
            setIsLoading(false);
        }
    }, [options]);

    return {
        config,
        isLoading,
        error,
        updateConfig,
        refresh: fetchConfig
    };
}
