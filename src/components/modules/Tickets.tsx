import { useState, useMemo } from 'react';
import { ServiceSection } from '../ServiceSection';
import { WaitListSection } from '../WaitListSection';
import { ComingAppointments } from '../ComingAppointments';
import { useTickets } from '../../hooks/useTicketsCompat';
import { PendingTicketCard } from '../tickets/PendingTicketCard';
import { PaymentModal } from '../checkout/PaymentModal';
import { Receipt } from 'lucide-react';
import type { PaymentMethod, PaymentDetails } from '../../types';
import type { PendingTicket } from '../../store/slices/uiTicketsSlice';
import toast from 'react-hot-toast';
import { haptics } from '../../utils/haptics';

export function Tickets() {
  const [activeTab, setActiveTab] = useState<'coming' | 'waitlist' | 'inservice' | 'pending'>('coming');
  const { pendingTickets, waitlist = [], serviceTickets = [], markTicketAsPaid } = useTickets();

  // Payment modal state for Pending tab
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<PendingTicket | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const tabs = useMemo(() => [
    { id: 'coming' as const, label: 'Coming', count: 0 }, // TODO: Get from appointments
    { id: 'waitlist' as const, label: 'Waiting', count: waitlist.length },
    { id: 'inservice' as const, label: 'In Service', count: serviceTickets.length },
    { id: 'pending' as const, label: 'Pending', count: pendingTickets.length },
  ], [waitlist.length, serviceTickets.length, pendingTickets.length]);

  // Payment handlers
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
      });
      handleClosePaymentModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const handleCancelTicket = (ticketId: string) => {
    if (confirm('Cancel this pending payment?')) {
      toast.success('Ticket cancelled');
    }
  };

  const handleTabChange = (tabId: typeof activeTab) => {
    haptics.selection();
    setActiveTab(tabId);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Sub-tabs for ticket types */}
      <div className="bg-white border-b border-gray-200 px-2 py-2 flex gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'coming' && (
          <ComingAppointments
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            hideHeader={true}
          />
        )}
        {activeTab === 'waitlist' && (
          <WaitListSection
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            hideHeader={true}
          />
        )}
        {activeTab === 'inservice' && (
          <ServiceSection
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            hideHeader={true}
          />
        )}
        {activeTab === 'pending' && (
          <div className="h-full p-3">
            {pendingTickets.length > 0 ? (
              <div className="space-y-3">
                {pendingTickets.map(ticket => (
                  <PendingTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    viewMode="normal"
                    onMarkPaid={handleOpenPaymentModal}
                    onCancel={handleCancelTicket}
                    isMenuOpen={openDropdownId === ticket.id}
                    onOpenMenu={(id, e) => {
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === id ? null : id);
                    }}
                    onCloseMenu={() => setOpenDropdownId(null)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <Receipt size={40} className="text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-2">No pending payments</h3>
                <p className="text-xs text-gray-500 text-center max-w-xs">
                  Completed services will appear here for payment processing.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

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
