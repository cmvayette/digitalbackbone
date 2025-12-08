import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProcessHealthDashboard } from './ProcessHealthDashboard';

// Mock mock-processes 
vi.mock('../../mocks/mock-processes', () => ({
    mockProcesses: [
        {
            id: 'p1',
            createdAt: new Date(),
            properties: { name: 'Healthy Process', description: 'Desc', steps: [{ owner: 'o', description: 'd', obligations: ['o'] }] }
        },
        {
            id: 'p2',
            createdAt: new Date('2020-01-01'), // Old
            properties: { name: 'Stale Process', description: 'Desc', steps: [] }
        }
    ]
}));

// Mock drift detection hook
vi.mock('../../hooks/useDriftDetection', () => ({
    useDriftDetection: () => ({ hasDrift: false, issues: [] })
}));

describe('ProcessHealthDashboard', () => {
    it('renders dashboard header', () => {
        render(<ProcessHealthDashboard />);
        expect(screen.getByText('Process Health Dashboard')).toBeDefined();
    });

    it('renders cards for processes', () => {
        render(<ProcessHealthDashboard />);
        expect(screen.getByText('Healthy Process')).toBeDefined();
        expect(screen.getByText('Stale Process')).toBeDefined();
    });
});
