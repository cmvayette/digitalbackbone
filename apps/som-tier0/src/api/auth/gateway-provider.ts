/**
 * Gateway Header Authentication Provider
 * trusts identity headers injected by an upstream proxy (e.g. Istio, Envoy, AWS ALB)
 * Used for C-ATO compliance (Identity Propagation)
 */

import { IAuthProvider, AuthenticationResult } from './auth-types';
import { UserContext, Role, ClassificationLevel } from '../../access-control';

export class GatewayHeaderAuthProvider implements IAuthProvider {

    async authenticate(headers: Record<string, string>): Promise<AuthenticationResult> {
        // Headers are typically lower-cased by Node.js http server
        const remoteUser = headers['x-remote-user'];

        if (!remoteUser) {
            // In Gateway mode, if the generic "user" header is missing, we aren't authenticated
            // unless we want to support a fallback? For now, strict.
            return {
                authenticated: false,
                error: 'Missing identity headers (X-Remote-User)',
            };
        }

        // Extract roles from X-Remote-Groups (comma separated)
        // format example: "som-admins, som-analysts"
        const remoteGroups = headers['x-remote-groups'] || '';
        const roles = this.mapGroupsToRoles(remoteGroups);

        // Extract clearance if present
        const remoteClearance = headers['x-remote-clearance'];
        const clearanceLevel = this.mapClearance(remoteClearance);

        const user: UserContext = {
            userId: remoteUser,
            roles: roles.length > 0 ? roles : [Role.Viewer], // Default to Viewer if authenticated but no specific role map
            clearanceLevel,
        };

        return {
            authenticated: true,
            user,
        };
    }

    private mapGroupsToRoles(groupsHeader: string): Role[] {
        const groupNames = groupsHeader.split(',').map(g => g.trim().toLowerCase());
        const roles: Set<Role> = new Set();

        // Simple mapping logic - in production this might be config driven
        if (groupNames.includes('som-admins') || groupNames.includes('administrators')) {
            roles.add(Role.Administrator);
        }
        if (groupNames.includes('som-operators')) {
            roles.add(Role.Operator);
        }
        if (groupNames.includes('som-analysts')) {
            roles.add(Role.Analyst);
        }
        if (groupNames.includes('som-viewers')) {
            roles.add(Role.Viewer);
        }
        // Add other mappings as needed

        return Array.from(roles);
    }

    private mapClearance(clearance?: string): ClassificationLevel {
        if (!clearance) return ClassificationLevel.Unclassified;

        const upper = clearance.toUpperCase();
        if (upper === 'TOPSECRET' || upper === 'TOP SECRET') return ClassificationLevel.TopSecret;
        if (upper === 'SECRET') return ClassificationLevel.Secret;
        if (upper === 'CONFIDENTIAL') return ClassificationLevel.Confidential;

        return ClassificationLevel.Unclassified;
    }

    // Gateway provider usually doesn't support dynamic key registration via the app
    // as identity is managed externally.
}
