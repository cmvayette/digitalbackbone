/**
 * SidebarPanel - Slide-over detail panel
 * Used across all apps for displaying holon details
 */

import React from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export interface SidebarPanelProps {
  /** Whether the sidebar is open */
  open: boolean;
  /** Called when the sidebar should close */
  onClose: () => void;
  /** Title displayed in the header */
  title?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Content to display in the sidebar */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Width of the sidebar */
  width?: 'sm' | 'md' | 'lg';
}

const widthClasses = {
  sm: 'w-80',
  md: 'w-96',
  lg: 'w-[480px]',
};

export function SidebarPanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
  width = 'md',
}: SidebarPanelProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'som-sidebar',
          widthClasses[width],
          open && 'open',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sidebar-title' : undefined}
      >
        {/* Header */}
        <div className="som-sidebar-header">
          <div>
            {title && (
              <h2
                id="sidebar-title"
                className="text-lg font-semibold text-[var(--text-primary)]"
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="som-btn som-btn--ghost p-2"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="som-sidebar-content">{children}</div>
      </div>
    </>
  );
}
