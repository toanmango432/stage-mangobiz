/**
 * PayRunList Component - Phase 3: Payroll & Pay Runs
 *
 * Displays a list of pay runs with filtering, sorting, and creation capabilities.
 * This is the main management view for payroll administrators.
 */

import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  Calendar,
  DollarSign,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FileEdit,
  Ban,
  ArrowUpDown,
} from 'lucide-react';
import type { AppDispatch } from '../../store';
import {
  fetchPayRuns,
  selectFilteredPayRuns,
  selectPayrollLoading,
  selectPayrollError,
  selectPayrollUI,
  selectPayrollStats,
  setFilterStatus,
  setSortOrder,
  setSelectedPayRunId,
  setCreateModalOpen,
  setDetailModalOpen,
} from '../../store/slices/payrollSlice';
import type { PayRun, PayRunStatus } from '../../types/payroll';
import { formatCurrency, formatPayPeriod } from '../../utils/payrollCalculation';

// ============================================
// TYPES
// ============================================

interface PayRunListProps {
  storeId: string;
  onSelectPayRun?: (payRun: PayRun) => void;
  onCreatePayRun?: () => void;
}

// ============================================
// STATUS CONFIG
// ============================================

const STATUS_CONFIG: Record<PayRunStatus, { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FileEdit },
  pending_approval: { label: 'Pending', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
  approved: { label: 'Approved', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: CheckCircle2 },
  processed: { label: 'Paid', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: CheckCircle2 },
  voided: { label: 'Voided', color: 'text-red-600', bgColor: 'bg-red-100', icon: Ban },
};

// ============================================
// STATUS BADGE COMPONENT
// ============================================

interface StatusBadgeProps {
  status: PayRunStatus;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
};

// ============================================
// STATS CARDS COMPONENT
// ============================================

interface StatsCardsProps {
  stats: {
    total: number;
    draft: number;
    pendingApproval: number;
    approved: number;
    processed: number;
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 mb-1">Total</p>
        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 mb-1">Draft</p>
        <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
      </div>
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
        <p className="text-xs text-amber-600 mb-1">Pending</p>
        <p className="text-2xl font-bold text-amber-700">{stats.pendingApproval}</p>
      </div>
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <p className="text-xs text-blue-600 mb-1">Approved</p>
        <p className="text-2xl font-bold text-blue-700">{stats.approved}</p>
      </div>
      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
        <p className="text-xs text-emerald-600 mb-1">Paid</p>
        <p className="text-2xl font-bold text-emerald-700">{stats.processed}</p>
      </div>
    </div>
  );
};

// ============================================
// FILTER TABS COMPONENT
// ============================================

interface FilterTabsProps {
  activeFilter: PayRunStatus | 'all';
  onFilterChange: (filter: PayRunStatus | 'all') => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ activeFilter, onFilterChange }) => {
  const filters: { value: PayRunStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_approval', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'processed', label: 'Paid' },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeFilter === filter.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

// ============================================
// PAY RUN ROW COMPONENT
// ============================================

interface PayRunRowProps {
  payRun: PayRun;
  onClick: () => void;
}

const PayRunRow: React.FC<PayRunRowProps> = ({ payRun, onClick }) => {
  const periodLabel = formatPayPeriod(payRun.periodStart, payRun.periodEnd);
  const staffCount = payRun.staffPayments.length;

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-brand-50 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-emerald-600" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{periodLabel}</h4>
              <StatusBadge status={payRun.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {payRun.periodType.replace('-', ' ')}
              </span>
              <span>{staffCount} staff member{staffCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(payRun.totals.grandTotal)}
            </p>
            <p className="text-xs text-gray-500">
              {formatCurrency(payRun.totals.totalWages)} wages + {formatCurrency(payRun.totals.totalCommission)} commission
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const PayRunList: React.FC<PayRunListProps> = ({
  storeId,
  onSelectPayRun,
  onCreatePayRun,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const payRuns = useSelector(selectFilteredPayRuns);
  const loading = useSelector(selectPayrollLoading);
  const error = useSelector(selectPayrollError);
  const ui = useSelector(selectPayrollUI);
  const stats = useSelector(selectPayrollStats);

  // Fetch pay runs on mount
  useEffect(() => {
    dispatch(fetchPayRuns());
  }, [dispatch]);

  const handleFilterChange = useCallback((filter: PayRunStatus | 'all') => {
    dispatch(setFilterStatus(filter));
  }, [dispatch]);

  const handleSortChange = useCallback(() => {
    // Toggle sort order or change sort field
    if (ui.sortOrder === 'desc') {
      dispatch(setSortOrder('asc'));
    } else {
      dispatch(setSortOrder('desc'));
    }
  }, [dispatch, ui.sortOrder]);

  const handlePayRunClick = useCallback((payRun: PayRun) => {
    dispatch(setSelectedPayRunId(payRun.id));
    dispatch(setDetailModalOpen(true));
    if (onSelectPayRun) {
      onSelectPayRun(payRun);
    }
  }, [dispatch, onSelectPayRun]);

  const handleCreateClick = useCallback(() => {
    dispatch(setCreateModalOpen(true));
    if (onCreatePayRun) {
      onCreatePayRun();
    }
  }, [dispatch, onCreatePayRun]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-600 mb-2">Failed to load pay runs</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pay Runs</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage payroll periods and process payments</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Pay Run
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Filters and Sort */}
      <div className="flex items-center justify-between">
        <FilterTabs activeFilter={ui.filterStatus} onFilterChange={handleFilterChange} />

        <button
          onClick={handleSortChange}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowUpDown className="w-4 h-4" />
          {ui.sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      {/* Pay Runs List */}
      {payRuns.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No pay runs found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {ui.filterStatus !== 'all'
              ? `No ${ui.filterStatus.replace('_', ' ')} pay runs`
              : 'Create your first pay run to get started'}
          </p>
          {ui.filterStatus === 'all' && (
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Pay Run
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {payRuns.map((payRun) => (
            <PayRunRow
              key={payRun.id}
              payRun={payRun}
              onClick={() => handlePayRunClick(payRun)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PayRunList;
