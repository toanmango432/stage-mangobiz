/**
 * StaffCardVertical Component - Optimized Version
 * High-performance vertical staff card with modular architecture
 */

import React, { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import {
  SPECIALTY_COLORS,
  STATUS_COLORS,
  LAYOUT,
  CARD_SHADOWS,
  BUSY_OVERLAY,
  ANIMATIONS,
  GLASS_EFFECTS,
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
          ? `1px solid rgba(225, 29, 72, 0.3)`
          : GLASS_EFFECTS.card.border,
        background: isBusy
          ? '#FFF'
          : `linear-gradient(to bottom right, ${specialty.bgGradientFrom}, ${specialty.bgGradientTo})`,
        cursor: isDraggable ? 'grab' : 'pointer',
        overflow: 'hidden',
        // Performance optimizations
        willChange: 'transform, box-shadow',
        contain: 'layout style paint',
        transition: ANIMATIONS.cardHover.transition,
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
        className={`staff-card-container group relative flex flex-col ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''
          } ${ANIMATIONS.cardHover.transform} ${ANIMATIONS.cardHover.shadow}`}
        style={cardStyle}
        onClick={onClick}
        tabIndex={0}
        role="button"
        aria-label={`Staff card for ${staff.name}, status: ${status.label}`}
      >
        {/* Busy State Overlay - Premium Gradient */}
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
          isUltra={layout.isUltra || layout.isCompact}
        />

        {/* TOP SECTION (80%) - Avatar & Info */}
        <div
          className={`relative flex flex-col items-center z-20`}
          style={{ height: LAYOUT.topSectionHeight }}
        >
          <div className={`${layout.dimensions.containerPadding} ${layout.isUltra ? 'pt-9' : layout.isCompact ? 'pt-7' : 'pt-5'} w-full flex flex-col items-center h-full justify-center ${layout.isUltra ? 'gap-0.5' : layout.isCompact ? 'gap-0.5' : 'gap-0.5'}`}>
            {/* Queue Number Badge */}
            {config.showQueueNumber && (
              <div className={`absolute ${layout.isUltra ? 'top-3 left-3' : 'top-5 left-3'} z-30`}>
                <div
                  className="flex items-center justify-center font-bold font-mono backdrop-blur-md transition-all duration-300"
                  style={{
                    width: layout.sizes.badge,
                    height: layout.sizes.badge,
                    fontSize: layout.sizes.badgeFont,
                    borderRadius: '50%', // Circular badge
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: '#1f2937',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {staff.count}
                </div>
              </div>
            )}

            {/* More Options Button - Relocated to Top Right */}
            {!layout.isUltra && (
              <div className="absolute top-2 right-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  className="p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle menu click
                  }}
                >
                  <MoreVertical size={16} />
                </button>
              </div>)}

            {/* Avatar */}
            {config.showAvatar && (
              <div className={layout.isUltra ? 'mb-0' : 'mb-1'}>
                <StaffCardAvatar
                  src={staff.image}
                  alt={staff.name}
                  size={layout.dimensions.avatarSize}
                  borderRadius={layout.dimensions.borderRadius}
                  borderWidth={layout.sizes.borderWidth}
                  isBusy={isBusy}
                  isUltra={layout.isUltra}
                />
              </div>
            )}

            {/* Staff Name - Premium Typography */}
            {config.showName && (
              <div className={`text-center w-full px-2 ${layout.isUltra ? '-mt-1' : ''}`}>
                <h3
                  className={`${layout.sizes.nameSize} font-black tracking-widest truncate uppercase ${isBusy ? 'text-rose-900' : specialty.textColor
                    }`}
                  style={{
                    textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                    fontFamily: '"Inter", sans-serif',
                    letterSpacing: '0.05em',
                  }}
                >
                  {displayName}
                </h3>
              </div>
            )}

            {/* Metrics (Clock-in Time & Turns) - Minimalist Pills */}
            {/* Normal & Compact: Show full metrics */}
            {!layout.isUltra && (
              <div className="w-full">
                <StaffCardMetrics
                  time={staff.time}
                  turnCount={staff.turnCount ?? 0}
                  showClockedInTime={config.showClockedInTime}
                  showTurnCount={config.showTurnCount}
                  metaSize={layout.sizes.metaSize}
                  iconSize={layout.sizes.iconSize}
                />
              </div>
            )}
          </div>
        </div>


        {/* BOTTOM SECTION (20%) - Timeline & Status */}
        {!layout.isUltra && (
          <div
            className={`relative z-20 flex flex-col justify-center px-3`}
            style={{
              height: LAYOUT.bottomSectionHeight,
              background: GLASS_EFFECTS.card.background,
              backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            {isBusy && activeTicket ? (
              <div className="w-full flex flex-col h-full justify-between">
                <StaffCardTicket
                  ticket={activeTicket}
                  totalTickets={staff.activeTickets?.length || 0}
                  isUltra={layout.isUltra || layout.isCompact}
                  onClick={() => onTicketClick?.(activeTicket.id)}
                />

                {/* Last & Next Timeline (Compact for Busy) */}
                {!layout.isCompact &&
                  (staff.lastServiceTime || staff.nextAppointmentTime) && (
                    <div className="flex items-center justify-center w-full gap-2 pb-1">
                      {staff.lastServiceTime && (
                        <span className="text-[10px] font-mono font-medium text-gray-500">
                          L: {staff.lastServiceTime.replace(' AM', 'a').replace(' PM', 'p')}
                        </span>
                      )}
                      {staff.lastServiceTime && staff.nextAppointmentTime && (
                        <span className="text-[10px] text-gray-300">•</span>
                      )}
                      {staff.nextAppointmentTime && (
                        <span className="text-[10px] font-mono font-bold text-blue-600">
                          N: {staff.nextAppointmentTime.replace(' AM', 'a').replace(' PM', 'p')}
                        </span>
                      )}
                    </div>
                  )}
              </div>
            ) : layout.isCompact ? (
              // Compact Mode: Single Row "Next"
              <div className="flex items-center justify-center gap-2 w-full">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                  Next
                </span>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  {staff.nextAppointmentTime || '2:00p'}
                </span>
              </div>
            ) : (
              // Normal Mode: Full Timeline
              <StaffCardTimeline
                lastServiceTime={staff.lastServiceTime}
                nextAppointmentTime={staff.nextAppointmentTime}
                timelineTextSize={layout.sizes.timelineText}
                isUltra={layout.isUltra}
              />
            )}
          </div>
        )}
      </div>
    );
  }
);

StaffCardVertical.displayName = 'StaffCardVertical';
