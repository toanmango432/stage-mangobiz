import { useState, useMemo, useEffect } from 'react';
import {
  Download,
  Calendar,
  Eye,
  Edit2,
  User,
  Users,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Zap,
  History,
  GitMerge,
  Plus
} from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import type { LocalAppointment } from '../../types/appointment';
import type { Ticket } from '../../types';
import { SalesDetailsPanel } from '../sales/SalesDetailsPanel';
import { Pagination } from '../sales/Pagination';
import { SalesLoadingSkeleton } from '../sales/SalesLoadingSkeleton';
import { SalesEmptyState } from '../sales/SalesEmptyState';
import { DateRangePicker } from '../sales/DateRangePicker';
import { FilterChip } from '../sales/FilterChip';
import { SalesMobileCard } from '../sales/SalesMobileCard';
import { NewSaleModal } from '../sales/NewSaleModal';
import { mockTickets, mockAppointments } from '../../data/mockSalesData';
import { Button, Input, Tabs, Tab } from '../ui';

type SalesTab = 'appointments' | 'tickets';
type DateFilter = '7days' | '30days' | '90days' | 'custom';

export function Sales() {
  useAppDispatch();

  // Data from Redux (commented out for now, using mock data)
  // const appointments = useAppSelector(selectAllAppointments);
  // const tickets = useAppSelector(selectAllTickets);
  // const appointmentsLoading = useAppSelector(selectAppointmentsLoading);
  // const ticketsLoading = useAppSelector(selectTicketsLoading);

  // Using mock data for demonstration
  const appointments = mockAppointments;
  const [tickets, setTickets] = useState(mockTickets);
  const appointmentsLoading = false;
  const ticketsLoading = false;

  // UI State
  const [activeTab, setActiveTab] = useState<SalesTab>('tickets');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Details Panel State
  const [selectedItem, setSelectedItem] = useState<Ticket | LocalAppointment | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Sorting State
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Date Range Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null
  });

  // New Sale Modal State
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);

  // Mobile view detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load data on mount (commented out for mock data)
  // useEffect(() => {
  //   // Load appointments
  //   const now = new Date();
  //   const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
  //   const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days future

  //   dispatch(fetchAppointments({
  //     rvcNo: 1, // TODO: Get from context
  //     startDate,
  //     endDate
  //   }));

  //   // Load tickets
  //   dispatch(fetchTickets('salon_123')); // TODO: Get salonId from context
  // }, [dispatch]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, statusFilter, dateFilter, customDateRange]);

  // Calculate stats based on active tab with trends
  useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    if (activeTab === 'tickets') {
      // Current period (last 30 days)
      const currentTickets = tickets.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);
      const total = currentTickets.length;
      const paid = currentTickets.filter(t => t.status === 'paid').length;
      const partial = currentTickets.filter(t => t.status === 'partial-payment').length;
      const refunded = currentTickets.filter(t => t.status === 'refunded' || t.status === 'partially-refunded').length;
      const totalRevenue = currentTickets.reduce((sum, t) => sum + (t.total || 0), 0);
      const avgValue = total > 0 ? totalRevenue / total : 0;

      // Previous period (30-60 days ago)
      const previousTickets = tickets.filter(t => {
        const date = new Date(t.createdAt);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      });
      const prevTotal = previousTickets.length;
      const prevAvgValue = prevTotal > 0
        ? previousTickets.reduce((sum, t) => sum + (t.total || 0), 0) / prevTotal
        : 0;

      // Calculate trends
      const totalTrend = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
      const avgValueTrend = prevAvgValue > 0 ? ((avgValue - prevAvgValue) / prevAvgValue) * 100 : 0;

      return {
        total,
        paid,
        partial,
        refunded,
        avgValue,
        totalTrend: totalTrend.toFixed(1),
        avgValueTrend: avgValueTrend.toFixed(1)
      };
    } else {
      // Current period (last 30 days)
      const currentAppts = appointments.filter(a => new Date(a.scheduledStartTime) >= thirtyDaysAgo);
      const total = currentAppts.length;
      const completed = currentAppts.filter(a => a.status === 'completed').length;
      const scheduled = currentAppts.filter(a => a.status === 'scheduled').length;
      const cancelled = currentAppts.filter(a => a.status === 'cancelled').length;
      const noShow = currentAppts.filter(a => a.status === 'no-show').length;
      const completionRate = total > 0 ? (completed / total * 100) : 0;

      // Previous period (30-60 days ago)
      const previousAppts = appointments.filter(a => {
        const date = new Date(a.scheduledStartTime);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      });
      const prevTotal = previousAppts.length;
      const prevCompleted = previousAppts.filter(a => a.status === 'completed').length;
      const prevCompletionRate = prevTotal > 0 ? (prevCompleted / prevTotal * 100) : 0;

      // Calculate trends
      const totalTrend = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
      const completionTrend = prevCompletionRate > 0
        ? ((completionRate - prevCompletionRate) / prevCompletionRate) * 100
        : 0;

      return {
        total,
        completed,
        scheduled,
        cancelled,
        noShow,
        completionRate: completionRate.toFixed(1),
        totalTrend: totalTrend.toFixed(1),
        completionTrend: completionTrend.toFixed(1)
      };
    }
  }, [activeTab, appointments, tickets]);

  // Filter and sort data based on active tab
  const filteredData = useMemo(() => {
    const data = activeTab === 'tickets' ? tickets : appointments;
    let filtered = [...data];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: any) => {
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
    if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
      // Use custom date range
      filtered = filtered.filter(item => {
        const itemDate = 'scheduledStartTime' in item
          ? new Date(item.scheduledStartTime)
          : new Date(item.createdAt);
        return itemDate >= customDateRange.from! && itemDate <= customDateRange.to!;
      });
    } else if (dateFilter !== 'custom') {
      // Use preset date range
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'date':
          aVal = 'scheduledStartTime' in a ? new Date(a.scheduledStartTime) : new Date(a.createdAt);
          bVal = 'scheduledStartTime' in b ? new Date(b.scheduledStartTime) : new Date(b.createdAt);
          break;
        case 'client':
          aVal = a.clientName?.toLowerCase() || '';
          bVal = b.clientName?.toLowerCase() || '';
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'total':
          aVal = (a as Ticket).total || 0;
          bVal = (b as Ticket).total || 0;
          break;
        case 'staff':
          aVal = ('staffName' in a ? a.staffName : (a as any).techName)?.toLowerCase() || '';
          bVal = ('staffName' in b ? b.staffName : (b as any).techName)?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [activeTab, appointments, tickets, searchQuery, statusFilter, dateFilter, sortBy, sortDirection]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  // Get status options based on active tab
  const statusOptions = useMemo(() => {
    if (activeTab === 'tickets') {
      return [
        { value: 'all', label: 'All Statuses' },
        { value: 'paid', label: 'Paid' },
        { value: 'partial-payment', label: 'Partial Payment' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'partially-refunded', label: 'Partially Refunded' },
        { value: 'voided', label: 'Voided' }
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
      // Transaction/Payment Statuses
      'paid': 'bg-closedTickets-50 text-closedTickets-700 border-closedTickets-200',
      'unpaid': 'bg-red-50 text-red-700 border-red-200',
      'partial-payment': 'bg-amber-50 text-amber-700 border-amber-200',
      'pending': 'bg-pendingTickets-50 text-pendingTickets-700 border-pendingTickets-200', // Metallic Gold
      'failed': 'bg-red-50 text-red-700 border-red-200',
      'refunded': 'bg-purple-50 text-purple-700 border-purple-200',
      'partially-refunded': 'bg-violet-50 text-violet-700 border-violet-200',
      'voided': 'bg-slate-50 text-slate-600 border-slate-200',
      // Legacy/Appointment Statuses (for backward compatibility)
      'completed': 'bg-closedTickets-50 text-closedTickets-700 border-closedTickets-200',
      'scheduled': 'bg-comingAppointments-50 text-comingAppointments-700 border-comingAppointments-200',
      'checked-in': 'bg-waitList-50 text-waitList-700 border-waitList-200', // Purple (Waiting)
      'in-service': 'bg-service-50 text-service-700 border-service-200', // Green
      'cancelled': 'bg-slate-50 text-slate-600 border-slate-200',
      'no-show': 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return colors[status] || 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 border-gray-200';
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Details Panel Handlers
  const handleViewDetails = (item: Ticket | LocalAppointment, index: number) => {
    setSelectedItem(item);
    setSelectedIndex(index);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => {
      setSelectedItem(null);
      setSelectedIndex(-1);
    }, 300); // Wait for animation to complete
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedItem(filteredData[newIndex] as Ticket | LocalAppointment);
      setSelectedIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (selectedIndex < filteredData.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedItem(filteredData[newIndex] as Ticket | LocalAppointment);
      setSelectedIndex(newIndex);
    }
  };

  // Sorting Handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('30days');
    setCustomDateRange({ from: null, to: null });
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    dateFilter !== '30days' ||
    (customDateRange.from !== null && customDateRange.to !== null);

  // Handle new sale creation
  const handleNewSale = (saleData: Ticket) => {
    setTickets([saleData, ...tickets]);
    setShowNewSaleModal(false);
  };

  // Handle date range change
  const handleDateRangeChange = (range: { from: Date | null; to: Date | null }) => {
    setCustomDateRange(range);
    if (range.from && range.to) {
      setDateFilter('custom');
    }
  };

  // Get active filters for chips display
  const getActiveFilters = () => {
    const filters: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];

    if (searchQuery) {
      filters.push({
        key: 'search',
        label: 'Search',
        value: searchQuery,
        onRemove: () => setSearchQuery('')
      });
    }

    if (statusFilter !== 'all') {
      const statusLabel = statusOptions.find(opt => opt.value === statusFilter)?.label || statusFilter;
      filters.push({
        key: 'status',
        label: 'Status',
        value: statusLabel,
        onRemove: () => setStatusFilter('all')
      });
    }

    if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
      filters.push({
        key: 'date',
        label: 'Date Range',
        value: `${formatChipDate(customDateRange.from)} - ${formatChipDate(customDateRange.to)}`,
        onRemove: () => {
          setDateFilter('30days');
          setCustomDateRange({ from: null, to: null });
        }
      });
    } else if (dateFilter !== '30days') {
      const dateLabel = dateFilter === '7days' ? 'Last 7 days' :
        dateFilter === '90days' ? 'Last 90 days' : dateFilter;
      filters.push({
        key: 'date',
        label: 'Date',
        value: dateLabel,
        onRemove: () => setDateFilter('30days')
      });
    }

    return filters;
  };

  const formatChipDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Sortable Column Header Component
  const SortableHeader = ({ column, label }: { column: string; label: string }) => {
    const isActive = sortBy === column;
    return (
      <th
        className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none min-w-[120px]"
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          <div className="flex flex-col">
            {isActive ? (
              sortDirection === 'asc' ? (
                <ChevronUp className="w-3 h-3 text-blue-600" />
              ) : (
                <ChevronDown className="w-3 h-3 text-blue-600" />
              )
            ) : (
              <ChevronsUpDown className="w-3 h-3 text-gray-400" />
            )}
          </div>
        </div>
      </th>
    );
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 flex flex-col">
      {/* Add animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out both;
        }

        /* Icon animations */
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
        }

        @keyframes rotateIcon {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(15deg);
          }
        }
        .icon-action:hover {
          animation: rotateIcon 0.3s ease-in-out alternate infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse-subtle {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 shadow-sm">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sales & Transactions</h1>
              <p className="text-sm text-gray-600 mt-0.5">View and manage sales transactions and appointments</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowNewSaleModal(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                New Sale
              </Button>
              <Button
                variant="secondary"
                size="sm"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
            </div>
          </div>


          {/* Tab Navigation */}
          <div className="mb-4">
            <Tabs
              value={activeTab}
              onChange={(val) => {
                setActiveTab(val as SalesTab);
                setStatusFilter('all');
                setSearchQuery('');
              }}
            >
              <Tab
                value="tickets"
                label="Sales Transactions"
                badge={tickets.length}
              />
              <Tab
                value="appointments"
                label="Appointments"
                badge={appointments.length}
              />
            </Tabs>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Quick:
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setCustomDateRange({ from: today, to: new Date() });
                setDateFilter('custom');
              }}
            >
              Today
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                setCustomDateRange({ from: weekAgo, to: new Date() });
                setDateFilter('custom');
              }}
            >
              7 Days
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const monthAgo = new Date();
                monthAgo.setDate(monthAgo.getDate() - 30);
                setCustomDateRange({ from: monthAgo, to: new Date() });
                setDateFilter('custom');
              }}
            >
              30 Days
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setStatusFilter(activeTab === 'tickets' ? 'paid' : 'completed');
              }}
            >
              {activeTab === 'tickets' ? 'Paid' : 'Completed'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClearFilters()}
            >
              <History className="w-3 h-3" />
              Clear
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by client name, receipt #, or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-w-[140px] flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowDatePicker(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {dateFilter === 'custom' && customDateRange.from && customDateRange.to
                    ? `${formatChipDate(customDateRange.from)} - ${formatChipDate(customDateRange.to)}`
                    : dateFilter === '7days'
                      ? '7 days'
                      : dateFilter === '90days'
                        ? '90 days'
                        : '30 days'}
                </span>
              </button>
            </div>

            {/* Filter Chips */}
            {hasActiveFilters && (
              <div className="flex items-center gap-3 flex-wrap">
                {getActiveFilters().map((filter) => (
                  <FilterChip
                    key={filter.key}
                    label={filter.label}
                    value={filter.value}
                    onRemove={filter.onRemove}
                  />
                ))}
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all duration-200 active:scale-95"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-6 py-2">
        <div className="max-w-[1600px] mx-auto">
          {(appointmentsLoading || ticketsLoading) ? (
            <SalesLoadingSkeleton />
          ) : filteredData.length === 0 ? (
            <SalesEmptyState
              hasFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              activeTab={activeTab}
            />
          ) : isMobile ? (
            /* Mobile Card View */
            <div className="space-y-5">
              {paginatedData.map((item: any, index: number) => {
                const actualIndex = (currentPage - 1) * itemsPerPage + index;
                return (
                  <div
                    key={item.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <SalesMobileCard
                      item={item}
                      type={activeTab === 'tickets' ? 'ticket' : 'appointment'}
                      onView={() => handleViewDetails(item, actualIndex)}
                    />
                  </div>
                );
              })}

              {/* Pagination for Mobile */}
              {filteredData.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md">
              <div className="overflow-x-auto max-h-[calc(100vh-260px)]">
                <table className="w-full table-auto">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      {activeTab === 'tickets' ? (
                        <>
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                            Receipt #
                          </th>
                          <SortableHeader column="date" label="Date" />
                          <SortableHeader column="client" label="Client" />
                          <SortableHeader column="staff" label="Staff" />
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                            Services
                          </th>
                          <SortableHeader column="total" label="Total" />
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                            Tip
                          </th>
                          <SortableHeader column="status" label="Status" />
                          <th className="px-3 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                            Actions
                          </th>
                        </>
                      ) : (
                        <>
                          <SortableHeader column="date" label="Date" />
                          <SortableHeader column="client" label="Client" />
                          <SortableHeader column="staff" label="Staff" />
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                            Services
                          </th>
                          <SortableHeader column="status" label="Status" />
                          <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                            Source
                          </th>
                          <th className="px-3 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                            Actions
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedData.map((item: any, index: number) => {
                      // Calculate the actual index in filteredData for navigation
                      const actualIndex = (currentPage - 1) * itemsPerPage + index;
                      return (
                        <tr
                          key={item.id}
                          className={`animate-fade-in-up transition-all duration-150 hover:bg-gray-50 hover:shadow-sm ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          {activeTab === 'tickets' ? (
                            <>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <span className="text-sm font-semibold text-gray-900">
                                  #{item.id}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{formatDate(item.createdAt)}</div>
                                <div className="text-xs text-gray-600">{formatTime(item.createdAt)}</div>
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 bg-gradient-to-br rounded-full flex items-center justify-center shadow-sm ${item.isGroupTicket
                                    ? 'from-purple-500 to-pink-500'
                                    : 'from-blue-500 to-purple-500'
                                    }`}>
                                    {item.isGroupTicket ? (
                                      <Users className="w-3.5 h-3.5 text-white" />
                                    ) : (
                                      <User className="w-3.5 h-3.5 text-white" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-gray-900">
                                      {item.clientName || 'Walk-in'}
                                      {item.isGroupTicket && item.clients && item.clients.length > 1 && (
                                        <span className="ml-1 text-xs text-purple-600 font-semibold">
                                          +{item.clients.length - 1}
                                        </span>
                                      )}
                                    </span>
                                    {item.isMergedTicket && (
                                      <div className="group relative">
                                        <GitMerge className="w-3.5 h-3.5 text-blue-600" />
                                        <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                          Merged from {item.mergedFromTickets?.length || 0} tickets
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <span className="text-sm text-gray-700">
                                  {item.services && item.services.length > 0
                                    ? [...new Set(item.services.map((s: any) => s.staffName))].join(', ')
                                    : 'Unassigned'}
                                </span>
                              </td>
                              <td className="px-3 py-1.5">
                                <span className="text-sm text-gray-700">
                                  {item.services?.map((s: any) => s.serviceName).join(', ') || 'N/A'}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <span className="text-sm font-bold text-gray-900 tabular-nums">
                                  ${(item.total || 0).toFixed(2)}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-700 tabular-nums">
                                  ${(item.tip || 0).toFixed(2)}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleViewDetails(item, actualIndex)}
                                    className="p-1 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded transition-all duration-200"
                                    aria-label="View details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-1 hover:bg-purple-50 hover:text-purple-600 text-gray-600 rounded transition-all duration-200">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatDate(item.scheduledStartTime)}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {formatTime(item.scheduledStartTime)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2 shadow-sm">
                                    <User className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.clientName || 'Walk-in'}
                                    </div>
                                    {item.clientPhone && (
                                      <div className="text-xs text-gray-600">{item.clientPhone}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-900">{item.staffName || 'Unassigned'}</span>
                              </td>
                              <td className="px-3 py-1.5">
                                <span className="text-sm text-gray-700">
                                  {item.services?.map((s: any) => s.serviceName).join(', ') || 'N/A'}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap">
                                <span className="text-sm text-gray-700 capitalize font-medium">{item.source || 'N/A'}</span>
                              </td>
                              <td className="px-3 py-1.5 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleViewDetails(item, actualIndex)}
                                    className="p-1 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded transition-all duration-200"
                                    aria-label="View details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-1 hover:bg-purple-50 hover:text-purple-600 text-gray-600 rounded transition-all duration-200">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredData.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details Panel */}
      <SalesDetailsPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        data={selectedItem}
        type={activeTab === 'tickets' ? 'ticket' : 'appointment'}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={selectedIndex > 0}
        hasNext={selectedIndex < filteredData.length - 1}
      />

      {/* Date Range Picker Modal */}
      {showDatePicker && (
        <DateRangePicker
          value={customDateRange}
          onChange={handleDateRangeChange}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* New Sale Modal */}
      <NewSaleModal
        isOpen={showNewSaleModal}
        onClose={() => setShowNewSaleModal(false)}
        onSave={handleNewSale}
      />
    </div>
  );
}
