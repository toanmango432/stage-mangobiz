-- Migration 021: Create reviews table
-- Service and staff reviews from clients

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- What is being reviewed
  review_type TEXT NOT NULL
    CHECK (review_type IN ('service', 'staff', 'store', 'product')),

  -- References
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Rating
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

  -- Review content
  title TEXT,
  body TEXT,

  -- Media
  images JSONB DEFAULT '[]',  -- Array of image URLs

  -- Moderation
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_notes TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES staff(id),

  -- Response from business
  response TEXT,
  response_at TIMESTAMPTZ,
  responded_by UUID REFERENCES staff(id),

  -- Verification
  is_verified_purchase BOOLEAN DEFAULT false,

  -- Display
  is_featured BOOLEAN DEFAULT false,
  show_author_name BOOLEAN DEFAULT true,

  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,

  -- Source
  source TEXT DEFAULT 'online_store'
    CHECK (source IN ('online_store', 'pos', 'email_request', 'google', 'facebook', 'yelp', 'api')),
  external_review_id TEXT,  -- For synced reviews

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Review helpful votes tracking
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(review_id, client_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_store_status ON reviews(store_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_store_approved ON reviews(store_id, rating, created_at DESC)
  WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_reviews_staff ON reviews(staff_id, status)
  WHERE staff_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id, status)
  WHERE service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_client ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view approved reviews
CREATE POLICY "Public view approved reviews" ON reviews
  FOR SELECT USING (status = 'approved');

-- Policy: Clients can view their own reviews (any status)
CREATE POLICY "Clients view own reviews" ON reviews
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Clients can create reviews
CREATE POLICY "Clients create reviews" ON reviews
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Clients can update their own pending reviews
CREATE POLICY "Clients update own pending reviews" ON reviews
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
    AND status = 'pending'
  );

-- Policy: Clients can vote on reviews
CREATE POLICY "Clients can vote" ON review_votes
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Clients can view their own votes
CREATE POLICY "Clients view own votes" ON review_votes
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

-- Function to update helpful_count when votes change
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'helpful' THEN
      UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'helpful' THEN
      UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'helpful' AND NEW.vote_type != 'helpful' THEN
      UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = NEW.review_id;
    ELSIF OLD.vote_type != 'helpful' AND NEW.vote_type = 'helpful' THEN
      UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_review_helpful_on_vote
  AFTER INSERT OR UPDATE OR DELETE ON review_votes
  FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

COMMENT ON TABLE reviews IS 'Client reviews for services, staff, and products';
COMMENT ON TABLE review_votes IS 'Helpful votes on reviews';
