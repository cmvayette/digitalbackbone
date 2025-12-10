import { useState } from 'react';
import React from 'react';

export function useTooltip() {
    const [tooltipState, setTooltipState] = useState<{ visible: boolean; x: number; y: number; content: React.ReactNode }>({
        visible: false,
        x: 0,
        y: 0,
        content: null
    });

    const showTooltip = (e: React.MouseEvent, content: React.ReactNode) => {
        setTooltipState({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            content
        });
    };

    const hideTooltip = () => {
        setTooltipState(prev => ({ ...prev, visible: false }));
    };

    return { tooltipState, showTooltip, hideTooltip };
}
