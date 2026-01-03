-- Migration: 013_create_staff_ratings_table.sql
-- Description: Create staff_ratings table for client reviews and ratings
-- PRD Reference: PRD-Team-Module.md - Section 6.1.4 Staff Rating System

CREATE TABLE IF NOT EXISTS staff_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,

  -- Client who left the review (optional - can be anonymous)
  client_id UUID REFERENCES clients(id),
  client_name TEXT, -- Stored separately for display even if client deleted

  -- Transaction links
  appointment_id UUID REFERENCES appointments(id),
  ticket_id UUID REFERENCES tickets(id),

  -- Rating (1-5 stars)
  rating INTEGER NOT NULL,
  review_text TEXT,

  -- Display settings
  is_public BOOLEAN DEFAULT true, -- Show on online booking
  is_verified BOOLEAN DEFAULT false, -- From verified appointment

  -- Moderation
  status TEXT DEFAULT 'active', -- active, hidden, flagged, removed
  flagged_reason TEXT,
  moderated_by UUID REFERENCES members(id),
  moderated_at TIMESTAMPTZ,
  moderation_notes TEXT,

  -- Response from staff/business
  response_text TEXT,
  response_by UUID REFERENCES members(id),
  response_at TIMESTAMPTZ,

  -- Service details (for context)
  services_performed TEXT[], -- Array of service names
  service_date DATE,

  -- Source
  source TEXT DEFAULT 'in_app', -- in_app, online_booking, google, yelp, imported

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add check constraint for rating range
ALTER TABLE staff_ratings ADD CONSTRAINT staff_ratings_rating_check
CHECK (rating >= 1 AND rating <= 5);

-- Add check constraint for valid status
ALTER TABLE staff_ratings ADD CONSTRAINT staff_ratings_status_check
CHECK (status IN ('active', 'hidden', 'flagged', 'removed', 'pending_review'));

-- Create indexes for common queries
CREATE INDEX idx_staff_ratings_staff ON staff_ratings(staff_id, created_at DESC);
CREATE INDEX idx_staff_ratings_public ON staff_ratings(staff_id, is_public, status) WHERE status = 'active' AND is_public = true;
CREATE INDEX idx_staff_ratings_store ON staff_ratings(store_id, created_at DESC);
CREATE INDEX idx_staff_ratings_client ON staff_ratings(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_staff_ratings_flagged ON staff_ratings(store_id, status) WHERE status = 'flagged';

-- Enable Row Level Security
ALTER TABLE staff_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public ratings are viewable by anyone (for online booking)
CREATE POLICY "Public ratings are viewable"
  ON staff_ratings FOR SELECT
  USING (
    (is_public = true AND status = 'active')
    OR store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Store members can insert ratings
CREATE POLICY "Store members can insert ratings"
  ON staff_ratings FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Store members can update ratings
CREATE POLICY "Store members can update ratings"
  ON staff_ratings FOR UPDATE
  USING (
    store_id IN (
      SELECT unnest(store_ids) FROM members WHERE id = auth.uid()
    )
  );

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_staff_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS staff_ratings_updated_at_trigger ON staff_ratings;
CREATE TRIGGER staff_ratings_updated_at_trigger
  BEFORE UPDATE ON staff_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_ratings_updated_at();

-- Create function to update staff aggregate ratings
CREATE OR REPLACE FUNCTION update_staff_rating_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the staff table with new aggregate values
  UPDATE staff
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM staff_ratings
      WHERE staff_id = COALESCE(NEW.staff_id, OLD.staff_id)
        AND status = 'active'
        AND is_public = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM staff_ratings
      WHERE staff_id = COALESCE(NEW.staff_id, OLD.staff_id)
        AND status = 'active'
        AND is_public = true
    )
  WHERE id = COALESCE(NEW.staff_id, OLD.staff_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update staff aggregates on rating changes
DROP TRIGGER IF EXISTS staff_ratings_aggregate_trigger ON staff_ratings;
CREATE TRIGGER staff_ratings_aggregate_trigger
  AFTER INSERT OR UPDATE OR DELETE ON staff_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_rating_aggregates();

-- Add comment for documentation
COMMENT ON TABLE staff_ratings IS 'Client ratings and reviews for staff members. Supports 1-5 star ratings with optional review text. Includes moderation and response features.';
