-- ============================================================
-- AssetTrack — Seed Data
-- Realistic banking office assets
-- ============================================================

-- DEPARTMENTS
INSERT INTO departments (id, name, branch) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'IT Department', 'Head Office'),
  ('d1000000-0000-0000-0000-000000000002', 'Operations', 'Head Office'),
  ('d1000000-0000-0000-0000-000000000003', 'Security', 'Head Office'),
  ('d1000000-0000-0000-0000-000000000004', 'Finance', 'Branch 1'),
  ('d1000000-0000-0000-0000-000000000005', 'Customer Service', 'Branch 2');

-- EMPLOYEES
INSERT INTO employees (id, full_name, email, phone, department, branch, status) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Alisher Karimov', 'a.karimov@bank.uz', '+998901111111', 'IT Department', 'Head Office', 'ACTIVE'),
  ('e1000000-0000-0000-0000-000000000002', 'Nodira Usmanova', 'n.usmanova@bank.uz', '+998902222222', 'Operations', 'Head Office', 'ACTIVE'),
  ('e1000000-0000-0000-0000-000000000003', 'Bekzod Rahimov', 'b.rahimov@bank.uz', '+998903333333', 'Security', 'Head Office', 'ACTIVE'),
  ('e1000000-0000-0000-0000-000000000004', 'Dilnoza Tosheva', 'd.tosheva@bank.uz', '+998904444444', 'Finance', 'Branch 1', 'ACTIVE'),
  ('e1000000-0000-0000-0000-000000000005', 'Sardor Mirzayev', 's.mirzayev@bank.uz', '+998905555555', 'Customer Service', 'Branch 2', 'ACTIVE');

-- ASSETS: Insert ALL as REGISTERED first so assignments can be created
INSERT INTO assets (id, name, type, category, serial_number, description, status, created_at, updated_at) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Dell Latitude 5540', 'Laptop', 'IT', 'DL-5540-001', 'Dell business laptop, 16GB RAM, 512GB SSD', 'REGISTERED', NOW() - INTERVAL '400 days', NOW() - INTERVAL '10 days'),
  ('a1000000-0000-0000-0000-000000000002', 'HP LaserJet Pro M404', 'Printer', 'IT', 'HP-M404-002', 'Network laser printer for Operations floor', 'REGISTERED', NOW() - INTERVAL '300 days', NOW() - INTERVAL '5 days'),
  ('a1000000-0000-0000-0000-000000000003', 'Cisco Catalyst 2960', 'Network Switch', 'IT', 'CC-2960-003', '48-port managed switch for server room', 'REGISTERED', NOW() - INTERVAL '800 days', NOW() - INTERVAL '30 days'),
  ('a1000000-0000-0000-0000-000000000004', 'Dell PowerEdge R740', 'Server', 'IT', 'DPE-R740-004', 'Rack-mounted server, 64GB RAM, dual Xeon', 'REGISTERED', NOW() - INTERVAL '1200 days', NOW() - INTERVAL '60 days'),
  ('a1000000-0000-0000-0000-000000000005', 'Hikvision DS-2CD2143', 'Security Camera', 'Security', 'HK-2143-005', '4MP dome camera, PoE, night vision', 'REGISTERED', NOW() - INTERVAL '600 days', NOW() - INTERVAL '15 days'),
  ('a1000000-0000-0000-0000-000000000006', 'Herman Miller Aeron', 'Office Chair', 'Office', 'HMA-AERON-006', 'Ergonomic office chair, size B', 'REGISTERED', NOW() - INTERVAL '500 days', NOW() - INTERVAL '20 days'),
  ('a1000000-0000-0000-0000-000000000007', 'Samsung 27" Monitor', 'Monitor', 'IT', 'SM-27M-007', '27-inch 4K IPS display', 'REGISTERED', NOW() - INTERVAL '350 days', NOW() - INTERVAL '45 days'),
  ('a1000000-0000-0000-0000-000000000008', 'Lenovo ThinkPad X1', 'Laptop', 'IT', 'LTP-X1-008', 'Executive laptop, i7, 32GB RAM', 'REGISTERED', NOW() - INTERVAL '250 days', NOW() - INTERVAL '8 days'),
  ('a1000000-0000-0000-0000-000000000009', 'Canon imageFORMULA', 'Scanner', 'Office', 'CIF-DR-009', 'High-speed document scanner', 'REGISTERED', NOW() - INTERVAL '1500 days', NOW() - INTERVAL '100 days'),
  ('a1000000-0000-0000-0000-000000000010', 'APC Smart-UPS 1500', 'UPS', 'IT', 'APC-1500-010', '1500VA rack-mount UPS for server room', 'REGISTERED', NOW() - INTERVAL '200 days', NOW() - INTERVAL '3 days');

