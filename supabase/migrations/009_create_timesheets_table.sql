-- Migration: 009_create_timesheets_table.sql
-- Description: Create timesheets table for time and attendance tracking
-- PRD Reference: PRD-Team-Module.md - Phase 2 (P1) Time & Attendance requirements

CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,

  -- Date for this timesheet entry (one entry per staff per day)
  date DATE NOT NULL,

  -- Scheduled shift times (from staff schedule)
  scheduled_start TIME,
  scheduled_end TIME,
  scheduled_break_minutes INTEGER DEFAULT 0,

  -- Actual clock in/out times
  actual_clock_in TIMESTAMPTZ,
  actual_clock_out TIMESTAMPTZ,

  -- Break tracking (JSONB array of break entries)
  -- [{ id, startTime, endTime, type: 'paid'|'unpaid', duration, label }]
  breaks JSONB DEFAULT '[]',

  -- Calculated hours (denormalized for query performance)
  -- { scheduledHours, actualHours, regularHours, overtimeHours, breakMinutes, varianceMinutes }
  hours JSONB DEFAULT '{"scheduledHours": 0, "actualHours": 0, "regularHours": 0, "overtimeHours": 0, "breakMinutes": 0, "varianceMinutes": 0}',

  -- Attendance flags
  is_late_arrival BOOLEAN DEFAULT false,
  is_early_departure BOOLEAN DEFAULT false,
  is_no_show BOOLEAN DEFAULT false,
  late_minutes INTEGER DEFAULT 0,
  early_departure_minutes INTEGER DEFAULT 0,

  -- Status and approval workflow
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES members(id),
  approved_at TIMESTAMPTZ,
  dispute_reason TEXT,
  dispute_notes TEXT,

  -- Notes
  notes TEXT,
  manager_notes TEXT,

  -- Location tracking (optional - for GPS/IP verification)
  clock_in_location JSONB, -- { latitude, longitude, accuracy, ip_address }
  clock_out_location JSONB,

  -- Photo verification (optional)
  clock_in_photo_url TEXT,
  clock_out_photo_url TEXT,

  -- Sync and audit fields
  sync_status TEXT DEFAULT 'synced',
  sync_version INTEGER DEFAULT 1,
  created_by UUID REFERENCES members(id),
  created_by_device TEXT,
  last_modified_by UUID REFERENCES members(id),
  last_modified_by_device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one timesheet per staff per day per store
  UNIQUE(store_id, staff_id, date)
);

-- Add check constraint for valid status
ALTER TABLE timesheets ADD CONSTRAINT timesheets_status_check
CHECK (status IN ('pending', 'approved', 'disputed', 'auto_approved'));

-- Create indexes for common queries
CREATE INDEX idx_timesheets_store_date ON timesheets(store_id, date);
CREATE INDEX idx_timesheets_staff_date ON timesheets(staff_id, date DESC);
CREATE INDEX idx_timesheets_status ON timesheets(store_id, status) WHERE status = 'pending';
CREATE INDEX idx_timesheets_approval_queue ON timesheets(store_id, status, date DESC) WHERE status IN ('pending', 'disputed');
CREATE INDEX idx_timesheets_sync ON timesheets(store_id, sync_status) WHERE sync_status != 'synced';
CREATE INDEX idx_timesheets_updated ON timesheets(store_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Store members can view timesheets for their stores
CREATE POLICY "Store members can view own store timesheets"
  ON timesheets FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Store members can insert timesheets for their stores
CREATE POLICY "Store members can insert own store timesheets"
  ON timesheets FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Store members can update timesheets for their stores
CREATE POLICY "Store members can update own store timesheets"
  ON timesheets FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_timesheets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.sync_version = OLD.sync_version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS timesheets_updated_at_trigger ON timesheets;
CREATE TRIGGER timesheets_updated_at_trigger
  BEFORE UPDATE ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION update_timesheets_updated_at();

-- Add comment for documentation
COMMENT ON TABLE timesheets IS 'Daily timesheet entries for staff time and attendance tracking. Supports clock in/out, breaks, overtime calculation, and manager approval workflow.';
