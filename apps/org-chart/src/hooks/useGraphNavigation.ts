import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

export function useGraphNavigation() {
    const { setCenter } = useReactFlow();

    const focusNode = useCallback((nodeId: string, zoomLevel: number = 1.2) => {
        // We need the node position, but simpler to use fitView with basic nodes option
        // However, fitView fits ALL passed nodes.
        // Better approach: use getNode to find pos (if we had access to state directly here, but useReactFlow gives us methods)
        // Since we don't have direct node access without fetching, we will use the internal store or params passed.

        // Actually, useReactFlow provides getNode!
        const instance = useReactFlow(); // Get instance
        const node = instance.getNode(nodeId);

        if (node) {
            const { position, measured } = node;
            const width = measured?.width || 350;
            const height = measured?.height || 200;

            // Calculate center
            const x = position.x + width / 2;
            const y = position.y + height / 2;

            setCenter(x, y, { zoom: zoomLevel, duration: 800 });
        }
    }, [setCenter]);

    return { focusNode };
}
