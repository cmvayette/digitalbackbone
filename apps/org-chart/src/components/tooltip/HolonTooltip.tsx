import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

interface HolonTooltipProps {
    x: number;
    y: number;
    content: React.ReactNode;
    visible: boolean;
}

export function HolonTooltip({ x, y, content, visible }: HolonTooltipProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !visible) return null;

    // Use a generic tooltip container attached to body or root
    // For simplicity in this environment, creating a portal to document.body
    return createPortal(
        <div
            style={{
                position: 'absolute',
                top: y + 15, // Offset slightly
                left: x + 15,
                zIndex: 9999,
                pointerEvents: 'none'
            }}
            className="bg-bg-panel border border-border-color shadow-xl rounded p-3 text-sm min-w-[200px] animate-in fade-in zoom-in-95 duration-150"
        >
            {content}
        </div>,
        document.body
    );
}

// Hook to manage tooltip state
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
