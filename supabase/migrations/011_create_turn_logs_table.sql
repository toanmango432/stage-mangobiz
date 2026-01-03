-- Migration: 011_create_turn_logs_table.sql
-- Description: Create turn_logs table for turn tracking history
-- PRD Reference: PRD-Team-Module.md - Section 6.8 Turn Tracking (unique differentiator)

CREATE TABLE IF NOT EXISTS turn_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,

  -- Date for this turn log (for daily grouping)
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Turn details
  turn_number INTEGER NOT NULL,
  turn_type TEXT NOT NULL, -- service, checkout, bonus, adjust, tardy, partial, void
  turn_value NUMERIC(4,2) DEFAULT 1.0, -- Usually 1, can be fractional for partial turns

  -- Transaction links (optional - for service/checkout turns)
  ticket_id UUID REFERENCES tickets(id),
  appointment_id UUID REFERENCES appointments(id),

  -- Service details
  client_name TEXT,
  services TEXT[], -- Array of service names
  service_amount NUMERIC(10,2) DEFAULT 0, -- Dollar value of service

  -- For adjustments
  adjustment_reason TEXT,
  adjusted_by UUID REFERENCES members(id),

  -- Voiding (to reverse incorrect entries)
  is_voided BOOLEAN DEFAULT false,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES members(id),
  void_reason TEXT,

  -- Timestamp when turn occurred
  turn_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Audit fields
  created_by UUID REFERENCES members(id),
  created_by_device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add check constraint for valid turn types
ALTER TABLE turn_logs ADD CONSTRAINT turn_logs_type_check
CHECK (turn_type IN ('service', 'checkout', 'bonus', 'adjust', 'tardy', 'partial', 'void', 'appointment'));

-- Create indexes for common queries
CREATE INDEX idx_turn_logs_store_date ON turn_logs(store_id, date DESC);
CREATE INDEX idx_turn_logs_staff_date ON turn_logs(staff_id, date DESC);
CREATE INDEX idx_turn_logs_daily ON turn_logs(store_id, date, staff_id) WHERE is_voided = false;
CREATE INDEX idx_turn_logs_ticket ON turn_logs(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX idx_turn_logs_appointment ON turn_logs(appointment_id) WHERE appointment_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE turn_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view own store turn logs"
  ON turn_logs FOR SELECT
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can insert turn logs"
  ON turn_logs FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store members can update turn logs"
  ON turn_logs FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE turn_logs IS 'Turn tracking history for fair walk-in distribution. Records each turn event with type, value, and optional transaction links. Unique Mango POS differentiator.';
