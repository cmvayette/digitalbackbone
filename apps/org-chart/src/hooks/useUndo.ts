import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface HistoryAction<T = any> {
    type: string;
    description: string;
    undo: () => void;
    payload?: T;
}

export function useUndo() {
    const [history, setHistory] = useState<HistoryAction[]>([]);

    const addAction = useCallback((action: HistoryAction) => {
        setHistory(prev => [action, ...prev].slice(0, 20)); // Keep last 20
        toast.success(action.description, {
            action: {
                label: 'Undo',
                onClick: () => undo()
            }
        });
    }, []);

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const [lastAction, ...rest] = prev;
            lastAction.undo();
            toast.info(`Undid: ${lastAction.description}`);
            return rest;
        });
    }, []);

    const canUndo = history.length > 0;

    return { addAction, undo, canUndo, history };
}
