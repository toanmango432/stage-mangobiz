import React from 'react';
import { MoreVertical, CheckCircle } from 'lucide-react';

interface StaffMember {
  name: string;
  color: string;
}

interface InServiceCardProps {
  card: {
    id: number;
    ticketNumber: number;
    customerName: string;
    isFirstVisit: boolean;
    hasStar?: boolean;
    hasNote?: boolean;
    serviceName: string;
    timeLeft: string;
    percentage: number;
    staff: StaffMember[];
    statusColor: 'green' | 'cyan' | 'purple';
  };
  layout?: 'grid' | 'list';
  size?: 'normal' | 'compact';
}

export function InServiceCard({ card, layout = 'grid', size = 'normal' }: InServiceCardProps) {
  // Determine color based on percentage
  const getStatusColor = (percentage: number) => {
    if (percentage > 100) {
      return {
        progress: 'linear-gradient(to right, #D9534F, #C9302C)',
        text: '#C9302C'
      };
    } else if (percentage >= 80) {
      return {
        progress: 'linear-gradient(to right, #5CB85C, #449D44)',
        text: '#449D44'
      };
    } else {
      return {
        progress: 'linear-gradient(to right, #9B7EAE, #7E5F93)',
        text: '#7E5F93'
      };
    }
  };

  const currentStatus = getStatusColor(card.percentage);

  const statusColors = {
    green: {
      stripe: 'linear-gradient(to bottom, #10b981, #059669)',
      progress: 'linear-gradient(to bottom, #34d399, #10b981)',
      text: '#0d9f6e'
    },
    cyan: {
      stripe: 'linear-gradient(to bottom, #06b6d4, #0891b2)',
      progress: 'linear-gradient(to bottom, #22d3ee, #06b6d4)',
      text: '#0891b2'
    },
    purple: {
      stripe: 'linear-gradient(to bottom, #8b5cf6, #7c3aed)',
      progress: 'linear-gradient(to bottom, #a78bfa, #8b5cf6)',
      text: '#7c3aed'
    }
  };

  const staffColors: Record<string, string> = {
    'SOPHIA': 'linear-gradient(to right, #FF6B70, #E04146)',
    'MADISON': 'linear-gradient(to right, #AF6FFF, #8A4AD0)',
    'EMMA': 'linear-gradient(to right, #AF6FFF, #8A4AD0)',
    'CHARLOTTE': 'linear-gradient(to right, #5A9FFF, #3373E8)',
    'EVELYN': 'linear-gradient(to right, #5EEAD4, #3BB09A)',
    'MIA': 'linear-gradient(to right, #FB923C, #F97316)',
    'GRACE': 'linear-gradient(to right, #FBBF24, #F59E0B)',
    'LILY': 'linear-gradient(to right, #5EEAD4, #14b8a6)',
    'OLIVIA': 'linear-gradient(to right, #EC4899, #DB2777)'
  };

  // List View Layout - Complete with All Grid Elements
  if (layout === 'list') {
    // Determine sizing classes based on size prop
    const isCompact = size === 'compact';
    return (
      <div
        className={`relative rounded-md sm:rounded-lg border border-[#d4b896]/40 overflow-visible transition-all duration-300 ease-out hover:-translate-y-0.5 ${
          isCompact ? 'min-w-[260px]' : 'min-w-[280px]'
        } max-w-full`}
        style={{
          background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',
          boxShadow: `
            0 1px 3px rgba(139, 92, 46, 0.12),
            0 2px 6px rgba(139, 92, 46, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 -1px 0 rgba(139, 92, 46, 0.06),
            inset 2px 0 1px rgba(255, 255, 255, 0.4),
            -2px 0 4px rgba(139, 92, 46, 0.12)
          `
        }}
      >
        {/* Perforation Dots */}
        <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-2 sm:px-3 z-10 opacity-20">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="w-[1.5px] h-[1.5px] sm:w-[2px] sm:h-[2px] rounded-full bg-[#c4b5a0]" />
          ))}
        </div>

        {/* Left Notch */}
        <div
          className="absolute left-[-4px] sm:left-[-5px] top-[50%] w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-r border-[#d4b896]/50"
          style={{
            background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)',
            boxShadow: 'inset -1px 0 2px rgba(139, 92, 46, 0.10)'
          }}
        />

        {/* Right Notch */}
        <div
          className="absolute right-[-4px] sm:right-[-5px] top-[50%] w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-l border-[#d4b896]/50"
          style={{
            background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)',
            boxShadow: 'inset 1px 0 2px rgba(139, 92, 46, 0.10)'
          }}
        />

        {/* Paper Thickness Edge */}
        <div
          className="absolute top-0 left-0 w-0.5 h-full rounded-l-lg"
          style={{
            background: `linear-gradient(to right, rgba(139, 92, 46, 0.20) 0%, rgba(139, 92, 46, 0.12) 30%, transparent 100%)`,
            boxShadow: `inset 1px 0 2px rgba(139, 92, 46, 0.25), -1px 0 2px rgba(139, 92, 46, 0.12)`
          }}
        />

        {/* Ticket Number - Wrap Around Badge */}
        <div
          className={`absolute left-0 ${
            isCompact ? 'top-1.5 sm:top-2 w-7 sm:w-8 text-xs sm:text-sm' : 'top-2 sm:top-3 w-9 sm:w-10 text-base sm:text-lg'
          } text-[#1a1614] flex items-center justify-center font-black z-20`}
          style={{
            height: isCompact
              ? card.isFirstVisit ? 'clamp(1.5rem, 3.5vw, 2rem)' : 'clamp(1.35rem, 3vw, 1.85rem)'
              : card.isFirstVisit ? 'clamp(2rem, 4vw, 2.5rem)' : 'clamp(1.75rem, 3.5vw, 2.25rem)',
            background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)',
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
            borderTop: '1px solid rgba(212, 184, 150, 0.5)',
            borderRight: '1px solid rgba(212, 184, 150, 0.5)',
            borderBottom: '1px solid rgba(212, 184, 150, 0.5)',
            boxShadow: `
              2px 0 4px rgba(139, 92, 46, 0.12),
              1px 0 2px rgba(139, 92, 46, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 1),
              inset 0 -1px 2px rgba(139, 92, 46, 0.08)
            `,
            letterSpacing: '-0.02em',
            transform: 'translateX(-3px)'
          }}
        >
          {card.ticketNumber}
        </div>

        {/* Content Container */}
        <div className={isCompact ? 'pl-6 sm:pl-7' : 'pl-8 sm:pl-9'}>
          {/* Row 1: Customer Info (left) + Time/Progress/Percentage (right) */}
          <div className={`flex items-center justify-between gap-2 sm:gap-3 ${
            isCompact ? 'px-1.5 sm:px-2 pt-1.5 sm:pt-2 pb-1' : 'px-2 sm:px-3 pt-2 sm:pt-2.5 pb-1.5'
          }`}>
            {/* Left: Customer Info */}
            <div className="flex-shrink min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`${
                  isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                } font-bold text-[#1a1614] truncate tracking-tight`}>
                  {card.customerName}
                </span>
                {card.hasStar && <span className={isCompact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}>⭐</span>}
                {card.hasNote && <span className={isCompact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'}>📋</span>}
              </div>
              {card.isFirstVisit && (
                <div className={`${
                  isCompact ? 'text-[8px] sm:text-[9px]' : 'text-[9px] sm:text-[10px]'
                } text-[#8b7968] font-medium tracking-wide mt-0.5`}>
                  FIRST VISIT
                </div>
              )}
            </div>

            {/* Right: Time, Progress Bar, Percentage */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
              <div className={`${
                isCompact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'
              } text-[#6b5d52] font-medium whitespace-nowrap`}>
                {card.timeLeft}
              </div>
              <div className={isCompact ? 'w-14 sm:w-16 md:w-20 flex-shrink-0' : 'w-16 sm:w-20 md:w-24 flex-shrink-0'}>
                <div
                  className={`${
                    isCompact ? 'h-1 sm:h-1.5' : 'h-1.5 sm:h-2'
                  } bg-[#f5f0e8] rounded-full border border-[#e8dcc8]/40 overflow-hidden`}
                  style={{ boxShadow: 'inset 0 0.5px 1px rgba(139, 92, 46, 0.08)' }}
                >
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${card.percentage}%`,
                      background: currentStatus.progress,
                      boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.5)'
                    }}
                  />
                </div>
              </div>
              <div className={`${
                isCompact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'
              } font-bold tracking-tight whitespace-nowrap`} style={{ color: currentStatus.text }}>
                {card.percentage}%
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className={isCompact ? 'mx-1.5 sm:mx-2 border-t border-[#e8dcc8]/40' : 'mx-2 sm:mx-3 border-t border-[#e8dcc8]/40'} />

          {/* Row 2: Service Name (left) + Staff/Done (right) */}
          <div className={`flex items-center justify-between gap-2 sm:gap-3 ${
            isCompact ? 'px-1.5 sm:px-2 py-1 sm:py-1.5' : 'px-2 sm:px-3 py-1.5 sm:py-2'
          }`}>
            {/* Left: Service Name */}
            <div className={`flex-1 min-w-0 ${
              isCompact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'
            } text-[#1a1614] font-semibold leading-tight line-clamp-2`}>
              {card.serviceName}
            </div>

            {/* Right: Staff Section with Background Container + Done Button */}
            <div
              className={`${
                isCompact ? 'px-1.5 py-1 sm:px-2 sm:py-1.5' : 'px-2 py-1.5 sm:px-2.5 sm:py-2'
              } rounded-md relative flex-shrink-0`}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.5) 0%, rgba(245, 240, 232, 0.4) 100%)',
                boxShadow: `
                  inset 0 1px 2px rgba(139, 92, 46, 0.08),
                  inset 0 -0.5px 0 rgba(255, 255, 255, 0.6),
                  0 0.5px 1px rgba(255, 255, 255, 0.8)
                `,
                border: '1px solid rgba(212, 184, 150, 0.12)'
              }}
            >
              <div className={isCompact ? 'flex items-center gap-1 pr-7' : 'flex items-center gap-1.5 pr-9'}>
                {card.staff.map((staff, index) => (
                  <div
                    key={index}
                    className={`text-white ${
                      isCompact ? 'text-[7px] sm:text-[8px] px-1 py-0.5 sm:px-1.5 sm:py-0.5' : 'text-[8px] sm:text-[9px] px-1.5 py-0.5 sm:px-2 sm:py-1'
                    } font-semibold rounded border border-white/30 cursor-pointer hover:scale-105 transition-transform whitespace-nowrap`}
                    style={{
                      background: staffColors[staff.name] || staffColors['SOPHIA'],
                      boxShadow: `0 1px 3px rgba(0, 0, 0, 0.15), inset 0 0.5px 0 rgba(255, 255, 255, 0.5)`,
                      textShadow: '0 0.5px 1px rgba(0, 0, 0, 0.25)'
                    }}
                  >
                    {staff.name}
                  </div>
                ))}
              </div>

              {/* Done Button */}
              <button
                className={`absolute top-1/2 ${
                  isCompact ? 'right-1.5 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7' : 'right-2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8'
                } rounded-full flex items-center justify-center bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all`}
                title="Mark as Done"
              >
                <CheckCircle size={isCompact ? 14 : 16} className={isCompact ? 'sm:w-4 sm:h-4' : 'sm:w-[18px] sm:h-[18px]'} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Paper Texture Layers */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay rounded-lg"
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
            backgroundSize: '200px 200px'
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none opacity-10 rounded-lg"
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px),
              repeating-linear-gradient(0deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px)
            `,
            backgroundSize: '3px 3px'
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.3)'
          }}
        />
      </div>
    );
  }

  // Compact Grid View Layout - Mini card with all elements
  if (layout === 'grid' && size === 'compact') {
    return (
      <div
        className="relative rounded-md sm:rounded-lg border border-[#d4b896]/40 overflow-visible transition-all duration-300 ease-out hover:-translate-y-1 hover:rotate-[0.3deg] min-w-[240px] max-w-full"
        style={{
          background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',
          boxShadow: `
            0 1px 3px rgba(139, 92, 46, 0.12),
            0 2px 6px rgba(139, 92, 46, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 -1px 0 rgba(139, 92, 46, 0.06),
            inset 2px 0 1px rgba(255, 255, 255, 0.4),
            -2px 0 4px rgba(139, 92, 46, 0.12)
          `
        }}
      >
        {/* Perforation Dots */}
        <div className="absolute top-0 left-0 w-full h-[3px] flex justify-between items-center px-2 z-10 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-[1.5px] h-[1.5px] rounded-full bg-[#c4b5a0]" />
          ))}
        </div>

        {/* Left Notch */}
        <div
          className="absolute left-[-3px] top-[50%] w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border-r border-[#d4b896]/50"
          style={{
            background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)',
            boxShadow: 'inset -1px 0 2px rgba(139, 92, 46, 0.10)'
          }}
        />

        {/* Right Notch */}
        <div
          className="absolute right-[-3px] top-[50%] w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border-l border-[#d4b896]/50"
          style={{
            background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)',
            boxShadow: 'inset 1px 0 2px rgba(139, 92, 46, 0.10)'
          }}
        />

        {/* Paper Thickness Edge */}
        <div
          className="absolute top-0 left-0 w-0.5 h-full rounded-l-md"
          style={{
            background: `linear-gradient(to right, rgba(139, 92, 46, 0.20) 0%, rgba(139, 92, 46, 0.12) 30%, transparent 100%)`,
            boxShadow: `inset 1px 0 2px rgba(139, 92, 46, 0.25), -1px 0 2px rgba(139, 92, 46, 0.12)`
          }}
        />

        {/* Ticket Number - Wrap Around Badge (Compact) */}
        <div
          className="absolute left-0 top-1.5 sm:top-2 w-7 sm:w-8 text-[#1a1614] flex items-center justify-center font-black text-xs sm:text-sm z-20"
          style={{
            height: 'clamp(1.25rem, 2.5vw, 1.5rem)',
            background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)',
            borderTopRightRadius: '6px',
            borderBottomRightRadius: '6px',
            borderTop: '1px solid rgba(212, 184, 150, 0.5)',
            borderRight: '1px solid rgba(212, 184, 150, 0.5)',
            borderBottom: '1px solid rgba(212, 184, 150, 0.5)',
            boxShadow: `
              2px 0 4px rgba(139, 92, 46, 0.12),
              1px 0 2px rgba(139, 92, 46, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 1),
              inset 0 -1px 2px rgba(139, 92, 46, 0.08)
            `,
            letterSpacing: '-0.02em',
            transform: 'translateX(-2px)'
          }}
        >
          {card.ticketNumber}
        </div>

        {/* Content Container */}
        <div>
          {/* Row 1: Customer Info + Icons */}
          <div className="flex items-start justify-between pl-9 sm:pl-10 pr-2 pt-1.5 sm:pt-2 pb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-[#1a1614] truncate tracking-tight">
                  {card.customerName}
                </span>
                {card.hasStar && <span className="text-[10px] sm:text-xs flex-shrink-0">⭐</span>}
                {card.hasNote && <span className="text-[10px] sm:text-xs flex-shrink-0">📋</span>}
              </div>
            </div>
            <button className="text-[#8b7968] hover:text-[#2d2520] p-0.5 rounded hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0">
              <MoreVertical size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Row 2: Service Name */}
          <div className="px-2 pb-1.5 text-[10px] sm:text-xs text-[#1a1614] font-semibold leading-tight line-clamp-1">
            {card.serviceName}
          </div>

          {/* Divider */}
          <div className="mx-2 border-t border-[#e8dcc8]/40" />

          {/* Row 3: Time, Progress Bar, Percentage */}
          <div className="px-2 py-1.5 flex items-center gap-1.5">
            <div className="text-[9px] sm:text-[10px] text-[#6b5d52] font-medium whitespace-nowrap flex-shrink-0">
              {card.timeLeft}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="h-1 sm:h-1.5 bg-[#f5f0e8] rounded-full border border-[#e8dcc8]/40 overflow-hidden"
                style={{ boxShadow: 'inset 0 0.5px 1px rgba(139, 92, 46, 0.08)' }}
              >
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${card.percentage}%`,
                    background: currentStatus.progress,
                    boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.5)'
                  }}
                />
              </div>
            </div>
            <div className="text-[10px] sm:text-xs font-bold tracking-tight whitespace-nowrap flex-shrink-0" style={{ color: currentStatus.text }}>
              {card.percentage}%
            </div>
          </div>

          {/* Row 4: Staff Section with Background Container */}
          <div
            className="mx-2 mb-1.5 sm:mb-2 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded relative"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.5) 0%, rgba(245, 240, 232, 0.4) 100%)',
              boxShadow: `
                inset 0 1px 2px rgba(139, 92, 46, 0.08),
                inset 0 -0.5px 0 rgba(255, 255, 255, 0.6),
                0 0.5px 1px rgba(255, 255, 255, 0.8)
              `,
              border: '1px solid rgba(212, 184, 150, 0.12)'
            }}
          >
            <div className="flex items-center gap-1 flex-wrap pr-7">
              {card.staff.map((staff, index) => (
                <div
                  key={index}
                  className="text-white text-[7px] sm:text-[8px] font-semibold px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded border border-white/30 cursor-pointer hover:scale-105 transition-transform whitespace-nowrap"
                  style={{
                    background: staffColors[staff.name] || staffColors['SOPHIA'],
                    boxShadow: `0 1px 2px rgba(0, 0, 0, 0.15), inset 0 0.5px 0 rgba(255, 255, 255, 0.5)`,
                    textShadow: '0 0.5px 1px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  {staff.name}
                </div>
              ))}
            </div>

            {/* Done Button (Compact) */}
            <button
              className="absolute top-1/2 right-1.5 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all"
              title="Mark as Done"
            >
              <CheckCircle size={14} className="sm:w-4 sm:h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Paper Texture Layers */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay rounded-md"
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
            backgroundSize: '200px 200px'
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none opacity-10 rounded-md"
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px),
              repeating-linear-gradient(0deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px)
            `,
            backgroundSize: '3px 3px'
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none rounded-md"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.3)'
          }}
        />
      </div>
    );
  }

  // Grid View Layout (Original)
  return (
    <div
      className="relative rounded-lg sm:rounded-xl border border-[#d4b896]/40 overflow-visible transition-all duration-500 ease-out hover:-translate-y-2 hover:rotate-[0.5deg] flex flex-col min-w-[280px] max-w-full"
      style={{
        background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',
        boxShadow: `
          0 2px 4px rgba(139, 92, 46, 0.12),
          0 4px 8px rgba(139, 92, 46, 0.10),
          0 8px 16px rgba(139, 92, 46, 0.08),
          0 12px 24px rgba(139, 92, 46, 0.05),
          inset 0 1px 0 rgba(255, 255, 255, 0.8),
          inset 0 -1px 0 rgba(139, 92, 46, 0.06),
          inset 3px 0 1px rgba(255, 255, 255, 0.6),
          -4px 0 8px rgba(139, 92, 46, 0.18),
          -2px 0 4px rgba(139, 92, 46, 0.15),
          -1px 0 2px rgba(139, 92, 46, 0.12)
        `
      }}
    >
      {/* Perforation Dots - Responsive */}
      <div className="absolute top-0 left-0 w-full h-[6px] flex justify-between items-center px-3 sm:px-4 z-10 opacity-25">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full bg-[#c4b5a0]"
          />
        ))}
      </div>

      {/* Left Notch - Responsive */}
      <div
        className="absolute left-[-6px] sm:left-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-r border-[#d4b896]/50"
        style={{
          background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)',
          boxShadow: 'inset -2px 0 3px rgba(139, 92, 46, 0.10), 1px 0 3px rgba(0,0,0,0.08)'
        }}
      />

      {/* Right Notch - Responsive */}
      <div
        className="absolute right-[-6px] sm:right-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-l border-[#d4b896]/50"
        style={{
          background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)',
          boxShadow: 'inset 2px 0 3px rgba(139, 92, 46, 0.10), -1px 0 3px rgba(0,0,0,0.08)'
        }}
      />

      {/* Paper Thickness Edge - Enhanced */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
        style={{
          background: `
            linear-gradient(to right,
              rgba(139, 92, 46, 0.20) 0%,
              rgba(139, 92, 46, 0.12) 30%,
              rgba(180, 150, 110, 0.08) 60%,
              transparent 100%
            )
          `,
          boxShadow: `
            inset 2px 0 3px rgba(139, 92, 46, 0.25),
            inset 1px 0 2px rgba(0, 0, 0, 0.15),
            -2px 0 4px rgba(139, 92, 46, 0.12),
            -1px 0 2px rgba(139, 92, 46, 0.10)
          `
        }}
      />

      {/* Paper Layered Depth */}
      <div
        className="absolute top-0 left-1 w-1 h-full"
        style={{
          background: 'linear-gradient(to right, rgba(139, 92, 46, 0.08) 0%, transparent 100%)',
          boxShadow: 'inset 1px 0 1px rgba(139, 92, 46, 0.10)'
        }}
      />

      {/* Ticket Number - Wrapping Around Left Edge - Responsive */}
      <div
        className="absolute left-0 top-4 sm:top-5 w-11 sm:w-14 text-[#1a1614] flex items-center justify-center font-black text-lg sm:text-2xl z-20"
        style={{
          height: card.isFirstVisit ? 'clamp(2.25rem, 5vw, 2.75rem)' : 'clamp(2rem, 4.5vw, 2.5rem)',
          background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)',
          borderTopRightRadius: '10px',
          borderBottomRightRadius: '10px',
          borderTop: '1.5px solid rgba(212, 184, 150, 0.5)',
          borderRight: '1.5px solid rgba(212, 184, 150, 0.5)',
          borderBottom: '1.5px solid rgba(212, 184, 150, 0.5)',
          boxShadow: `
            3px 0 8px rgba(139, 92, 46, 0.15),
            2px 0 4px rgba(139, 92, 46, 0.12),
            1px 0 2px rgba(139, 92, 46, 0.10),
            inset 0 2px 0 rgba(255, 255, 255, 1),
            inset 0 -2px 3px rgba(139, 92, 46, 0.08),
            inset -2px 0 2px rgba(255, 255, 255, 0.6)
          `,
          letterSpacing: '-0.02em',
          transform: 'translateX(-4px)'
        }}
      >
        {card.ticketNumber}
        {/* Right edge accent line */}
        <div
          className="absolute top-0 right-0 w-[1.5px] h-full"
          style={{
            background: 'linear-gradient(to bottom, rgba(180, 150, 110, 0.3) 0%, rgba(139, 92, 46, 0.2) 50%, rgba(180, 150, 110, 0.3) 100%)'
          }}
        />
      </div>

      {/* Card Header - Responsive */}
      <div className="flex items-start justify-between px-3 sm:px-4 pt-4 sm:pt-5 pb-1 pl-12 sm:pl-14">
        <div className="flex-1 min-w-0">
          {/* Customer Info */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <span className="text-base sm:text-lg md:text-xl font-bold text-[#1a1614] truncate tracking-tight">
              {card.customerName}
            </span>
            {card.hasStar && <span className="text-sm sm:text-base md:text-lg flex-shrink-0">⭐</span>}
            {card.hasNote && <span className="text-sm sm:text-base md:text-lg flex-shrink-0">📋</span>}
          </div>
          {card.isFirstVisit && (
            <div className="text-[10px] sm:text-xs text-[#8b7968] font-medium tracking-wide">
              FIRST VISIT
            </div>
          )}
        </div>

        {/* More Button */}
        <button className="text-[#8b7968] hover:text-[#2d2520] p-1 sm:p-1.5 rounded-lg hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0 -mr-0.5 sm:-mr-1">
          <MoreVertical size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>

      {/* Service Name - Responsive with line clamp */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-sm sm:text-base text-[#1a1614] font-semibold leading-snug tracking-tight line-clamp-2">
        {card.serviceName}
      </div>

      {/* Divider */}
      <div className="mx-3 sm:mx-4 mb-3 sm:mb-4 border-t border-[#e8dcc8]/50" />

      {/* Time & Percentage - Responsive */}
      <div className="px-3 sm:px-4 pb-1.5 sm:pb-2 flex items-center justify-between">
        <div className="text-xs sm:text-sm text-[#6b5d52] font-medium">{card.timeLeft} left</div>
        <div
          className="text-xl sm:text-2xl font-bold tracking-tight"
          style={{ color: currentStatus.text }}
        >
          {card.percentage}%
        </div>
      </div>

      {/* Progress Bar - Responsive */}
      <div className="px-3 sm:px-4 pb-4 sm:pb-5">
        <div
          className="h-2 sm:h-2.5 bg-[#f5f0e8] rounded-full border border-[#e8dcc8]/40 overflow-hidden"
          style={{
            boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08)'
          }}
        >
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${card.percentage}%`,
              background: currentStatus.progress,
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)'
            }}
          />
        </div>
      </div>

      {/* Staff Section - Background Container - Responsive */}
      <div
        className="mt-auto mx-2 sm:mx-3 mb-2 sm:mb-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg relative"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
          boxShadow: `
            inset 0 1px 3px rgba(139, 92, 46, 0.08),
            inset 0 -1px 0 rgba(255, 255, 255, 0.6),
            0 1px 2px rgba(255, 255, 255, 0.8)
          `,
          border: '1px solid rgba(212, 184, 150, 0.15)'
        }}
      >
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 pr-11 sm:pr-12">
          {card.staff.map((staff, index) => (
            <div
              key={index}
              className="text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-white/30 cursor-pointer hover:scale-105 transition-transform tracking-wide"
              style={{
                background: staffColors[staff.name] || staffColors['SOPHIA'],
                boxShadow: `
                  0 3px 6px rgba(0, 0, 0, 0.18),
                  0 1px 3px rgba(0, 0, 0, 0.12),
                  inset 0 1px 0 rgba(255, 255, 255, 0.5)
                `,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)'
              }}
            >
              {staff.name}
            </div>
          ))}
        </div>

        {/* Done Button - Responsive */}
        <button
          className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all"
          title="Mark as Done"
        >
          <CheckCircle size={20} className="sm:w-5 sm:h-5" strokeWidth={2} />
        </button>
      </div>

      {/* Subtle Paper Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay rounded-xl"
        style={{
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
          backgroundSize: '200px 200px'
        }}
      />

      {/* Gentle Paper Grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15 rounded-xl"
        style={{
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px),
            repeating-linear-gradient(0deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px)
          `,
          backgroundSize: '3px 3px'
        }}
      />

      {/* Edge Highlight for subtle depth */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.4)'
        }}
      />
    </div>
  );
}
