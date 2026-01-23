/**
 * PayRunDetail Component - Phase 3: Payroll & Pay Runs
 *
 * Detailed view of a single pay run with staff payment breakdown,
 * approval workflow actions, and adjustment capabilities.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Send,
  Check,
  XCircle,
  Printer,
  Users,
  TrendingUp,
  FileText,
} from 'lucide-react';
import type { AppDispatch } from '../../store';
import {
  submitPayRunForApproval,
  approvePayRun,
  rejectPayRun,
  processPayRun,
  selectPayrollSubmitting,
} from '../../store/slices/payrollSlice';
import type { PayRun, PayRunStatus, StaffPayment } from '../../types/payroll';
import { formatCurrency, formatHoursDisplay, formatPayPeriod } from '../../utils/payrollCalculation';

// ============================================
// TYPES
// ============================================

interface PayRunDetailProps {
  payRun: PayRun;
  onClose: () => void;
  onAddAdjustment?: (staffId: string) => void;
}

// ============================================
// STATUS CONFIG
// ============================================

const STATUS_CONFIG: Record<PayRunStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  pending_approval: { label: 'Pending Approval', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  approved: { label: 'Approved', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  processed: { label: 'Paid', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  voided: { label: 'Voided', color: 'text-red-600', bgColor: 'bg-red-100' },
};

// ============================================
// SUMMARY CARD COMPONENT
// ============================================

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, subValue, color = 'emerald' }) => {
  return (
    <div className={`bg-${color}-50 rounded-xl p-4 border border-${color}-100`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-${color}-600`}>{icon}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </div>
  );
};

// ============================================
// STAFF PAYMENT ROW COMPONENT
// ============================================

interface StaffPaymentRowProps {
  payment: StaffPayment;
  isExpanded: boolean;
  onToggle: () => void;
  onAddAdjustment?: () => void;
  isEditable: boolean;
}

const StaffPaymentRow: React.FC<StaffPaymentRowProps> = ({
  payment,
  isExpanded,
  onToggle,
  onAddAdjustment,
  isEditable,
}) => {
  const adjustmentsTotal = payment.adjustments.reduce((sum, adj) => sum + adj.amount, 0);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Row Header */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-brand-500 flex items-center justify-center text-white font-semibold">
            {payment.staffName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{payment.staffName}</h4>
            <p className="text-sm text-gray-500">
              {formatHoursDisplay(payment.hours.actualHours)} worked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="grid grid-cols-4 gap-6 text-right text-sm">
            <div>
              <p className="text-gray-500">Wages</p>
              <p className="font-medium">{formatCurrency(payment.totalWages)}</p>
            </div>
            <div>
              <p className="text-gray-500">Commission</p>
              <p className="font-medium">{formatCurrency(payment.totalCommission)}</p>
            </div>
            <div>
              <p className="text-gray-500">Tips</p>
              <p className="font-medium text-emerald-600">{formatCurrency(payment.totalTips)}</p>
            </div>
            <div>
              <p className="text-gray-500">Net Pay</p>
              <p className="font-bold text-lg">{formatCurrency(payment.netPay)}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Hours Breakdown */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Hours
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Regular</span>
                  <span>{formatHoursDisplay(payment.hours.regularHours)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Overtime (1.5x)</span>
                  <span className="text-amber-600">{formatHoursDisplay(payment.hours.overtimeHours)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Double Time (2x)</span>
                  <span className="text-red-600">{formatHoursDisplay(payment.hours.doubleTimeHours)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-medium">Total</span>
                  <span className="font-medium">{formatHoursDisplay(payment.hours.actualHours)}</span>
                </div>
              </div>
            </div>

            {/* Wages Breakdown */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Wages
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Base</span>
                  <span>{formatCurrency(payment.baseWages)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Overtime</span>
                  <span className="text-amber-600">{formatCurrency(payment.overtimePay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Double Time</span>
                  <span className="text-red-600">{formatCurrency(payment.doubleTimePay)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-medium">Total Wages</span>
                  <span className="font-medium">{formatCurrency(payment.totalWages)}</span>
                </div>
              </div>
            </div>

            {/* Commission Breakdown */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Commission
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service ({formatCurrency(payment.commission.serviceRevenue)} rev)</span>
                  <span>{formatCurrency(payment.commission.serviceCommission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Product ({formatCurrency(payment.commission.productRevenue)} rev)</span>
                  <span>{formatCurrency(payment.commission.productCommission)}</span>
                </div>
                {payment.commission.newClientBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">New Client ({payment.commission.newClientCount})</span>
                    <span className="text-green-600">{formatCurrency(payment.commission.newClientBonus)}</span>
                  </div>
                )}
                {payment.commission.rebookBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rebook ({payment.commission.rebookCount})</span>
                    <span className="text-green-600">{formatCurrency(payment.commission.rebookBonus)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="font-medium">Total Commission</span>
                  <span className="font-medium">{formatCurrency(payment.totalCommission)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Adjustments */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Adjustments
              </h5>
              {isEditable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddAdjustment?.();
                  }}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Adjustment
                </button>
              )}
            </div>

            {payment.adjustments.length > 0 ? (
              <div className="space-y-2">
                {payment.adjustments.map((adj) => (
                  <div key={adj.id} className="flex justify-between text-sm bg-white rounded-lg p-2">
                    <span className="text-gray-600">
                      {adj.description || adj.type}
                    </span>
                    <span className={adj.amount >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {adj.amount >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                  <span>Total Adjustments</span>
                  <span className={adjustmentsTotal >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {adjustmentsTotal >= 0 ? '+' : ''}{formatCurrency(adjustmentsTotal)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No adjustments</p>
            )}
          </div>

          {/* Payment Status */}
          {payment.isPaid && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 rounded-lg text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Paid on {new Date(payment.paidAt!).toLocaleDateString()}</span>
              {payment.paymentReference && (
                <span className="ml-auto text-emerald-600">Ref: {payment.paymentReference}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const PayRunDetail: React.FC<PayRunDetailProps> = ({
  payRun,
  onClose,
  onAddAdjustment,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const submitting = useSelector(selectPayrollSubmitting);
  const [expandedStaffIds, setExpandedStaffIds] = useState<Set<string>>(new Set());
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const statusConfig = STATUS_CONFIG[payRun.status];
  const isEditable = payRun.status === 'draft';

  // Calculate totals
  const summaryData = useMemo(() => ({
    totalStaff: payRun.staffPayments.length,
    totalHours: payRun.staffPayments.reduce((sum, sp) => sum + sp.hours.actualHours, 0),
    totalOvertimeHours: payRun.staffPayments.reduce((sum, sp) => sum + sp.hours.overtimeHours, 0),
  }), [payRun.staffPayments]);

  const toggleStaffExpanded = useCallback((staffId: string) => {
    setExpandedStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) {
        next.delete(staffId);
      } else {
        next.add(staffId);
      }
      return next;
    });
  }, []);

  const handleSubmitForApproval = useCallback(async () => {
    await dispatch(submitPayRunForApproval(payRun.id));
  }, [dispatch, payRun.id]);

  const handleApprove = useCallback(async () => {
    await dispatch(approvePayRun({ payRunId: payRun.id }));
  }, [dispatch, payRun.id]);

  const handleReject = useCallback(async () => {
    if (!rejectReason.trim()) return;
    await dispatch(rejectPayRun({ payRunId: payRun.id, reason: rejectReason }));
    setShowRejectDialog(false);
    setRejectReason('');
  }, [dispatch, payRun.id, rejectReason]);

  const handleProcess = useCallback(async () => {
    await dispatch(processPayRun({ payRunId: payRun.id }));
  }, [dispatch, payRun.id]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                {formatPayPeriod(payRun.periodStart, payRun.periodEnd)}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {payRun.periodType.replace('-', ' ')} pay period
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {/* Print functionality */}}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Print"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <SummaryCard
              icon={<Users className="w-5 h-5" />}
              label="Staff Members"
              value={summaryData.totalStaff.toString()}
            />
            <SummaryCard
              icon={<Clock className="w-5 h-5" />}
              label="Total Hours"
              value={formatHoursDisplay(summaryData.totalHours)}
              subValue={`${formatHoursDisplay(summaryData.totalOvertimeHours)} overtime`}
            />
            <SummaryCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Total Wages"
              value={formatCurrency(payRun.totals.totalWages)}
              subValue={`${formatCurrency(payRun.totals.totalCommission)} commission`}
            />
            <div className="bg-emerald-100 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-emerald-700">Grand Total</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(payRun.totals.grandTotal)}</p>
              <p className="text-xs text-emerald-600 mt-1">{formatCurrency(payRun.totals.totalTips)} in tips</p>
            </div>
          </div>

          {/* Staff Payments */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Staff Payments ({payRun.staffPayments.length})
            </h3>

            <div className="space-y-3">
              {payRun.staffPayments.map((payment) => (
                <StaffPaymentRow
                  key={payment.staffId}
                  payment={payment}
                  isExpanded={expandedStaffIds.has(payment.staffId)}
                  onToggle={() => toggleStaffExpanded(payment.staffId)}
                  onAddAdjustment={() => onAddAdjustment?.(payment.staffId)}
                  isEditable={isEditable}
                />
              ))}
            </div>
          </div>

          {/* Workflow Notes */}
          {payRun.approvalNotes && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-medium text-blue-700 mb-1">Approval Notes</p>
              <p className="text-sm text-blue-600">{payRun.approvalNotes}</p>
            </div>
          )}

          {payRun.voidReason && (
            <div className="mt-6 p-4 bg-red-50 rounded-xl">
              <p className="text-sm font-medium text-red-700 mb-1">Void/Rejection Reason</p>
              <p className="text-sm text-red-600">{payRun.voidReason}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Created: {new Date(payRun.createdAt).toLocaleString()}
              {payRun.approvedAt && (
                <span className="ml-4">Approved: {new Date(payRun.approvedAt).toLocaleString()}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {payRun.status === 'draft' && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Submit for Approval
                </button>
              )}

              {payRun.status === 'pending_approval' && (
                <>
                  <button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                </>
              )}

              {payRun.status === 'approved' && (
                <button
                  onClick={handleProcess}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Process Payments
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Pay Run</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this pay run. It will be returned to draft status.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || submitting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Reject Pay Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayRunDetail;
