import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface HolonCardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
    selected?: boolean;
    active?: boolean;
}

export const HolonCard = ({
    className,
    hoverable = false,
    selected = false,
    active = false,
    children,
    ...props
}: HolonCardProps) => {
    return (
        <div
            className={twMerge(
                clsx(
                    // Base
                    'bg-slate-900 border rounded-md shadow-sm transition-all duration-200',
                    // Border
                    selected ? 'border-orange-500 ring-1 ring-orange-500/50' : 'border-slate-800',
                    active ? 'border-emerald-500' : '',
                    // Interact
                    hoverable && !selected && 'hover:border-slate-600 hover:shadow-md hover:bg-slate-800/50 cursor-pointer',
                    className
                )
            )}
            {...props}
        >
            {children}
        </div>
    );
};
