import { describe, it, expect, beforeEach } from 'vitest';
import { ApiKeyAuthProvider } from './api-key-provider';
import { GatewayHeaderAuthProvider } from './gateway-provider';
import { Role, ClassificationLevel } from '../../access-control';

describe('ApiKeyAuthProvider', () => {
    let provider: ApiKeyAuthProvider;
    const mockUser = {
        userId: 'user1',
        roles: [Role.Operator],
        clearanceLevel: ClassificationLevel.Unclassified
    };

    beforeEach(() => {
        provider = new ApiKeyAuthProvider();
    });

    it('should authenticate with a valid registered API key', async () => {
        provider.registerAPIKey('valid-key', mockUser);

        const result = await provider.authenticate({ 'authorization': 'valid-key' });

        expect(result.authenticated).toBe(true);
        expect(result.user).toEqual(mockUser);
    });

    it('should authenticate with a valid Bearer token', async () => {
        provider.registerAPIKey('valid-token', mockUser);

        const result = await provider.authenticate({ 'authorization': 'Bearer valid-token' });

        expect(result.authenticated).toBe(true);
        expect(result.user).toEqual(mockUser);
    });

    it('should fail with an invalid API key', async () => {
        const result = await provider.authenticate({ 'authorization': 'invalid-key' });

        expect(result.authenticated).toBe(false);
        expect(result.error).toBe('Invalid API key');
    });

    it('should fail with missing headers', async () => {
        const result = await provider.authenticate({});

        expect(result.authenticated).toBe(false);
        expect(result.error).toBe('Missing authentication credentials');
    });

    it('should allow revoking keys', async () => {
        provider.registerAPIKey('temp-key', mockUser);
        provider.revokeAPIKey('temp-key');

        const result = await provider.authenticate({ 'authorization': 'temp-key' });

        expect(result.authenticated).toBe(false);
    });
});

describe('GatewayHeaderAuthProvider', () => {
    let provider: GatewayHeaderAuthProvider;

    beforeEach(() => {
        provider = new GatewayHeaderAuthProvider();
    });

    it('should authenticate based on x-remote-user header', async () => {
        const headers = {
            'x-remote-user': 'jdoe',
        };

        const result = await provider.authenticate(headers);

        expect(result.authenticated).toBe(true);
        expect(result.user?.userId).toBe('jdoe');
        expect(result.user?.roles).toContain(Role.Viewer); // Default
        expect(result.user?.clearanceLevel).toBe(ClassificationLevel.Unclassified);
    });

    it('should fail if x-remote-user is missing', async () => {
        const result = await provider.authenticate({});

        expect(result.authenticated).toBe(false);
        expect(result.error).toContain('Missing identity headers');
    });

    it('should map roles from x-remote-groups', async () => {
        const headers = {
            'x-remote-user': 'admin',
            'x-remote-groups': 'som-admins, som-operators',
        };

        const result = await provider.authenticate(headers);

        expect(result.authenticated).toBe(true);
        expect(result.user?.roles).toContain(Role.Administrator);
        expect(result.user?.roles).toContain(Role.Operator);
    });

    it('should map clearance from x-remote-clearance', async () => {
        const headers = {
            'x-remote-user': 'agent007',
            'x-remote-clearance': 'Top Secret',
        };

        const result = await provider.authenticate(headers);

        expect(result.authenticated).toBe(true);
        expect(result.user?.clearanceLevel).toBe(ClassificationLevel.TopSecret);
    });
});
