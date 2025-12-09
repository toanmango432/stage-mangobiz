-- Migration: Create announcements table for Control Center notifications
-- Supports multi-channel delivery, targeting, and tracking

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure: { title, body, summary?, imageUrl?, iconEmoji?, ctas?: [{label, url?, action?, style, trackClicks}] }

  -- Classification
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('feature_update', 'maintenance', 'security', 'promotion', 'tip', 'policy', 'urgent', 'general')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'error', 'neutral')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),

  -- Delivery channels (array)
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app_banner'],
  -- Options: in_app_banner, in_app_modal, in_app_toast, dashboard_widget, login_screen, email

  -- Channel-specific configuration
  channel_config JSONB DEFAULT '{}'::jsonb,

  -- Targeting
  targeting JSONB NOT NULL DEFAULT '{"tiers": ["all"], "roles": ["all"]}'::jsonb,
  -- Structure: { tiers: string[], roles: string[], specificTenantIds?: string[], behavior?: {...}, features?: {...} }

  -- Display behavior
  behavior JSONB NOT NULL DEFAULT '{"dismissible": true, "requireAcknowledgment": false, "showOnce": false}'::jsonb,
  -- Structure: { dismissible, requireAcknowledgment, showOnce, frequency?, startsAt?, expiresAt?, showDuringHours? }

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'expired', 'archived')),

  -- Statistics (denormalized for quick access)
  stats JSONB NOT NULL DEFAULT '{"totalViews": 0, "uniqueViews": 0, "dismissals": 0, "acknowledgments": 0, "ctaClicks": {}, "emailsSent": 0, "emailsOpened": 0, "emailsClicked": 0}'::jsonb,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  internal_notes TEXT,

  -- Audit
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_status_priority ON announcements(status, priority);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- Announcement interactions table for tracking user engagement
CREATE TABLE IF NOT EXISTS announcement_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  tenant_id UUID,
  user_id TEXT,
  store_id UUID,
  action TEXT NOT NULL CHECK (action IN ('view', 'dismiss', 'acknowledge', 'cta_click', 'email_open', 'email_click')),
  cta_label TEXT,
  channel TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for interaction queries
CREATE INDEX IF NOT EXISTS idx_announcement_interactions_announcement ON announcement_interactions(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_interactions_tenant ON announcement_interactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_announcement_interactions_action ON announcement_interactions(announcement_id, action);

-- Function to update stats when interaction is recorded
CREATE OR REPLACE FUNCTION update_announcement_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the stats based on action type
  IF NEW.action = 'view' THEN
    UPDATE announcements
    SET stats = jsonb_set(
      jsonb_set(stats, '{totalViews}', to_jsonb((stats->>'totalViews')::int + 1)),
      '{uniqueViews}',
      to_jsonb(COALESCE((SELECT COUNT(DISTINCT user_id) FROM announcement_interactions WHERE announcement_id = NEW.announcement_id AND action = 'view'), 0))
    ),
    updated_at = NOW()
    WHERE id = NEW.announcement_id;
  ELSIF NEW.action = 'dismiss' THEN
    UPDATE announcements
    SET stats = jsonb_set(stats, '{dismissals}', to_jsonb((stats->>'dismissals')::int + 1)),
    updated_at = NOW()
    WHERE id = NEW.announcement_id;
  ELSIF NEW.action = 'acknowledge' THEN
    UPDATE announcements
    SET stats = jsonb_set(stats, '{acknowledgments}', to_jsonb((stats->>'acknowledgments')::int + 1)),
    updated_at = NOW()
    WHERE id = NEW.announcement_id;
  ELSIF NEW.action = 'cta_click' AND NEW.cta_label IS NOT NULL THEN
    UPDATE announcements
    SET stats = jsonb_set(
      stats,
      ARRAY['ctaClicks', NEW.cta_label],
      to_jsonb(COALESCE((stats->'ctaClicks'->>NEW.cta_label)::int, 0) + 1)
    ),
    updated_at = NOW()
    WHERE id = NEW.announcement_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats
DROP TRIGGER IF EXISTS trigger_update_announcement_stats ON announcement_interactions;
CREATE TRIGGER trigger_update_announcement_stats
AFTER INSERT ON announcement_interactions
FOR EACH ROW
EXECUTE FUNCTION update_announcement_stats();

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for announcements (allow read for active announcements, full access for service role)
CREATE POLICY "Anyone can read active announcements" ON announcements
  FOR SELECT USING (status = 'active');

CREATE POLICY "Service role has full access to announcements" ON announcements
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for interactions
CREATE POLICY "Anyone can insert interactions" ON announcement_interactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read their own interactions" ON announcement_interactions
  FOR SELECT USING (true);

CREATE POLICY "Service role has full access to interactions" ON announcement_interactions
  FOR ALL USING (auth.role() = 'service_role');

-- Insert a sample welcome announcement
INSERT INTO announcements (
  content,
  category,
  severity,
  priority,
  channels,
  targeting,
  behavior,
  status,
  created_by
) VALUES (
  '{"title": "Welcome to Mango POS!", "body": "Thank you for choosing Mango POS. Get started by creating your first appointment or exploring the Front Desk.", "summary": "Welcome to Mango POS!"}'::jsonb,
  'feature_update',
  'success',
  'normal',
  ARRAY['in_app_banner', 'dashboard_widget'],
  '{"tiers": ["all"], "roles": ["all"]}'::jsonb,
  '{"dismissible": true, "requireAcknowledgment": false, "showOnce": true}'::jsonb,
  'active',
  'system'
) ON CONFLICT DO NOTHING;
