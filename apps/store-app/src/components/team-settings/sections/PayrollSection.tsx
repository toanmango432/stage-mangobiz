/**
 * Payroll Section Component - Phase 3: Payroll & Pay Runs
 *
 * Displays pay run history and allows creating/managing pay runs
 * for individual staff members.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  FileText,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { Card, SectionHeader, Badge } from '../components/SharedComponents';
import type { AppDispatch } from '@/store';
import {
  fetchPayRuns,
  selectAllPayRuns,
  selectPayrollLoading,
  selectPayrollError,
} from '@/store/slices/payrollSlice';
import type { PayRun, PayRunStatus, StaffPayment } from '@/types/payroll';
import {
  formatCurrency,
  formatHoursDisplay,
  formatPayPeriod,
} from '@/utils/payrollCalculation';

interface PayrollSectionProps {
  memberId: string;
  memberName: string;
  storeId: string;
}

// ============================================
// STATUS BADGE COMPONENT
// ============================================

interface StatusBadgeProps {
  status: PayRunStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig: Record<PayRunStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
    draft: { label: 'Draft', variant: 'default' },
    pending_approval: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'info' },
    processed: { label: 'Paid', variant: 'success' },
    voided: { label: 'Voided', variant: 'error' },
  };

  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// ============================================
// PAY RUN CARD COMPONENT
// ============================================

interface PayRunCardProps {
  payRun: PayRun;
  staffPayment?: StaffPayment;
  onClick: () => void;
}

const PayRunCard: React.FC<PayRunCardProps> = ({ payRun, staffPayment, onClick }) => {
  const periodLabel = formatPayPeriod(payRun.periodStart, payRun.periodEnd);

  return (
    <Card hover onClick={onClick} className="mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">{periodLabel}</h4>
              <StatusBadge status={payRun.status} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {payRun.periodType.charAt(0).toUpperCase() + payRun.periodType.slice(1).replace('-', ' ')} pay period
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {staffPayment && (
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(staffPayment.netPay)}
              </p>
              <p className="text-xs text-gray-500">
                {formatHoursDisplay(staffPayment.hours.actualHours)} worked
              </p>
            </div>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </Card>
  );
};

// ============================================
// EARNINGS SUMMARY COMPONENT
// ============================================

interface EarningsSummaryProps {
  staffPayments: StaffPayment[];
  period: 'month' | 'year';
}

const EarningsSummary: React.FC<EarningsSummaryProps> = ({ staffPayments, period }) => {
  const totals = useMemo(() => {
    return staffPayments.reduce(
      (acc, payment) => ({
        wages: acc.wages + payment.totalWages,
        commission: acc.commission + payment.totalCommission,
        tips: acc.tips + payment.totalTips,
        total: acc.total + payment.netPay,
        hours: acc.hours + payment.hours.actualHours,
      }),
      { wages: 0, commission: 0, tips: 0, total: 0, hours: 0 }
    );
  }, [staffPayments]);

  const periodLabel = period === 'month' ? 'This Month' : 'This Year';

  return (
    <Card className="mb-6 bg-gradient-to-br from-emerald-50 to-brand-50 border-emerald-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h4 className="font-semibold text-gray-900">{periodLabel} Earnings</h4>
        </div>
        <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totals.total)}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-white/60 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Wages</p>
          <p className="font-semibold text-gray-900">{formatCurrency(totals.wages)}</p>
        </div>
        <div className="text-center p-3 bg-white/60 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Commission</p>
          <p className="font-semibold text-gray-900">{formatCurrency(totals.commission)}</p>
        </div>
        <div className="text-center p-3 bg-white/60 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Tips</p>
          <p className="font-semibold text-gray-900">{formatCurrency(totals.tips)}</p>
        </div>
        <div className="text-center p-3 bg-white/60 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Hours</p>
          <p className="font-semibold text-gray-900">{formatHoursDisplay(totals.hours)}</p>
        </div>
      </div>
    </Card>
  );
};

// ============================================
// PAY RUN DETAIL MODAL
// ============================================

interface PayRunDetailModalProps {
  payRun: PayRun;
  staffPayment?: StaffPayment;
  onClose: () => void;
}

const PayRunDetailModal: React.FC<PayRunDetailModalProps> = ({
  payRun,
  staffPayment,
  onClose,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!staffPayment) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pay Run Details</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No payment data found for this staff member.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pay Run Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Period Info */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-900">
                {formatPayPeriod(payRun.periodStart, payRun.periodEnd)}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {payRun.periodType.replace('-', ' ')} pay period
              </p>
            </div>
            <StatusBadge status={payRun.status} />
          </div>

          {/* Hours Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Hours Breakdown
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Regular</p>
                <p className="font-semibold">{formatHoursDisplay(staffPayment.hours.regularHours)}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-gray-500">Overtime</p>
                <p className="font-semibold text-amber-700">
                  {formatHoursDisplay(staffPayment.hours.overtimeHours)}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-500">Double Time</p>
                <p className="font-semibold text-red-700">
                  {formatHoursDisplay(staffPayment.hours.doubleTimeHours)}
                </p>
              </div>
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Earnings Breakdown
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Base Wages</span>
                <span className="font-medium">{formatCurrency(staffPayment.baseWages)}</span>
              </div>
              {staffPayment.overtimePay > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Overtime Pay</span>
                  <span className="font-medium text-amber-700">
                    {formatCurrency(staffPayment.overtimePay)}
                  </span>
                </div>
              )}
              {staffPayment.doubleTimePay > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Double Time Pay</span>
                  <span className="font-medium text-red-700">
                    {formatCurrency(staffPayment.doubleTimePay)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="text-gray-600">Total Wages</span>
                <span className="font-semibold">{formatCurrency(staffPayment.totalWages)}</span>
              </div>
            </div>
          </div>

          {/* Commission Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Commission & Tips
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">
                  Service Commission
                  <span className="text-xs text-gray-400 ml-1">
                    ({formatCurrency(staffPayment.commission.serviceRevenue)} revenue)
                  </span>
                </span>
                <span className="font-medium">
                  {formatCurrency(staffPayment.commission.serviceCommission)}
                </span>
              </div>
              {staffPayment.commission.productCommission > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Product Commission</span>
                  <span className="font-medium">
                    {formatCurrency(staffPayment.commission.productCommission)}
                  </span>
                </div>
              )}
              {staffPayment.commission.newClientBonus > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    New Client Bonus
                    <span className="text-xs text-gray-400 ml-1">
                      ({staffPayment.commission.newClientCount} clients)
                    </span>
                  </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(staffPayment.commission.newClientBonus)}
                  </span>
                </div>
              )}
              {staffPayment.commission.rebookBonus > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    Rebook Bonus
                    <span className="text-xs text-gray-400 ml-1">
                      ({staffPayment.commission.rebookCount} rebooks)
                    </span>
                  </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(staffPayment.commission.rebookBonus)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="text-gray-600">Total Commission</span>
                <span className="font-semibold">{formatCurrency(staffPayment.totalCommission)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Tips</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(staffPayment.totalTips)}
                </span>
              </div>
            </div>
          </div>

          {/* Adjustments */}
          {staffPayment.adjustments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Adjustments</h4>
              <div className="space-y-2">
                {staffPayment.adjustments.map((adj) => (
                  <div key={adj.id} className="flex justify-between py-2">
                    <span className="text-gray-600">
                      {adj.description || adj.type}
                    </span>
                    <span className={`font-medium ${adj.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {adj.amount >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="pt-4 border-t-2 border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Gross Pay</p>
                <p className="text-lg font-semibold">{formatCurrency(staffPayment.grossPay)}</p>
              </div>
              {staffPayment.guaranteedMinimum > 0 && staffPayment.grossPay < staffPayment.guaranteedMinimum && (
                <div className="text-right">
                  <p className="text-xs text-amber-600">Guaranteed minimum applied</p>
                </div>
              )}
              <div className="text-right">
                <p className="text-sm text-gray-500">Net Pay</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(staffPayment.netPay)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {payRun.status === 'processed' && staffPayment.isPaid && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Paid on {new Date(staffPayment.paidAt!).toLocaleDateString()}</span>
              {staffPayment.paymentReference && (
                <span className="text-sm text-green-600 ml-auto">
                  Ref: {staffPayment.paymentReference}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN PAYROLL SECTION COMPONENT
// ============================================

export const PayrollSection: React.FC<PayrollSectionProps> = ({
  memberId,
  memberName,
  storeId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const allPayRuns = useSelector(selectAllPayRuns);
  const loading = useSelector(selectPayrollLoading);
  const error = useSelector(selectPayrollError);

  const [selectedPayRun, setSelectedPayRun] = useState<PayRun | null>(null);
  const [viewPeriod, setViewPeriod] = useState<'month' | 'year'>('month');

  // Fetch pay runs on mount
  useEffect(() => {
    dispatch(fetchPayRuns());
  }, [dispatch]);

  // Filter pay runs that include this staff member
  const staffPayRuns = useMemo(() => {
    return allPayRuns.filter((pr) =>
      pr.staffPayments.some((sp) => sp.staffId === memberId)
    );
  }, [allPayRuns, memberId]);

  // Get staff payments for summary
  const staffPayments = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return staffPayRuns
      .filter((pr) => {
        const periodEnd = new Date(pr.periodEnd);
        if (viewPeriod === 'month') {
          return periodEnd >= startOfMonth;
        }
        return periodEnd >= startOfYear;
      })
      .map((pr) => pr.staffPayments.find((sp) => sp.staffId === memberId)!)
      .filter(Boolean);
  }, [staffPayRuns, memberId, viewPeriod]);

  // Get selected staff payment
  const selectedStaffPayment = useMemo(() => {
    if (!selectedPayRun) return undefined;
    return selectedPayRun.staffPayments.find((sp) => sp.staffId === memberId);
  }, [selectedPayRun, memberId]);

  const handlePayRunClick = useCallback((payRun: PayRun) => {
    setSelectedPayRun(payRun);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPayRun(null);
  }, []);

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
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pay History"
        subtitle={`View ${memberName}'s earnings and pay runs`}
        icon={<DollarSign className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewPeriod('month')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                viewPeriod === 'month'
                  ? 'bg-emerald-100 text-emerald-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setViewPeriod('year')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                viewPeriod === 'year'
                  ? 'bg-emerald-100 text-emerald-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              This Year
            </button>
          </div>
        }
      />

      {/* Earnings Summary */}
      {staffPayments.length > 0 && (
        <EarningsSummary staffPayments={staffPayments} period={viewPeriod} />
      )}

      {/* Pay Runs List */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Pay Run History
        </h4>

        {staffPayRuns.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-1">No pay runs yet</p>
              <p className="text-sm text-gray-400">
                Pay runs will appear here once created
              </p>
            </div>
          </Card>
        ) : (
          <div>
            {staffPayRuns.map((payRun) => (
              <PayRunCard
                key={payRun.id}
                payRun={payRun}
                staffPayment={payRun.staffPayments.find((sp) => sp.staffId === memberId)}
                onClick={() => handlePayRunClick(payRun)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pay Run Detail Modal */}
      {selectedPayRun && (
        <PayRunDetailModal
          payRun={selectedPayRun}
          staffPayment={selectedStaffPayment}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default PayrollSection;
