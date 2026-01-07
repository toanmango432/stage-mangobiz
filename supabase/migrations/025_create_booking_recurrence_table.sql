-- Migration 025: Create booking_recurrence table
-- Support for recurring appointments
-- Recommended by backend architect for feature parity with leading platforms

CREATE TABLE IF NOT EXISTS booking_recurrence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Service and staff
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,

  -- Recurrence pattern
  recurrence_type TEXT NOT NULL
    CHECK (recurrence_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')),

  -- For weekly/biweekly: which day(s)
  days_of_week INTEGER[] DEFAULT '{}',  -- 0=Sun, 1=Mon, ..., 6=Sat

  -- For monthly: which day of month
  day_of_month INTEGER,

  -- For custom: interval
  interval_value INTEGER DEFAULT 1,
  interval_unit TEXT DEFAULT 'week'
    CHECK (interval_unit IN ('day', 'week', 'month')),

  -- Time
  preferred_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,

  -- Schedule boundaries
  starts_at DATE NOT NULL,
  ends_at DATE,  -- NULL = no end date
  max_occurrences INTEGER,  -- Stop after N appointments

  -- Tracking
  occurrences_created INTEGER DEFAULT 0,
  last_occurrence_date DATE,
  next_occurrence_date DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  paused_at TIMESTAMPTZ,
  pause_reason TEXT,

  -- Auto-booking behavior
  auto_book BOOLEAN DEFAULT true,  -- Automatically create appointments
  book_ahead_days INTEGER DEFAULT 30,  -- How far ahead to auto-book
  require_confirmation BOOLEAN DEFAULT false,  -- Need client confirmation each time

  -- Cancellation policy
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Link recurring appointments back to their recurrence rule
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS recurrence_id UUID REFERENCES booking_recurrence(id) ON DELETE SET NULL;

ALTER TABLE online_bookings
  ADD COLUMN IF NOT EXISTS recurrence_id UUID REFERENCES booking_recurrence(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_booking_recurrence_client ON booking_recurrence(client_id, status);
CREATE INDEX idx_booking_recurrence_store_active ON booking_recurrence(store_id, status)
  WHERE status = 'active';
CREATE INDEX idx_booking_recurrence_next ON booking_recurrence(store_id, next_occurrence_date)
  WHERE status = 'active';
CREATE INDEX idx_appointments_recurrence ON appointments(recurrence_id)
  WHERE recurrence_id IS NOT NULL;

-- RLS
ALTER TABLE booking_recurrence ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own recurrence rules
CREATE POLICY "Clients view own recurrence" ON booking_recurrence
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Clients can create recurrence rules
CREATE POLICY "Clients create recurrence" ON booking_recurrence
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Clients can update their own recurrence (pause/cancel)
CREATE POLICY "Clients update own recurrence" ON booking_recurrence
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER booking_recurrence_updated_at
  BEFORE UPDATE ON booking_recurrence
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

-- Function to calculate next occurrence date
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
  p_recurrence_id UUID
)
RETURNS DATE AS $$
DECLARE
  v_rec RECORD;
  v_next_date DATE;
  v_check_date DATE;
  v_day_match BOOLEAN;
BEGIN
  SELECT * INTO v_rec FROM booking_recurrence WHERE id = p_recurrence_id;

  IF v_rec IS NULL OR v_rec.status != 'active' THEN
    RETURN NULL;
  END IF;

  -- Check if we've hit limits
  IF v_rec.ends_at IS NOT NULL AND v_rec.last_occurrence_date >= v_rec.ends_at THEN
    RETURN NULL;
  END IF;

  IF v_rec.max_occurrences IS NOT NULL AND v_rec.occurrences_created >= v_rec.max_occurrences THEN
    RETURN NULL;
  END IF;

  -- Calculate next date based on recurrence type
  v_check_date := COALESCE(v_rec.last_occurrence_date, v_rec.starts_at - 1);

  CASE v_rec.recurrence_type
    WHEN 'daily' THEN
      v_next_date := v_check_date + v_rec.interval_value;

    WHEN 'weekly' THEN
      v_next_date := v_check_date + 1;
      -- Find next matching day of week
      WHILE EXTRACT(DOW FROM v_next_date)::integer != ALL(v_rec.days_of_week)
            AND v_next_date < v_check_date + 14 LOOP
        v_next_date := v_next_date + 1;
      END LOOP;

    WHEN 'biweekly' THEN
      v_next_date := v_check_date + 1;
      -- Find next matching day of week, allowing 2-week span
      WHILE EXTRACT(DOW FROM v_next_date)::integer != ALL(v_rec.days_of_week)
            AND v_next_date < v_check_date + 21 LOOP
        v_next_date := v_next_date + 1;
      END LOOP;
      -- If found within first week, add another week
      IF v_next_date <= v_check_date + 7 AND v_rec.last_occurrence_date IS NOT NULL THEN
        v_next_date := v_next_date + 7;
      END IF;

    WHEN 'monthly' THEN
      v_next_date := (v_check_date + INTERVAL '1 month')::date;
      IF v_rec.day_of_month IS NOT NULL THEN
        v_next_date := DATE_TRUNC('month', v_next_date)::date + (v_rec.day_of_month - 1);
      END IF;

    WHEN 'custom' THEN
      v_next_date := v_check_date + (v_rec.interval_value || ' ' || v_rec.interval_unit)::interval;

    ELSE
      v_next_date := NULL;
  END CASE;

  -- Ensure date is not in the past
  IF v_next_date < CURRENT_DATE THEN
    v_next_date := CURRENT_DATE;
  END IF;

  -- Ensure date is not past ends_at
  IF v_rec.ends_at IS NOT NULL AND v_next_date > v_rec.ends_at THEN
    RETURN NULL;
  END IF;

  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql;

-- Function to create next recurring appointment
CREATE OR REPLACE FUNCTION create_next_recurring_appointment(
  p_recurrence_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_rec RECORD;
  v_next_date DATE;
  v_booking_id UUID;
BEGIN
  SELECT * INTO v_rec FROM booking_recurrence WHERE id = p_recurrence_id;

  IF v_rec IS NULL OR v_rec.status != 'active' OR NOT v_rec.auto_book THEN
    RETURN NULL;
  END IF;

  v_next_date := calculate_next_occurrence(p_recurrence_id);

  IF v_next_date IS NULL THEN
    RETURN NULL;
  END IF;

  -- Create online booking (pending confirmation if required)
  INSERT INTO online_bookings (
    store_id, client_id, service_id, staff_id,
    requested_date, requested_time, duration_minutes,
    status, recurrence_id, source
  ) VALUES (
    v_rec.store_id, v_rec.client_id, v_rec.service_id, v_rec.staff_id,
    v_next_date, v_rec.preferred_time, v_rec.duration_minutes,
    CASE WHEN v_rec.require_confirmation THEN 'pending' ELSE 'confirmed' END,
    p_recurrence_id, 'recurring'
  )
  RETURNING id INTO v_booking_id;

  -- Update recurrence tracking
  UPDATE booking_recurrence
  SET
    occurrences_created = occurrences_created + 1,
    last_occurrence_date = v_next_date,
    next_occurrence_date = calculate_next_occurrence(p_recurrence_id),
    updated_at = now()
  WHERE id = p_recurrence_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE booking_recurrence IS 'Recurring appointment rules for repeat bookings';
COMMENT ON FUNCTION calculate_next_occurrence IS 'Calculates the next occurrence date for a recurrence rule';
COMMENT ON FUNCTION create_next_recurring_appointment IS 'Creates the next appointment in a recurring series';
