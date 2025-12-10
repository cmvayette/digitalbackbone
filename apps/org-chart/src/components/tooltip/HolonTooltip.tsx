import { createPortal } from 'react-dom';

interface HolonTooltipProps {
    x: number;
    y: number;
    content: React.ReactNode;
    visible: boolean;
}

export function HolonTooltip({ x, y, content, visible }: HolonTooltipProps) {
    if (!visible) return null;

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
