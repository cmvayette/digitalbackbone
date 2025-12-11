import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSearch } from '../../hooks/useSearch';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API Client
const mockSearch = vi.fn();
vi.mock('@som/api-client', () => ({
    createSOMClient: () => ({
        search: mockSearch
    })
}));

const wrapper = ({ children }: any) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
    });
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('useSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns empty results initially', async () => {
        const { result } = renderHook(() => useSearch(''), { wrapper });
        expect(result.current.results).toEqual([]);
        expect(mockSearch).not.toHaveBeenCalled();
    });

    it('calls api.search when query is provided', async () => {
        mockSearch.mockResolvedValue({
            success: true,
            data: [{ id: '1', name: 'Logistics', type: 'Organization', description: 'Test' }]
        });

        const { result } = renderHook(() => useSearch('logistics'), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Expect exact call assuming impl logic (which sends activeQuery)
        expect(mockSearch).toHaveBeenCalled();
        expect(result.current.results).toHaveLength(1);
        expect(result.current.results[0].label).toBe('Logistics');
    });

    it('handles search failure gracefully', async () => {
        mockSearch.mockResolvedValue({
            success: false,
            error: { message: 'Failed' }
        });

        const { result } = renderHook(() => useSearch('crash'), { wrapper });

        await waitFor(() => expect(result.current.error).toBeTruthy());
        expect(result.current.results).toEqual([]);
    });

    it('appends intent keywords to query', async () => {
        mockSearch.mockResolvedValue({ success: true, data: [] });
        renderHook(() => useSearch('jobs', { vacant: true }), { wrapper });
        await waitFor(() => expect(mockSearch).toHaveBeenCalledWith('jobs vacant', undefined, 10));
    });
});
