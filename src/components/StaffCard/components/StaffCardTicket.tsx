/**
 * StaffCardTicket Component
 * Paper-style ticket display for active tickets
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TICKET_STYLES } from '../constants/staffCardTokens';
import { formatClientName } from '../utils/formatters';

interface ActiveTicket {
  id: number;
  ticketNumber?: string | number;
  clientName: string;
  serviceName: string;
  status: 'in-service' | 'pending';
}

interface StaffCardTicketProps {
  ticket: ActiveTicket;
  totalTickets: number;
  isUltra: boolean;
  onClick?: () => void;
}

export const StaffCardTicket = React.memo<StaffCardTicketProps>(
  ({ ticket, totalTickets, isUltra, onClick }) => {
    const statusColor =
      ticket.status === 'in-service'
        ? TICKET_STYLES.statusColors['in-service']
        : TICKET_STYLES.statusColors.pending;

    return (
      <div className="w-full relative z-10 px-1 perspective-1000">
        {/* Stack Effect (if > 1 ticket) */}
        {totalTickets > 1 && (
          <div
            className="absolute inset-x-2 -bottom-1 h-3 bg-[#f8f5ed] border-2 border-dashed border-[#dcdcdc] rounded-lg z-0 shadow-sm"
            style={{ transform: 'rotate(-1deg) translateZ(-8px)' }}
          />
        )}

        {/* Main Ticket Card */}
        <div
          onClick={onClick}
          className="relative w-full h-[38px] bg-gradient-to-br from-[#FFFBF0] to-[#FFF8E7] border-2 border-dashed border-[#E5E7EB] rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md group z-10 flex items-center overflow-hidden"
          style={{
            boxShadow: TICKET_STYLES.shadow,
            WebkitMaskImage:
              'radial-gradient(circle at -4px 50%, transparent 5px, black 5.5px), radial-gradient(circle at calc(100% + 4px) 50%, transparent 5px, black 5.5px)',
            maskImage:
              'radial-gradient(circle at -4px 50%, transparent 5px, black 5.5px), radial-gradient(circle at calc(100% + 4px) 50%, transparent 5px, black 5.5px)',
            contain: 'layout style paint', // Performance optimization
          }}
          role="button"
          tabIndex={0}
          aria-label={`Ticket ${ticket.ticketNumber || ticket.id} for ${ticket.clientName}`}
        >
          {/* Status Strip (Left Stub) */}
          <div className="absolute left-0 top-0 bottom-0 w-[4px]">
            <div
              className="absolute inset-0 opacity-80"
              style={{ background: statusColor }}
            />
            {/* Perforation Line */}
            <div className="absolute right-0 top-0 bottom-0 w-[1px] border-r border-dashed border-black/5" />
          </div>

          {/* Ticket Number - Top Left Corner Tag */}
          <div className="absolute top-0 left-[4px] px-1.5 py-[1px] bg-[#F3F0E6]/80 backdrop-blur-[1px] rounded-br-md border-b border-r border-black/5 z-20">
            <span className="text-[8px] font-mono font-bold text-gray-400 leading-none block">
              #{ticket.ticketNumber || ticket.id}
            </span>
          </div>

          {/* Content Container */}
          <div className="flex-1 flex items-center justify-between pl-3.5 pr-2">
            {/* Left: Info */}
            <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
              {/* Pulse Dot (In-Service only) */}
              {ticket.status === 'in-service' && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              )}

              {/* Text: First Name + Service */}
              <div className="flex items-baseline gap-1.5 truncate pt-1">
                <span
                  className={`${
                    isUltra ? 'text-[10px]' : 'text-[11px]'
                  } font-bold text-gray-800 uppercase tracking-tight`}
                >
                  {formatClientName(ticket.clientName)}
                </span>
                <span
                  className={`${
                    isUltra ? 'text-xs' : 'text-xs'
                  } font-medium text-gray-500 truncate`}
                >
                  {ticket.serviceName}
                </span>
              </div>

              {/* Ticket Count Badge (Inline) */}
              {totalTickets > 1 && (
                <span className="flex-shrink-0 bg-white text-gray-500 text-xs font-bold px-1.5 py-0.5 rounded-full border border-gray-200 shadow-sm mt-0.5">
                  +{totalTickets - 1}
                </span>
              )}
            </div>

            {/* Right: Chevron */}
            <div className="flex-shrink-0 ml-1 text-gray-300 group-hover:text-gray-500 transition-colors pt-2">
              <ChevronRight size={14} strokeWidth={2} />
            </div>
          </div>

          {/* Paper Texture Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-multiply"
            style={{
              backgroundImage: `url("${TICKET_STYLES.textureUrl}")`,
              backgroundSize: '100px 100px',
            }}
          />

          {/* Highlight Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>
    );
  }
);

StaffCardTicket.displayName = 'StaffCardTicket';
