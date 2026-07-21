-- Nexora Doctor App — Row Level Security (Supabase)
-- Doctors may only read/write clinical rows where doctor_id = auth.uid() mapped profile

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipd_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE surgeries ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemedicine_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY doctor_self ON doctors
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY doctor_appointments ON appointments
  FOR ALL USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY doctor_encounters ON encounters
  FOR ALL USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY doctor_prescriptions ON prescriptions
  FOR ALL USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY doctor_ipd ON ipd_admissions
  FOR ALL USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY doctor_surgeries ON surgeries
  FOR ALL USING (surgeon_doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY doctor_documents ON clinical_documents
  FOR ALL USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- Patients: read-only for assigned doctor via encounters (simplified care-team model)
CREATE POLICY doctor_patient_read ON patients
  FOR SELECT USING (
    id IN (
      SELECT patient_id FROM encounters
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY doctor_lab_orders ON lab_orders
  FOR ALL USING (
    encounter_id IN (
      SELECT id FROM encounters
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY doctor_radiology_orders ON radiology_orders
  FOR ALL USING (
    encounter_id IN (
      SELECT id FROM encounters
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY doctor_telemedicine ON telemedicine_sessions
  FOR ALL USING (
    appointment_id IN (
      SELECT id FROM appointments
      WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );
