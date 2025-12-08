import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSearch } from '../../hooks/useSearch';

const mockNodes = [
    { id: '1', type: 'organization', data: { label: 'Logistics Unit', properties: { uic: 'LSU-1' } } },
    { id: '2', type: 'person', data: { label: 'Sarah Miller', properties: { rank: 'LCDR' } } },
    { id: '3', type: 'position', data: { label: 'Ops Officer', properties: { billetCode: '12345' } } },
] as any[];

describe('useSearch', () => {
    it('returns empty array for empty query', () => {
        const { result } = renderHook(() => useSearch(mockNodes, ''));
        expect(result.current).toEqual([]);
    });

    it('filters by label (case-insensitive)', () => {
        const { result } = renderHook(() => useSearch(mockNodes, 'logistics'));
        expect(result.current).toHaveLength(1);
        expect(result.current[0].label).toBe('Logistics Unit');
    });

    it('filters by subtitle/properties', () => {
        const { result } = renderHook(() => useSearch(mockNodes, 'lcdr')); // Search by rank
        expect(result.current).toHaveLength(1);
        expect(result.current[0].label).toBe('Sarah Miller');
    });

    it('limits results', () => {
        // Create 15 matching nodes
        const manyNodes = Array.from({ length: 15 }, (_, i) => ({
            id: String(i), type: 'person', data: { label: `Person ${i}`, properties: {} }
        })) as any[];

        const { result } = renderHook(() => useSearch(manyNodes, 'Person'));
        expect(result.current).toHaveLength(10);
    });
});
