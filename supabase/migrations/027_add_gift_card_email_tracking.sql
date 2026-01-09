-- Migration 027: Add email tracking columns to gift_cards
-- Supports email delivery tracking for the send-gift-card-email Edge Function

-- Add email tracking columns
ALTER TABLE gift_cards
ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'pending'
  CHECK (email_status IN ('pending', 'scheduled', 'sent', 'delivered', 'failed', 'bounced')),
ADD COLUMN IF NOT EXISTS email_message_id TEXT,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_error TEXT;

-- Index for finding pending scheduled emails
CREATE INDEX IF NOT EXISTS idx_gift_cards_email_scheduled
  ON gift_cards(delivery_scheduled_at)
  WHERE email_status = 'scheduled' AND delivery_scheduled_at IS NOT NULL;

COMMENT ON COLUMN gift_cards.email_status IS 'Email delivery status: pending, scheduled, sent, delivered, failed, bounced';
COMMENT ON COLUMN gift_cards.email_message_id IS 'Email provider message ID for tracking';
COMMENT ON COLUMN gift_cards.email_sent_at IS 'When the email was sent';
COMMENT ON COLUMN gift_cards.email_delivered_at IS 'When the email was confirmed delivered';
COMMENT ON COLUMN gift_cards.email_error IS 'Error message if email failed';
