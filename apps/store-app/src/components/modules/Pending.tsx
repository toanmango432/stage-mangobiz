import { useState, useMemo, useEffect } from 'react';
import { useTickets } from '../../hooks/useTicketsCompat';
import { PendingHeader } from '../pending';
import { PendingTicketCard } from '../tickets/PendingTicketCard';
import { PaymentModal } from '../checkout/LegacyPaymentModal';
import TicketPanel from '../checkout/TicketPanel';
import type { PaymentMethod, PaymentDetails } from '../../types';
import type { PendingTicket } from '../../store/slices/uiTicketsSlice';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import { FrontDeskEmptyState } from '../frontdesk/FrontDeskEmptyState';
import { useBreakpoint } from '../../hooks/useMobileModal';
import { usePullToRefresh } from '../../hooks/useGestures';
import { haptics } from '../../utils/haptics';
import { useAppSelector } from '../../store/hooks';
import { selectAllStaff } from '../../store/slices/uiStaffSlice';
import type { StaffMember } from '../checkout/ServiceList';
import { TicketDetailsModal } from '../tickets/TicketDetailsModal';
import { EditTicketModal } from '../tickets/EditTicketModal';

type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low' | 'client-name';

interface PendingProps {   //parent props for sync 
  displayMode?: 'grid' | 'list';
  onDisplayModeChange?: (mode: 'grid' | 'list') => void;
}

