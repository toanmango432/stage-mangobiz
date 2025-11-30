import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Receipt, ChevronUp, ChevronDown, Maximize2, X, Grid, List, DollarSign, CreditCard } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectPendingTickets } from '../../store/slices/uiTicketsSlice';
import { markTicketAsPaid } from '../../store/slices/uiTicketsSlice';
import { PendingTicketCard } from '../tickets/PendingTicketCard';
import { Pending } from '../modules/Pending';
import { PaymentModal } from '../checkout/LegacyPaymentModal';
import type { PaymentMethod, PaymentDetails } from '../../types';

type ViewMode = 'collapsed' | 'expanded' | 'fullView';
type DisplayMode = 'grid' | 'list';

export const PendingSectionFooter = memo(function PendingSectionFooter() {
  const dispatch = useAppDispatch();

  // PERFORMANCE: Use direct Redux selector instead of useTickets() to avoid
  // unnecessary re-renders when staff data changes
  const pendingTickets = useAppSelector(selectPendingTickets);

  // Payment modal state
  const [selectedTicket, setSelectedTicket] = useState<typeof pendingTickets[0] | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Get staff sidebar width from localStorage to position footer correctly
  const [staffSidebarWidth, setStaffSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('staffSidebarWidth');
    return savedWidth ? parseInt(savedWidth) : 256; // Default 256px
  });

  // Listen for sidebar width changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedWidth = localStorage.getItem('staffSidebarWidth');
      if (savedWidth) {
        setStaffSidebarWidth(parseInt(savedWidth));
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event from same window
    window.addEventListener('staffSidebarWidthChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('staffSidebarWidthChanged', handleStorageChange);
    };
  }, []);

  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>('collapsed');

  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    const saved = localStorage.getItem('pendingFooterDisplayMode') as DisplayMode;
    return saved === 'list' ? 'list' : 'grid';
  });

  // Track if we've already restored state from localStorage
  const hasRestoredState = useRef(false);

  // Load saved view mode from localStorage (only once, and only if there are tickets)
  useEffect(() => {
    if (!hasRestoredState.current && pendingTickets.length > 0) {
      const saved = localStorage.getItem('pendingFooterViewMode') as ViewMode;
      if (saved && (saved === 'expanded' || saved === 'fullView')) {
        setViewMode(saved);
      }
      hasRestoredState.current = true;
    }
  }, [pendingTickets.length]);

  // HARD RULE: Force collapsed mode when there are no pending tickets
  useEffect(() => {
    if (pendingTickets.length === 0 && viewMode !== 'collapsed') {
      setViewMode('collapsed');
      localStorage.setItem('pendingFooterViewMode', 'collapsed');
    }
  }, [pendingTickets.length, viewMode]);

  // Save viewMode to localStorage when it changes
  useEffect(() => {
    if (pendingTickets.length > 0) {
      localStorage.setItem('pendingFooterViewMode', viewMode);
    }
  }, [viewMode, pendingTickets.length]);

  // Save displayMode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('pendingFooterDisplayMode', displayMode);
  }, [displayMode]);

  // Resizable expanded mode
  const [expandedHeight, setExpandedHeight] = useState(300); // Default 300px
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  // Calculate total amount (memoized for performance)
  const totalAmount = useMemo(() =>
    pendingTickets.reduce((sum, ticket) =>
      sum + ticket.subtotal + ticket.tax + ticket.tip, 0
    ),
    [pendingTickets]
  );

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = expandedHeight;
  };

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = resizeStartY.current - e.clientY; // Inverted because we're growing upward
      const newHeight = Math.max(200, Math.min(600, resizeStartHeight.current + deltaY));
      setExpandedHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Toggle between collapsed and expanded
  const toggleCollapsedExpanded = () => {
    // HARD RULE: Don't allow expansion if there are no tickets
    if (pendingTickets.length === 0) return;
    if (viewMode === 'fullView') return; // Don't toggle if in full view
    setViewMode(prev => prev === 'collapsed' ? 'expanded' : 'collapsed');
  };

  // Open full view
  const openFullView = () => {
    // HARD RULE: Don't allow full view if there are no tickets
    if (pendingTickets.length === 0) return;
    setViewMode('fullView');
  };

  // Close full view
  const closeFullView = () => {
    setViewMode('expanded');
  };

  // Open payment modal for a ticket
  const handleTicketClick = (ticket: typeof pendingTickets[0], e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    setSelectedTicket(ticket);
    setIsPaymentModalOpen(true);
  };

  // Handle payment confirmation
  const handlePaymentConfirm = async (
    paymentMethod: PaymentMethod,
    paymentDetails: PaymentDetails,
    tip: number
  ) => {
    if (!selectedTicket) return;

    try {
      await dispatch(
        markTicketAsPaid({
          ticketId: selectedTicket.id,
          paymentMethod,
          paymentDetails,
          tip,
        })
      ).unwrap();

      setIsPaymentModalOpen(false);
      setSelectedTicket(null);
    } catch (error) {
      console.error('Payment failed:', error);
      throw error; // Let the modal handle the error display
    }
  };

  // ====================
  // HARD RULE: Always show "No Pending Payments" when there are 0 tickets
  // This is the ultimate safeguard - checks BEFORE viewMode logic
  // ====================
  if (pendingTickets.length === 0) {
    return (
      <div
        className="fixed bottom-0 right-0 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 z-40"
        style={{
          left: `${staffSidebarWidth}px`
        }}
      >
        <div className="h-9 flex items-center justify-center px-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Receipt size={14} className="text-gray-400" />
            <span className="font-medium text-xs">No Pending Payments</span>
          </div>
        </div>
      </div>
    );
  }

  // ====================
  // COLLAPSED MODE (1+ tickets)
  // ====================
  if (viewMode === 'collapsed' && pendingTickets.length > 0) {
    return (
      <>
        <div
          className="fixed bottom-0 right-0 bg-gradient-to-r from-amber-50 to-yellow-50 border-t-2 border-amber-400 shadow-2xl z-40"
          style={{
            left: `${staffSidebarWidth}px`
          }}
        >
          <div className="w-full flex items-center justify-between px-4 py-3 gap-4">
            {/* Left: Count and icon with pulsing indicator */}
            <button
              onClick={toggleCollapsedExpanded}
              className="flex items-center gap-3 hover:bg-amber-100/50 transition-colors cursor-pointer p-2 rounded-lg flex-shrink-0"
            >
              <div className="relative">
                {/* Pulsing notification badge */}
                <div className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center">
                    <span className="text-white text-xs font-bold">{pendingTickets.length}</span>
                  </span>
                </div>
                <div className="p-2 bg-amber-400 rounded-lg shadow-md">
                  <Receipt size={20} className="text-white" />
                </div>
              </div>
              <div>
                <div className="text-amber-900 font-bold text-base flex items-center gap-2">
                  <span>Pending Payments</span>
                  <ChevronUp size={18} className="text-amber-600" />
                </div>
                <div className="text-amber-700 text-sm font-semibold">
                  Total: ${totalAmount.toFixed(2)}
                </div>
              </div>
            </button>

            {/* Right: Clickable ticket cards */}
            <div className="flex items-center gap-2 flex-1 overflow-x-auto">
              <div className="flex items-center gap-3 min-w-0">
                {/* Show first 3 tickets as clickable cards */}
                {pendingTickets.slice(0, 3).map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={(e) => handleTicketClick(ticket, e)}
                    className="group relative px-5 py-3 bg-white rounded-xl shadow-lg border-2 border-amber-300 hover:border-amber-500 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex-shrink-0 min-w-[200px]"
                  >
                    {/* Static corner indicator - no pulsing for cleaner UI */}
                    <div className="absolute -top-1.5 -right-1.5">
                      <span className="inline-flex rounded-full h-3 w-3 bg-amber-500 ring-2 ring-white"></span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <div className="flex items-center gap-2 w-full">
                          <span className="font-black text-gray-900 text-base">#{ticket.number}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-800 font-semibold truncate">{ticket.clientName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 bg-amber-100 px-2 py-0.5 rounded-full">
                          <DollarSign size={14} className="text-amber-700" />
                          <span className="text-amber-900 font-bold text-sm">${(ticket.subtotal + ticket.tax + ticket.tip).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Payment icon on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <CreditCard size={18} className="text-amber-600" />
                      </div>
                    </div>
                  </button>
                ))}

                {/* "+X more" indicator */}
                {pendingTickets.length > 3 && (
                  <button
                    onClick={toggleCollapsedExpanded}
                    className="flex-shrink-0 px-4 py-3 bg-amber-100 hover:bg-amber-200 rounded-xl border-2 border-amber-300 text-amber-900 text-base font-bold transition-all hover:scale-105 shadow-md hover:shadow-lg min-w-[120px] text-center"
                  >
                    +{pendingTickets.length - 3} more
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {selectedTicket && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setSelectedTicket(null);
            }}
            ticket={selectedTicket}
            onConfirm={handlePaymentConfirm}
          />
        )}
      </>
    );
  }

  // ====================
  // EXPANDED MODE
  // ====================
  if (viewMode === 'expanded') {
    return (
      <div
        className="fixed bottom-0 right-0 bg-white border-t-2 border-amber-400 shadow-2xl z-40 flex flex-col"
        style={{
          height: `${expandedHeight}px`,
          left: `${staffSidebarWidth}px`
        }}
      >
        {/* Resize Handle */}
        <div
          className={`h-2 bg-gradient-to-b from-amber-100 to-amber-200 cursor-ns-resize hover:bg-amber-300 transition-colors ${isResizing ? 'bg-amber-400' : ''}`}
          onMouseDown={handleResizeStart}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-1 bg-amber-400 rounded-full" />
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 rounded-lg shadow-sm">
              <Receipt size={20} className="text-white" />
            </div>
            <div>
              <div className="text-amber-900 font-bold text-base">
                Pending Payments ({pendingTickets.length})
              </div>
              <div className="text-amber-700 text-sm">
                Total: ${totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Grid/List Toggle */}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-amber-200 p-1">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`p-1.5 rounded ${displayMode === 'grid' ? 'bg-amber-400 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Grid View"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setDisplayMode('list')}
                className={`p-1.5 rounded ${displayMode === 'list' ? 'bg-amber-400 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>

            {/* Full View Button */}
            <button
              onClick={openFullView}
              className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
              title="Full View"
            >
              <Maximize2 size={18} className="text-amber-600" />
            </button>

            {/* Collapse Button */}
            <button
              onClick={toggleCollapsedExpanded}
              className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
              title="Collapse"
            >
              <ChevronDown size={18} className="text-amber-600" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {displayMode === 'grid' ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {pendingTickets.map((ticket) => (
                <PendingTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  viewMode="grid-normal"
                  onMarkPaid={() => {}}
                  isMenuOpen={false}
                  onOpenMenu={() => {}}
                  onCloseMenu={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-w-5xl">
              {pendingTickets.map((ticket) => (
                <PendingTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  viewMode="normal"
                  onMarkPaid={() => {}}
                  isMenuOpen={false}
                  onOpenMenu={() => {}}
                  onCloseMenu={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ====================
  // FULL VIEW MODE (Drawer)
  // ====================
  if (viewMode === 'fullView') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b-2 border-amber-400 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 rounded-lg shadow-sm">
              <Receipt size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-amber-900 font-bold text-xl">Pending Payments</h2>
              <p className="text-amber-700 text-sm">
                {pendingTickets.length} ticket{pendingTickets.length !== 1 ? 's' : ''} • Total: ${totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={closeFullView}
            className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
            title="Close Full View"
          >
            <X size={24} className="text-amber-600" />
          </button>
        </div>

        {/* Full Pending Page Content */}
        <div className="flex-1 overflow-hidden">
          <Pending />
        </div>
      </div>
    );
  }

  return null;
});
