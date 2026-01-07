-- Migration 016: Create online_bookings table
-- Stores booking requests from Online Store before POS confirmation

CREATE TABLE IF NOT EXISTS online_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Service and staff
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,  -- NULL = any available

  -- Requested time
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),

  -- Guest info (for non-registered customers)
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,

  -- After confirmation, links to POS appointment
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

  -- Booking metadata
  notes TEXT,
  source TEXT DEFAULT 'web'
    CHECK (source IN ('web', 'ios', 'android', 'google', 'facebook', 'api')),

  -- Marketing attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer_url TEXT,

  -- Device info
  device_type TEXT,
  browser TEXT,
  ip_address INET,

  -- Confirmation tracking
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES staff(id),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT,  -- 'customer' or staff UUID

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes (critical for availability queries)
CREATE INDEX idx_online_bookings_store_date_status
  ON online_bookings(store_id, requested_date, status)
  WHERE status IN ('pending', 'confirmed');

CREATE INDEX idx_online_bookings_store_status
  ON online_bookings(store_id, status);

CREATE INDEX idx_online_bookings_client
  ON online_bookings(client_id)
  WHERE client_id IS NOT NULL;

CREATE INDEX idx_online_bookings_staff_date
  ON online_bookings(staff_id, requested_date)
  WHERE staff_id IS NOT NULL AND status IN ('pending', 'confirmed');

CREATE INDEX idx_online_bookings_created
  ON online_bookings(store_id, created_at DESC);

-- RLS
ALTER TABLE online_bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own bookings
CREATE POLICY "Customers view own bookings" ON online_bookings
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
    OR guest_email = (SELECT email FROM client_auth WHERE auth_user_id = auth.uid())
  );

-- Policy: Customers can create bookings
CREATE POLICY "Customers create bookings" ON online_bookings
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
    OR auth.uid() IS NOT NULL  -- Allow authenticated users to book
  );

-- Policy: Customers can cancel their own pending bookings
CREATE POLICY "Customers cancel own bookings" ON online_bookings
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
    AND status = 'pending'
  )
  WITH CHECK (status = 'cancelled');

-- Policy: Public can view aggregate availability (no personal data)
-- Note: Actual availability queries should use a secure function

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_online_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER online_bookings_updated_at
  BEFORE UPDATE ON online_bookings
  FOR EACH ROW EXECUTE FUNCTION update_online_bookings_updated_at();

COMMENT ON TABLE online_bookings IS 'Online booking requests from customers before POS staff confirmation';
