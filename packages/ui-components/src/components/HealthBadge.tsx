/**
 * HealthBadge - Health status indicator
 * Used to show green/yellow/red health status
 */

import React from 'react';
import { clsx } from 'clsx';

export type HealthStatus = 'healthy' | 'at-risk' | 'critical' | 'unknown';

export interface HealthBadgeProps {
  /** Health status */
  status: HealthStatus;
  /** Optional label text */
  label?: string;
  /** Show as compact dot only */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const statusLabels: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  'at-risk': 'At Risk',
  critical: 'Critical',
  unknown: 'Unknown',
};

export function HealthBadge({
  status,
  label,
  compact = false,
  className,
}: HealthBadgeProps) {
  const displayLabel = label ?? statusLabels[status];

  if (compact) {
    return (
      <span
        className={clsx(`som-health-dot som-health-dot--${status}`, className)}
        title={displayLabel}
        role="status"
        aria-label={displayLabel}
      />
    );
  }

  return (
    <span
      className={clsx(`som-health-badge som-health-badge--${status}`, className)}
      role="status"
    >
      <span className={`som-health-dot som-health-dot--${status}`} />
      {displayLabel}
    </span>
  );
}

/**
 * Calculate health status from a percentage (e.g., fill rate)
 * @param percentage - Value from 0 to 100
 * @param thresholds - Custom thresholds for healthy/at-risk
 */
export function calculateHealthStatus(
  percentage: number | null | undefined,
  thresholds: { healthy: number; atRisk: number } = { healthy: 80, atRisk: 50 }
): HealthStatus {
  if (percentage == null) return 'unknown';
  if (percentage >= thresholds.healthy) return 'healthy';
  if (percentage >= thresholds.atRisk) return 'at-risk';
  return 'critical';
}
