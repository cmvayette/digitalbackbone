import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    appName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-200 p-4">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-6 text-center">
                        <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-xl font-bold text-white mb-2">
                            Something went wrong
                        </h1>

                        <p className="text-slate-400 mb-6">
                            {this.props.appName ? `${this.props.appName} encountered an unexpected error.` : 'The application encountered an unexpected error.'}
                        </p>

                        {this.state.error && (
                            <div className="bg-slate-950 rounded p-3 mb-6 text-left overflow-auto max-h-32">
                                <code className="text-xs font-mono text-red-400">
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}

                        <button
                            onClick={this.handleReload}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
                        >
                            <RefreshCw size={16} />
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
