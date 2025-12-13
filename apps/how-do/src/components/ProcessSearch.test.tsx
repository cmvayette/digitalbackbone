
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProcessSearch } from './ProcessSearch';
import { mockProcesses } from '../mocks/mock-processes';
import { HolonType } from '@som/shared-types';

// Mock dependencies
// Mock dependencies
const mocks = vi.hoisted(() => ({
    searchProcesses: vi.fn(),
    processes: [
        {
            id: 'proc-1',
            type: 'Process' as any,
            status: 'active',
            properties: {
                name: 'Onboarding Checklist',
                description: 'Get started',
                tags: ['Logistics'],
                steps: []
            }
        },
        {
            id: 'proc-2',
            type: 'Process' as any,
            status: 'draft',
            properties: {
                name: 'New Operational Workflow',
                description: 'Draft process',
                tags: ['HR'],
                steps: []
            }
        }
    ]
}));

vi.mock('@som/api-client', () => ({
    useExternalProcessData: () => ({
        processes: mocks.processes,
        searchProcesses: mocks.searchProcesses,
        isLoading: false
    })
}));

// Define mock implementation for searchProcesses after imports
mocks.searchProcesses.mockResolvedValue([
    {
        id: 'proc-1',
        type: HolonType.Process,
        status: 'active',
        properties: {
            name: 'Onboarding Checklist',
            description: 'Get started',
            tags: ['Logistics'],
            steps: []
        }
    }
]);

vi.mock('../hooks/useGovernanceConfig', () => {
    const stableConfig = {
        config: {
            properties: {
                search: {
                    weights: { rankMatch: 1, roleMatch: 1, tagMatch: 1 },
                    recommendationMinScore: 10
                }
            }
        }
    };
    return {
        useGovernanceConfig: () => stableConfig
    };
});

// Mock useDriftDetection to force a drift state
vi.mock('../hooks/useDriftDetection', () => ({
    useDriftDetection: (process: any) => {
        // Mocking drift for a specific process ID or logic
        if (process.id === 'proc-1') {
            return { hasDrift: true, issues: [] };
        }
        return { hasDrift: false, issues: [] };
    }
}));

describe('ProcessSearch', () => {
    it('renders list of processes', () => {
        render(<ProcessSearch onSelectProcess={() => { }} />);
        expect(screen.getByText('New Operational Workflow')).toBeDefined();
        expect(screen.getByText('Onboarding Checklist')).toBeDefined();
    });

    it('shows DRIFT badge for drifting process', () => {
        render(<ProcessSearch onSelectProcess={() => { }} />);

        // proc-1 is mocked to have drift
        const driftBadges = screen.getAllByText(/DRIFT/);
        expect(driftBadges.length).toBeGreaterThan(0);
    });

    it('filters processes by search term', async () => {
        render(<ProcessSearch onSelectProcess={() => { }} />);

        const input = screen.getByPlaceholderText(/search processes/i);
        fireEvent.change(input, { target: { value: 'Onboarding' } });

        await waitFor(() => {
            expect(screen.queryByText('New Operational Workflow')).toBeNull();
        });
        expect(screen.getByText('Onboarding Checklist')).toBeDefined();
    });

    it('calls onSelectProcess when clicked', () => {
        const onSelect = vi.fn();
        render(<ProcessSearch onSelectProcess={onSelect} />);

        fireEvent.click(screen.getByText('Onboarding Checklist'));
        expect(onSelect).toHaveBeenCalled();
    });
});
