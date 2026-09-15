-- Rakshak SOS — patient emergency alerts for registered hospitals
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  hospital_id UUID NOT NULL,
  hospital_name TEXT NOT NULL,
  place_description TEXT,
  emergency_notes TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_accuracy DOUBLE PRECISION,
  blood_group TEXT,
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Dispatched', 'Resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dispatched_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_patient_status
  ON emergency_alerts (patient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_hospital_status
  ON emergency_alerts (hospital_id, status, created_at DESC);

ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emergency_alerts_anon_all_v0"
  ON emergency_alerts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable realtime status updates on the patient dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE emergency_alerts;
