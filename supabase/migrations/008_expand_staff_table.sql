-- Migration: 008_expand_staff_table.sql
-- Description: Expand staff table with comprehensive team management fields
-- PRD Reference: PRD-Team-Module.md - Phase 1 (P0) requirements

-- Add role column with salon/spa specific roles
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'stylist';

-- Add employment information
ALTER TABLE staff ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'full-time';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS termination_date DATE;

-- Add commission and wage settings (JSONB for flexibility)
-- commission_settings: { type, basePercentage, tiers[], serviceCommission, productCommission, tipHandling, bonuses }
ALTER TABLE staff ADD COLUMN IF NOT EXISTS commission_settings JSONB DEFAULT '{"type": "percentage", "basePercentage": 50, "serviceCommission": 50, "productCommission": 10, "tipHandling": "keep_all"}';

-- wage_settings: { payType, hourlyRate, salaryAmount, guaranteedMinimum, overtimeRate, payPeriod }
ALTER TABLE staff ADD COLUMN IF NOT EXISTS wage_settings JSONB DEFAULT '{"payType": "commission_only", "overtimeRate": 1.5, "payPeriod": "bi-weekly"}';

-- Add online booking settings
-- { isBookableOnline, showOnWebsite, acceptNewClients, autoAcceptBookings, maxAdvanceBookingDays, bufferBetweenAppointments }
ALTER TABLE staff ADD COLUMN IF NOT EXISTS online_booking_settings JSONB DEFAULT '{"isBookableOnline": true, "showOnWebsite": true, "acceptNewClients": true, "autoAcceptBookings": true, "maxAdvanceBookingDays": 60, "bufferBetweenAppointments": 0}';

-- Add permissions (granular permission flags)
-- { canAccessAdminPortal, canAccessReports, canModifyPrices, canApplyDiscounts, canProcessRefunds, canManageTeam, etc. }
ALTER TABLE staff ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Add professional profile for client-facing info
-- { bio, jobTitle, specialties[], yearsExperience, certifications[], languages[], portfolioImages[] }
ALTER TABLE staff ADD COLUMN IF NOT EXISTS professional_profile JSONB DEFAULT '{}';

-- Add HR information
-- { employeeId, dateOfBirth, emergencyContact, address, taxInfo }
ALTER TABLE staff ADD COLUMN IF NOT EXISTS hr_info JSONB DEFAULT '{}';

-- Add notification preferences
-- { email: {}, sms: {}, push: {} }
ALTER TABLE staff ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": {"newBooking": true, "bookingChange": true}, "sms": {"newBooking": true}, "push": {"newBooking": true}}';

-- Add performance goals
-- { dailyRevenueTarget, weeklyServicesTarget, rebookingRateTarget, etc. }
ALTER TABLE staff ADD COLUMN IF NOT EXISTS performance_goals JSONB DEFAULT '{}';

-- Add turn tracking fields
ALTER TABLE staff ADD COLUMN IF NOT EXISTS turn_queue_position INTEGER DEFAULT 0;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS daily_turn_count INTEGER DEFAULT 0;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS daily_revenue NUMERIC(10,2) DEFAULT 0;

-- Add clock in/out tracking
ALTER TABLE staff ADD COLUMN IF NOT EXISTS clocked_in_at TIMESTAMPTZ;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS current_ticket_id UUID;

-- Add rating aggregates (denormalized for performance)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT 0;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Add services assignment (array of service IDs with custom settings)
-- [{ serviceId, canPerform, customPrice, customDuration, commissionOverride, skillLevel }]
ALTER TABLE staff ADD COLUMN IF NOT EXISTS service_assignments JSONB DEFAULT '[]';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(store_id, role);
CREATE INDEX IF NOT EXISTS idx_staff_clocked_in ON staff(store_id, clocked_in_at) WHERE clocked_in_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_employment_type ON staff(store_id, employment_type);
CREATE INDEX IF NOT EXISTS idx_staff_turn_queue ON staff(store_id, turn_queue_position) WHERE is_active = true;

-- Add check constraint for valid roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_role_check'
  ) THEN
    ALTER TABLE staff ADD CONSTRAINT staff_role_check
    CHECK (role IN (
      'owner', 'manager',
      'senior_stylist', 'stylist', 'junior_stylist', 'apprentice', 'barber', 'colorist',
      'nail_technician', 'esthetician', 'massage_therapist', 'makeup_artist',
      'receptionist', 'assistant'
    ));
  END IF;
END $$;

-- Add check constraint for employment type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_employment_type_check'
  ) THEN
    ALTER TABLE staff ADD CONSTRAINT staff_employment_type_check
    CHECK (employment_type IN ('full-time', 'part-time', 'contractor', 'temporary'));
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE staff IS 'Staff members with comprehensive team management fields. Supports 14 role types, commission/wage settings, online booking, and performance tracking.';
