import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Receipt, ChevronUp, ChevronDown, Maximize2, X, Grid, List, DollarSign, CreditCard } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectPendingTickets, removePendingTicket } from '../../store/slices/uiTicketsSlice';
import { selectAllStaff } from '../../store/slices/uiStaffSlice';
import { selectFrontDeskSettings } from '../../store/slices/frontDeskSettingsSlice';
import { PendingTicketCard } from '../tickets/PendingTicketCard';
import { EditTicketModal } from '../tickets/EditTicketModal';
import { TicketDetailsModal } from '../tickets/TicketDetailsModal';
import { RemoveFromPendingModal, type RemoveReason } from '../tickets/RemoveFromPendingModal';
import { Pending } from '../modules/Pending';
import TicketPanel from '../checkout/TicketPanel';
import type { StaffMember } from '../checkout/ServiceList';
import { sortByUrgency, hasUrgentTickets, UrgencyThresholds } from '../../utils/urgencyUtils';

// =====================
// CONSTANTS
// =====================
const PENDING_SECTION: {
  MIN_EXPANDED_HEIGHT: number;
  MAX_EXPANDED_HEIGHT: number;
  DEFAULT_EXPANDED_HEIGHT: number;
  COLLAPSED_TICKET_DISPLAY_COUNT: number;
  EMPTY_STATE_HEIGHT: number;
  COLLAPSED_HEIGHT: number;
} = {
  MIN_EXPANDED_HEIGHT: 200,
  MAX_EXPANDED_HEIGHT: 600,
  DEFAULT_EXPANDED_HEIGHT: 300,
  COLLAPSED_TICKET_DISPLAY_COUNT: 3,
  EMPTY_STATE_HEIGHT: 36,
  COLLAPSED_HEIGHT: 100,
};

const STORAGE_KEYS = {
  VIEW_MODE: 'pendingFooterViewMode',
  DISPLAY_MODE: 'pendingFooterDisplayMode',
  SIDEBAR_WIDTH: 'staffSidebarWidth',
  CHECKOUT_TICKET: 'checkout-pending-ticket',
} as const;

// Safe localStorage helper with try-catch
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail if localStorage is unavailable or quota exceeded
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  },
};

type ViewMode = 'collapsed' | 'expanded' | 'fullView';
type DisplayMode = 'grid' | 'list';

