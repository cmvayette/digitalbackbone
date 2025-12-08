import { render, screen, fireEvent } from '@testing-library/react';
import { ObligationLinker } from './ObligationLinker';
import { describe, it, expect, vi } from 'vitest';

describe('ObligationLinker', () => {
    it('renders linked obligations', () => {
        // obl-1 is in mock-policy.json
        render(
            <ObligationLinker
                linkedObligationIds={[{ id: 'obl-1' }]}
                onLink={() => { }}
                onUnlink={() => { }}
            />
        );
        expect(screen.getByText(/The Operations Officer must review/i)).toBeDefined();
    });

    it('opens dropdown and allows linking', () => {
        const onLink = vi.fn();
        render(
            <ObligationLinker
                linkedObligationIds={[]}
                onLink={onLink}
                onUnlink={() => { }}
            />
        );

        fireEvent.click(screen.getByText(/Link Obligation/i));

        // Find an unlinked obligation
        const option = screen.getByText(/The Training Officer is responsible/i);
        fireEvent.click(option);

        expect(onLink).toHaveBeenCalled();
        expect(onLink.mock.calls[0][0].id).toBe('obl-2');
    });

    it('allows unlinking via X button', () => {
        const onUnlink = vi.fn();
        render(
            <ObligationLinker
                linkedObligationIds={[{ id: 'obl-1' }]}
                onLink={() => { }}
                onUnlink={onUnlink}
            />
        );

        // Click the unlinked button (the X icon is inside the button)
        const buttons = screen.getAllByRole('button');
        // First button is likely the X on the chip
        fireEvent.click(buttons[0]);

        expect(onUnlink).toHaveBeenCalledWith('obl-1');
    });
});
