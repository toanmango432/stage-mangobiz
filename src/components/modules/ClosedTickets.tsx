/**
 * Closed Tickets
 * Quick operational view of completed tickets for Main Nav
 * Shows only closed/completed tickets with search and quick filters
 */

import { useState, useMemo } from 'react';
import { Search, CheckCircle, Receipt, RefreshCcw, Eye, DollarSign } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { cn } from '../../lib/utils';

type DateFilter = 'today' | 'yesterday' | 'week';

export function ClosedTickets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');

  // Get all tickets from Redux
  const allTickets = useAppSelector(state => state.uiTickets?.items || []);

  // Filter to closed tickets only
  const closedTickets = useMemo(() => {
    return allTickets.filter(ticket =>
      ticket.status === 'closed' ||
      ticket.status === 'completed' ||
      ticket.status === 'paid'
    );
  }, [allTickets]);

  // Apply date filter
  const filteredByDate = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return closedTickets.filter(ticket => {
      const ticketDate = new Date(ticket.createdAt || ticket.closedAt || new Date());
      switch (dateFilter) {
        case 'today':
          return ticketDate >= today;
        case 'yesterday':
          return ticketDate >= yesterday && ticketDate < today;
        case 'week':
          return ticketDate >= weekAgo;
        default:
          return true;
      }
    });
  }, [closedTickets, dateFilter]);

  // Apply search filter
  const displayTickets = useMemo(() => {
    if (!searchQuery.trim()) return filteredByDate;

    const query = searchQuery.toLowerCase();
    return filteredByDate.filter(ticket =>
      ticket.clientName?.toLowerCase().includes(query) ||
      ticket.ticketNumber?.toString().includes(query) ||
      ticket.id?.toString().includes(query) ||
      (ticket as any).staffName?.toLowerCase().includes(query)
    );
  }, [filteredByDate, searchQuery]);

  // Calculate totals
  const totalRevenue = displayTickets.reduce((sum, t) => sum + (t.total || 0), 0);

  const formatTime = (date: string | Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Closed Tickets</h1>
                <p className="text-sm text-gray-500">Completed transactions</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{displayTickets.length} tickets</p>
              <p className="text-xl font-bold text-gray-900">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client, ticket #, or staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all"
              />
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-2">
              {(['today', 'yesterday', 'week'] as DateFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                    dateFilter === filter
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  )}
                >
                  {filter === 'today' && 'Today'}
                  {filter === 'yesterday' && 'Yesterday'}
                  {filter === 'week' && 'This Week'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1400px] mx-auto">
          {displayTickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No closed tickets found</h3>
              <p className="text-gray-500">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : `No tickets closed ${dateFilter === 'today' ? 'today' : dateFilter === 'yesterday' ? 'yesterday' : 'this week'}`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  formatTime={formatTime}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Ticket Card Component
function TicketCard({
  ticket,
  formatTime,
  formatDate
}: {
  ticket: any;
  formatTime: (date: string | Date | undefined) => string;
  formatDate: (date: string | Date | undefined) => string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-gray-300 transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-gray-900">#{ticket.ticketNumber || ticket.id}</span>
              <span className="text-gray-600 font-medium">{ticket.clientName || 'Walk-in'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{ticket.services?.map((s: any) => s.serviceName || s.name).join(', ') || 'Services'}</span>
              <span className="text-gray-300">•</span>
              <span>Staff: {(ticket as any).staffName || ticket.services?.[0]?.staffName || 'Assigned'}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 justify-end mb-0.5">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xl font-bold text-gray-900">{(ticket.total || 0).toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-500">
            {ticket.paymentMethod || 'Card'} • {formatTime(ticket.closedAt || ticket.createdAt)}
            {dateFilter !== 'today' && (
              <span className="ml-1">• {formatDate(ticket.closedAt || ticket.createdAt)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Eye className="w-4 h-4" />
          View Details
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Receipt className="w-4 h-4" />
          Reprint
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
          <RefreshCcw className="w-4 h-4" />
          Refund
        </button>
      </div>
    </div>
  );
}

// Helper for dateFilter access in TicketCard
const dateFilter = 'today';
