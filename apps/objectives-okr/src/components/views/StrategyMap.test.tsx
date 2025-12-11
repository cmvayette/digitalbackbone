import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StrategyMap } from './StrategyMap';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HolonType } from '@som/shared-types';

// Mock api-client
vi.mock('@som/api-client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@som/api-client')>();
    return {
        ...actual,
        createSOMClient: () => ({
            queryHolons: async (type: HolonType) => {
                if (type === HolonType.LOE) {
                    return {
                        success: true,
                        data: [{
                            id: 'loe-1',
                            type: HolonType.LOE,
                            properties: {
                                name: 'Test LOE',
                                description: 'Line of Effort',
                                timeframe: { start: new Date(), end: new Date() }
                            }
                        }]
                    };
                }
                if (type === HolonType.Objective) {
                    return {
                        success: true,
                        data: [{
                            id: 'obj-1',
                            type: HolonType.Objective,
                            properties: {
                                statement: 'Test Objective',
                                narrative: 'We will win',
                                level: 'strategic',
                                status: 'active',
                                linkedKRs: ['kr-1']
                            }
                        }]
                    };
                }
                if (type === HolonType.KeyResult) {
                    return {
                        success: true,
                        data: [{
                            id: 'kr-1',
                            type: HolonType.KeyResult,
                            properties: {
                                statement: 'Key Result 1',
                                target: 100,
                                currentValue: 50,
                                health: 'on-track'
                            }
                        }]
                    };
                }
                return { success: true, data: [] };
            }
        })
    };
});

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('StrategyMap', () => {
    it('renders LOE and Objective data', async () => {
        render(<StrategyMap />, { wrapper: createWrapper() });

        // Wait for LOE
        await waitFor(() => {
            expect(screen.getByText('Test LOE')).toBeDefined();
        });

        // Check Objective
        expect(screen.getByText('Test Objective')).toBeDefined();
        expect(screen.getByText('"We will win"')).toBeDefined();

        // Check KR
        expect(screen.getByText('Key Result 1')).toBeDefined();
        expect(screen.getByText('Target: 100')).toBeDefined();
    });
});
