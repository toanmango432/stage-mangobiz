import React from 'react';
import { WaitListSection } from './WaitListSection';
import { SectionErrorBoundary } from './SectionErrorBoundary';

export interface EmbeddableWaitListProps {
  /**
   * Display mode for the wait list
   * - 'full': Complete wait list with all features
   * - 'compact': Reduced height, simplified UI
   * - 'minimal': Just the essentials, no header
   * - 'widget': Small widget view for dashboards
   */
  displayMode?: 'full' | 'compact' | 'minimal' | 'widget';

  /**
   * Whether to show the header
   */
  showHeader?: boolean;

  /**
   * Whether to show action buttons (add, edit, delete, etc.)
   */
  showActions?: boolean;

  /**
   * Maximum number of tickets to show (for widget mode)
   */
  maxTickets?: number;

  /**
   * Custom class name for styling
   */
  className?: string;

  /**
   * Custom styles for the container
   */
  style?: React.CSSProperties;

  /**
   * Callback when a ticket is selected
   */
  onTicketSelect?: (ticketId: string) => void;

  /**
   * Whether to show the view mode toggle
   */
  showViewToggle?: boolean;

  /**
   * Initial view mode (grid or list)
   */
  initialViewMode?: 'grid' | 'list';

  /**
   * Custom header styles
   */
  headerStyles?: {
    bg: string;
    accentColor: string;
    iconColor: string;
    activeIconColor: string;
    titleColor: string;
    borderColor: string;
    counterBg: string;
    counterText: string;
  };

  /**
   * Whether this is being used in a mobile context
   */
  isMobile?: boolean;

  /**
   * Whether to enable error boundary protection
   */
  useErrorBoundary?: boolean;
}

/**
 * Embeddable WaitList component that can be used in different contexts
 * This wrapper makes WaitListSection flexible for embedding in various pages
 */
export const EmbeddableWaitList: React.FC<EmbeddableWaitListProps> = ({
  displayMode = 'full',
  showHeader = true,
  className = '',
  style,
  showViewToggle = true,
  initialViewMode = 'list',
  headerStyles,
  isMobile = false,
  useErrorBoundary = true
}) => {
  // Determine component props based on display mode
  const getPropsForMode = () => {
    switch (displayMode) {
      case 'minimal':
        return {
          hideHeader: true,
          cardViewMode: 'compact' as const,
          viewMode: 'list' as const,
          minimizedLineView: false
        };

      case 'compact':
        return {
          hideHeader: !showHeader,
          cardViewMode: 'compact' as const,
          viewMode: initialViewMode,
          minimizedLineView: true
        };

      case 'widget':
        return {
          hideHeader: true,
          cardViewMode: 'compact' as const,
          viewMode: 'list' as const,
          minimizedLineView: true
        };

      case 'full':
      default:
        return {
          hideHeader: !showHeader,
          cardViewMode: 'normal' as const,
          viewMode: initialViewMode,
          minimizedLineView: false
        };
    }
  };

  const modeProps = getPropsForMode();

  // Container styles based on display mode
  const getContainerStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      ...style
    };

    switch (displayMode) {
      case 'widget':
        return {
          ...baseStyles,
          maxHeight: '300px',
          overflow: 'auto'
        };

      case 'compact':
        return {
          ...baseStyles,
          maxHeight: '400px',
          overflow: 'auto'
        };

      case 'minimal':
        return {
          ...baseStyles,
          padding: 0
        };

      default:
        return baseStyles;
    }
  };

  // Default header styles if not provided
  const defaultHeaderStyles = headerStyles || {
    bg: 'bg-gradient-to-br from-purple-50/80 via-purple-100/60 to-violet-50/40',
    accentColor: '#A78BFA',
    iconColor: 'text-[#9CA3AF]',
    activeIconColor: 'text-[#A78BFA]',
    titleColor: 'text-[#111827]',
    borderColor: 'border-purple-200/30',
    counterBg: 'bg-purple-100',
    counterText: 'text-purple-700'
  };

  const content = (
    <div
      className={`embeddable-waitlist ${displayMode}-mode ${className}`}
      style={getContainerStyles()}
    >
      <WaitListSection
        {...modeProps}
        isMobile={isMobile}
        headerStyles={defaultHeaderStyles}
        // Add any additional props based on features
        {...(!showViewToggle && {
          viewMode: modeProps.viewMode,
          setViewMode: undefined
        })}
      />
    </div>
  );

  // Wrap with error boundary if requested
  if (useErrorBoundary) {
    return (
      <SectionErrorBoundary sectionName="Wait List">
        {content}
      </SectionErrorBoundary>
    );
  }

  return content;
};

/**
 * Pre-configured wait list components for common use cases
 */

export const WaitListWidget: React.FC<Omit<EmbeddableWaitListProps, 'displayMode'>> = (props) => (
  <EmbeddableWaitList {...props} displayMode="widget" />
);

export const CompactWaitList: React.FC<Omit<EmbeddableWaitListProps, 'displayMode'>> = (props) => (
  <EmbeddableWaitList {...props} displayMode="compact" />
);

export const MinimalWaitList: React.FC<Omit<EmbeddableWaitListProps, 'displayMode'>> = (props) => (
  <EmbeddableWaitList {...props} displayMode="minimal" />
);

/**
 * Example usage in different contexts:
 *
 * 1. In Book module to show waiting customers:
 * <WaitListWidget
 *   maxTickets={5}
 *   onTicketSelect={(id) => console.log('Selected:', id)}
 * />
 *
 * 2. In dashboard for quick overview:
 * <CompactWaitList
 *   showHeader={false}
 *   className="dashboard-waitlist"
 * />
 *
 * 3. In a modal or sidebar:
 * <MinimalWaitList
 *   isMobile={true}
 *   showActions={false}
 * />
 *
 * 4. Full featured in FrontDesk:
 * <EmbeddableWaitList
 *   displayMode="full"
 *   showViewToggle={true}
 * />
 */