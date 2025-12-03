-- Migration: Create portfolio_items and staff_reviews tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/cpaldkcvdcdyzytosntc/sql

-- =============================================
-- PORTFOLIO ITEMS TABLE
-- Stores staff work samples/portfolio images
-- =============================================

CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_before_after BOOLEAN DEFAULT FALSE,
  before_image_url TEXT,
  likes INTEGER DEFAULT 0,
  sync_status TEXT DEFAULT 'synced',
  sync_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for portfolio_items
CREATE INDEX IF NOT EXISTS idx_portfolio_staff ON portfolio_items(staff_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_store ON portfolio_items(store_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON portfolio_items(is_featured) WHERE is_featured = TRUE;

-- Enable RLS
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolio_items
CREATE POLICY "Allow read access for all users" ON portfolio_items
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON portfolio_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON portfolio_items
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete for authenticated users" ON portfolio_items
  FOR DELETE USING (true);

-- =============================================
-- STAFF REVIEWS TABLE
-- Stores client reviews for staff members
-- =============================================

CREATE TABLE IF NOT EXISTS staff_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT 'Anonymous',
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  service_date DATE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  response_text TEXT,
  response_at TIMESTAMPTZ,
  response_by UUID REFERENCES members(id),
  is_public BOOLEAN DEFAULT TRUE,
  sync_status TEXT DEFAULT 'synced',
  sync_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for staff_reviews
CREATE INDEX IF NOT EXISTS idx_reviews_staff ON staff_reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_reviews_store ON staff_reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON staff_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON staff_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE staff_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_reviews
CREATE POLICY "Allow read access for all users" ON staff_reviews
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON staff_reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON staff_reviews
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete for authenticated users" ON staff_reviews
  FOR DELETE USING (true);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_reviews_updated_at
  BEFORE UPDATE ON staff_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STORAGE BUCKET FOR IMAGES
-- Run this separately in Storage settings or via SQL
-- =============================================

-- Create storage bucket for staff portfolio images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-portfolio',
  'staff-portfolio',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for staff-portfolio bucket
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'staff-portfolio');

CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'staff-portfolio');

CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'staff-portfolio');

CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'staff-portfolio');
