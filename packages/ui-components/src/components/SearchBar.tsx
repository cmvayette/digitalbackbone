/**
 * SearchBar - Unified search input component
 * Used across all apps for consistent search UX
 */

import React from 'react';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';

export interface SearchBarProps {
  /** Current search value */
  value: string;
  /** Called when value changes */
  onChange: (value: string) => void;
  /** Called when user presses Enter */
  onSubmit?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Show keyboard shortcut hint */
  showShortcut?: boolean;
  /** Shortcut key to display (e.g., "/") */
  shortcutKey?: string;
  /** Additional CSS classes */
  className?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Loading state */
  loading?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  showShortcut = true,
  shortcutKey = '/',
  className,
  autoFocus = false,
  loading = false,
}: SearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle keyboard shortcut to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === shortcutKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        // Don't trigger if user is typing in an input
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('som-search', className)}>
      <Search className="som-search-icon" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="som-search-input"
        autoFocus={autoFocus}
        aria-label={placeholder}
      />
      {showShortcut && !value && (
        <span className="som-search-shortcut">{shortcutKey}</span>
      )}
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          <span className="som-spinner" style={{ width: '1rem', height: '1rem' }} />
        </span>
      )}
    </form>
  );
}
