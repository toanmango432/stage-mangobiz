import React, { useEffect, useState, useRef } from 'react';
import { useTickets } from '../hooks/useTicketsCompat';
import { Receipt, ChevronDown, ChevronUp, Clock, UserCheck, CheckCircle, DollarSign, CreditCard, MoreVertical, Trash2, Edit2, Printer, Mail, Share2, MessageSquare, Star, Tag, Users, Maximize2 } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
interface PendingTicketsProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}
export function PendingTickets({
  isMinimized = false,
  onToggleMinimize
}: PendingTicketsProps) {
  const {
    pendingTickets,
    markTicketAsPaid
  } = useTickets();
  const [activeTab, setActiveTab] = useState('all');
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Toggle dropdown for a ticket
  const toggleDropdown = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };
  // Paper textures for tickets
  const paperTextures = ["url('https://www.transparenttextures.com/patterns/paper.png')", "url('https://www.transparenttextures.com/patterns/paper-fibers.png')", "url('https://www.transparenttextures.com/patterns/rice-paper.png')", "url('https://www.transparenttextures.com/patterns/soft-paper.png')", "url('https://www.transparenttextures.com/patterns/handmade-paper.png')"];
  // Paper background colors
  const paperVariations = ['#FFFDF7', '#FFFEF9', '#FFFCF5', '#FFFDF8', '#FFFEFA'];
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
        {filteredTickets.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredTickets.map((ticket, index) => {
          // Generate unique paper style for this ticket
          const paperColor = paperVariations[ticket.id % paperVariations.length];
          const texturePattern = paperTextures[ticket.id % paperTextures.length];
          return <div key={ticket.id} className={`rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 relative overflow-hidden ${index % 2 === 0 ? 'bg-opacity-100' : 'bg-opacity-95'}`} style={{
            backgroundColor: paperColor,
            backgroundImage: texturePattern,
            backgroundBlendMode: 'multiply',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 2px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.2)'
          }}>
                  {/* Ticket stub edge with semicircle cut-outs */}
                  <div className="absolute top-0 left-0 h-full w-1 flex flex-col justify-between items-center pointer-events-none opacity-60">
                    <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
                    <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
                    <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
                  </div>
                  {/* Left accent bar */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#FF6B6B] opacity-70"></div>
                  {/* Header with ticket number */}
                  <div className="flex justify-between items-center p-3 border-b border-dashed border-gray-300">
                    <div className="flex items-center">
                      <div className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm mr-2 border border-gray-800" style={{
                  textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
                }}>
                        {ticket.number}
                      </div>
                      <div className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                        #{ticket.id}
                      </div>
                    </div>
                    <div className="relative">
                      <Tippy content="More options">
                        <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50 transition-colors" onClick={e => toggleDropdown(ticket.id, e)} aria-label="More options" aria-haspopup="true" aria-expanded={openDropdownId === ticket.id}>
                          <MoreVertical size={14} />
                        </button>
                      </Tippy>
                      {openDropdownId === ticket.id && <div ref={dropdownRef} className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-1" role="menu">
                          <button className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center" role="menuitem">
                            <Edit2 size={14} className="mr-2 text-blue-500" />
                            Edit Receipt
                          </button>
                          <button className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center" role="menuitem">
                            <Printer size={14} className="mr-2 text-gray-500" />
                            Print Receipt
                          </button>
                          <button className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center" role="menuitem">
                            <Mail size={14} className="mr-2 text-gray-500" />
                            Email Receipt
                          </button>
                          <button className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-red-50 flex items-center" role="menuitem">
                            <Trash2 size={14} className="mr-2 text-red-500" />
                            Void Receipt
                          </button>
                        </div>}
                    </div>
                  </div>
                  {/* Client and service info - improved padding */}
                  <div className="px-3 py-2.5">
                    <div className="flex items-center mb-2">
                      <UserCheck size={14} className="text-blue-500 mr-2" />
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {ticket.clientName}
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 mb-3">
                      <Tag size={12} className="text-blue-500 mr-1.5" />
                      <span className="truncate">
                        {ticket.service}
                        {ticket.additionalServices > 0 && <span className="ml-1 text-[9px] bg-gray-100 px-1 rounded-sm border border-gray-200">
                            +{ticket.additionalServices}
                          </span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-800">
                        ${ticket.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium text-gray-800">
                        ${ticket.tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-gray-600">Tip:</span>
                      <span className="font-medium text-gray-800">
                        ${ticket.tip.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm border-t border-gray-200 pt-2">
                      <span className="font-medium text-gray-800">Total:</span>
                      <span className="font-bold text-gray-900">
                        $
                        {(ticket.subtotal + ticket.tax + ticket.tip).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* Payment method and action button */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center">
                      {ticket.paymentType === 'card' ? <div className="flex items-center text-xs text-gray-700">
                          <CreditCard size={14} className="text-blue-500 mr-1.5" />
                          Card Payment
                        </div> : ticket.paymentType === 'cash' ? <div className="flex items-center text-xs text-gray-700">
                          <DollarSign size={14} className="text-green-500 mr-1.5" />
                          Cash Payment
                        </div> : <div className="flex items-center text-xs text-gray-700">
                          <Share2 size={14} className="text-purple-500 mr-1.5" />
                          Venmo
                        </div>}
                    </div>
                    <button onClick={() => markTicketAsPaid(ticket.id)} className="flex items-center py-1.5 px-3 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
                      <CheckCircle size={12} className="mr-1.5" />
                      Mark Paid
                    </button>
                  </div>
                  {/* PAID/UNPAID stamp overlay */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.08] pointer-events-none">
                    <div className="text-[#FF6B6B] font-bold text-2xl tracking-wider uppercase" style={{
                letterSpacing: '0.1em',
                textShadow: '0 0 1px rgba(255,107,107,0.2)',
                fontFamily: 'monospace'
              }}>
                      UNPAID
                    </div>
                  </div>
                </div>;
        })}
          </div> : <div className="flex flex-col items-center mt-10 py-6">
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
          </div>}
      </div>
    </div>;
}