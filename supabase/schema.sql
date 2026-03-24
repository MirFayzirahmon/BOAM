-- ============================================================
-- AssetTrack — Bank Office Asset Management System
-- Supabase SQL Schema
-- CBU Coding Hackathon 2026 — Team NEWBIES
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  branch TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  department TEXT NOT NULL,
  branch TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_INVITE', 'INACTIVE')),
  invited_by TEXT,
  invited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ASSETS
-- ============================================================
CREATE TYPE asset_category AS ENUM ('IT', 'Office', 'Security', 'Other');
CREATE TYPE asset_status AS ENUM ('REGISTERED', 'ASSIGNED', 'IN_REPAIR', 'LOST', 'WRITTEN_OFF');

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category asset_category NOT NULL DEFAULT 'Other',
  serial_number TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  status asset_status NOT NULL DEFAULT 'REGISTERED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT
);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  returned_at TIMESTAMPTZ,
  notes TEXT
);

-- Only one active assignment per asset (returned_at IS NULL means active)
CREATE UNIQUE INDEX idx_one_active_assignment
  ON assignments (asset_id)
  WHERE returned_at IS NULL;

-- ============================================================
-- ASSET HISTORY (Audit Log)
-- ============================================================
CREATE TABLE asset_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  changed_by TEXT NOT NULL,
  old_status asset_status,
  new_status asset_status NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT NOT NULL,
  notes TEXT
);

-- ============================================================
-- CONSTRAINTS: prevent assigning LOST or WRITTEN_OFF assets
-- ============================================================
CREATE OR REPLACE FUNCTION check_asset_assignable()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT status FROM assets WHERE id = NEW.asset_id) IN ('LOST', 'WRITTEN_OFF') THEN
    RAISE EXCEPTION 'Cannot assign an asset with status LOST or WRITTEN_OFF';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_asset_assignable
  BEFORE INSERT ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION check_asset_assignable();

-- ============================================================
-- AUTO-UPDATE updated_at on assets
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (allow authenticated users full access)
-- ============================================================
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON assets
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON employees
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON assignments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON asset_history
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON departments
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assignments_asset ON assignments(asset_id);
CREATE INDEX idx_assignments_employee ON assignments(employee_id);
CREATE INDEX idx_asset_history_asset ON asset_history(asset_id);
CREATE INDEX idx_asset_history_changed_at ON asset_history(changed_at);
