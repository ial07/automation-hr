-- Add 'leave' to attendance_status enum
ALTER TYPE attendance_status ADD VALUE IF NOT EXISTS 'leave';

-- Add leave_request_id to attendance_records for traceability
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS leave_request_id UUID REFERENCES leave_requests(id);

-- Create index for leave_request lookups
CREATE INDEX IF NOT EXISTS idx_attendance_leave_request ON attendance_records(leave_request_id);
