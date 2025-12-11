import { useState, useCallback } from 'react';
import { Process } from '../types/process';

const STORAGE_PREFIX = 'how-do-process-';
const LAST_ACTIVE_KEY = 'how-do-last-active-id';

export const useProcessPersistence = () => {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const saveProcess = useCallback((process: Process) => {
        try {
            const key = `${STORAGE_PREFIX}${process.id}`;
            const data = JSON.stringify({
                ...process,
                _savedAt: new Date().toISOString()
            });
            localStorage.setItem(key, data);
            localStorage.setItem(LAST_ACTIVE_KEY, process.id);
            setLastSaved(new Date());
            return true;
        } catch (error) {
            console.error('Failed to save process to local storage', error);
            return false;
        }
    }, []);

    const loadProcess = useCallback((id: string): Process | null => {
        try {
            const key = `${STORAGE_PREFIX}${id}`;
            const item = localStorage.getItem(key);
            if (!item) return null;

            const parsed = JSON.parse(item);
            // Rehydrate dates if necessary
            // For now, we assume standard JSON parsing is sufficient for structure, 
            // but Dates usually come back as strings.
            // If strict typing is needed, we would walk the object.
            return parsed as Process;
        } catch (error) {
            console.error(`Failed to load process ${id}`, error);
            return null;
        }
    }, []);

    const loadLastActiveProcess = useCallback((): Process | null => {
        const lastId = localStorage.getItem(LAST_ACTIVE_KEY);
        if (lastId) {
            return loadProcess(lastId);
        }
        return null;
    }, [loadProcess]);

    return {
        saveProcess,
        loadProcess,
        loadLastActiveProcess,
        lastSaved
    };
};
