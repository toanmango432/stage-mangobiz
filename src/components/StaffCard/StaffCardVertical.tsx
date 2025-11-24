/**
 * StaffCardVertical Component - Optimized Version
 * High-performance vertical staff card with modular architecture
 */

import React, { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import {  SPECIALTY_COLORS,
  STATUS_COLORS,
  LAYOUT,
  CARD_SHADOWS,
  BUSY_OVERLAY,
} from './constants/staffCardTokens';
import { formatStaffName } from './utils/formatters';
import { useStaffCardLayout } from './hooks/useStaffCardLayout';
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

export interface StaffCardVerticalProps {
  staff: StaffMember;
  viewMode?: ViewMode;
  isDraggable?: boolean;
  isSelected?: boolean;
  displayConfig?: DisplayConfig;
  onClick?: () => void;
  onTicketClick?: (ticketId: number) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const StaffCardVertical = React.memo<StaffCardVerticalProps>(
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

    const layout = useStaffCardLayout({ viewMode, isBusy });
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
        width: layout.dimensions.width,
        height: layout.dimensions.height,
        borderRadius: layout.dimensions.cardRadius,
        boxShadow: isBusy ? CARD_SHADOWS.busy : CARD_SHADOWS.default,
        border: isBusy
          ? `2px solid rgba(225, 29, 72, 0.3)`
          : `1px solid ${specialty.darkBorderColor}40`,
        background: `linear-gradient(to bottom, ${specialty.bgGradientFrom}, ${specialty.bgGradientTo})`,
        cursor: isDraggable ? 'grab' : 'pointer',
        overflow: 'hidden',
        // Performance optimizations
        willChange: 'transform, box-shadow',
        contain: 'layout style paint',
      }),
      [
        layout.dimensions,
        isBusy,
        specialty,
        isDraggable,
      ]
    );

    const notchWidth = useMemo(() => {
      if (isBusy) {
        return layout.isUltra
          ? LAYOUT.notchWidthBusy.ultra
          : LAYOUT.notchWidthBusy.normal;
      }
      return layout.isUltra
        ? LAYOUT.notchWidthReady.ultra
        : LAYOUT.notchWidthReady.normal;
    }, [isBusy, layout.isUltra]);

    // ========================================
    // Render
    // ========================================

    return (
      <div
        className={`staff-card-container group relative flex flex-col transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl ${
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

        {/* Notch - Status/Progress Indicator */}
        <StaffCardNotch
          status={staff.status}
          ticketInfo={staff.currentTicketInfo}
          notchWidth={notchWidth}
          notchHeight={layout.sizes.notchHeight}
          isUltra={layout.isUltra}
        />

        {/* TOP SECTION (70%) - Avatar & Info */}
        <div
          className={`relative flex flex-col items-center z-20`}
          style={{ height: LAYOUT.topSectionHeight }}
        >
          <div className={`${layout.dimensions.containerPadding} pt-8 w-full flex flex-col items-center`}>
            {/* Queue Number Badge */}
            {config.showQueueNumber && (
              <div className="absolute top-3 left-3 z-30">
                <div
                  className="flex items-center justify-center font-bold font-mono backdrop-blur-md border border-gray-300/30 transition-all duration-300"
                  style={{
                    width: layout.sizes.badge,
                    height: layout.sizes.badge,
                    fontSize: layout.sizes.badgeFont,
                    borderRadius: layout.isUltra ? '10px' : layout.isCompact ? '12px' : '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    color: '#1f2937',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  }}
                >
                  {staff.count}
                </div>
              </div>
            )}

            {/* More Options Button - Enhanced Touch Target */}
            {!layout.isUltra && (
              <button
                className={`absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition-colors z-30 bg-white/80 hover:bg-white rounded-full shadow-sm backdrop-blur-sm ${TOUCH_TARGET_CLASSES.flex}`}
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle options menu
                }}
                aria-label="More options"
              >
                <MoreVertical size={16} />
              </button>
            )}

            {/* Avatar */}
            {config.showAvatar && (
              <StaffCardAvatar
                src={staff.image}
                alt={staff.name}
                size={layout.dimensions.avatarSize}
                borderRadius={layout.dimensions.borderRadius}
                borderWidth={layout.sizes.borderWidth}
                isBusy={isBusy}
                isUltra={layout.isUltra}
              />
            )}

            {/* Staff Name */}
            {config.showName && (
              <div className="text-center w-full mb-1">
                <h3
                  className={`${layout.sizes.nameSize} font-extrabold tracking-tight truncate px-1 drop-shadow-sm uppercase ${
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
              metaSize={layout.sizes.metaSize}
              iconSize={layout.sizes.iconSize}
            />
          </div>
        </div>

        {/* Elegant Divider */}
        {config.enhancedSeparator && (
          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent z-20" />
        )}

        {/* BOTTOM SECTION (30%) - Tickets or Timeline */}
        <div
          className={`relative flex flex-col justify-center z-20`}
          style={{
            height: LAYOUT.bottomSectionHeight,
            background: isBusy
              ? 'transparent'
              : 'linear-gradient(to top, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%)',
            backdropFilter: isBusy ? 'none' : 'blur(4px)',
            padding: layout.isUltra ? '0.375rem' : '0.75rem',
          }}
        >
          {/* Busy State: Show Active Ticket */}
          {isBusy && activeTicket ? (
            <div className="w-full">
              <StaffCardTicket
                ticket={activeTicket}
                totalTickets={staff.activeTickets?.length || 0}
                isUltra={layout.isUltra}
                onClick={() => onTicketClick?.(activeTicket.id)}
              />

              {/* Last & Next Timeline (Compact for Busy) */}
              {!layout.isUltra &&
                (staff.lastServiceTime || staff.nextAppointmentTime) && (
                  <div className="flex items-center justify-between w-full px-2 gap-2 mt-2.5">
                    {staff.lastServiceTime && (
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                        <span className="text-[9px] font-mono font-medium text-gray-500">
                          {staff.lastServiceTime}
                        </span>
                      </div>
                    )}

                    {staff.lastServiceTime && staff.nextAppointmentTime && (
                      <div className="flex-1 h-px bg-gray-200" />
                    )}

                    {staff.nextAppointmentTime && (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono font-bold text-blue-600">
                          {staff.nextAppointmentTime}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                      </div>
                    )}
                  </div>
                )}
            </div>
          ) : (
            /* Ready State: Show Timeline */
            <StaffCardTimeline
              lastServiceTime={staff.lastServiceTime}
              nextAppointmentTime={staff.nextAppointmentTime}
              timelineTextSize={layout.sizes.timelineText}
              isUltra={layout.isUltra}
            />
          )}
        </div>
      </div>
    );
  }
);

StaffCardVertical.displayName = 'StaffCardVertical';
