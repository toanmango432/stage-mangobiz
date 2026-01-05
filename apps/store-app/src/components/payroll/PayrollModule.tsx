/**
 * PayrollModule Component - Phase 3: Payroll & Pay Runs
 *
 * Main container component that orchestrates all payroll functionality.
 * Integrates PayRunList, PayRunDetail, CreatePayRunModal, and PayRunAdjustmentModal.
 */

import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectSalonId } from '../../store/slices/authSlice';
import type { PayRun } from '../../types/payroll';

import { PayRunList } from './PayRunList';
import { PayRunDetail } from './PayRunDetail';
import { CreatePayRunModal } from './CreatePayRunModal';
import { PayRunAdjustmentModal } from './PayRunAdjustmentModal';

// ============================================
// TYPES
// ============================================

interface PayrollModuleProps {
  className?: string;
}

interface AdjustmentModalState {
  isOpen: boolean;
  payRunId: string;
  staffId: string;
  staffName: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const PayrollModule: React.FC<PayrollModuleProps> = ({ className = '' }) => {
  const salonId = useSelector(selectSalonId);

  // Local UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPayRun, setDetailPayRun] = useState<PayRun | null>(null);
  const [adjustmentModal, setAdjustmentModal] = useState<AdjustmentModalState>({
    isOpen: false,
    payRunId: '',
    staffId: '',
    staffName: '',
  });

  // Get store ID from auth
  const storeId = salonId || 'default-store';

  // Handlers
  const handleSelectPayRun = useCallback((payRun: PayRun) => {
    setDetailPayRun(payRun);
    setShowDetailModal(true);
  }, []);

  const handleCreatePayRun = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const handleCreateSuccess = useCallback((_payRunId: string) => {
    setShowCreateModal(false);
    // Optionally open the newly created pay run
    // This could be fetched and shown in detail
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setDetailPayRun(null);
  }, []);

  const handleAddAdjustment = useCallback((staffId: string) => {
    if (!detailPayRun) return;

    const staffPayment = detailPayRun.staffPayments.find((sp) => sp.staffId === staffId);
    if (!staffPayment) return;

    setAdjustmentModal({
      isOpen: true,
      payRunId: detailPayRun.id,
      staffId,
      staffName: staffPayment.staffName,
    });
  }, [detailPayRun]);

  const handleCloseAdjustmentModal = useCallback(() => {
    setAdjustmentModal({
      isOpen: false,
      payRunId: '',
      staffId: '',
      staffName: '',
    });
  }, []);

  const handleAdjustmentSuccess = useCallback(() => {
    // Refresh detail modal data if needed
    // The Redux store should automatically update
  }, []);

  return (
    <div className={`h-full ${className}`}>
      {/* Main Content - Pay Run List */}
      <div className="p-6">
        <PayRunList
          storeId={storeId}
          onSelectPayRun={handleSelectPayRun}
          onCreatePayRun={handleCreatePayRun}
        />
      </div>

      {/* Create Pay Run Modal */}
      {showCreateModal && (
        <CreatePayRunModal
          storeId={storeId}
          onClose={handleCloseCreateModal}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Pay Run Detail Modal */}
      {showDetailModal && detailPayRun && (
        <PayRunDetail
          payRun={detailPayRun}
          onClose={handleCloseDetailModal}
          onAddAdjustment={handleAddAdjustment}
        />
      )}

      {/* Adjustment Modal */}
      {adjustmentModal.isOpen && detailPayRun && (
        <PayRunAdjustmentModal
          payRunId={adjustmentModal.payRunId}
          staffId={adjustmentModal.staffId}
          staffName={adjustmentModal.staffName}
          existingAdjustments={
            detailPayRun.staffPayments.find((sp) => sp.staffId === adjustmentModal.staffId)?.adjustments
          }
          onClose={handleCloseAdjustmentModal}
          onSuccess={handleAdjustmentSuccess}
        />
      )}
    </div>
  );
};

export default PayrollModule;
