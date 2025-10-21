import React, { useEffect, useState, useRef } from 'react';
import { Receipt, Search, Calendar, Filter, Download, X, User, Tag, DollarSign, Percent, CreditCard, Clock, ChevronRight, Star, AlertTriangle, Printer, RefreshCcw, FileText } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
interface ClosedTicketsProps {
  isOpen: boolean;
  onClose: () => void;
}
// Payment type interface
interface PaymentType {
  id: string;
  label: string;
  icon: React.ReactNode;
}
// Ticket interface
interface ClosedTicket {
  id: number;
  number: number;
  clientName: string;
  clientType: string;
  technicians: {
    name: string;
    color: string;
  }[];
  services: string[];
  total: number;
  tip: number;
  paymentType: string;
  closedAt: Date;
  isVip?: boolean;
  isAdjusted?: boolean;
}
export function ClosedTickets({
  isOpen,
  onClose
}: ClosedTicketsProps) {
  // Refs
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [techFilter, setTechFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  // Mock payment types
  const paymentTypes: PaymentType[] = [{
    id: 'dejavoo',
    label: 'Dejavoo',
    icon: <CreditCard size={14} className="text-blue-500" />
  }, {
    id: 'cash',
    label: 'Cash',
    icon: <DollarSign size={14} className="text-green-500" />
  }, {
    id: 'rewards',
    label: 'Rewards',
    icon: <Star size={14} className="text-amber-500" />
  }];
  // Sample closed tickets data
  const closedTickets: ClosedTicket[] = [{
    id: 1,
    number: 1001,
    clientName: 'Emma Johnson',
    clientType: 'Regular',
    technicians: [{
      name: 'Sophia Martinez',
      color: 'bg-[#9B5DE5]'
    }],
    services: ['Full Highlights', 'Haircut', 'Blow Dry'],
    total: 185.5,
    tip: 37.0,
    paymentType: 'dejavoo',
    closedAt: new Date(2023, 6, 15, 14, 30),
    isVip: true
  }, {
    id: 2,
    number: 1002,
    clientName: 'Michael Chen',
    clientType: 'New',
    technicians: [{
      name: 'James Wilson',
      color: 'bg-[#3F83F8]'
    }],
    services: ["Men's Haircut", 'Beard Trim'],
    total: 45.0,
    tip: 9.0,
    paymentType: 'cash',
    closedAt: new Date(2023, 6, 15, 15, 15)
  }, {
    id: 3,
    number: 1003,
    clientName: 'Sarah Davis',
    clientType: 'VIP',
    technicians: [{
      name: 'Emma Johnson',
      color: 'bg-[#4CC2A9]'
    }, {
      name: 'Olivia Davis',
      color: 'bg-[#9B5DE5]'
    }],
    services: ['Manicure', 'Pedicure', 'Facial'],
    total: 210.0,
    tip: 42.0,
    paymentType: 'dejavoo',
    closedAt: new Date(2023, 6, 15, 16, 45),
    isVip: true
  }, {
    id: 4,
    number: 1004,
    clientName: 'Robert Wilson',
    clientType: 'Regular',
    technicians: [{
      name: 'Michael Brown',
      color: 'bg-[#E5565B]'
    }],
    services: ["Men's Haircut"],
    total: 35.0,
    tip: 5.0,
    paymentType: 'cash',
    closedAt: new Date(2023, 6, 16, 10, 30)
  }, {
    id: 5,
    number: 1005,
    clientName: 'Jennifer Lopez',
    clientType: 'VIP',
    technicians: [{
      name: 'Sophia Martinez',
      color: 'bg-[#9B5DE5]'
    }, {
      name: 'Emma Johnson',
      color: 'bg-[#4CC2A9]'
    }],
    services: ['Color Correction', 'Haircut', 'Treatment', 'Styling'],
    total: 350.0,
    tip: 70.0,
    paymentType: 'dejavoo',
    closedAt: new Date(2023, 6, 16, 11, 45),
    isVip: true
  }, {
    id: 6,
    number: 1006,
    clientName: 'David Thompson',
    clientType: 'Regular',
    technicians: [{
      name: 'James Wilson',
      color: 'bg-[#3F83F8]'
    }],
    services: ["Men's Haircut", 'Shave'],
    total: 55.0,
    tip: 10.0,
    paymentType: 'rewards',
    closedAt: new Date(2023, 6, 16, 13, 15)
  }, {
    id: 7,
    number: 1007,
    clientName: 'Amanda Miller',
    clientType: 'Regular',
    technicians: [{
      name: 'Olivia Davis',
      color: 'bg-[#9B5DE5]'
    }],
    services: ['Balayage', 'Haircut', 'Blow Dry'],
    total: 240.0,
    tip: 48.0,
    paymentType: 'dejavoo',
    closedAt: new Date(2023, 6, 16, 14, 30),
    isAdjusted: true
  }, {
    id: 8,
    number: 1008,
    clientName: 'Thomas Jackson',
    clientType: 'New',
    technicians: [{
      name: 'Michael Brown',
      color: 'bg-[#E5565B]'
    }],
    services: ["Men's Haircut", 'Beard Trim'],
    total: 45.0,
    tip: 0.0,
    paymentType: 'cash',
    closedAt: new Date(2023, 6, 16, 15, 45)
  }, {
    id: 9,
    number: 1009,
    clientName: 'Jessica White',
    clientType: 'VIP',
    technicians: [{
      name: 'Emma Johnson',
      color: 'bg-[#4CC2A9]'
    }],
    services: ['Full Highlights', 'Haircut', 'Treatment'],
    total: 210.0,
    tip: 42.0,
    paymentType: 'dejavoo',
    closedAt: new Date(2023, 6, 16, 16, 30),
    isVip: true
  }, {
    id: 10,
    number: 1010,
    clientName: 'Kevin Brown',
    clientType: 'Regular',
    technicians: [{
      name: 'James Wilson',
      color: 'bg-[#3F83F8]'
    }],
    services: ["Men's Haircut"],
    total: 35.0,
    tip: 7.0,
    paymentType: 'cash',
    closedAt: new Date(2023, 6, 17, 10, 15)
  }, {
    id: 11,
    number: 1011,
    clientName: 'Nicole Garcia',
    clientType: 'Regular',
    technicians: [{
      name: 'Sophia Martinez',
      color: 'bg-[#9B5DE5]'
    }],
    services: ['Haircut', 'Blow Dry'],
    total: 85.0,
    tip: 17.0,
    paymentType: 'dejavoo',
    closedAt: new Date(2023, 6, 17, 11, 30)
  }, {
    id: 12,
    number: 1012,
    clientName: 'Brian Martinez',
    clientType: 'New',
    technicians: [{
      name: 'Michael Brown',
      color: 'bg-[#E5565B]'
    }],
    services: ["Men's Haircut", 'Shave'],
    total: 55.0,
    tip: 11.0,
    paymentType: 'rewards',
    closedAt: new Date(2023, 6, 17, 13, 0),
    isAdjusted: true
  }];
  // Filter tickets based on search term and filters
  const filteredTickets = closedTickets.filter(ticket => {
    const matchesSearch = searchTerm === '' || ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.number.toString().includes(searchTerm) || ticket.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTech = techFilter === '' || ticket.technicians.some(tech => tech.name === techFilter);
    const matchesPayment = paymentFilter === '' || ticket.paymentType === paymentFilter;
    // Date filtering logic
    let matchesDate = true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateFilter === 'today') {
      const ticketDate = new Date(ticket.closedAt);
      ticketDate.setHours(0, 0, 0, 0);
      matchesDate = ticketDate.getTime() === today.getTime();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      matchesDate = ticket.closedAt >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      matchesDate = ticket.closedAt >= monthAgo;
    }
    return matchesSearch && matchesTech && matchesPayment && matchesDate;
  });
  // Handle click outside to close the overlay
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  // Focus search input when overlay opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);
  // Handle row expansion
  const toggleRowExpansion = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };
  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  // Handle export to CSV
  const handleExportCSV = () => {
    // Implementation would go here
    console.log('Export to CSV');
  };
  // Handle export to PDF
  const handleExportPDF = () => {
    // Implementation would go here
    console.log('Export to PDF');
  };
  // Get payment type icon
  const getPaymentTypeIcon = (type: string) => {
    const paymentType = paymentTypes.find(p => p.id === type);
    return paymentType?.icon || <CreditCard size={14} />;
  };
  // Get payment type label
  const getPaymentTypeLabel = (type: string) => {
    const paymentType = paymentTypes.find(p => p.id === type);
    return paymentType?.label || type;
  };
  // If not open, don't render anything
  if (!isOpen) return null;
  return <div className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-end justify-center">
      <div ref={overlayRef} className="bg-white rounded-t-xl shadow-xl w-full max-w-full h-[70vh] flex flex-col transform transition-transform duration-300 ease-in-out" style={{
      boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
    }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
          <div className="flex items-center">
            <div className="bg-rose-50 p-2 rounded-md mr-3">
              <Receipt size={20} className="text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Closed Tickets</h2>
            <div className="ml-2 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
              {filteredTickets.length}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        {/* Search and filters */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 sticky top-14 z-10">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input ref={searchInputRef} type="text" placeholder="Search by name, ticket #, or service..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {/* Filter toggle */}
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Filter size={16} className="mr-2 text-gray-500" />
              Filters
            </button>
            {/* Date filter dropdown */}
            <div className="relative">
              <button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Calendar size={16} className="mr-2 text-gray-500" />
                {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'Last 7 Days' : dateFilter === 'month' ? 'Last 30 Days' : 'Custom'}
                <ChevronRight size={16} className="ml-1 text-gray-500" />
              </button>
            </div>
            {/* Export buttons */}
            <div className="flex items-center ml-auto">
              <Tippy content="Export to CSV">
                <button onClick={handleExportCSV} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                  <Download size={18} />
                </button>
              </Tippy>
              <Tippy content="Export to PDF">
                <button onClick={handleExportPDF} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md ml-1">
                  <FileText size={18} />
                </button>
              </Tippy>
            </div>
          </div>
          {/* Expanded filters */}
          {showFilters && <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Technician filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technician
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm" value={techFilter} onChange={e => setTechFilter(e.target.value)}>
                  <option value="">All Technicians</option>
                  <option value="Sophia Martinez">Sophia Martinez</option>
                  <option value="James Wilson">James Wilson</option>
                  <option value="Emma Johnson">Emma Johnson</option>
                  <option value="Michael Brown">Michael Brown</option>
                  <option value="Olivia Davis">Olivia Davis</option>
                </select>
              </div>
              {/* Payment type filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Type
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
                  <option value="">All Payment Types</option>
                  <option value="dejavoo">Dejavoo</option>
                  <option value="cash">Cash</option>
                  <option value="rewards">Rewards</option>
                </select>
              </div>
              {/* Date range filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm" value={dateFilter} onChange={e => setDateFilter(e.target.value as 'today' | 'week' | 'month' | 'custom')}>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>}
        </div>
        {/* Table header */}
        <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 sticky top-[118px] z-10">
          <div className="col-span-1">Ticket #</div>
          <div className="col-span-2">Client</div>
          <div className="col-span-2">Tech(s)</div>
          <div className="col-span-2">Services</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-1 text-right">Tip</div>
          <div className="col-span-1">Payment</div>
          <div className="col-span-2">Closed Date/Time</div>
        </div>
        {/* Table body */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {filteredTickets.length === 0 ? <div className="flex flex-col items-center justify-center h-full py-10">
              <div className="bg-gray-100 p-3 rounded-full mb-3">
                <Receipt size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">
                No tickets found
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-md">
                Try adjusting your search or filters to see more results.
              </p>
            </div> : <div className="divide-y divide-gray-200">
              {filteredTickets.map(ticket => <div key={ticket.id} className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-sm hover:bg-white transition-colors ${expandedRow === ticket.id ? 'bg-white shadow-sm' : ''}`} onClick={() => toggleRowExpansion(ticket.id)}>
                  {/* Ticket # */}
                  <div className="col-span-1 flex items-center">
                    <div className="bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-1.5 shadow-sm">
                      {ticket.number % 100}
                    </div>
                    <span className="text-gray-500 text-xs">
                      {ticket.number}
                    </span>
                  </div>
                  {/* Client */}
                  <div className="col-span-2 flex items-center">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-800">
                          {ticket.clientName}
                        </span>
                        {ticket.isVip && <Tippy content="VIP Client">
                            <span className="ml-1 text-amber-500">
                              <Star size={14} fill="currentColor" />
                            </span>
                          </Tippy>}
                      </div>
                      <span className="text-xs text-gray-500">
                        {ticket.clientType}
                      </span>
                    </div>
                  </div>
                  {/* Technicians */}
                  <div className="col-span-2">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full ${ticket.technicians[0].color} text-white flex items-center justify-center text-xs font-bold shadow-sm`}>
                        {ticket.technicians[0].name.charAt(0)}
                      </div>
                      <span className="ml-1.5 text-gray-700 truncate">
                        {ticket.technicians[0].name}
                      </span>
                      {ticket.technicians.length > 1 && <Tippy content={<div className="p-1">
                              {ticket.technicians.slice(1).map((tech, index) => <div key={index} className="flex items-center py-1">
                                    <div className={`w-5 h-5 rounded-full ${tech.color} text-white flex items-center justify-center text-xs font-bold`}>
                                      {tech.name.charAt(0)}
                                    </div>
                                    <span className="ml-1.5 text-white">
                                      {tech.name}
                                    </span>
                                  </div>)}
                            </div>} interactive={true}>
                          <span className="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                            +{ticket.technicians.length - 1}
                          </span>
                        </Tippy>}
                    </div>
                  </div>
                  {/* Services */}
                  <div className="col-span-2">
                    <div className="flex items-center">
                      <Tag size={14} className="text-gray-400 mr-1.5 flex-shrink-0" />
                      <span className="text-gray-700 truncate">
                        {ticket.services[0]}
                      </span>
                      {ticket.services.length > 1 && <Tippy content={<div className="p-1">
                              {ticket.services.slice(1).map((service, index) => <div key={index} className="py-1 text-white">
                                    {service}
                                  </div>)}
                            </div>} interactive={true}>
                          <span className="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                            +{ticket.services.length - 1}
                          </span>
                        </Tippy>}
                    </div>
                  </div>
                  {/* Total */}
                  <div className="col-span-1 text-right">
                    <span className="font-semibold text-gray-800">
                      ${ticket.total.toFixed(2)}
                    </span>
                    {ticket.isAdjusted && <Tippy content="Price adjusted">
                        <span className="ml-1 text-amber-500">
                          <AlertTriangle size={14} />
                        </span>
                      </Tippy>}
                  </div>
                  {/* Tip */}
                  <div className="col-span-1 text-right">
                    <span className={ticket.tip > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                      {ticket.tip > 0 ? `$${ticket.tip.toFixed(2)}` : '—'}
                    </span>
                  </div>
                  {/* Payment Type */}
                  <div className="col-span-1">
                    <div className="flex items-center">
                      {getPaymentTypeIcon(ticket.paymentType)}
                      <span className="ml-1 text-gray-700">
                        {getPaymentTypeLabel(ticket.paymentType)}
                      </span>
                    </div>
                  </div>
                  {/* Closed Date/Time */}
                  <div className="col-span-2">
                    <div className="flex flex-col">
                      <span className="text-gray-700">
                        {formatDate(ticket.closedAt)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(ticket.closedAt)}
                      </span>
                    </div>
                  </div>
                  {/* Expanded row actions */}
                  {expandedRow === ticket.id && <div className="col-span-12 mt-2 pt-2 border-t border-gray-200 flex items-center justify-end space-x-2">
                      <button className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center">
                        <FileText size={14} className="mr-1.5 text-gray-500" />
                        View Full Ticket
                      </button>
                      <button className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center">
                        <Printer size={14} className="mr-1.5 text-gray-500" />
                        Reprint
                      </button>
                      <button className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center">
                        <RefreshCcw size={14} className="mr-1.5 text-gray-500" />
                        Refund
                      </button>
                    </div>}
                </div>)}
            </div>}
        </div>
      </div>
    </div>;
}