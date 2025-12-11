import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 'solid' | 'subtle' | 'outline';
export type BadgeIntent = 'neutral' | 'info' | 'success' | 'warning' | 'critical' | 'process';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    intent?: BadgeIntent;
    size?: 'sm' | 'md';
}

export const Badge = ({
    className,
    variant = 'solid',
    intent = 'neutral',
    size = 'md',
    ...props
}: BadgeProps) => {
    const baseStyles = 'inline-flex items-center rounded font-mono font-bold uppercase tracking-wider border transition-colors';

    const sizes = {
        sm: 'px-1.5 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
    };

    const variants = {
        solid: {
            neutral: 'bg-slate-700 text-slate-200 border-transparent',
            info: 'bg-sky-500 text-white border-transparent',
            success: 'bg-emerald-500 text-slate-950 border-transparent',
            warning: 'bg-amber-500 text-slate-950 border-transparent',
            critical: 'bg-rose-600 text-white border-transparent',
            process: 'bg-indigo-500 text-white border-transparent',
        },
        subtle: {
            neutral: 'bg-slate-800 text-slate-400 border-transparent',
            info: 'bg-sky-950/50 text-sky-400 border-transparent',
            success: 'bg-emerald-950/50 text-emerald-400 border-transparent',
            warning: 'bg-amber-950/50 text-amber-500 border-transparent',
            critical: 'bg-rose-950/50 text-rose-400 border-transparent',
            process: 'bg-indigo-950/50 text-indigo-400 border-transparent',
        },
        outline: {
            neutral: 'bg-transparent text-slate-400 border-slate-700',
            info: 'bg-transparent text-sky-500 border-sky-800',
            success: 'bg-transparent text-emerald-500 border-emerald-800',
            warning: 'bg-transparent text-amber-500 border-amber-800 border-dashed', // Tiger Team Style
            critical: 'bg-transparent text-rose-500 border-rose-800',
            process: 'bg-transparent text-indigo-400 border-indigo-800',
        }
    };

    const selectedVariant = variants[variant][intent];

    return (
        <span
            className={twMerge(clsx(baseStyles, sizes[size], selectedVariant, className))}
            {...props}
        />
    );
};