-- ASSIGNMENTS: Insert all while assets are still REGISTERED (trigger allows it)
INSERT INTO assignments (id, asset_id, employee_id, assigned_at, returned_at, notes) VALUES
  -- Active assignments
  ('ab100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 days', NULL, 'Primary work laptop for IT admin'),
  ('ab100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days', NULL, 'Server room network equipment'),
  ('ab100000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000003', NOW() - INTERVAL '15 days', NULL, 'Lobby security camera'),
  ('ab100000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '20 days', NULL, 'Ergonomic chair for operations manager'),
  -- Historical assignments (returned_at is set)
  ('ab100000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000004', NOW() - INTERVAL '90 days', NOW() - INTERVAL '45 days', 'Returned for repair - dead pixels'),
  ('ab100000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000005', NOW() - INTERVAL '60 days', NOW() - INTERVAL '8 days', 'Lost during branch transfer'),
  ('ab100000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '200 days', NOW() - INTERVAL '11 days', 'Previous assignment before transfer'),
  ('ab100000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000004', NOW() - INTERVAL '500 days', NOW() - INTERVAL '100 days', 'Scanner written off - obsolete');

-- NOW update assets to their real statuses (after assignments are in place)
UPDATE assets SET status = 'ASSIGNED' WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE assets SET status = 'ASSIGNED' WHERE id = 'a1000000-0000-0000-0000-000000000003';
UPDATE assets SET status = 'ASSIGNED' WHERE id = 'a1000000-0000-0000-0000-000000000005';
UPDATE assets SET status = 'ASSIGNED' WHERE id = 'a1000000-0000-0000-0000-000000000006';
UPDATE assets SET status = 'IN_REPAIR' WHERE id = 'a1000000-0000-0000-0000-000000000007';
UPDATE assets SET status = 'LOST' WHERE id = 'a1000000-0000-0000-0000-000000000008';
UPDATE assets SET status = 'WRITTEN_OFF' WHERE id = 'a1000000-0000-0000-0000-000000000009';

-- ASSET HISTORY (audit trail)
INSERT INTO asset_history (asset_id, changed_by, old_status, new_status, changed_at, reason, notes) VALUES
  -- Dell Laptop history
  ('a1000000-0000-0000-0000-000000000001', 'admin@bank.uz', NULL, 'REGISTERED', NOW() - INTERVAL '400 days', 'Initial registration', 'New procurement batch Q3'),
  ('a1000000-0000-0000-0000-000000000001', 'admin@bank.uz', 'REGISTERED', 'ASSIGNED', NOW() - INTERVAL '200 days', 'Assigned to N. Usmanova', 'Operations team allocation'),
  ('a1000000-0000-0000-0000-000000000001', 'admin@bank.uz', 'ASSIGNED', 'REGISTERED', NOW() - INTERVAL '11 days', 'Returned by N. Usmanova', 'Employee transfer'),
  ('a1000000-0000-0000-0000-000000000001', 'admin@bank.uz', 'REGISTERED', 'ASSIGNED', NOW() - INTERVAL '10 days', 'Reassigned to A. Karimov', 'IT team reallocation'),
  -- Samsung Monitor
  ('a1000000-0000-0000-0000-000000000007', 'admin@bank.uz', NULL, 'REGISTERED', NOW() - INTERVAL '350 days', 'Initial registration', 'New monitor for finance'),
  ('a1000000-0000-0000-0000-000000000007', 'admin@bank.uz', 'REGISTERED', 'ASSIGNED', NOW() - INTERVAL '90 days', 'Assigned to D. Tosheva', 'Finance department upgrade'),
  ('a1000000-0000-0000-0000-000000000007', 'admin@bank.uz', 'ASSIGNED', 'IN_REPAIR', NOW() - INTERVAL '45 days', 'Dead pixel cluster detected', 'Sent to Samsung service center'),
  -- Lenovo ThinkPad - Lost
  ('a1000000-0000-0000-0000-000000000008', 'admin@bank.uz', NULL, 'REGISTERED', NOW() - INTERVAL '250 days', 'Initial registration', 'Executive laptop procurement'),
  ('a1000000-0000-0000-0000-000000000008', 'admin@bank.uz', 'REGISTERED', 'ASSIGNED', NOW() - INTERVAL '60 days', 'Assigned to S. Mirzayev', 'Branch 2 customer service'),
  ('a1000000-0000-0000-0000-000000000008', 'admin@bank.uz', 'ASSIGNED', 'LOST', NOW() - INTERVAL '8 days', 'Lost during branch transfer', 'Police report filed, investigation ongoing'),
  -- Canon Scanner - Written Off
  ('a1000000-0000-0000-0000-000000000009', 'admin@bank.uz', NULL, 'REGISTERED', NOW() - INTERVAL '1500 days', 'Initial registration', 'Legacy document scanner'),
  ('a1000000-0000-0000-0000-000000000009', 'admin@bank.uz', 'REGISTERED', 'ASSIGNED', NOW() - INTERVAL '500 days', 'Assigned to D. Tosheva', 'Finance scanning needs'),
  ('a1000000-0000-0000-0000-000000000009', 'admin@bank.uz', 'ASSIGNED', 'IN_REPAIR', NOW() - INTERVAL '200 days', 'Paper jam mechanism failure', 'Repair cost exceeds value'),
  ('a1000000-0000-0000-0000-000000000009', 'admin@bank.uz', 'IN_REPAIR', 'WRITTEN_OFF', NOW() - INTERVAL '100 days', 'Written off - repair not economical', 'Asset fully depreciated'),
  -- Other assets
  ('a1000000-0000-0000-0000-000000000002', 'admin@bank.uz', NULL, 'REGISTERED', NOW() - INTERVAL '300 days', 'Initial registration', 'HP printer for operations'),
  ('a1000000-0000-0000-0000-000000000003', 'admin@bank.uz', NULL, 'REGISTERED', NOW() - INTERVAL '800 days', 'Initial registration', 'Network infrastructure'),
  ('a1000000-0000-0000-0000-000000000003', 'admin@bank.uz', 'REGISTERED', 'ASSIGNED', NOW() - INTERVAL '30 days', 'Assigned to A. Karimov', 'IT infrastructure management'),
  ('a1000000-0000-0000-0000-000000000005', 'admin@bank.uz', NULL, 'REGISTERED', NOW() - INTERVAL '600 days', 'Initial registration', 'Security system expansion'),
  ('a1000000-0000-0000-0000-000000000005', 'admin@bank.uz', 'REGISTERED', 'ASSIGNED', NOW() - INTERVAL '15 days', 'Assigned to B. Rahimov', 'Lobby security upgrade'),
  ('a1000000-0000-0000-0000-000000000006', 'admin@bank.uz', NULL, 'REGISTERED', NOW() - INTERVAL '500 days', 'Initial registration', 'Ergonomic furniture program'),
  ('a1000000-0000-0000-0000-000000000006', 'admin@bank.uz', 'REGISTERED', 'ASSIGNED', NOW() - INTERVAL '20 days', 'Assigned to N. Usmanova', 'Operations manager office'),
  ('a1000000-0000-0000-0000-000000000010', 'admin@bank.uz', NULL, 'REGISTERED', NOW() - INTERVAL '200 days', 'Initial registration', 'Server room power backup');
