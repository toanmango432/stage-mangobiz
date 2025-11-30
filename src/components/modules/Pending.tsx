import { useState, useMemo, useEffect } from 'react';
import { useTickets } from '../../hooks/useTicketsCompat';
import { PendingHeader } from '../pending';
import { PendingTicketCard } from '../tickets/PendingTicketCard';
import { PaymentModal } from '../checkout/LegacyPaymentModal';
import type { PaymentMethod, PaymentDetails } from '../../types';
import type { PendingTicket } from '../../store/slices/uiTicketsSlice';
import toast from 'react-hot-toast';
import { Receipt, RefreshCw } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useMobileModal';
import { usePullToRefresh } from '../../hooks/useGestures';
import { haptics } from '../../utils/haptics';

type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low' | 'client-name';

export function Pending() {
  const { pendingTickets, markTicketAsPaid } = useTickets();
  const { isMobile, isTablet } = useBreakpoint();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cardViewMode, setCardViewMode] = useState<'normal' | 'compact'>('normal');

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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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

  // Cancel ticket handler
  const handleCancelTicket = (ticketId: string) => {
    if (confirm('Cancel this pending payment? The ticket will be removed from the queue.')) {
      // TODO: Implement cancel functionality
      toast.success('Ticket cancelled', {
        duration: 2000,
        position: 'top-center',
      });
      console.log('Cancel ticket:', ticketId);
    }
  };

  // Dropdown handlers
  const handleOpenMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  const handleCloseMenu = () => {
    setOpenDropdownId(null);
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
                  onCancel={handleCancelTicket}
                  isMenuOpen={openDropdownId === ticket.id}
                  onOpenMenu={handleOpenMenu}
                  onCloseMenu={handleCloseMenu}
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
                  onCancel={handleCancelTicket}
                  isMenuOpen={openDropdownId === ticket.id}
                  onOpenMenu={handleOpenMenu}
                  onCloseMenu={handleCloseMenu}
                />
              ))}
            </div>
          )
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full py-12 px-4">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Receipt size={isMobile ? 40 : 48} className="text-gray-400" />
            </div>
            <h3 className={`font-semibold text-gray-700 mb-2 text-center ${isMobile ? 'text-base' : 'text-lg'}`}>
              {searchQuery ? 'No tickets found' : 'No pending payments'}
            </h3>
            <p className={`text-gray-500 max-w-md text-center ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'All caught up! When services are completed, they will appear here for payment processing.'}
            </p>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {selectedTicket && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          ticket={selectedTicket}
          onConfirm={handlePaymentConfirm}
        />
      )}
    </div>
  );
}
