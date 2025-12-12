/**
 * @som/ui-components
 * Shared UI components for all Tier-1 applications
 */

// Components
export { SidebarPanel } from './components/SidebarPanel';
export type { SidebarPanelProps } from './components/SidebarPanel';

export { SearchBar } from './components/SearchBar';
export type { SearchBarProps } from './components/SearchBar';

export { HealthBadge, calculateHealthStatus } from './components/HealthBadge';
export type { HealthBadgeProps, HealthStatus } from './components/HealthBadge';

export { HolonLink } from './components/HolonLink';
export type { HolonLinkProps } from './components/HolonLink';

export { LoadingState, Spinner } from './components/LoadingState';
export type { LoadingStateProps } from './components/LoadingState';

export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps, EmptyStateVariant } from './components/EmptyState';

export { OwnerPicker } from './components/OwnerPicker';
export type { OwnerPickerProps } from './components/OwnerPicker';


// Atoms
export { Button } from './components/atoms/Button';
export type { ButtonProps } from './components/atoms/Button';

export { Badge } from './components/atoms/Badge';
export type { BadgeProps, BadgeVariant, BadgeIntent } from './components/atoms/Badge';

export { HolonCard } from './components/atoms/HolonCard';
export type { HolonCardProps } from './components/atoms/HolonCard';

// Hooks
export { useDebounce } from './hooks/useDebounce';

// Auth
export { AuthGuard, type AuthGuardProps } from './components/auth/AuthGuard';
export { AuthCallback, type AuthCallbackProps } from './components/auth/AuthCallback';
