import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@som/api-client', () => ({
    createSOMClient: vi.fn(() => ({
        getPolicies: vi.fn().mockResolvedValue({ success: true, data: [] }),
        getOrgStructure: vi.fn().mockResolvedValue({ success: true, data: {} }),
        // add other methods as needed
    })),
    useExternalOrgData: () => ({
        getCandidates: vi.fn(() => [])
    }),
}));
