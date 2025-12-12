import React, { useEffect } from 'react';
import { createSOMClient, type SOMClientOptions } from '@som/api-client';

export interface AuthGuardProps {
    children: React.ReactNode;
    authConfig: NonNullable<SOMClientOptions['authConfig']>;
    mode?: 'real' | 'mock';
    tokenStorageKey?: string;
    loadingComponent?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
    children,
    authConfig,
    mode = 'real',
    tokenStorageKey = 'som_access_token',
    loadingComponent
}) => {
    // Check for token
    const token = localStorage.getItem(tokenStorageKey);

    useEffect(() => {
        if (!token) {
            console.log('[AuthGuard] No token. Initializing login...');
            // Initiate Login
            const client = createSOMClient(undefined, {
                mode,
                authConfig
            });
            console.log('[AuthGuard] Calling client.login()...', client);
            client.login?.();
        }
    }, [token, authConfig, mode]);

    if (!token) {
        return (
            <>
                {loadingComponent || (
                    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-cyan-400 font-mono animate-pulse z-50">
                        REDIRECTING TO CAC LOGIN...
                    </div>
                )}
            </>
        );
    }

    return <>{children}</>;
};
