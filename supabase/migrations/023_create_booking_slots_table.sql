-- Migration 023: Create booking_slots table
-- Pre-computed availability slots for efficient booking queries
-- Recommended by backend architect for performance at scale

CREATE TABLE IF NOT EXISTS booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,

  -- Slot timing
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,

  -- Availability
  is_available BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,

  -- Booking reference (if booked)
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  online_booking_id UUID REFERENCES online_bookings(id) ON DELETE SET NULL,

  -- Capacity (for group services)
  capacity INTEGER DEFAULT 1,
  booked_count INTEGER DEFAULT 0,

  -- Service restriction (if slot is for specific service only)
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,

  -- Source of the slot
  source TEXT DEFAULT 'schedule'
    CHECK (source IN ('schedule', 'manual', 'recurring', 'override')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Critical performance indexes for availability queries
CREATE INDEX idx_booking_slots_availability
  ON booking_slots(store_id, slot_date, is_available)
  WHERE is_available = true;

CREATE INDEX idx_booking_slots_staff_date
  ON booking_slots(staff_id, slot_date, slot_time)
  WHERE is_available = true;

CREATE INDEX idx_booking_slots_service
  ON booking_slots(store_id, service_id, slot_date)
  WHERE service_id IS NOT NULL AND is_available = true;

-- Prevent duplicate slots
CREATE UNIQUE INDEX idx_booking_slots_unique
  ON booking_slots(store_id, staff_id, slot_date, slot_time);

-- RLS
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view available slots (for booking calendar)
CREATE POLICY "Public view available slots" ON booking_slots
  FOR SELECT USING (
    is_available = true
    AND slot_date >= CURRENT_DATE
  );

-- Trigger to update updated_at
CREATE TRIGGER booking_slots_updated_at
  BEFORE UPDATE ON booking_slots
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

-- Function to get available slots for a service
CREATE OR REPLACE FUNCTION get_available_slots(
  p_store_id UUID,
  p_service_id UUID,
  p_date DATE,
  p_staff_id UUID DEFAULT NULL
)
RETURNS TABLE (
  slot_id UUID,
  staff_id UUID,
  staff_name TEXT,
  slot_time TIME,
  duration_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bs.id AS slot_id,
    bs.staff_id,
    s.name AS staff_name,
    bs.slot_time,
    bs.duration_minutes
  FROM booking_slots bs
  JOIN staff s ON s.id = bs.staff_id
  WHERE bs.store_id = p_store_id
    AND bs.slot_date = p_date
    AND bs.is_available = true
    AND bs.is_blocked = false
    AND bs.booked_count < bs.capacity
    AND (bs.service_id IS NULL OR bs.service_id = p_service_id)
    AND (p_staff_id IS NULL OR bs.staff_id = p_staff_id)
    AND s.is_active = true
    AND (s.provides_services IS NULL OR p_service_id = ANY(s.provides_services))
  ORDER BY bs.slot_time, s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to regenerate slots for a date range
CREATE OR REPLACE FUNCTION regenerate_booking_slots(
  p_store_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_staff RECORD;
  v_current_date DATE;
  v_day_of_week INTEGER;
  v_schedule JSONB;
  v_start_time TIME;
  v_end_time TIME;
  v_slot_time TIME;
BEGIN
  -- Delete existing unbooked slots in range
  DELETE FROM booking_slots
  WHERE store_id = p_store_id
    AND slot_date BETWEEN p_start_date AND p_end_date
    AND appointment_id IS NULL
    AND online_booking_id IS NULL;

  -- Loop through each active staff member
  FOR v_staff IN
    SELECT id, name, schedule
    FROM staff
    WHERE store_id = p_store_id AND is_active = true
  LOOP
    v_current_date := p_start_date;

    WHILE v_current_date <= p_end_date LOOP
      v_day_of_week := EXTRACT(DOW FROM v_current_date);
      v_schedule := v_staff.schedule->v_day_of_week::text;

      IF v_schedule IS NOT NULL AND (v_schedule->>'enabled')::boolean THEN
        v_start_time := (v_schedule->>'start')::TIME;
        v_end_time := (v_schedule->>'end')::TIME;
        v_slot_time := v_start_time;

        WHILE v_slot_time < v_end_time LOOP
          INSERT INTO booking_slots (store_id, staff_id, slot_date, slot_time, source)
          VALUES (p_store_id, v_staff.id, v_current_date, v_slot_time, 'schedule')
          ON CONFLICT (store_id, staff_id, slot_date, slot_time) DO NOTHING;

          v_count := v_count + 1;
          v_slot_time := v_slot_time + INTERVAL '30 minutes';
        END LOOP;
      END IF;

      v_current_date := v_current_date + 1;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE booking_slots IS 'Pre-computed availability slots for efficient booking queries';
COMMENT ON FUNCTION get_available_slots IS 'Returns available booking slots for a service on a date';
COMMENT ON FUNCTION regenerate_booking_slots IS 'Regenerates booking slots from staff schedules';
