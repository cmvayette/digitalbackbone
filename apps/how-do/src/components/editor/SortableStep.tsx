import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableStepProps {
    id: string;
    children: React.ReactNode;
}

export const SortableStep: React.FC<SortableStepProps> = ({ id, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className="sortable-step-wrapper h-full flex flex-col items-center">
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="drag-handle p-1 mb-1 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripVertical size={16} />
            </div>
            {children}
        </div>
    );
};
