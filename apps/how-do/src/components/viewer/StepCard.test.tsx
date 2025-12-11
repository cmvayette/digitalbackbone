import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StepCard } from './StepCard';

const mockStep = {
    id: 'step-1',
    title: 'Test Step',
    description: 'Description',
    owner: 'user-1',
    obligations: []
};

describe('StepCard', () => {
    it('renders standard step', () => {
        render(<StepCard step={mockStep} index={0} />);
        expect(screen.getByText('Test Step')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('renders Agent owner with robot icon style', () => {
        render(<StepCard step={mockStep} index={0} isAgent={true} ownerName="AI Agent" />);
        expect(screen.getByText('AI Agent')).toBeInTheDocument();
        const badge = screen.getByText('AI Agent').parentElement;
        // Check for purple styling applied to text
        expect(badge?.querySelector('span')).toHaveClass('text-purple-300');
    });

    it('renders Proxy Task details', () => {
        const proxyStep = {
            ...mockStep,
            source: 'external' as const,
            externalId: 'JIRA-1234',
            externalSource: 'JIRA'
        };
        render(<StepCard step={proxyStep} index={0} />);

        expect(screen.getByText('JIRA')).toBeInTheDocument();
        expect(screen.getByText('JIRA-1234')).toBeInTheDocument();
    });
});
