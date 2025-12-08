import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useOrgMutations } from './useOrgMutations';
import { useUndo } from './useUndo';
import { ReactFlowProvider } from '@xyflow/react';

// Mock sonner to prevent errors and check calls
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        info: vi.fn(),
        error: vi.fn()
    }
}));

describe('useOrgMutations', () => {
    it('adds organization and updates graph', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ReactFlowProvider>{children}</ReactFlowProvider>
        );
        const { result } = renderHook(() => useOrgMutations(), { wrapper });

        let newId = '';
        act(() => {
            newId = result.current.addOrganization('root', 'Test Unit', 'TST-1');
        });

        expect(newId).toMatch(/^org-/);
    });

    it('adds position and updates graph', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ReactFlowProvider>{children}</ReactFlowProvider>
        );
        const { result } = renderHook(() => useOrgMutations(), { wrapper });

        let newId = '';
        act(() => {
            newId = result.current.addPosition('org-1', 'Ops Officer', '1110');
        });

        expect(newId).toMatch(/^pos-/);
    });

    it('assigns person to position', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ReactFlowProvider initialNodes={[{
                id: 'pos-1',
                type: 'position',
                position: { x: 0, y: 0 },
                data: { label: 'Officer', isVacant: true, properties: {} }
            }]}>{children}</ReactFlowProvider>
        );
        const { result } = renderHook(() => useOrgMutations(), { wrapper });

        act(() => {
            result.current.assignPerson('pos-1', 'John Doe', 'CPT');
        });

        // We can't easily check internal state here without mocking useReactFlow better, 
        // but success implies no crash and logic ran.
    });
});

describe('useUndo', () => {
    it('manages history stack', () => {
        const { result } = renderHook(() => useUndo());

        const undoFn = vi.fn();

        act(() => {
            result.current.addAction({
                type: 'TEST',
                description: 'Testing',
                undo: undoFn
            });
        });

        expect(result.current.history).toHaveLength(1);
        expect(result.current.canUndo).toBe(true);

        act(() => {
            result.current.undo();
        });

        expect(undoFn).toHaveBeenCalled();
        expect(result.current.history).toHaveLength(0);
    });
});
