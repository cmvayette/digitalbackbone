import { render, screen, fireEvent } from '@testing-library/react';
import { DriftAlert } from './DriftAlert';
import { describe, it, expect, vi } from 'vitest';
import { DriftType } from '../../hooks/useDriftDetection';

describe('DriftAlert', () => {
    const issues = [
        {
            type: DriftType.Deprecated,
            message: 'Obligation removed',
            severity: 'high' as const,
            stepId: 's1',
            obligationId: 'o1'
        }
    ];

    it('renders issues correctly', () => {
        render(<DriftAlert issues={issues} />);
        expect(screen.getByText('Governance Drift Detected')).toBeDefined();
        expect(screen.getByText('Obligation removed')).toBeDefined();
    });

    it('does not render when no issues', () => {
        const { container } = render(<DriftAlert issues={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('calls onFix when button clicked', () => {
        const onFix = vi.fn();
        render(<DriftAlert issues={issues} onFix={onFix} />);

        fireEvent.click(screen.getByText('FIX'));
        expect(onFix).toHaveBeenCalledWith(issues[0]);
    });
});
