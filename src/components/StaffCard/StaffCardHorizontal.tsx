/**
 * StaffCardHorizontal Component - Optimized Horizontal Layout
 * High-performance horizontal staff card with modular architecture
 * Layout: Avatar LEFT, Info RIGHT (flex-row)
 */

import React, { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import {
  SPECIALTY_COLORS,
  STATUS_COLORS,
  CARD_SHADOWS,
  BUSY_OVERLAY,
} from './constants/staffCardTokens';
import { formatStaffName } from './utils/formatters';
import { useStaffCardDisplay, type DisplayConfig } from './hooks/useStaffCardDisplay';
import { StaffCardNotch } from './components/StaffCardNotch';
import { StaffCardAvatar } from './components/StaffCardAvatar';
import { StaffCardTicket } from './components/StaffCardTicket';
import { StaffCardTimeline } from './components/StaffCardTimeline';
import { StaffCardMetrics } from './components/StaffCardMetrics';
import { TOUCH_TARGET_CLASSES } from './utils/touchTargets';
import './styles/containerQueries.css';

// ============================================================================
// TYPES
// ============================================================================

export type ViewMode = 'ultra-compact' | 'compact' | 'normal';
export type StaffStatus = 'ready' | 'busy' | 'off';
export type Specialty = 'neutral' | 'nails' | 'hair' | 'massage' | 'skincare' | 'waxing' | 'combo' | 'support';

interface ActiveTicket {
  id: number;
  ticketNumber?: string | number;
  clientName: string;
  serviceName: string;
  status: 'in-service' | 'pending';
}

interface CurrentTicketInfo {
  timeLeft: number;
  totalTime: number;
  progress: number;
  startTime: string;
  serviceName?: string;
  clientName?: string;
}

export interface StaffMember {
  id: number;
  name: string;
  time: string;
  image: string;
  status: StaffStatus;
  color: string;
  count: number;
  specialty?: Specialty;
  turnCount?: number;
  lastServiceTime?: string;
  nextAppointmentTime?: string;
  activeTickets?: ActiveTicket[];
  currentTicketInfo?: CurrentTicketInfo;
}

export interface StaffCardHorizontalProps {
  staff: StaffMember;
  viewMode?: ViewMode;
  isDraggable?: boolean;
  isSelected?: boolean;
  displayConfig?: DisplayConfig;
  onClick?: () => void;
  onTicketClick?: (ticketId: number) => void;
}

// ============================================================================
// HORIZONTAL LAYOUT DIMENSIONS
// ============================================================================

const HORIZONTAL_DIMENSIONS = {
  'ultra-compact': {
    height: '76px',
    avatarSize: '44px',
    borderRadius: '50%',
    cardRadius: '12px',
    avatarContainerWidth: '35%',
    infoContainerWidth: '65%',
  },
  compact: {
    height: '100px',
    avatarSize: '64px',
    borderRadius: '50%',
    cardRadius: '16px',
    avatarContainerWidth: '35%',
    infoContainerWidth: '65%',
  },
  normal: {
    height: '140px',
    avatarSize: '96px',
    borderRadius: '50%',
    cardRadius: '20px',
    avatarContainerWidth: '35%',
    infoContainerWidth: '65%',
  },
};

// ============================================================================
// RESPONSIVE SIZES FOR HORIZONTAL LAYOUT
// ============================================================================

const getHorizontalSizes = (viewMode: ViewMode, isBusy: boolean) => {
  const isUltra = viewMode === 'ultra-compact';
  const isCompact = viewMode === 'compact';

  return {
    badge: isUltra ? '20px' : isCompact ? '26px' : '32px',
    badgeFont: isUltra ? '10px' : isCompact ? '12px' : '14px',
    notchSize: isBusy ? (isUltra ? '32px' : '40px') : (isUltra ? '20px' : '28px'),
    nameSize: isUltra ? 'text-sm' : isCompact ? 'text-base' : 'text-lg',
    metaSize: isUltra ? 'text-xs' : 'text-xs',
    iconSize: isUltra ? 9 : 11,
    borderWidth: isUltra ? '2px' : '3px',
    timelineText: isUltra ? 'text-xs' : 'text-xs',
    spacing: isUltra ? 'gap-1' : isCompact ? 'gap-2' : 'gap-3',
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const StaffCardHorizontal = React.memo<StaffCardHorizontalProps>(
  ({
    staff,
    viewMode = 'normal',
    isDraggable = false,
    isSelected = false,
    displayConfig,
    onClick,
    onTicketClick,
  }) => {
    // ========================================
    // Hooks & Memoized Values
    // ========================================

    const status = STATUS_COLORS[staff.status] || STATUS_COLORS.ready;
    const isBusy = status.isBusy;
    const isUltra = viewMode === 'ultra-compact';
    const isCompact = viewMode === 'compact';

    const dimensions = HORIZONTAL_DIMENSIONS[viewMode];
    const sizes = getHorizontalSizes(viewMode, isBusy);
    const config = useStaffCardDisplay({ displayConfig });

    const specialty = useMemo(
      () => SPECIALTY_COLORS[staff.specialty || 'neutral'],
      [staff.specialty]
    );

    const displayName = useMemo(
      () => formatStaffName(staff.name),
      [staff.name]
    );

    const activeTicket = useMemo(
      () =>
        staff.activeTickets?.find((t) => t.status === 'in-service') ||
        staff.activeTickets?.[0],
      [staff.activeTickets]
    );

    // ========================================
    // Style Calculations
    // ========================================

    const cardStyle = useMemo(
      () => ({
        height: dimensions.height,
        borderRadius: dimensions.cardRadius,
        boxShadow: isBusy ? CARD_SHADOWS.busy : CARD_SHADOWS.default,
        border: isBusy
          ? `2px solid rgba(225, 29, 72, 0.3)`
          : `1px solid ${specialty.darkBorderColor}40`,
        background: `linear-gradient(to right, ${specialty.bgGradientFrom}, ${specialty.bgGradientTo})`,
        cursor: isDraggable ? 'grab' : 'pointer',
        overflow: 'hidden',
        // Performance optimizations
        willChange: 'transform, box-shadow',
        contain: 'layout style paint',
      }),
      [dimensions, isBusy, specialty, isDraggable]
    );

    // ========================================
    // Render
    // ========================================

    return (
      <div
        className={`staff-card-container group relative flex flex-row transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl ${
          isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''
        }`}
        style={cardStyle}
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label={`Staff card for ${staff.name}, status: ${status.label}`}
      >
        {/* Busy State Overlay */}
        {isBusy && (
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background: BUSY_OVERLAY.background,
              mixBlendMode: BUSY_OVERLAY.mixBlendMode,
              filter: BUSY_OVERLAY.filter,
            }}
          />
        )}

        {/* LEFT SECTION - Avatar Container (35%) */}
        <div
          className="relative flex flex-col items-center justify-center z-20"
          style={{
            width: dimensions.avatarContainerWidth,
            padding: isUltra ? '0.5rem' : '0.75rem',
          }}
        >
          {/* Notch - Positioned at top-center of avatar section */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-30">
            <StaffCardNotch
              status={staff.status}
              ticketInfo={staff.currentTicketInfo}
              notchWidth={sizes.notchSize}
              notchHeight={isBusy ? '24px' : '16px'}
              isUltra={isUltra}
            />
          </div>

          {/* Queue Number Badge - Top Left */}
          {config.showQueueNumber && (
            <div className="absolute top-2 left-2 z-30">
              <div
                className="flex items-center justify-center font-bold font-mono backdrop-blur-md border border-gray-300/30 transition-all duration-300"
                style={{
                  width: sizes.badge,
                  height: sizes.badge,
                  fontSize: sizes.badgeFont,
                  borderRadius: isUltra ? '8px' : '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  color: '#1f2937',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                {staff.count}
              </div>
            </div>
          )}

          {/* Avatar */}
          {config.showAvatar && (
            <StaffCardAvatar
              src={staff.image}
              alt={staff.name}
              size={dimensions.avatarSize}
              borderRadius={dimensions.borderRadius}
              borderWidth={sizes.borderWidth}
              isBusy={isBusy}
              isUltra={isUltra}
            />
          )}
        </div>

        {/* RIGHT SECTION - Info Container (65%) */}
        <div
          className={`relative flex flex-col justify-center z-20 ${sizes.spacing}`}
          style={{
            width: dimensions.infoContainerWidth,
            padding: isUltra ? '0.5rem 0.75rem 0.5rem 0.25rem' : '0.75rem 1rem 0.75rem 0.5rem',
          }}
        >
          {/* More Options Button */}
          {!isUltra && (
            <button
              className={`absolute top-2 right-2 text-gray-500 hover:text-gray-900 transition-colors z-30 bg-white/80 hover:bg-white rounded-full shadow-sm backdrop-blur-sm ${TOUCH_TARGET_CLASSES.flex}`}
              onClick={(e) => {
                e.stopPropagation();
                // Handle options menu
              }}
              aria-label="More options"
            >
              <MoreVertical size={14} />
            </button>
          )}

          {/* Staff Name */}
          {config.showName && (
            <div className="w-full mb-1">
              <h3
                className={`${sizes.nameSize} font-extrabold tracking-tight truncate drop-shadow-sm uppercase ${
                  isBusy ? 'text-white' : 'text-gray-900'
                }`}
              >
                {displayName}
              </h3>
            </div>
          )}

          {/* Metrics (Clock-in Time & Turns) */}
          <StaffCardMetrics
            time={staff.time}
            turnCount={staff.turnCount ?? 0}
            showClockedInTime={config.showClockedInTime}
            showTurnCount={config.showTurnCount}
            metaSize={sizes.metaSize}
            iconSize={sizes.iconSize}
          />

          {/* Divider */}
          {config.enhancedSeparator && !isUltra && (
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent my-1" />
          )}

          {/* Bottom Section - Tickets or Timeline */}
          {isBusy && activeTicket ? (
            <div className="w-full">
              <StaffCardTicket
                ticket={activeTicket}
                totalTickets={staff.activeTickets?.length || 0}
                isUltra={isUltra}
                onClick={() => onTicketClick?.(activeTicket.id)}
              />
            </div>
          ) : (
            <StaffCardTimeline
              lastServiceTime={staff.lastServiceTime}
              nextAppointmentTime={staff.nextAppointmentTime}
              timelineTextSize={sizes.timelineText}
              isUltra={isUltra}
            />
          )}
        </div>
      </div>
    );
  }
);

StaffCardHorizontal.displayName = 'StaffCardHorizontal';
