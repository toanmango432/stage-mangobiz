-- ============================================================================
-- Migration: 028_add_device_pairing_columns.sql
-- Description: Add device pairing support to salon_devices table
-- Part of: Device Pairing System (Store App ↔ Mango Pad)
-- ============================================================================

-- Add device role column (separate from platform type)
-- device_role identifies what the device does (store-app, mango-pad, check-in, display)
-- device_type (existing) identifies the platform (ios, android, web, desktop)
ALTER TABLE salon_devices
ADD COLUMN IF NOT EXISTS device_role TEXT;

-- Add CHECK constraint for device_role
-- Only apply if the column was just added (avoid duplicate constraint error)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'salon_devices_device_role_check'
  ) THEN
    ALTER TABLE salon_devices
    ADD CONSTRAINT salon_devices_device_role_check
    CHECK (device_role IS NULL OR device_role IN ('store-app', 'mango-pad', 'check-in', 'display'));
  END IF;
END $$;

-- Add station_name for identifying checkout stations
-- e.g., "Checkout Station 1", "Front Desk", etc.
ALTER TABLE salon_devices
ADD COLUMN IF NOT EXISTS station_name TEXT;

-- Add pairing_code for device pairing (6-char alphanumeric)
-- Store App generates this, Mango Pad enters it to pair
ALTER TABLE salon_devices
ADD COLUMN IF NOT EXISTS pairing_code TEXT;

-- Add paired_to_device_id to track which station a Pad is paired to
-- For store-app: NULL (stations don't pair to other devices)
-- For mango-pad: references the store-app device_fingerprint it's paired to
ALTER TABLE salon_devices
ADD COLUMN IF NOT EXISTS paired_to_device_id TEXT;

-- Create index on pairing_code for fast lookup during pairing
CREATE INDEX IF NOT EXISTS idx_salon_devices_pairing_code
  ON salon_devices(pairing_code)
  WHERE pairing_code IS NOT NULL;

-- Create index on paired_to_device_id for finding paired devices
CREATE INDEX IF NOT EXISTS idx_salon_devices_paired_to
  ON salon_devices(store_id, paired_to_device_id)
  WHERE paired_to_device_id IS NOT NULL;

-- Create index on device_role for filtering by role
CREATE INDEX IF NOT EXISTS idx_salon_devices_role
  ON salon_devices(store_id, device_role);

-- RLS Policy: Allow authenticated users to update their own device record
-- (for pairing operations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'salon_devices_update_own_policy'
  ) THEN
    CREATE POLICY "salon_devices_update_own_policy" ON salon_devices
      FOR UPDATE
      USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
  END IF;
END $$;

-- RLS Policy: Allow authenticated users to insert device records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'salon_devices_insert_policy'
  ) THEN
    CREATE POLICY "salon_devices_insert_policy" ON salon_devices
      FOR INSERT
      WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
  END IF;
END $$;

-- Add comments for new columns
COMMENT ON COLUMN salon_devices.device_role IS 'Device role: store-app (checkout station), mango-pad (customer-facing iPad), check-in (kiosk), display (waiting room)';
COMMENT ON COLUMN salon_devices.station_name IS 'Human-readable station name for identification (e.g., "Checkout Station 1")';
COMMENT ON COLUMN salon_devices.pairing_code IS '6-character alphanumeric pairing code (uppercase) for device pairing';
COMMENT ON COLUMN salon_devices.paired_to_device_id IS 'For mango-pad devices: the device_fingerprint of the store-app station it is paired to';
