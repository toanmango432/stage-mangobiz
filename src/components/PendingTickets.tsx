import { useEffect, useState, useRef } from 'react';
import { useTickets } from '../hooks/useTicketsCompat';
import { useTicketSection } from '../hooks/frontdesk';
import { Receipt, ChevronUp, Maximize2, MoreVertical, List, Grid, Check, ChevronDown } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { PendingTicketCard } from './tickets/PendingTicketCard';
import { PaymentModal } from './checkout/LegacyPaymentModal';
import type { PaymentMethod, PaymentDetails } from '../types';
import { PendingTicket } from '../store/slices/uiTicketsSlice';
import toast from 'react-hot-toast';

interface PendingTicketsProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  viewMode?: 'grid' | 'list';
  setViewMode?: (mode: 'grid' | 'list') => void;
  cardViewMode?: 'normal' | 'compact';
  setCardViewMode?: (mode: 'normal' | 'compact') => void;
  minimizedLineView?: boolean;
  setMinimizedLineView?: (minimized: boolean) => void;
  isCombinedView?: boolean;
}

export function PendingTickets({
  isMinimized = false,
  onToggleMinimize,
  viewMode: externalViewMode,
  setViewMode: externalSetViewMode,
  cardViewMode: externalCardViewMode,
  setCardViewMode: externalSetCardViewMode,
  minimizedLineView: externalMinimizedLineView,
  setMinimizedLineView: externalSetMinimizedLineView,
  isCombinedView = false,
}: PendingTicketsProps) {
  const {
    pendingTickets,
    markTicketAsPaid
  } = useTickets();

  // Use shared hook for view mode management
  const {
    viewMode,
    setViewMode,
    cardViewMode,
    toggleCardViewMode,
    minimizedLineView,
    toggleMinimizedLineView
  } = useTicketSection({
    sectionKey: 'pending',
    defaultViewMode: 'grid',
    defaultCardViewMode: 'normal',
    isCombinedView,
    externalViewMode,
    externalSetViewMode,
    externalCardViewMode,
    externalSetCardViewMode,
    externalMinimizedLineView,
    externalSetMinimizedLineView,
  });

  const [activeTab, setActiveTab] = useState('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [_openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<PendingTicket | null>(null);
  // Updated color tokens for section styling
  const colorTokens = {
    primary: '#EB5757',
    bg: 'bg-[#FDECEC]',
    text: 'text-[#EB5757]',
    border: 'ring-[#EB5757]/30',
    iconBg: 'bg-[#EB5757]',
    hoverBg: 'hover:bg-[#FDECEC]/60',
    hoverText: 'hover:text-[#EB5757]',
    dropdownHover: 'hover:bg-[#FDECEC]',
    focusRing: 'focus:ring-[#EB5757]'
  };
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;

      // Close ticket dropdowns
      if (!target.closest('[role="menu"]') && !target.closest('button[aria-haspopup="true"]')) {
        setOpenDropdownId(null);
      }

      // Close view mode dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
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
      // Call the real markTicketAsPaid thunk
      await markTicketAsPaid(selectedTicket.id, paymentMethod, paymentDetails, tip);

      // Show success toast
      toast.success(`Payment processed for ticket #${selectedTicket.number}`, {
        duration: 3000,
        position: 'top-center',
        icon: '✅',
      });

      // Close modal
      handleClosePaymentModal();
    } catch (error) {
      // Error toast will be shown by the thunk rejection
      toast.error(error instanceof Error ? error.message : 'Payment processing failed', {
        duration: 4000,
        position: 'top-center',
        icon: '❌',
      });
    }
  };

  // Filter tickets based on active tab
  const filteredTickets = pendingTickets.filter(ticket => {
    if (activeTab === 'all') return true;
    return ticket.paymentType === activeTab;
  });
  // Render the minimized header-only view
  if (isMinimized) {
    return <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 ease-in-out">
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 h-[46px] cursor-pointer" onClick={onToggleMinimize}>
          <div className="flex items-center">
            <div className={`mr-3 ${colorTokens.text}`}>
              <Receipt size={18} />
            </div>
            <h2 className="text-[15px] font-medium text-[#EB5757] flex items-center">
              Pending Payment
              <div className="ml-2 bg-[#EB5757] text-white text-xs px-2 py-0.5 rounded-full">
                {pendingTickets.length}
              </div>
            </h2>
          </div>
          <div className="flex items-center">
            <Tippy content="Expand section">
              <button className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors" onClick={e => {
              e.stopPropagation();
              onToggleMinimize && onToggleMinimize();
            }} aria-expanded="false" aria-controls="pending-tickets-content">
                <Maximize2 size={16} />
              </button>
            </Tippy>
          </div>
        </div>
      </div>;
  }
  return <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden transition-all duration-200 ease-in-out">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FDECEC] border-b border-[#FDECEC]/50 h-[46px] sticky top-0 z-10 cursor-pointer" onClick={onToggleMinimize}>
        <div className="flex items-center">
          <div className={`mr-3 ${colorTokens.text}`}>
            <Receipt size={18} />
          </div>
          <h2 className="text-[15px] font-medium text-[#EB5757] flex items-center">
            Pending Payment
            <div className="ml-2 bg-[#EB5757] text-white text-xs px-2 py-0.5 rounded-full">
              {pendingTickets.length}
            </div>
          </h2>
        </div>
        <div className="flex items-center space-x-1">
          {/* View mode toggle button */}
          {viewMode === 'list' && (
            <Tippy content={minimizedLineView ? 'Expand line view' : 'Minimize line view'}>
              <button
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMinimizedLineView();
                }}
                aria-label={minimizedLineView ? 'Expand line view' : 'Minimize line view'}
              >
                {minimizedLineView ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </Tippy>
          )}
          {viewMode === 'grid' && (
            <Tippy content={cardViewMode === 'compact' ? 'Expand card view' : 'Minimize card view'}>
              <button
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCardViewMode();
                }}
                aria-label={cardViewMode === 'compact' ? 'Expand card view' : 'Minimize card view'}
              >
                {cardViewMode === 'compact' ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </Tippy>
          )}

          {/* Dropdown menu */}
          <div className="relative" ref={dropdownRef}>
            <Tippy content="View options">
              <button
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                aria-haspopup="true"
                aria-expanded={showDropdown}
              >
                <MoreVertical size={16} />
              </button>
            </Tippy>
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-1">
                {/* View Mode Section */}
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    View Mode
                  </h3>
                </div>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#FDECEC] flex items-center"
                  onClick={() => {
                    setViewMode('list');
                    setShowDropdown(false);
                  }}
                  role="menuitem"
                >
                  <List size={14} className="mr-2 text-[#EB5757]" />
                  Line View
                  {viewMode === 'list' && <Check size={14} className="ml-auto text-[#EB5757]" />}
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#FDECEC] flex items-center"
                  onClick={() => {
                    setViewMode('grid');
                    setShowDropdown(false);
                  }}
                  role="menuitem"
                >
                  <Grid size={14} className="mr-2 text-[#EB5757]" />
                  Grid View
                  {viewMode === 'grid' && <Check size={14} className="ml-auto text-[#EB5757]" />}
                </button>
              </div>
            )}
          </div>

          <Tippy content="Collapse section">
            <button className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors" onClick={e => {
            e.stopPropagation();
            onToggleMinimize && onToggleMinimize();
          }} aria-expanded="true" aria-controls="pending-tickets-content">
              <ChevronUp size={16} />
            </button>
          </Tippy>
        </div>
      </div>
      {/* Tab navigation for payment types - refined to be more subtle */}
      <div className="flex border-b border-gray-100 px-3 pt-1 bg-white sticky top-[46px] z-10">
        <button className={`px-3 py-2 text-xs ${activeTab === 'all' ? 'text-[#EB5757] font-medium border-b-2 border-[#EB5757]' : 'text-gray-500 hover:text-gray-700 font-normal'}`} onClick={() => setActiveTab('all')}>
          All
          <span className="ml-1 text-xs text-gray-400">
            ({pendingTickets.length})
          </span>
        </button>
        <button className={`px-3 py-2 text-xs ${activeTab === 'card' ? 'text-[#EB5757] font-medium border-b-2 border-[#EB5757]' : 'text-gray-500 hover:text-gray-700 font-normal'}`} onClick={() => setActiveTab('card')}>
          Card
          <span className="ml-1 text-xs text-gray-400">
            ({pendingTickets.filter(t => t.paymentType === 'card').length})
          </span>
        </button>
        <button className={`px-3 py-2 text-xs ${activeTab === 'cash' ? 'text-[#EB5757] font-medium border-b-2 border-[#EB5757]' : 'text-gray-500 hover:text-gray-700 font-normal'}`} onClick={() => setActiveTab('cash')}>
          Cash
          <span className="ml-1 text-xs text-gray-400">
            ({pendingTickets.filter(t => t.paymentType === 'cash').length})
          </span>
        </button>
        <button className={`px-3 py-2 text-xs ${activeTab === 'venmo' ? 'text-[#EB5757] font-medium border-b-2 border-[#EB5757]' : 'text-gray-500 hover:text-gray-700 font-normal'}`} onClick={() => setActiveTab('venmo')}>
          Venmo
          <span className="ml-1 text-xs text-gray-400">
            ({pendingTickets.filter(t => t.paymentType === 'venmo').length})
          </span>
        </button>
      </div>
      <div id="pending-tickets-content" className="overflow-auto p-3 flex-1">
        {filteredTickets.length > 0 ? (
          viewMode === 'grid' ? (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: cardViewMode === 'compact' ? 'repeat(auto-fill, minmax(240px, 1fr))' : 'repeat(auto-fill, minmax(300px, 1fr))',
              }}
            >
              {filteredTickets.map((ticket) => (
                <PendingTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  viewMode={cardViewMode === 'compact' ? 'grid-compact' : 'grid-normal'}
                  onMarkPaid={handleOpenPaymentModal}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTickets.map((ticket) => (
                <PendingTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  viewMode={minimizedLineView ? 'compact' : 'normal'}
                  onMarkPaid={handleOpenPaymentModal}
                />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center mt-10 py-6">
            <div className={`${colorTokens.bg} p-3 rounded-full mb-3`}>
              <Receipt size={28} className={colorTokens.text} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              No pending payments
            </h3>
            <p className="text-[13px] text-gray-500 max-w-md text-center">
              All payments have been processed. Completed tickets will appear
              here when they're ready for payment.
            </p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedTicket && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          ticket={selectedTicket as any}
          onConfirm={handlePaymentConfirm}
        />
      )}
    </div>;
}