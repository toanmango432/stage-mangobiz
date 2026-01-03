-- Migration: 012_create_time_off_requests_table.sql
-- Description: Create time_off_requests table for leave management
-- PRD Reference: PRD-Team-Module.md - Section 6.4.3 Time Off Management

CREATE TABLE IF NOT EXISTS time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,

  -- Request type
  request_type TEXT NOT NULL, -- vacation, sick, personal, unpaid, bereavement, jury_duty, other

  -- Date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Time range (for partial day requests)
  all_day BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,

  -- Request details
  notes TEXT,
  reason TEXT,

  -- Hours requested (calculated)
  total_hours NUMERIC(5,2),

  -- Approval workflow
  status TEXT DEFAULT 'pending', -- pending, approved, denied, cancelled, expired
  reviewed_by UUID REFERENCES members(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Conflict detection (set by system)
  has_conflicts BOOLEAN DEFAULT false,
  conflict_details JSONB, -- [{ type, description, affectedAppointments }]

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES members(id),
  cancellation_reason TEXT,

  -- Sync and audit fields
  sync_status TEXT DEFAULT 'synced',
  sync_version INTEGER DEFAULT 1,
  created_by UUID REFERENCES members(id),
  created_by_device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add check constraint for valid request types
ALTER TABLE time_off_requests ADD CONSTRAINT time_off_type_check
CHECK (request_type IN ('vacation', 'sick', 'personal', 'unpaid', 'bereavement', 'jury_duty', 'other'));

-- Add check constraint for valid status
ALTER TABLE time_off_requests ADD CONSTRAINT time_off_status_check
CHECK (status IN ('pending', 'approved', 'denied', 'cancelled', 'expired'));

-- Add check constraint for date validity
ALTER TABLE time_off_requests ADD CONSTRAINT time_off_dates_valid_check
CHECK (end_date >= start_date);

-- Create indexes for common queries
CREATE INDEX idx_time_off_store_dates ON time_off_requests(store_id, start_date, end_date);
CREATE INDEX idx_time_off_staff ON time_off_requests(staff_id, status);
CREATE INDEX idx_time_off_pending ON time_off_requests(store_id, status, created_at DESC) WHERE status = 'pending';
CREATE INDEX idx_time_off_approved_range ON time_off_requests(store_id, start_date, end_date) WHERE status = 'approved';
CREATE INDEX idx_time_off_sync ON time_off_requests(store_id, sync_status) WHERE sync_status != 'synced';

-- Enable Row Level Security
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store time off requests"
  ON time_off_requests FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert time off requests"
  ON time_off_requests FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update time off requests"
  ON time_off_requests FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_time_off_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.sync_version = OLD.sync_version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS time_off_requests_updated_at_trigger ON time_off_requests;
CREATE TRIGGER time_off_requests_updated_at_trigger
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_time_off_requests_updated_at();

-- Add comment for documentation
COMMENT ON TABLE time_off_requests IS 'Staff time off requests with approval workflow. Supports various leave types with conflict detection.';
