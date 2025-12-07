/**
 * OwnerPicker - Select Organization, Position, or Person
 * Used across all apps for assigning ownership
 */

import React from 'react';
import { Building2, Briefcase, User, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';
import { HolonType, HolonID } from '@som/shared-types';

export type OwnerType = 'Organization' | 'Position' | 'Person';

export interface OwnerRef {
  type: OwnerType;
  id: HolonID;
  name: string;
}

export interface OwnerPickerProps {
  /** Currently selected owner */
  value: OwnerRef | null;
  /** Called when owner selection changes */
  onChange: (owner: OwnerRef | null) => void;
  /** Which owner types are allowed */
  allowedTypes?: OwnerType[];
  /** Placeholder text */
  placeholder?: string;
  /** Search function to find owners */
  onSearch: (query: string, type: OwnerType) => Promise<OwnerRef[]>;
  /** Additional CSS classes */
  className?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Error message */
  error?: string;
}

const typeIcons: Record<OwnerType, React.ReactNode> = {
  Organization: <Building2 size={16} />,
  Position: <Briefcase size={16} />,
  Person: <User size={16} />,
};

export function OwnerPicker({
  value,
  onChange,
  allowedTypes = ['Organization', 'Position', 'Person'],
  placeholder = 'Select owner...',
  onSearch,
  className,
  disabled = false,
  error,
}: OwnerPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeType, setActiveType] = React.useState<OwnerType>(allowedTypes[0]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<OwnerRef[]>([]);
  const [loading, setLoading] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search when query or type changes
  React.useEffect(() => {
    if (!isOpen) return;

    const search = async () => {
      setLoading(true);
      try {
        const owners = await onSearch(searchQuery, activeType);
        setResults(owners);
      } catch (err) {
        console.error('Owner search failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery, activeType, isOpen, onSearch]);

  const handleSelect = (owner: OwnerRef) => {
    onChange(owner);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'w-full flex items-center justify-between gap-2 px-3 py-2',
          'som-bg-surface som-border som-rounded',
          'text-sm text-left',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-[var(--accent-red)]'
        )}
      >
        {value ? (
          <span className="flex items-center gap-2">
            {typeIcons[value.type]}
            <span className="truncate">{value.name}</span>
          </span>
        ) : (
          <span className="text-[var(--text-muted)]">{placeholder}</span>
        )}
        <span className="flex items-center gap-1">
          {value && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-[var(--bg-hover)] rounded cursor-pointer"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown size={16} className={clsx(isOpen && 'rotate-180')} />
        </span>
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-[var(--accent-red)]">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full som-bg-panel som-border som-rounded som-shadow-lg">
          {/* Type tabs */}
          {allowedTypes.length > 1 && (
            <div className="flex border-b border-[var(--border-subtle)]">
              {allowedTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={clsx(
                    'flex-1 px-3 py-2 text-xs font-medium',
                    'flex items-center justify-center gap-1.5',
                    activeType === type
                      ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent-blue)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  {typeIcons[type]}
                  {type}
                </button>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="p-2 border-b border-[var(--border-subtle)]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeType.toLowerCase()}s...`}
              className="w-full px-2 py-1.5 text-sm som-bg-surface som-border som-rounded"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                No {activeType.toLowerCase()}s found
              </div>
            ) : (
              <ul>
                {results.map((owner) => (
                  <li key={owner.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(owner)}
                      className={clsx(
                        'w-full px-3 py-2 text-left text-sm',
                        'flex items-center gap-2',
                        'hover:bg-[var(--bg-hover)]',
                        value?.id === owner.id && 'bg-[var(--bg-surface)]'
                      )}
                    >
                      {typeIcons[owner.type]}
                      <span className="truncate">{owner.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
