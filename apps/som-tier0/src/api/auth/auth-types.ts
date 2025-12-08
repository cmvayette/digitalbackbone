/**
 * Shared types for Authentication Providers
 */

import { UserContext } from '../../access-control';

/**
 * Result of an authentication attempt
 */
export interface AuthenticationResult {
    authenticated: boolean;
    user?: UserContext;
    error?: string;
}

/**
 * Interface for Authentication Providers
 * Adapters must implement this interface to plug into the AuthenticationMiddleware
 */
export interface IAuthProvider {
    /**
     * Authenticate a request based on headers (or other context)
     * @param headers Request headers
     */
    authenticate(headers: Record<string, string>): Promise<AuthenticationResult>;

    /**
     * Optional: Register an API key (only for providers that support it)
     */
    registerAPIKey?(apiKey: string, user: UserContext): void;

    /**
     * Optional: Revoke an API key
     */
    revokeAPIKey?(apiKey: string): void;
}
