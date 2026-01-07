-- Migration 026: Additional indexes, policies, and utilities for Online Store
-- Performance optimization and service role access

-- =============================================================================
-- SERVICE ROLE POLICIES (for POS/Admin access)
-- =============================================================================

-- Allow service role full access to all Online Store tables
-- This enables POS staff to manage bookings, orders, etc.

-- Client Auth: Service role can manage all records
CREATE POLICY "Service role manages client_auth" ON client_auth
  FOR ALL USING (auth.role() = 'service_role');

-- Online Bookings: Service role can manage all records
CREATE POLICY "Service role manages online_bookings" ON online_bookings
  FOR ALL USING (auth.role() = 'service_role');

-- Products: Service role can manage all records
CREATE POLICY "Service role manages products" ON products
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages product_categories" ON product_categories
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages product_inventory_log" ON product_inventory_log
  FOR ALL USING (auth.role() = 'service_role');

-- Memberships: Service role can manage all records
CREATE POLICY "Service role manages memberships" ON memberships
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages client_memberships" ON client_memberships
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages membership_usage_log" ON membership_usage_log
  FOR ALL USING (auth.role() = 'service_role');

-- Gift Cards: Service role can manage all records
CREATE POLICY "Service role manages gift_cards" ON gift_cards
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages gift_card_transactions" ON gift_card_transactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages client_gift_cards" ON client_gift_cards
  FOR ALL USING (auth.role() = 'service_role');

-- Orders: Service role can manage all records
CREATE POLICY "Service role manages orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages order_items" ON order_items
  FOR ALL USING (auth.role() = 'service_role');

-- Reviews: Service role can manage all records
CREATE POLICY "Service role manages reviews" ON reviews
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages review_votes" ON review_votes
  FOR ALL USING (auth.role() = 'service_role');

-- Promotions: Service role can manage all records
CREATE POLICY "Service role manages promotions" ON promotions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages promotion_usage" ON promotion_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Booking Slots: Service role can manage all records
CREATE POLICY "Service role manages booking_slots" ON booking_slots
  FOR ALL USING (auth.role() = 'service_role');

-- Notification Preferences: Service role can manage all records
CREATE POLICY "Service role manages notification_prefs" ON client_notification_preferences
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages notification_log" ON notification_log
  FOR ALL USING (auth.role() = 'service_role');

-- Booking Recurrence: Service role can manage all records
CREATE POLICY "Service role manages booking_recurrence" ON booking_recurrence
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =============================================================================

-- Services: For online store catalog queries
-- Note: Using 'category' (text) instead of 'category_id' per actual schema
CREATE INDEX IF NOT EXISTS idx_services_online_display
  ON services(store_id, category)
  WHERE is_active = true;

-- Staff: For online booking staff selection
CREATE INDEX IF NOT EXISTS idx_staff_online_booking
  ON staff(store_id, is_active)
  WHERE is_active = true;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to get store's online booking settings
CREATE OR REPLACE FUNCTION get_store_booking_settings(p_store_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'booking_lead_time_hours', COALESCE((settings->>'booking_lead_time_hours')::integer, 2),
    'booking_max_advance_days', COALESCE((settings->>'booking_max_advance_days')::integer, 60),
    'allow_guest_booking', COALESCE((settings->>'allow_guest_booking')::boolean, true),
    'require_deposit', COALESCE((settings->>'require_deposit')::boolean, false),
    'deposit_percentage', COALESCE((settings->>'deposit_percentage')::integer, 20),
    'cancellation_policy_hours', COALESCE((settings->>'cancellation_policy_hours')::integer, 24),
    'auto_confirm_bookings', COALESCE((settings->>'auto_confirm_bookings')::boolean, false)
  )
  INTO v_result
  FROM stores
  WHERE id = p_store_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if client has active membership
CREATE OR REPLACE FUNCTION client_has_active_membership(
  p_client_id UUID,
  p_store_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM client_memberships
    WHERE client_id = p_client_id
      AND store_id = p_store_id
      AND status = 'active'
      AND current_period_end > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client's membership discount
CREATE OR REPLACE FUNCTION get_client_membership_discount(
  p_client_id UUID,
  p_store_id UUID,
  p_service_id UUID DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  v_discount DECIMAL := 0;
  v_membership RECORD;
BEGIN
  SELECT m.discount_percentage, m.discount_services
  INTO v_membership
  FROM client_memberships cm
  JOIN memberships m ON m.id = cm.membership_id
  WHERE cm.client_id = p_client_id
    AND cm.store_id = p_store_id
    AND cm.status = 'active'
    AND cm.current_period_end > now()
  ORDER BY m.discount_percentage DESC NULLS LAST
  LIMIT 1;

  IF v_membership IS NULL THEN
    RETURN 0;
  END IF;

  -- Check for service-specific discount
  IF p_service_id IS NOT NULL AND v_membership.discount_services IS NOT NULL THEN
    SELECT (item->>'discount')::decimal INTO v_discount
    FROM jsonb_array_elements(v_membership.discount_services) AS item
    WHERE (item->>'service_id')::uuid = p_service_id;

    IF v_discount IS NOT NULL THEN
      RETURN v_discount;
    END IF;
  END IF;

  -- Return global membership discount
  RETURN COALESCE(v_membership.discount_percentage, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client's gift card balance
CREATE OR REPLACE FUNCTION get_client_gift_card_balance(
  p_client_id UUID,
  p_store_id UUID
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(gc.current_balance)
    FROM client_gift_cards cgc
    JOIN gift_cards gc ON gc.id = cgc.gift_card_id
    WHERE cgc.client_id = p_client_id
      AND cgc.store_id = p_store_id
      AND gc.status = 'active'
      AND (gc.expires_at IS NULL OR gc.expires_at > now())
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client's loyalty points
CREATE OR REPLACE FUNCTION get_client_loyalty_points(
  p_client_id UUID,
  p_store_id UUID
)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((
    SELECT reward_points
    FROM clients
    WHERE id = p_client_id
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION get_store_booking_settings IS 'Returns store online booking configuration';
COMMENT ON FUNCTION client_has_active_membership IS 'Checks if client has an active membership';
COMMENT ON FUNCTION get_client_membership_discount IS 'Gets applicable membership discount for a client';
COMMENT ON FUNCTION get_client_gift_card_balance IS 'Gets total gift card balance for a client';
COMMENT ON FUNCTION get_client_loyalty_points IS 'Gets loyalty points balance for a client';
