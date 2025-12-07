/**
 * LoadingState - Consistent loading UI
 */

import React from 'react';
import { clsx } from 'clsx';

export interface LoadingStateProps {
  /** Loading message */
  message?: string;
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  className,
}: LoadingStateProps) {
  return (
    <div className={clsx('som-loading flex-col gap-3', className)} role="status">
      <span className={clsx('som-spinner', sizeClasses[size])} />
      {message && (
        <span className="text-sm text-[var(--text-secondary)]">{message}</span>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
}

/**
 * Inline loading spinner
 */
export function Spinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return <span className={clsx('som-spinner', sizeClasses[size], className)} />;
}
