import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProcessPersistence } from './useProcessPersistence';
import { Process, HolonType } from '@som/shared-types';

describe('useProcessPersistence', () => {
    const mockProcess: Process = {
        id: 'test-process-1',
        type: HolonType.Process,
        status: 'active',
        createdAt: new Date(),
        createdBy: 'user',
        sourceDocuments: [],
        properties: {
            name: 'Test Process',
            description: '',
            inputs: [],
            outputs: [],
            tags: [],
            estimatedDuration: 0,
            steps: []
        }
    };

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('saves a process to localStorage', () => {
        const { result } = renderHook(() => useProcessPersistence());

        act(() => {
            const success = result.current.saveProcess(mockProcess);
            expect(success).toBe(true);
        });

        const stored = localStorage.getItem('how-do-process-test-process-1');
        expect(stored).toBeTruthy();
        expect(JSON.parse(stored!).id).toBe('test-process-1');
        expect(localStorage.getItem('how-do-last-active-id')).toBe('test-process-1');
    });

    it('loads a saved process', () => {
        const { result } = renderHook(() => useProcessPersistence());

        act(() => {
            result.current.saveProcess(mockProcess);
        });

        const loaded = result.current.loadProcess('test-process-1');
        expect(loaded).toBeTruthy();
        expect(loaded?.id).toBe(mockProcess.id);
        expect(loaded?.properties.name).toBe(mockProcess.properties.name);
    });

    it('loads last active process', () => {
        const { result } = renderHook(() => useProcessPersistence());

        // Save one
        act(() => {
            result.current.saveProcess(mockProcess);
        });

        // Load last active
        const loaded = result.current.loadLastActiveProcess();
        expect(loaded).toBeTruthy();
        expect(loaded?.id).toBe(mockProcess.id);
    });

    it('returns null for non-existent process', () => {
        const { result } = renderHook(() => useProcessPersistence());
        const loaded = result.current.loadProcess('fake-id');
        expect(loaded).toBeNull();
    });
});
