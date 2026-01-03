-- Migration: 010_create_pay_runs_table.sql
-- Description: Create pay_runs table for payroll processing
-- PRD Reference: PRD-Team-Module.md - Phase 3 (P1) Payroll & Pay Runs requirements

CREATE TABLE IF NOT EXISTS pay_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),

  -- Pay period definition
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pay_date DATE,
  pay_period_type TEXT DEFAULT 'bi-weekly', -- weekly, bi-weekly, semi-monthly, monthly

  -- Status workflow: draft → pending_approval → approved → processed
  status TEXT DEFAULT 'draft',

  -- Staff payments (JSONB array of payment objects)
  -- Each payment: { staffId, staffName, hours: { regular, overtime }, wages, commissions: { service, product, giftCard, membership }, tips, bonuses: [], adjustments: [], deductions: [], totalGross, totalNet }
  staff_payments JSONB DEFAULT '[]',

  -- Totals (denormalized for quick access)
  totals JSONB DEFAULT '{
    "totalStaff": 0,
    "totalHoursRegular": 0,
    "totalHoursOvertime": 0,
    "totalWages": 0,
    "totalCommissions": 0,
    "totalTips": 0,
    "totalBonuses": 0,
    "totalAdjustments": 0,
    "totalDeductions": 0,
    "grandTotal": 0
  }',

  -- Submission workflow
  submitted_by UUID REFERENCES members(id),
  submitted_at TIMESTAMPTZ,

  -- Approval workflow
  approved_by UUID REFERENCES members(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- Processing
  processed_by UUID REFERENCES members(id),
  processed_at TIMESTAMPTZ,
  processing_notes TEXT,
  payment_method TEXT, -- direct_deposit, check, cash, external

  -- Voiding (for reversals)
  voided_by UUID REFERENCES members(id),
  voided_at TIMESTAMPTZ,
  void_reason TEXT,

  -- Rejection (if denied)
  rejected_by UUID REFERENCES members(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Notes
  notes TEXT,

  -- Sync and audit fields
  sync_status TEXT DEFAULT 'synced',
  sync_version INTEGER DEFAULT 1,
  created_by UUID REFERENCES members(id),
  created_by_device TEXT,
  last_modified_by UUID REFERENCES members(id),
  last_modified_by_device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add check constraint for valid status
ALTER TABLE pay_runs ADD CONSTRAINT pay_runs_status_check
CHECK (status IN ('draft', 'pending_approval', 'approved', 'processing', 'processed', 'voided', 'rejected'));

-- Add check constraint for pay period type
ALTER TABLE pay_runs ADD CONSTRAINT pay_runs_period_type_check
CHECK (pay_period_type IN ('weekly', 'bi-weekly', 'semi-monthly', 'monthly'));

-- Add check constraint for period validity
ALTER TABLE pay_runs ADD CONSTRAINT pay_runs_period_valid_check
CHECK (period_end >= period_start);

-- Create indexes for common queries
CREATE INDEX idx_pay_runs_store_period ON pay_runs(store_id, period_start DESC);
CREATE INDEX idx_pay_runs_status ON pay_runs(store_id, status);
CREATE INDEX idx_pay_runs_pending ON pay_runs(store_id, status, created_at DESC) WHERE status = 'pending_approval';
CREATE INDEX idx_pay_runs_sync ON pay_runs(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_pay_runs_updated ON pay_runs(store_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE pay_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Store members can view pay runs for their stores
CREATE POLICY "Store members can view own store pay runs"
  ON pay_runs FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Only managers/owners can insert pay runs
CREATE POLICY "Managers can insert pay runs"
  ON pay_runs FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members
      WHERE id = auth.uid() AND role IN ('owner', 'manager', 'admin')
    )
  );

-- Only managers/owners can update pay runs
CREATE POLICY "Managers can update pay runs"
  ON pay_runs FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members
      WHERE id = auth.uid() AND role IN ('owner', 'manager', 'admin')
    )
  );

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_pay_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.sync_version = OLD.sync_version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS pay_runs_updated_at_trigger ON pay_runs;
CREATE TRIGGER pay_runs_updated_at_trigger
  BEFORE UPDATE ON pay_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_pay_runs_updated_at();

-- Add comment for documentation
COMMENT ON TABLE pay_runs IS 'Payroll pay runs with approval workflow. Contains staff payments with wages, commissions, tips, bonuses, and adjustments. Supports draft, approval, and processing states.';
