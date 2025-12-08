import { BaseEdge, type EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';

export function TigerTeamEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Tiger Team styling overrides
    const edgeStyle = {
        ...style,
        stroke: '#a855f7', // accent-purple
        strokeDasharray: '5,5',
        strokeWidth: 2,
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
            {/* Optional Label */}
            {data?.label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            fontSize: 10,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan bg-bg-panel px-1.5 py-0.5 rounded border border-accent-purple text-accent-purple font-bold tracking-wider uppercase shadow-sm"
                    >
                        {data.label as string}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
