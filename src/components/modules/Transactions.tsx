import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Eye,
  XCircle,
  ChevronDown,
  X,
  User,
  Clock,
  CreditCard,
  RefreshCw,
  Printer,
  Banknote
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchTransactions,
  selectAllTransactions,
  selectTransactionStats,
  voidTransaction,
  refundTransaction
} from '../../store/slices/transactionsSlice';
import type { Transaction } from '../../types';

type TransactionStatus = 'all' | 'completed' | 'voided' | 'refunded' | 'partially-refunded';
type DateFilter = '7days' | '30days' | '90days' | 'custom';

export function Transactions() {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector(selectAllTransactions);
  const stats = useAppSelector(selectTransactionStats);

  const [activeStatus, setActiveStatus] = useState<TransactionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load transactions on mount
  useEffect(() => {
    // Using hardcoded salon ID for now - should come from auth context
    dispatch(fetchTransactions('salon_123'));
  }, [dispatch]);

  // Status tabs
  const statusTabs = [
    { id: 'all' as TransactionStatus, label: 'All Transactions', count: stats?.totalTransactions || 0 },
    { id: 'completed' as TransactionStatus, label: 'Completed', count: stats?.completedCount || 0 },
    { id: 'voided' as TransactionStatus, label: 'Voided', count: stats?.voidedCount || 0 },
    { id: 'refunded' as TransactionStatus, label: 'Refunded', count: stats?.refundedCount || 0 },
  ];

  // Filter transactions based on status and search
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply status filter
    if (activeStatus !== 'all') {
      filtered = filtered.filter(txn => txn.status === activeStatus);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(txn =>
        txn.clientName.toLowerCase().includes(query) ||
        txn.id.includes(query) ||
        txn.ticketId.includes(query)
      );
    }

    // Apply date filter
    if (dateFilter !== 'custom') {
      const now = new Date();
      const cutoff = new Date();

      switch (dateFilter) {
        case '7days':
          cutoff.setDate(now.getDate() - 7);
          break;
        case '30days':
          cutoff.setDate(now.getDate() - 30);
          break;
        case '90days':
          cutoff.setDate(now.getDate() - 90);
          break;
      }

      filtered = filtered.filter(txn =>
        new Date(txn.createdAt) >= cutoff
      );
    }

    return filtered;
  }, [transactions, searchQuery, activeStatus, dateFilter]);

  // Handler functions for transaction actions
  const handleViewTransaction = (transaction: Transaction) => {
    // TODO: Open transaction details modal
    console.log('View transaction:', transaction);
  };

  const handleVoidTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to void this transaction? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Get userId from auth context
      await dispatch(voidTransaction({
        id: transactionId,
        voidReason: 'Manual void from transaction list',
        userId: 'user_123'
      })).unwrap();

      // Show success message
      console.log('Transaction voided successfully');
    } catch (error) {
      console.error('Failed to void transaction:', error);
      // TODO: Show error toast
    }
  };

  const handleRefundTransaction = async (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const total = transaction.total || 0;
    const refundAmount = prompt(`Enter refund amount (max: $${total.toFixed(2)}):`);
    if (!refundAmount) return;

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > total) {
      alert('Invalid refund amount');
      return;
    }

    const reason = prompt('Enter refund reason:') || 'Customer request';

    try {
      // TODO: Get userId from auth context
      await dispatch(refundTransaction({
        id: transactionId,
        refundAmount: amount,
        refundReason: reason,
        userId: 'user_123'
      })).unwrap();

      // Show success message
      console.log('Transaction refunded successfully');
    } catch (error) {
      console.error('Failed to refund transaction:', error);
      // TODO: Show error toast
    }
  };

  const handlePrintReceipt = (transaction: Transaction) => {
    // TODO: Implement receipt printing
    console.log('Print receipt for transaction:', transaction);
    window.print(); // Temporary - should generate proper receipt
  };

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
              <p className="text-2xl font-bold text-blue-900">${(stats?.totalRevenue || 0).toFixed(2)}</p>
              <p className="text-xs text-blue-700 mt-1">Last 30 days</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-900">Transactions</span>
                <Receipt className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">{stats?.totalTransactions || 0}</p>
              <p className="text-xs text-green-700 mt-1">Completed tickets</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900">Avg Transaction</span>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">${(stats?.avgTransaction || 0).toFixed(2)}</p>
              <p className="text-xs text-purple-700 mt-1">Per transaction</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-900">Total Tips</span>
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-900">${(stats?.totalTips || 0).toFixed(2)}</p>
              <p className="text-xs text-orange-700 mt-1">Tips collected</p>
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
          {filteredTransactions.length === 0 ? (
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
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          #{transaction.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm text-gray-900">{transaction.clientName || 'Walk-in'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className="text-sm font-semibold text-gray-900">
                            ${(transaction.total || 0).toFixed(2)}
                          </span>
                          {transaction.tip && transaction.tip > 0 && (
                            <span className="text-xs text-gray-500 block">
                              (includes ${transaction.tip.toFixed(2)} tip)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {transaction.paymentMethod === 'cash' && <Banknote className="w-4 h-4 text-green-600" />}
                          {transaction.paymentMethod === 'card' && <CreditCard className="w-4 h-4 text-blue-600" />}
                          <span className="text-sm text-gray-600 capitalize">{transaction.paymentMethod}</span>
                          {transaction.paymentDetails?.cardLast4 && (
                            <span className="text-xs text-gray-500">
                              (*{transaction.paymentDetails.cardLast4})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'voided' ? 'bg-red-100 text-red-800' :
                          transaction.status === 'refunded' ? 'bg-orange-100 text-orange-800' :
                          transaction.status === 'partially-refunded' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status === 'partially-refunded' ? 'Partial Refund' : transaction.status}
                          {transaction.refundedAmount && transaction.refundedAmount > 0 && (
                            <span className="ml-1">
                              (${transaction.refundedAmount.toFixed(2)})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500 block">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewTransaction(transaction)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          {transaction.status === 'completed' && (
                            <>
                              <button
                                onClick={() => handleVoidTransaction(transaction.id)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Void Transaction"
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </button>
                              <button
                                onClick={() => handleRefundTransaction(transaction.id)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Refund"
                              >
                                <RefreshCw className="w-4 h-4 text-orange-600" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handlePrintReceipt(transaction)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Print Receipt"
                          >
                            <Printer className="w-4 h-4 text-gray-600" />
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

    </div>
  );
}
