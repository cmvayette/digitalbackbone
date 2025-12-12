import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export interface AuthCallbackProps {
    tokenStorageKey?: string;
    onSuccess?: () => void;
    redirectPath?: string;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({
    tokenStorageKey = 'som_access_token',
    onSuccess,
    redirectPath = '/'
}) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const code = searchParams.get('code');

    useEffect(() => {
        if (code) {
            console.log('Received auth code:', code);
            // SIMULATION: Set dummy token
            // In real world, we would swap code for token here via API
            localStorage.setItem(tokenStorageKey, 'mock-keycloak-token-' + Date.now());

            if (onSuccess) {
                onSuccess();
            } else {
                navigate(redirectPath);
            }
        }
    }, [code, navigate, onSuccess, redirectPath, tokenStorageKey]);

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-200 font-mono">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-8 w-8 border-t-2 border-cyan-400 rounded-full"></div>
                <p>Authenticating...</p>
            </div>
        </div>
    );
};
