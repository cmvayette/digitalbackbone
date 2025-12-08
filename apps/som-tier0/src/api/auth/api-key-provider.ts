/**
 * API Key Authentication Provider
 * Implements simple in-memory API key validation (Legacy/Dev mode)
 */

import { IAuthProvider, AuthenticationResult } from './auth-types';
import { UserContext } from '../../access-control';

export class ApiKeyAuthProvider implements IAuthProvider {
    private apiKeys: Map<string, UserContext>;

    constructor() {
        this.apiKeys = new Map();
    }

    /**
     * extract API key from authorization header
     */
    private extractAPIKey(authHeader?: string): string | undefined {
        if (!authHeader) {
            return undefined;
        }

        // Support "Bearer <token>" format
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            return parts[1];
        }

        // Support direct API key
        return authHeader;
    }

    async authenticate(headers: Record<string, string>): Promise<AuthenticationResult> {
        // Case-insensitive header lookup might be needed, but for now assuming normalized lower-case or standard 'authorization'
        const authHeader = headers['authorization'] || headers['Authorization'];
        const apiKey = this.extractAPIKey(authHeader);

        if (!apiKey) {
            return {
                authenticated: false,
                error: 'Missing authentication credentials',
            };
        }

        const user = this.apiKeys.get(apiKey);

        if (!user) {
            return {
                authenticated: false,
                error: 'Invalid API key',
            };
        }

        return {
            authenticated: true,
            user,
        };
    }

    registerAPIKey(apiKey: string, user: UserContext): void {
        this.apiKeys.set(apiKey, user);
    }

    revokeAPIKey(apiKey: string): void {
        this.apiKeys.delete(apiKey);
    }
}
