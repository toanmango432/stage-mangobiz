-- Migration 015: Create client_auth table
-- Links Supabase Auth users to existing POS clients table
-- For Online Store customer authentication

CREATE TABLE IF NOT EXISTS client_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE,  -- Supabase auth.users.id
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,  -- Link to POS client
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Profile info
  email TEXT NOT NULL,
  phone TEXT,

  -- Verification status
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,

  -- Linking metadata
  link_method TEXT DEFAULT 'email_match'
    CHECK (link_method IN ('email_match', 'phone_verify', 'manual', 'oauth')),
  linked_at TIMESTAMPTZ,

  -- Activity tracking
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_client_auth_email_store
  ON client_auth(email, store_id);
CREATE INDEX idx_client_auth_client
  ON client_auth(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_client_auth_store
  ON client_auth(store_id);

-- RLS
ALTER TABLE client_auth ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own auth record
CREATE POLICY "Users view own auth" ON client_auth
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Policy: Users can update their own auth record
CREATE POLICY "Users update own auth" ON client_auth
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Policy: Allow insert during signup (authenticated users only)
CREATE POLICY "Users create own auth" ON client_auth
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_client_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_auth_updated_at
  BEFORE UPDATE ON client_auth
  FOR EACH ROW EXECUTE FUNCTION update_client_auth_updated_at();

COMMENT ON TABLE client_auth IS 'Links Supabase Auth users to POS clients for Online Store';
