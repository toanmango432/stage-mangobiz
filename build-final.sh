#!/bin/bash

# Extract header from current file (imports through helpers, lines 1-126)
head -n 126 src/components/tickets/ServiceTicketCard_OLD.tsx > /tmp/header.txt

# Add the 4 view modes adapted from reference
cat >> /tmp/header.txt << 'VIEWMODES'

  // LIST COMPACT VIEW
  if (viewMode === 'compact') {
    return (
      <>
        <div
          onClick={() => onClick?.(ticket.id)}
          className="relative cursor-pointer transition-all duration-150 hover:bg-[#fffcf9] active:scale-[0.99] rounded-md border border-[#e8dcc8]/60"
          role="button"
          tabIndex={0}
          aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
          style={{ background: '#FFFCF7', padding: '8px 10px' }}
        >
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-600">
              {ticket.number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-[#1a1614] truncate">{ticket.clientName}</div>
              <div className="text-xs text-[#8b7968] truncate">{ticket.service}</div>
            </div>
            <div className="flex-shrink-0 text-sm font-bold" style={{ color: currentStatus.text }}>
              {Math.round(progress)}%
            </div>
            <div className="hidden sm:flex flex-shrink-0">
              {staffList[0] && (
                <div className="text-white text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: getStaffGradient(staffList[0]), boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  {staffList[0].name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="mt-1.5 h-1 bg-[#f5f0e8] rounded-full overflow-hidden">
            <div className="h-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%`, background: currentStatus.progress }} />
          </div>
        </div>
        <TicketDetailsModal ticket={{ ...ticket, status: 'in-service' as const, priority: ticket.priority || 'normal' }} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
      </>
    );
  }

  // LIST NORMAL VIEW
  if (viewMode === 'normal') {
    return (
      <>
      <div onClick={() => onClick?.(ticket.id)} className="relative cursor-pointer transition-all duration-200 ease-out hover:bg-[#fffcf9] active:scale-[0.99] overflow-hidden rounded-lg border border-[#e8dcc8]" role="button" tabIndex={0} aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }} style={{ background: 'linear-gradient(to right, #FFFCF7 0%, #FFF9F0 100%)', padding: '12px 14px' }}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center font-bold text-sm text-gray-700">{ticket.number}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-[#1a1614] truncate text-base">{ticket.clientName}</span>
              {hasStar && <span className="text-sm flex-shrink-0">⭐</span>}
              {hasNote && <span className="text-sm flex-shrink-0">📋</span>}
            </div>
            <div className="text-xs sm:text-sm text-[#6b5d52] truncate">{ticket.service}</div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-xs sm:text-sm font-semibold" style={{ color: currentStatus.text }}>{Math.round(progress)}%</div>
            <div className="text-xs text-[#8b7968]">{formatTime(timeRemaining)}</div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            {staffList.slice(0, 2).map((staff, i) => (<div key={i} className="text-white text-xs font-semibold px-2 py-1 rounded-md" style={{ background: getStaffGradient(staff), boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>{staff.name.substring(0, 3).toUpperCase()}</div>))}
            {staffList.length > 2 && <span className="text-xs text-gray-500">+{staffList.length - 2}</span>}
          </div>
        </div>
        <div className="mt-2 h-1.5 bg-[#f5f0e8] rounded-full overflow-hidden">
          <div className="h-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%`, background: currentStatus.progress }} />
        </div>
      </div>
      <TicketDetailsModal ticket={{ ...ticket, status: 'in-service' as const, priority: ticket.priority || 'normal' }} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
    </>
    );
  }

  return null;
}
VIEWMODES

# Use the assembled file
cp /tmp/header.txt src/components/tickets/ServiceTicketCard.tsx
echo "✅ File created with list compact and normal views"
echo "Testing build..."
