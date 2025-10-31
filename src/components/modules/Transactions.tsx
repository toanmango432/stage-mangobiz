import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  MoreVertical,
  Eye,
  Edit2,
  XCircle,
  RotateCcw,
  ChevronDown,
  X,
  User,
  Clock,
  CreditCard
} from 'lucide-react';
import { useTickets } from '../../hooks/useTicketsCompat';
import { ClosedTickets } from '../ClosedTickets';

type TransactionStatus = 'all' | 'closed' | 'completed' | 'voided' | 'refunded';
type DateFilter = '7days' | '30days' | '90days' | 'custom';

export function Transactions() {
  const { completed, pendingTickets } = useTickets();
  const [activeStatus, setActiveStatus] = useState<TransactionStatus>('closed');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
  const [showClosedTicketsModal, setShowClosedTicketsModal] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = completed.reduce((sum, ticket) => sum + (ticket.total || 0), 0);
    const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;
    
    return {
      totalRevenue,
      totalTransactions: completed.length,
      avgTicket,
      pendingCount: pendingTickets.length
    };
  }, [completed, pendingTickets]);

  // Status tabs
  const statusTabs = [
    { id: 'all' as TransactionStatus, label: 'All Tickets', count: completed.length },
    { id: 'closed' as TransactionStatus, label: 'Closed', count: completed.length },
    { id: 'completed' as TransactionStatus, label: 'Completed', count: 0 },
    { id: 'voided' as TransactionStatus, label: 'Voided', count: 0 },
    { id: 'refunded' as TransactionStatus, label: 'Refunded', count: 0 },
  ];

  // Filter transactions based on status and search
  const filteredTransactions = useMemo(() => {
    let filtered = [...completed];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(ticket => 
        ticket.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id?.toString().includes(searchQuery)
      );
    }

    return filtered;
  }, [completed, searchQuery, activeStatus]);

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-600 mt-1">View and manage all ticket transactions</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Total Revenue</span>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-blue-700 mt-1">Last 30 days</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-900">Transactions</span>
                <Receipt className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">{stats.totalTransactions}</p>
              <p className="text-xs text-green-700 mt-1">Completed tickets</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900">Avg Ticket</span>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">${stats.avgTicket.toFixed(2)}</p>
              <p className="text-xs text-purple-700 mt-1">Per transaction</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-900">Pending</span>
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-900">{stats.pendingCount}</p>
              <p className="text-xs text-orange-700 mt-1">Awaiting checkout</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client name, ticket ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                showFilters 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Last 30 days</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Advanced Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm">
                    <option>All Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm">
                    <option>All Methods</option>
                    <option>Cash</option>
                    <option>Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm">
                    <option>Any Amount</option>
                    <option>$0 - $50</option>
                    <option>$50 - $100</option>
                    <option>$100+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm">
                    <option>All Services</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeStatus === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeStatus === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {activeStatus === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {activeStatus === 'closed' ? (
            // Use existing ClosedTickets component for closed status
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowClosedTicketsModal(true)}
                className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">View Closed Tickets</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {completed.length} closed tickets • Click to view details
                    </p>
                  </div>
                  <Eye className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search or filters' : 'Transactions will appear here'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Services
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">#{ticket.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm text-gray-900">{ticket.clientName || 'Walk-in'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{ticket.techName || 'Unassigned'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{ticket.service || 'Multiple services'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          ${(ticket.total || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Card</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {new Date().toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Closed Tickets Modal */}
      {showClosedTicketsModal && (
        <ClosedTickets 
          isOpen={showClosedTicketsModal} 
          onClose={() => setShowClosedTicketsModal(false)}
        />
      )}
    </div>
  );
}
