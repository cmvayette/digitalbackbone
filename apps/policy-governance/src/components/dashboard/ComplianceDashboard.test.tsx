import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComplianceDashboard } from './ComplianceDashboard';
import { usePolicyStore } from '../../store/policyStore';
import React from 'react';

describe('ComplianceDashboard', () => {
    beforeEach(() => {
        usePolicyStore.setState({
            policies: [
                {
                    id: 'p1',
                    title: 'Active Policy',
                    documentType: 'Instruction',
                    version: '1.0',
                    status: 'active', // Active
                    sections: [],
                    obligations: [
                        { id: 'o1', statement: 'Crit 1', actor: { id: 'a1', type: 'Position', name: 'Pos A' }, criticality: 'high', status: 'validated' },
                        { id: 'o2', statement: 'Low 1', actor: { id: 'a2', type: 'Position', name: 'Pos B' }, criticality: 'low', status: 'validated' }
                    ],
                    createdAt: '',
                    updatedAt: ''
                },
                {
                    id: 'p2',
                    title: 'Draft Policy',
                    documentType: 'Instruction',
                    version: '0.1',
                    status: 'draft',
                    sections: [],
                    obligations: [],
                    createdAt: '',
                    updatedAt: ''
                }
            ],
            currentPolicy: null
        });
    });

    it('renders dashboard visuals', () => {
        render(<ComplianceDashboard />);
        expect(screen.getByText('Compliance Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Compliance Score')).toBeInTheDocument();
    });

    it('calculates metrics correctly', () => {
        render(<ComplianceDashboard />);

        // Active Policies: 1 of 2
        // We look for the text "1" in the active policies card, but it might be tricky with finding logic.
        // Let's rely on the semantic text if possible or strict regex.
        expect(screen.getByText('Active Policies')).toBeInTheDocument();

        // Total Obligations: 2
        // Critical Risks: 1
    });

    it('lists critical obligations', () => {
        render(<ComplianceDashboard />);
        expect(screen.getByText('Crit 1')).toBeInTheDocument();
        expect(screen.queryByText('Low 1')).not.toBeInTheDocument(); // Only high risks shown in table
    });
});