export function Pending({ displayMode: externalDisplayMode, onDisplayModeChange }: PendingProps = {} as PendingProps) {
  const { pendingTickets, markTicketAsPaid } = useTickets();
  const { isMobile, isTablet } = useBreakpoint();

  // Get staff from Redux
  const staffFromRedux = useAppSelector(selectAllStaff);

  // Convert Redux staff to StaffMember format (including specialty for color matching)
  const staffMembers: StaffMember[] = staffFromRedux.map(s => ({
    id: s.id,
    name: s.name,
    available: s.status === 'ready',
    specialty: s.specialty,
  }));

  // state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>('grid');
  const [cardViewMode, setCardViewMode] = useState<'normal' | 'compact'>('normal');

  // neu co props tu parent thi dung, con khong thi dung state noi bo 
  const viewMode = externalDisplayMode ?? internalViewMode;
  const setViewMode = onDisplayModeChange ?? setInternalViewMode;

  // Force list view on mobile for better usability
  useEffect(() => {
    if (isMobile) {
      setViewMode('list');
      setCardViewMode('normal'); // Normal cards are better on mobile
    }
  }, [isMobile]);

  // Pull to refresh for mobile
  const { handlers: pullHandlers, isRefreshing, pullProgress, translateY } = usePullToRefresh({
    onRefresh: async () => {
      haptics.medium();
      // Simulate a refresh - in a real app this would fetch new data
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Tickets refreshed', {
        duration: 2000,
        position: 'top-center',
      });
    },
    threshold: 80,
  });

  // Toggle compact mode
  const toggleCardViewMode = () => {
    setCardViewMode(prev => prev === 'normal' ? 'compact' : 'normal');
  };

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<PendingTicket | null>(null);

  // Checkout panel state - for full checkout experience
  const [isCheckoutPanelOpen, setIsCheckoutPanelOpen] = useState(false);

  // Ticket details and edit modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [ticketToView, setTicketToView] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<number | null>(null);

  // Filter and sort tickets
  const filteredTickets = useMemo(() => {
    let filtered = pendingTickets;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.clientName.toLowerCase().includes(query) ||
          t.technician?.toLowerCase().includes(query) ||
          t.number.toString().includes(query) ||
          t.service.toLowerCase().includes(query)
      );
    }

    // Sort tickets
    const sorted = [...filtered];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => b.number - a.number);
        break;
      case 'oldest':
        sorted.sort((a, b) => a.number - b.number);
        break;
      case 'amount-high':
        sorted.sort((a, b) => {
          const totalA = a.subtotal + a.tax + a.tip;
          const totalB = b.subtotal + b.tax + b.tip;
          return totalB - totalA;
        });
        break;
      case 'amount-low':
        sorted.sort((a, b) => {
          const totalA = a.subtotal + a.tax + a.tip;
          const totalB = b.subtotal + b.tax + b.tip;
          return totalA - totalB;
        });
        break;
      case 'client-name':
        sorted.sort((a, b) => a.clientName.localeCompare(b.clientName));
        break;
    }

    return sorted;
  }, [pendingTickets, searchQuery, sortBy]);

  // Payment modal handlers
  const handleOpenPaymentModal = (ticketId: string) => {
    const ticket = pendingTickets.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      setIsPaymentModalOpen(true);
    }
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedTicket(null);
  };

  const handlePaymentConfirm = async (
    paymentMethod: PaymentMethod,
    paymentDetails: PaymentDetails,
    tip: number
  ) => {
    if (!selectedTicket) return;

    try {
      await markTicketAsPaid(selectedTicket.id, paymentMethod, paymentDetails, tip);

      toast.success(`Payment processed for ticket #${selectedTicket.number}`, {
        duration: 3000,
        position: 'top-center',
        icon: '✅',
      });

      handleClosePaymentModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment processing failed', {
        duration: 4000,
        position: 'top-center',
        icon: '❌',
      });
    }
  };

  // Checkout panel handlers - opens full checkout experience
  const handleOpenCheckoutPanel = (ticketId: string) => {
    // Store the pending ticket ID in localStorage so TicketPanel can load it
    const ticket = pendingTickets.find(t => t.id === ticketId);
    if (ticket) {
      localStorage.setItem('checkout-pending-ticket', JSON.stringify(ticket));
      setIsCheckoutPanelOpen(true);
    }
  };

  const handleCloseCheckoutPanel = () => {
    setIsCheckoutPanelOpen(false);
    localStorage.removeItem('checkout-pending-ticket');
  };

  // View details handlers
  const handleViewDetails = (ticketId: string) => {
    setTicketToView(parseInt(ticketId));
    setShowDetailsModal(true);
  };

  // Edit ticket handlers
  const handleEdit = (ticketId: string) => {
    setTicketToEdit(parseInt(ticketId));
    setShowEditModal(true);
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Simplified Header */}
      <PendingHeader
        ticketCount={pendingTickets.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
        cardViewMode={cardViewMode}
        onCardViewModeToggle={toggleCardViewMode}
        isMobile={isMobile}
      />

      {/* Content - Direct ticket grid with pull-to-refresh on mobile */}
      <main
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 relative"
        {...((isMobile || isTablet) ? pullHandlers : {})}
        style={{
          transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
          transition: isRefreshing ? 'transform 0.2s ease-out' : undefined,
        }}
      >
        {/* Pull to refresh indicator */}
        {(isMobile || isTablet) && (pullProgress > 0 || isRefreshing) && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-2 flex items-center justify-center transition-all duration-200"
            style={{
              opacity: Math.min(pullProgress, 1),
              transform: `translateY(${Math.min(pullProgress * 60, 60)}px)`,
            }}
          >
            <div className={`p-2 bg-white rounded-full shadow-lg ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw size={20} className={pullProgress >= 1 ? 'text-amber-600' : 'text-gray-400'} />
            </div>
          </div>
        )}

        {filteredTickets.length > 0 ? (
          viewMode === 'grid' ? (
            <div
              className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : ''}`}
              style={!isMobile ? {
                gridTemplateColumns:
                  cardViewMode === 'compact'
                    ? 'repeat(auto-fill, minmax(240px, 1fr))'
                    : 'repeat(auto-fill, minmax(300px, 1fr))',
              } : undefined}
            >
              {filteredTickets.map(ticket => (
                <PendingTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  viewMode={isMobile ? 'normal' : (cardViewMode === 'compact' ? 'grid-compact' : 'grid-normal')}
                  onMarkPaid={handleOpenPaymentModal}
                  onEdit={handleEdit}
                  onViewDetails={handleViewDetails}
                  onClick={handleOpenCheckoutPanel}
                />
              ))}
            </div>
          ) : (
            <div className={`space-y-3 ${isMobile ? '' : 'max-w-5xl'}`}>
              {filteredTickets.map(ticket => (
                <PendingTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  viewMode={cardViewMode === 'compact' ? 'compact' : 'normal'}
                  onMarkPaid={handleOpenPaymentModal}
                  onEdit={handleEdit}
                  onViewDetails={handleViewDetails}
                  onClick={handleOpenCheckoutPanel}
                />
              ))}
            </div>
          )
        ) : (
          <FrontDeskEmptyState section="pending" hasFilters={!!searchQuery} />
        )}
      </main>

      {/* Payment Modal - Quick payment option */}
      {selectedTicket && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          ticket={selectedTicket as any}
          onConfirm={handlePaymentConfirm}
        />
      )}

      {/* Full Checkout Panel - Opens when clicking on a ticket */}
      <TicketPanel
        isOpen={isCheckoutPanelOpen}
        onClose={handleCloseCheckoutPanel}
        staffMembers={staffMembers.length > 0 ? staffMembers : [
          { id: 'staff-1', name: 'Staff Member', available: true },
        ]}
      />

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        ticketId={ticketToView}
        onEdit={(id) => {
          setShowDetailsModal(false);
          setTicketToEdit(id);
          setShowEditModal(true);
        }}
      />

      {/* Edit Ticket Modal */}
      <EditTicketModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        ticketId={ticketToEdit}
      />
    </div>
  );
}
