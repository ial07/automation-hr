-- Leave request types
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'maternity', 'special');
CREATE TYPE leave_status AS ENUM (
  'draft',
  'submitted',
  'approved_manager',
  'rejected_manager',
  'approved_hr',
  'rejected_hr'
);

-- Leave requests table
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status leave_status NOT NULL DEFAULT 'draft',
  -- Manager approval
  manager_id UUID REFERENCES users(id),
  manager_notes TEXT,
  manager_action_at TIMESTAMPTZ,
  -- HR approval
  hr_id UUID REFERENCES users(id),
  hr_notes TEXT,
  hr_action_at TIMESTAMPTZ,
  -- AI policy check result
  policy_check_result JSONB,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leave balances table
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  annual_total INTEGER NOT NULL DEFAULT 12,
  annual_used INTEGER NOT NULL DEFAULT 0,
  sick_total INTEGER NOT NULL DEFAULT 14,
  sick_used INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_balances_user ON leave_balances(user_id);

-- RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to leave_requests"
  ON leave_requests USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to leave_balances"
  ON leave_balances USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
