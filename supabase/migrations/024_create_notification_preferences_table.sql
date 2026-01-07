-- Migration 024: Create client_notification_preferences table
-- Customer communication settings for Online Store
-- Recommended by backend architect for personalized communication

CREATE TABLE IF NOT EXISTS client_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Email preferences
  email_enabled BOOLEAN DEFAULT true,
  email_booking_confirmation BOOLEAN DEFAULT true,
  email_booking_reminder BOOLEAN DEFAULT true,
  email_booking_cancelled BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  email_promotions BOOLEAN DEFAULT false,
  email_newsletter BOOLEAN DEFAULT false,
  email_review_request BOOLEAN DEFAULT true,
  email_rewards_updates BOOLEAN DEFAULT true,
  email_membership_updates BOOLEAN DEFAULT true,
  email_order_updates BOOLEAN DEFAULT true,

  -- SMS preferences
  sms_enabled BOOLEAN DEFAULT true,
  sms_booking_confirmation BOOLEAN DEFAULT true,
  sms_booking_reminder BOOLEAN DEFAULT true,
  sms_booking_cancelled BOOLEAN DEFAULT true,
  sms_marketing BOOLEAN DEFAULT false,
  sms_promotions BOOLEAN DEFAULT false,

  -- Push notification preferences (for mobile app)
  push_enabled BOOLEAN DEFAULT true,
  push_booking_updates BOOLEAN DEFAULT true,
  push_promotions BOOLEAN DEFAULT false,
  push_rewards_updates BOOLEAN DEFAULT true,

  -- Reminder timing
  reminder_hours_before INTEGER DEFAULT 24,
  second_reminder_hours_before INTEGER,  -- NULL = no second reminder

  -- Communication frequency limits
  max_marketing_emails_per_month INTEGER DEFAULT 4,
  max_marketing_sms_per_month INTEGER DEFAULT 2,

  -- Do not disturb
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '21:00',
  quiet_hours_end TIME DEFAULT '09:00',

  -- Unsubscribe tracking
  email_unsubscribed_at TIMESTAMPTZ,
  sms_unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(client_id, store_id)
);

-- Notification history log
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Notification details
  notification_type TEXT NOT NULL
    CHECK (notification_type IN (
      'email', 'sms', 'push',
      'booking_confirmation', 'booking_reminder', 'booking_cancelled',
      'review_request', 'marketing', 'promotion', 'newsletter',
      'rewards_update', 'membership_update', 'order_update'
    )),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),

  -- Delivery details
  recipient TEXT NOT NULL,  -- Email address or phone number
  subject TEXT,
  template_id TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),

  -- Provider response
  provider TEXT,  -- 'sendgrid', 'twilio', 'firebase', etc.
  provider_message_id TEXT,
  error_message TEXT,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notification_prefs_client ON client_notification_preferences(client_id);
CREATE INDEX idx_notification_prefs_store ON client_notification_preferences(store_id);
CREATE INDEX idx_notification_log_client ON notification_log(client_id, created_at DESC)
  WHERE client_id IS NOT NULL;
CREATE INDEX idx_notification_log_store ON notification_log(store_id, created_at DESC);
CREATE INDEX idx_notification_log_status ON notification_log(status, created_at)
  WHERE status IN ('pending', 'sent');

-- RLS
ALTER TABLE client_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view and update their own preferences
CREATE POLICY "Clients view own preferences" ON client_notification_preferences
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients update own preferences" ON client_notification_preferences
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients insert own preferences" ON client_notification_preferences
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Clients can view their notification history
CREATE POLICY "Clients view own notifications" ON notification_log
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM client_auth WHERE auth_user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON client_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

-- Function to check if client should receive notification
CREATE OR REPLACE FUNCTION should_send_notification(
  p_client_id UUID,
  p_store_id UUID,
  p_notification_type TEXT,
  p_channel TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_prefs RECORD;
  v_current_hour INTEGER;
  v_should_send BOOLEAN := true;
BEGIN
  SELECT * INTO v_prefs
  FROM client_notification_preferences
  WHERE client_id = p_client_id AND store_id = p_store_id;

  -- If no preferences, use defaults (allow transactional, deny marketing)
  IF v_prefs IS NULL THEN
    RETURN p_notification_type NOT IN ('marketing', 'promotion', 'newsletter');
  END IF;

  -- Check channel enabled
  IF p_channel = 'email' AND NOT v_prefs.email_enabled THEN
    RETURN false;
  ELSIF p_channel = 'sms' AND NOT v_prefs.sms_enabled THEN
    RETURN false;
  ELSIF p_channel = 'push' AND NOT v_prefs.push_enabled THEN
    RETURN false;
  END IF;

  -- Check quiet hours
  IF v_prefs.quiet_hours_enabled THEN
    v_current_hour := EXTRACT(HOUR FROM CURRENT_TIME);
    IF v_current_hour >= EXTRACT(HOUR FROM v_prefs.quiet_hours_start)
       OR v_current_hour < EXTRACT(HOUR FROM v_prefs.quiet_hours_end) THEN
      -- Only block marketing during quiet hours, allow transactional
      IF p_notification_type IN ('marketing', 'promotion', 'newsletter') THEN
        RETURN false;
      END IF;
    END IF;
  END IF;

  -- Check specific notification type preference
  CASE p_notification_type
    WHEN 'booking_confirmation' THEN
      v_should_send := CASE p_channel
        WHEN 'email' THEN v_prefs.email_booking_confirmation
        WHEN 'sms' THEN v_prefs.sms_booking_confirmation
        ELSE v_prefs.push_booking_updates
      END;
    WHEN 'booking_reminder' THEN
      v_should_send := CASE p_channel
        WHEN 'email' THEN v_prefs.email_booking_reminder
        WHEN 'sms' THEN v_prefs.sms_booking_reminder
        ELSE v_prefs.push_booking_updates
      END;
    WHEN 'marketing' THEN
      v_should_send := CASE p_channel
        WHEN 'email' THEN v_prefs.email_marketing
        WHEN 'sms' THEN v_prefs.sms_marketing
        ELSE v_prefs.push_promotions
      END;
    WHEN 'promotion' THEN
      v_should_send := CASE p_channel
        WHEN 'email' THEN v_prefs.email_promotions
        WHEN 'sms' THEN v_prefs.sms_promotions
        ELSE v_prefs.push_promotions
      END;
    ELSE
      v_should_send := true;  -- Allow unknown types by default
  END CASE;

  RETURN v_should_send;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE client_notification_preferences IS 'Customer communication and notification settings';
COMMENT ON TABLE notification_log IS 'Log of all notifications sent to customers';
COMMENT ON FUNCTION should_send_notification IS 'Checks if a notification should be sent based on client preferences';
