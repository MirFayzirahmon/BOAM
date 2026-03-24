-- ============================================================
-- AssetTrack — RBAC Migration
-- Adds user_roles and asset_requests tables
-- ============================================================

-- ============================================================
-- USER ROLES
-- ============================================================
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('ADMIN', 'EMPLOYEE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON user_roles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX idx_user_roles_email ON user_roles(email);

-- ============================================================
-- ASSET REQUESTS
-- ============================================================
CREATE TABLE asset_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_email TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'NEW_ASSET_PURCHASE'
    CHECK (request_type IN ('EXISTING_ASSET_ASSIGNMENT', 'NEW_ASSET_PURCHASE', 'STATUS_CHANGE')),
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  target_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  requested_status asset_status,
  justification TEXT NOT NULL,
  procurement_required BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_notes TEXT,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE asset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON asset_requests
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX idx_asset_requests_requester ON asset_requests(requester_email);
CREATE INDEX idx_asset_requests_status ON asset_requests(status);
