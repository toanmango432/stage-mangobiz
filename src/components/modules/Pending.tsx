import { useState, useMemo } from 'react';
import { useTickets } from '../../hooks/useTicketsCompat';
import { PendingHeader } from '../pending';
import { PendingTicketCard } from '../tickets/PendingTicketCard';
import { PaymentModal } from '../checkout/PaymentModal';
import type { PaymentMethod, PaymentDetails } from '../../types';
import type { PendingTicket } from '../../store/slices/uiTicketsSlice';
import toast from 'react-hot-toast';
import { Receipt } from 'lucide-react';

type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low' | 'client-name';

export function Pending() {
  const { pendingTickets, markTicketAsPaid } = useTickets();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cardViewMode, setCardViewMode] = useState<'normal' | 'compact'>('normal');

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
      />

      {/* Content - Direct ticket grid */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {filteredTickets.length > 0 ? (
          viewMode === 'grid' ? (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns:
                  cardViewMode === 'compact'
                    ? 'repeat(auto-fill, minmax(240px, 1fr))'
                    : 'repeat(auto-fill, minmax(300px, 1fr))',
              }}
            >
              {filteredTickets.map(ticket => (
                <PendingTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  viewMode={cardViewMode === 'compact' ? 'grid-compact' : 'grid-normal'}
                  onMarkPaid={handleOpenPaymentModal}
                  onCancel={handleCancelTicket}
                  isMenuOpen={openDropdownId === ticket.id}
                  onOpenMenu={handleOpenMenu}
                  onCloseMenu={handleCloseMenu}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-w-5xl">
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
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Receipt size={48} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? 'No tickets found' : 'No pending payments'}
            </h3>
            <p className="text-sm text-gray-500 max-w-md text-center">
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
