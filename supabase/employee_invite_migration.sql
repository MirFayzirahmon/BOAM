ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS invited_by TEXT,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'employees_status_check'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_status_check
      CHECK (status IN ('ACTIVE', 'PENDING_INVITE', 'INACTIVE'));
  END IF;
END $$;
