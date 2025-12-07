/**
 * HolonLink - Cross-app navigation link
 * Used to link between apps when referencing holons
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { HolonType, HolonID } from '@som/shared-types';

export interface HolonLinkProps {
  /** Type of holon being linked to */
  holonType: HolonType;
  /** ID of the holon */
  holonId: HolonID;
  /** Display text */
  children: React.ReactNode;
  /** Custom click handler (overrides default navigation) */
  onClick?: (holonType: HolonType, holonId: HolonID) => void;
  /** Show external link icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get the app route for a holon type
 */
function getAppRoute(holonType: HolonType, holonId: HolonID): string {
  switch (holonType) {
    case HolonType.Person:
    case HolonType.Position:
    case HolonType.Organization:
      return `/org-chart?id=${holonId}&type=${holonType}`;
    case HolonType.Process:
      return `/how-do/process/${holonId}`;
    case HolonType.Document:
      return `/policy/${holonId}`;
    case HolonType.Task:
    case HolonType.Initiative:
      return `/tasks/${holonId}`;
    case HolonType.Objective:
    case HolonType.LOE:
      return `/okr/${holonType.toLowerCase()}/${holonId}`;
    default:
      return `/?id=${holonId}&type=${holonType}`;
  }
}

export function HolonLink({
  holonType,
  holonId,
  children,
  onClick,
  showIcon = true,
  className,
}: HolonLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(holonType, holonId);
    }
    // Default behavior: navigate to the route
    // In a real app, this would use React Router's navigate
  };

  const href = getAppRoute(holonType, holonId);

  return (
    <a
      href={href}
      onClick={handleClick}
      className={clsx('som-holon-link', className)}
    >
      {children}
      {showIcon && <ExternalLink className="som-holon-link-icon" />}
    </a>
  );
}
