-- Overtime status enum
CREATE TYPE overtime_status AS ENUM (
  'submitted',
  'approved_manager',
  'rejected_manager',
  'approved_hr',
  'rejected_hr'
);

-- Overtime requests table
CREATE TABLE overtime_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  reason TEXT NOT NULL,
  status overtime_status NOT NULL DEFAULT 'submitted',
  attendance_record_id UUID REFERENCES attendance_records(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_overtime_employee ON overtime_requests(employee_id);
CREATE INDEX idx_overtime_date ON overtime_requests(date);
CREATE INDEX idx_overtime_status ON overtime_requests(status);

-- RLS
ALTER TABLE overtime_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to overtime_requests"
  ON overtime_requests USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_overtime_requests_updated_at
  BEFORE UPDATE ON overtime_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
