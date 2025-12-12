import { useState, useEffect } from 'react';
import * as SharedTypes from '@som/shared-types';
import { createSOMClient, SOMClientOptions } from '../factory';

export function useProcessDetail(processId: string | undefined, options?: SOMClientOptions) {
    const [process, setProcess] = useState<SharedTypes.Process | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!processId) {
            setProcess(null);
            return;
        }

        const fetchProcess = async () => {
            setIsLoading(true);
            try {
                const client = createSOMClient(
                    options?.mode === 'mock' ? undefined : 'http://localhost:3333/api/v1',
                    options
                );
                if (!options || options.mode !== 'mock') {
                    client.setAuthToken('dev-token-123');
                }

                // Use getHolon to fetch specific ID
                const result = await client.getHolon(processId);

                if (result.success && result.data) {
                    setProcess(result.data as SharedTypes.Process);
                    setError(null);
                } else {
                    const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to fetch process';
                    setError(errorMessage);
                    setProcess(null);
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Network error fetching process');
                setProcess(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProcess();
    }, [processId, options]);

    return {
        process,
        isLoading,
        error
    };
}
