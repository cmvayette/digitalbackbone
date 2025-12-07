/**
 * EmptyState - Consistent empty state UI
 */

import React from 'react';
import { Inbox, Search, FileQuestion, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';

export type EmptyStateVariant = 'default' | 'search' | 'no-data' | 'no-results';

export interface EmptyStateProps {
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Variant determines the icon */
  variant?: EmptyStateVariant;
  /** Custom icon (overrides variant icon) */
  icon?: React.ReactNode;
  /** Action button/link */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const variantIcons: Record<EmptyStateVariant, React.ReactNode> = {
  default: <Inbox />,
  search: <Search />,
  'no-data': <FolderOpen />,
  'no-results': <FileQuestion />,
};

export function EmptyState({
  title,
  description,
  variant = 'default',
  icon,
  action,
  className,
}: EmptyStateProps) {
  const IconElement = icon ?? variantIcons[variant];

  return (
    <div className={clsx('som-empty-state', className)}>
      <div className="som-empty-state-icon">{IconElement}</div>
      <h3 className="som-empty-state-title">{title}</h3>
      {description && (
        <p className="som-empty-state-description">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
