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
  Edit2,
  X,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Users
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectAllAppointments,
  selectIsLoading as selectAppointmentsLoading,
  fetchAppointments
} from '../../store/slices/appointmentsSlice';
import {
  selectAllTickets,
  selectTicketsLoading,
  fetchTickets
} from '../../store/slices/ticketsSlice';
import type { LocalAppointment } from '../../types/appointment';
import type { Ticket } from '../../types';

type SalesTab = 'appointments' | 'tickets';
type DateFilter = '7days' | '30days' | '90days' | 'custom';

export function Sales() {
  const dispatch = useAppDispatch();

  // Data from Redux
  const appointments = useAppSelector(selectAllAppointments);
  const tickets = useAppSelector(selectAllTickets);
  const appointmentsLoading = useAppSelector(selectAppointmentsLoading);
  const ticketsLoading = useAppSelector(selectTicketsLoading);

  // UI State
  const [activeTab, setActiveTab] = useState<SalesTab>('tickets');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load data on mount
  useEffect(() => {
    // Load appointments
    const now = new Date();
    const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days future

    dispatch(fetchAppointments({
      rvcNo: 1, // TODO: Get from context
      startDate,
      endDate
    }));

    // Load tickets
    dispatch(fetchTickets('salon_123')); // TODO: Get salonId from context
  }, [dispatch]);

  // Calculate stats based on active tab
  const stats = useMemo(() => {
    if (activeTab === 'tickets') {
      const total = tickets.length;
      const active = tickets.filter(t => t.status === 'in-progress').length;
      const pending = tickets.filter(t => t.status === 'pending').length;
      const completed = tickets.filter(t => t.status === 'completed').length;
      const avgValue = total > 0
        ? tickets.reduce((sum, t) => sum + (t.total || 0), 0) / total
        : 0;

      return {
        total,
        active,
        pending,
        completed,
        avgValue
      };
    } else {
      const total = appointments.length;
      const completed = appointments.filter(a => a.status === 'completed').length;
      const scheduled = appointments.filter(a => a.status === 'scheduled').length;
      const cancelled = appointments.filter(a => a.status === 'cancelled').length;
      const noShow = appointments.filter(a => a.status === 'no-show').length;

      return {
        total,
        completed,
        scheduled,
        cancelled,
        noShow,
        completionRate: total > 0 ? (completed / total * 100).toFixed(1) : '0'
      };
    }
  }, [activeTab, appointments, tickets]);

  // Filter data based on active tab
  const filteredData = useMemo(() => {
    const data = activeTab === 'tickets' ? tickets : appointments;
    let filtered = [...data];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        if ('clientName' in item) {
          return item.clientName?.toLowerCase().includes(query) ||
                 item.clientPhone?.includes(query);
        } else {
          return item.clientName?.toLowerCase().includes(query) ||
                 item.id?.includes(query);
        }
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
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

      filtered = filtered.filter(item => {
        const itemDate = 'scheduledStartTime' in item
          ? new Date(item.scheduledStartTime)
          : new Date(item.createdAt);
        return itemDate >= cutoff;
      });
    }

    return filtered;
  }, [activeTab, appointments, tickets, searchQuery, statusFilter, dateFilter]);

  // Get status options based on active tab
  const statusOptions = useMemo(() => {
    if (activeTab === 'tickets') {
      return [
        { value: 'all', label: 'All Statuses' },
        { value: 'new', label: 'New' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'pending', label: 'Pending Checkout' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ];
    } else {
      return [
        { value: 'all', label: 'All Statuses' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'checked-in', label: 'Checked In' },
        { value: 'in-service', label: 'In Service' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'no-show', label: 'No Show' }
      ];
    }
  }, [activeTab]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'checked-in': 'bg-yellow-100 text-yellow-800',
      'in-service': 'bg-purple-100 text-purple-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'no-show': 'bg-red-100 text-red-800',
      'new': 'bg-blue-100 text-blue-800',
      'pending': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
              <p className="text-gray-600 mt-1">View and manage appointments and tickets</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {activeTab === 'tickets' ? (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Total Tickets</span>
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                <p className="text-xs text-blue-700 mt-1">All tickets</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-900">Active</span>
                  <PlayCircle className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-900">{stats.active}</p>
                <p className="text-xs text-purple-700 mt-1">In progress</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-orange-900">Pending</span>
                  <PauseCircle className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-900">{stats.pending}</p>
                <p className="text-xs text-orange-700 mt-1">Awaiting checkout</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">Avg Value</span>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900">${stats.avgValue.toFixed(2)}</p>
                <p className="text-xs text-green-700 mt-1">Per ticket</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Total Appointments</span>
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                <p className="text-xs text-blue-700 mt-1">All time</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">Completed</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                <p className="text-xs text-green-700 mt-1">{stats.completionRate}% completion rate</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-900">Scheduled</span>
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-900">{stats.scheduled}</p>
                <p className="text-xs text-purple-700 mt-1">Upcoming</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-900">No Shows</span>
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-900">{stats.noShow}</p>
                <p className="text-xs text-red-700 mt-1">Missed appointments</p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('tickets');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'tickets'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tickets
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100">
                {tickets.length}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab('appointments');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'appointments'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Appointments
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100">
                {appointments.length}
              </span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {filteredData.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No {activeTab} found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search or filters' : `No ${activeTab} to display`}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {activeTab === 'tickets' ? (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ticket #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Staff/Tech
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Services
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
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
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      {activeTab === 'tickets' ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              #{item.id?.slice(0, 8)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(item.createdAt)}</div>
                            <div className="text-sm text-gray-500">{formatTime(item.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm text-gray-900">{item.clientName || 'Walk-in'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{item.techName || 'Unassigned'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {item.items?.map((i: any) => i.name).join(', ') || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              ${(item.total || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                              {item.status}
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
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(item.scheduledStartTime)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatTime(item.scheduledStartTime)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.clientName || 'Walk-in'}
                                </div>
                                {item.clientPhone && (
                                  <div className="text-sm text-gray-500">{item.clientPhone}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{item.staffName || 'Unassigned'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {item.services?.map((s: any) => s.serviceName).join(', ') || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600 capitalize">{item.source || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
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