export const PendingSectionFooter = memo(function PendingSectionFooter() {
  const dispatch = useAppDispatch();

  // PERFORMANCE: Use direct Redux selector instead of useTickets() to avoid
  // unnecessary re-renders when staff data changes
  const pendingTickets = useAppSelector(selectPendingTickets);

  // Get staff from Redux for TicketPanel
  const staffFromRedux = useAppSelector(selectAllStaff);

  // Convert Redux staff to StaffMember format (including specialty for color matching)
  const staffMembers: StaffMember[] = staffFromRedux.map(s => ({
    id: s.id,
    name: s.name,
    available: s.status === 'ready',
    specialty: s.specialty,
  }));

  // Checkout panel state (replaces payment modal)
  const [isCheckoutPanelOpen, setIsCheckoutPanelOpen] = useState(false);

  // Update CSS custom property when sidebar width changes
  useEffect(() => {
    const updateSidebarWidth = () => {
      const savedWidth = safeLocalStorage.getItem(STORAGE_KEYS.SIDEBAR_WIDTH);
      if (savedWidth) {
        document.documentElement.style.setProperty('--staff-sidebar-width', `${savedWidth}px`);
      }
    };

    // Initialize from localStorage
    updateSidebarWidth();

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', updateSidebarWidth);

    // Also listen for custom event from same window
    window.addEventListener('staffSidebarWidthChanged', updateSidebarWidth);

    return () => {
      window.removeEventListener('storage', updateSidebarWidth);
      window.removeEventListener('staffSidebarWidthChanged', updateSidebarWidth);
    };
  }, []);

  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>('collapsed');

  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.DISPLAY_MODE) as DisplayMode;
    return saved === 'list' ? 'list' : 'grid';
  });

  // Track if we've already restored state from localStorage
  const hasRestoredState = useRef(false);

  // Load saved view mode from localStorage (only once, and only if there are tickets)
  useEffect(() => {
    if (!hasRestoredState.current && pendingTickets.length > 0) {
      const saved = safeLocalStorage.getItem(STORAGE_KEYS.VIEW_MODE) as ViewMode;
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
      safeLocalStorage.setItem(STORAGE_KEYS.VIEW_MODE, 'collapsed');
    }
  }, [pendingTickets.length, viewMode]);

  // Save viewMode to localStorage when it changes
  useEffect(() => {
    if (pendingTickets.length > 0) {
      safeLocalStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
    }
  }, [viewMode, pendingTickets.length]);

  // Save displayMode to localStorage when it changes
  useEffect(() => {
    safeLocalStorage.setItem(STORAGE_KEYS.DISPLAY_MODE, displayMode);
  }, [displayMode]);

  // Resizable expanded mode
  const [expandedHeight, setExpandedHeight] = useState(PENDING_SECTION.DEFAULT_EXPANDED_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  // Edit and Details modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [ticketToView, setTicketToView] = useState<number | null>(null);

  // Remove from Pending modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [ticketToRemove, setTicketToRemove] = useState<{ id: string; number: number; clientName: string } | null>(null);

  // Handle remove from pending
  const handleRemoveTicket = (reason: RemoveReason, notes?: string) => {
    if (!ticketToRemove) return;
    dispatch(removePendingTicket({
      ticketId: ticketToRemove.id,
      reason,
      notes,
    }));
    setShowRemoveModal(false);
    setTicketToRemove(null);
  };

  // Update CSS variable for pending section height so FrontDesk can adjust its padding
  useEffect(() => {
    let height = PENDING_SECTION.EMPTY_STATE_HEIGHT;

    if (pendingTickets.length > 0) {
      if (viewMode === 'collapsed') {
        height = PENDING_SECTION.COLLAPSED_HEIGHT;
      } else if (viewMode === 'expanded') {
        height = expandedHeight;
      } else if (viewMode === 'fullView') {
        height = 0; // Full screen overlay, no padding needed
      }
    }

    document.documentElement.style.setProperty('--pending-section-height', `${height}px`);
  }, [pendingTickets.length, viewMode, expandedHeight]);

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
      const newHeight = Math.max(
        PENDING_SECTION.MIN_EXPANDED_HEIGHT,
        Math.min(PENDING_SECTION.MAX_EXPANDED_HEIGHT, resizeStartHeight.current + deltaY)
      );
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

  // Open checkout panel for a ticket
  const handleTicketClick = (ticket: typeof pendingTickets[0], e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    // Store ticket in localStorage for TicketPanel to load
    safeLocalStorage.setItem(STORAGE_KEYS.CHECKOUT_TICKET, JSON.stringify(ticket));
    setIsCheckoutPanelOpen(true);
  };

  // Close checkout panel
  const handleCloseCheckoutPanel = () => {
    setIsCheckoutPanelOpen(false);
    safeLocalStorage.removeItem(STORAGE_KEYS.CHECKOUT_TICKET);
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
          left: 'var(--staff-sidebar-width)'
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
          role="region"
          aria-label="Pending payments section"
          className="fixed bottom-0 right-0 bg-gradient-to-r from-amber-50 to-yellow-50 border-t-2 border-amber-400 shadow-2xl z-40"
          style={{
            left: 'var(--staff-sidebar-width)'
          }}
        >
          {/* Row 1: Clickable Header - entire row is clickable to expand */}
          <button
            onClick={toggleCollapsedExpanded}
            aria-expanded="false"
            aria-label={`Expand pending payments section. ${pendingTickets.length} pending payments totaling $${totalAmount.toFixed(2)}`}
            className="w-full flex items-center justify-between px-4 py-2 hover:bg-amber-100/50 transition-colors cursor-pointer border-b border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-inset"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Pulsing notification badge */}
                <div className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center">
                    <span className="text-white text-xs font-bold">{pendingTickets.length}</span>
                  </span>
                </div>
                <div className="p-2 bg-amber-400 rounded-lg shadow-md">
                  <Receipt size={18} className="text-white" aria-hidden="true" />
                </div>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-amber-900 font-bold text-sm">Pending Payments</span>
                  <ChevronUp size={18} className="text-amber-600" aria-hidden="true" />
                </div>
                <div className="text-amber-700 text-xs font-semibold">
                  Total: ${totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </button>

          {/* Row 2: Ticket cards */}
          <div className="w-full flex items-center px-4 py-2 gap-3 overflow-x-auto">
            {/* Show first N tickets as clickable cards */}
            {pendingTickets.slice(0, PENDING_SECTION.COLLAPSED_TICKET_DISPLAY_COUNT).map((ticket) => (
              <button
                key={ticket.id}
                onClick={(e) => handleTicketClick(ticket, e)}
                aria-label={`Open ticket ${ticket.number} for ${ticket.clientName}, $${(ticket.subtotal + ticket.tax + ticket.tip).toFixed(2)}`}
                className="group relative px-4 py-2 bg-white rounded-xl shadow-lg border-2 border-amber-300 hover:border-amber-500 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex-shrink-0 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {/* Static corner indicator */}
                <div className="absolute -top-1.5 -right-1.5">
                  <span className="inline-flex rounded-full h-3 w-3 bg-amber-500 ring-2 ring-white"></span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-black text-gray-900 text-sm">#{ticket.number}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-800 font-semibold text-sm truncate">{ticket.clientName}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 bg-amber-100 px-2 py-0.5 rounded-full">
                      <DollarSign size={12} className="text-amber-700" />
                      <span className="text-amber-900 font-bold text-xs">${(ticket.subtotal + ticket.tax + ticket.tip).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment icon on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <CreditCard size={16} className="text-amber-600" />
                  </div>
                </div>
              </button>
            ))}

            {/* "+X more" indicator */}
            {pendingTickets.length > PENDING_SECTION.COLLAPSED_TICKET_DISPLAY_COUNT && (
              <button
                onClick={toggleCollapsedExpanded}
                aria-label={`Show ${pendingTickets.length - PENDING_SECTION.COLLAPSED_TICKET_DISPLAY_COUNT} more pending tickets`}
                className="flex-shrink-0 px-3 py-2 bg-amber-100 hover:bg-amber-200 rounded-xl border-2 border-amber-300 text-amber-900 text-sm font-bold transition-all hover:scale-105 shadow-md hover:shadow-lg min-w-[100px] text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                +{pendingTickets.length - PENDING_SECTION.COLLAPSED_TICKET_DISPLAY_COUNT} more
              </button>
            )}
          </div>
        </div>

        {/* Checkout Panel - Full checkout experience */}
        <TicketPanel
          isOpen={isCheckoutPanelOpen}
          onClose={handleCloseCheckoutPanel}
          staffMembers={staffMembers.length > 0 ? staffMembers : [
            { id: 'staff-1', name: 'Staff Member', available: true },
          ]}
        />
      </>
    );
  }

  // ====================
  // EXPANDED MODE
  // ====================
  if (viewMode === 'expanded') {
    return (
      <div
        role="region"
        aria-label="Pending payments section - expanded"
        className="fixed bottom-0 right-0 bg-white border-t-2 border-amber-400 shadow-2xl z-40 flex flex-col"
        style={{
          height: `${expandedHeight}px`,
          left: 'var(--staff-sidebar-width)'
        }}
      >
        {/* Resize Handle */}
        <div
          role="slider"
          aria-label="Resize pending section"
          aria-valuenow={expandedHeight}
          aria-valuemin={PENDING_SECTION.MIN_EXPANDED_HEIGHT}
          aria-valuemax={PENDING_SECTION.MAX_EXPANDED_HEIGHT}
          tabIndex={0}
          className={`h-2 bg-gradient-to-b from-amber-100 to-amber-200 cursor-ns-resize hover:bg-amber-300 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${isResizing ? 'bg-amber-400' : ''}`}
          onMouseDown={handleResizeStart}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-1 bg-amber-400 rounded-full" />
          </div>
        </div>

        {/* Header - Left side clickable to collapse */}
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
          {/* Clickable area to collapse */}
          <button
            onClick={toggleCollapsedExpanded}
            aria-expanded="true"
            aria-label={`Collapse pending payments section. ${pendingTickets.length} pending payments totaling $${totalAmount.toFixed(2)}`}
            className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-amber-100/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-inset"
          >
            <div className="p-2 bg-amber-400 rounded-lg shadow-sm">
              <Receipt size={20} className="text-white" aria-hidden="true" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-amber-900 font-bold text-base">
                  Pending Payments ({pendingTickets.length})
                </span>
                <ChevronDown size={20} className="text-amber-600" aria-hidden="true" />
              </div>
              <div className="text-amber-700 text-sm">
                Total: ${totalAmount.toFixed(2)}
              </div>
            </div>
          </button>

          {/* Controls - not part of clickable area */}
          <div className="flex items-center gap-2 px-4 py-3" role="group" aria-label="View controls">
            {/* Grid/List Toggle */}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-amber-200 p-1" role="radiogroup" aria-label="Display mode">
              <button
                onClick={() => setDisplayMode('grid')}
                role="radio"
                aria-checked={displayMode === 'grid'}
                aria-label="Grid view"
                className={`p-1.5 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 ${displayMode === 'grid' ? 'bg-amber-400 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid size={16} aria-hidden="true" />
              </button>
              <button
                onClick={() => setDisplayMode('list')}
                role="radio"
                aria-checked={displayMode === 'list'}
                aria-label="List view"
                className={`p-1.5 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 ${displayMode === 'list' ? 'bg-amber-400 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <List size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Full View Button */}
            <button
              onClick={openFullView}
              aria-label="Open full view"
              className="p-2 hover:bg-amber-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <Maximize2 size={18} className="text-amber-600" aria-hidden="true" />
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
                  onMarkPaid={(id) => {
                    const t = pendingTickets.find(pt => pt.id === id);
                    if (t) {
                      safeLocalStorage.setItem(STORAGE_KEYS.CHECKOUT_TICKET, JSON.stringify(t));
                      setIsCheckoutPanelOpen(true);
                    }
                  }}
                  onEdit={(id) => {
                    setTicketToEdit(parseInt(id));
                    setShowEditModal(true);
                  }}
                  onViewDetails={(id) => {
                    setTicketToView(parseInt(id));
                    setShowDetailsModal(true);
                  }}
                  onRemove={(id) => {
                    const t = pendingTickets.find(pt => pt.id === id);
                    if (t) {
                      setTicketToRemove({ id: t.id, number: t.number, clientName: t.clientName });
                      setShowRemoveModal(true);
                    }
                  }}
                  onClick={(id) => {
                    const t = pendingTickets.find(pt => pt.id === id);
                    if (t) {
                      safeLocalStorage.setItem(STORAGE_KEYS.CHECKOUT_TICKET, JSON.stringify(t));
                      setIsCheckoutPanelOpen(true);
                    }
                  }}
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
                  onMarkPaid={(id) => {
                    const t = pendingTickets.find(pt => pt.id === id);
                    if (t) {
                      safeLocalStorage.setItem(STORAGE_KEYS.CHECKOUT_TICKET, JSON.stringify(t));
                      setIsCheckoutPanelOpen(true);
                    }
                  }}
                  onEdit={(id) => {
                    setTicketToEdit(parseInt(id));
                    setShowEditModal(true);
                  }}
                  onViewDetails={(id) => {
                    setTicketToView(parseInt(id));
                    setShowDetailsModal(true);
                  }}
                  onRemove={(id) => {
                    const t = pendingTickets.find(pt => pt.id === id);
                    if (t) {
                      setTicketToRemove({ id: t.id, number: t.number, clientName: t.clientName });
                      setShowRemoveModal(true);
                    }
                  }}
                  onClick={(id) => {
                    const t = pendingTickets.find(pt => pt.id === id);
                    if (t) {
                      safeLocalStorage.setItem(STORAGE_KEYS.CHECKOUT_TICKET, JSON.stringify(t));
                      setIsCheckoutPanelOpen(true);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Checkout Panel - Full checkout experience */}
        <TicketPanel
          isOpen={isCheckoutPanelOpen}
          onClose={handleCloseCheckoutPanel}
          staffMembers={staffMembers.length > 0 ? staffMembers : [
            { id: 'staff-1', name: 'Staff Member', available: true },
          ]}
        />

        {/* Edit, Details, and Remove Modals */}
        <EditTicketModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} ticketId={ticketToEdit} />
        <TicketDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} ticketId={ticketToView} onEdit={(id) => {
          setShowDetailsModal(false);
          setTicketToEdit(id);
          setShowEditModal(true);
        }} />
        <RemoveFromPendingModal
          isOpen={showRemoveModal}
          onClose={() => { setShowRemoveModal(false); setTicketToRemove(null); }}
          onConfirm={handleRemoveTicket}
          ticketNumber={ticketToRemove?.number}
          clientName={ticketToRemove?.clientName}
        />
      </div>
    );
  }

  // ====================
  // FULL VIEW MODE (Drawer)
  // ====================
  if (viewMode === 'fullView') {
    return (
      <div
        role="dialog"
        aria-label="Pending payments full view"
        aria-modal="true"
        className="fixed inset-0 z-50 flex flex-col bg-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b-2 border-amber-400 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 rounded-lg shadow-sm">
              <Receipt size={24} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 id="pending-full-view-title" className="text-amber-900 font-bold text-xl">Pending Payments</h2>
              <p className="text-amber-700 text-sm">
                {pendingTickets.length} ticket{pendingTickets.length !== 1 ? 's' : ''} • Total: ${totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={closeFullView}
            aria-label="Close full view"
            className="p-2 hover:bg-amber-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <X size={24} className="text-amber-600" aria-hidden="true" />
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
