-- ============================================================================
-- REGAL HOSPITAL ENTERPRISE PLATFORM · RH-BLR-01
-- Consolidated migration: Hospital, Doctor, Vendor, Patient sync
-- Safe to re-run. Run entire script in Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- 1. DOCTOR PROFILES & CREDENTIALS (41 CLINICIANS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT 'RegalDoc@2026',
  department VARCHAR(100) NOT NULL,
  room VARCHAR(50) NOT NULL,
  fee NUMERIC NOT NULL,
  is_on_duty BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.doctor_profiles (id, name, email, password_hash, department, room, fee)
VALUES
  ('RH-D01', 'Dr. Suriraju V', 'suriraju.v@regalhospital.com', 'RegalDoc@2026', 'Urology', 'Room 101', 700),
  ('RH-D02', 'Dr. Chandrakanth S. Kesari', 'chandrakanth.kesari@regalhospital.com', 'RegalDoc@2026', 'General Surgery', 'Room 204', 800),
  ('RH-D03', 'Dr. Ananya R', 'ananya.r@regalhospital.com', 'RegalDoc@2026', 'General Medicine', 'Room 102', 600),
  ('RH-D04', 'Dr. Vikramaditya Rao', 'vikramaditya.rao@regalhospital.com', 'RegalDoc@2026', 'Cardiology', 'Room 301', 900),
  ('RH-D05', 'Dr. Meera Nambiar', 'meera.nambiar@regalhospital.com', 'RegalDoc@2026', 'Cardiology', 'Room 302', 850),
  ('RH-D06', 'Dr. Rajesh Kumar Hegde', 'rajesh.hegde@regalhospital.com', 'RegalDoc@2026', 'Orthopedics', 'Room 201', 850),
  ('RH-D07', 'Dr. Shalini Deshmukh', 'shalini.deshmukh@regalhospital.com', 'RegalDoc@2026', 'Orthopedics', 'Room 202', 750),
  ('RH-D08', 'Dr. Arvind Swamy', 'arvind.swamy@regalhospital.com', 'RegalDoc@2026', 'Neurology', 'Room 401', 950),
  ('RH-D09', 'Dr. Kavitha Reddy', 'kavitha.reddy@regalhospital.com', 'RegalDoc@2026', 'Neurosurgery', 'Room 402', 1200),
  ('RH-D10', 'Dr. Pradeep Verma', 'pradeep.verma@regalhospital.com', 'RegalDoc@2026', 'Gastroenterology', 'Room 205', 800),
  ('RH-D11', 'Dr. Sunitha Gopal', 'sunitha.gopal@regalhospital.com', 'RegalDoc@2026', 'Gastroenterology', 'Room 206', 750),
  ('RH-D12', 'Dr. Anand Kulkarni', 'anand.kulkarni@regalhospital.com', 'RegalDoc@2026', 'Nephrology', 'Room 105', 850),
  ('RH-D13', 'Dr. Archana Bhat', 'archana.bhat@regalhospital.com', 'RegalDoc@2026', 'Pediatrics', 'Room 108', 650),
  ('RH-D14', 'Dr. Rohan D''Souza', 'rohan.dsouza@regalhospital.com', 'RegalDoc@2026', 'Pediatrics', 'Room 109', 650),
  ('RH-D15', 'Dr. Deepa Shankar', 'deepa.shankar@regalhospital.com', 'RegalDoc@2026', 'Obstetrics & Gynecology', 'Room 210', 800),
  ('RH-D16', 'Dr. Priyanka Murthy', 'priyanka.murthy@regalhospital.com', 'RegalDoc@2026', 'Obstetrics & Gynecology', 'Room 211', 750),
  ('RH-D17', 'Dr. Harish Prasad', 'harish.prasad@regalhospital.com', 'RegalDoc@2026', 'Pulmonology', 'Room 305', 700),
  ('RH-D18', 'Dr. Nandini Sen', 'nandini.sen@regalhospital.com', 'RegalDoc@2026', 'Dermatology', 'Room 112', 600),
  ('RH-D19', 'Dr. Karthik Subramanian', 'karthik.subramanian@regalhospital.com', 'RegalDoc@2026', 'ENT', 'Room 115', 650),
  ('RH-D20', 'Dr. Smita Joshi', 'smita.joshi@regalhospital.com', 'RegalDoc@2026', 'Ophthalmology', 'Room 118', 700),
  ('RH-D21', 'Dr. Manoj Kumar', 'manoj.kumar@regalhospital.com', 'RegalDoc@2026', 'Ophthalmology', 'Room 119', 700),
  ('RH-D22', 'Dr. Sangeetha Iyengar', 'sangeetha.iyengar@regalhospital.com', 'RegalDoc@2026', 'Endocrinology', 'Room 308', 800),
  ('RH-D23', 'Dr. Rakesh Nair', 'rakesh.nair@regalhospital.com', 'RegalDoc@2026', 'Oncology', 'Room 405', 1000),
  ('RH-D24', 'Dr. Gautham Pai', 'gautham.pai@regalhospital.com', 'RegalDoc@2026', 'Oncology', 'Room 406', 1000),
  ('RH-D25', 'Dr. Vani S. Rao', 'vani.rao@regalhospital.com', 'RegalDoc@2026', 'Psychiatry', 'Room 122', 750),
  ('RH-D26', 'Dr. Ashok Patel', 'ashok.patel@regalhospital.com', 'RegalDoc@2026', 'Rheumatology', 'Room 310', 800),
  ('RH-D27', 'Dr. Varun Sundaram', 'varun.sundaram@regalhospital.com', 'RegalDoc@2026', 'Vascular Surgery', 'Room 215', 900),
  ('RH-D28', 'Dr. Rashmi Kulkarni', 'rashmi.kulkarni@regalhospital.com', 'RegalDoc@2026', 'Anaesthesiology', 'OT Wing', 700),
  ('RH-D29', 'Dr. Sumeet Bhalla', 'sumeet.bhalla@regalhospital.com', 'RegalDoc@2026', 'Plastic Surgery', 'Room 218', 1100),
  ('RH-D30', 'Dr. Nithya Srinivas', 'nithya.srinivas@regalhospital.com', 'RegalDoc@2026', 'Pathology', 'Central Lab', 500),
  ('RH-D31', 'Dr. Jayakrishnan Nair', 'jayakrishnan.nair@regalhospital.com', 'RegalDoc@2026', 'Radiology', 'Imaging Block', 600),
  ('RH-D32', 'Dr. Bhavana Shah', 'bhavana.shah@regalhospital.com', 'RegalDoc@2026', 'Radiology', 'Imaging Block', 600),
  ('RH-D33', 'Dr. Santosh Shetty', 'santosh.shetty@regalhospital.com', 'RegalDoc@2026', 'Emergency Medicine', 'ER Trauma 1', 800),
  ('RH-D34', 'Dr. Madhavi Latha', 'madhavi.latha@regalhospital.com', 'RegalDoc@2026', 'Nuclear Medicine', 'Diagnostic Wing', 900),
  ('RH-D35', 'Dr. Chethan Gowda', 'chethan.gowda@regalhospital.com', 'RegalDoc@2026', 'Physical Medicine & Rehab', 'Rehab Unit', 650),
  ('RH-D36', 'Dr. Anushree Roy', 'anushree.roy@regalhospital.com', 'RegalDoc@2026', 'Clinical Immunology', 'Room 312', 750),
  ('RH-D37', 'Dr. Girish Menon', 'girish.menon@regalhospital.com', 'RegalDoc@2026', 'Cardiothoracic Surgery', 'Room 304', 1300),
  ('RH-D38', 'Dr. Lavanya Krishnan', 'lavanya.krishnan@regalhospital.com', 'RegalDoc@2026', 'Pediatric Surgery', 'Room 110', 850),
  ('RH-D39', 'Dr. Hemanth Kumar', 'hemanth.kumar@regalhospital.com', 'RegalDoc@2026', 'Geriatrics', 'Room 106', 700),
  ('RH-D40', 'Dr. Aparna Nair', 'aparna.nair@regalhospital.com', 'RegalDoc@2026', 'Infectious Diseases', 'Room 104', 750),
  ('RH-D41', 'Dr. Balaji Venkat', 'balaji.venkat@regalhospital.com', 'RegalDoc@2026', 'Pain Management', 'Room 220', 800)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  department = EXCLUDED.department,
  room = EXCLUDED.room,
  fee = EXCLUDED.fee;

-- ============================================================================
-- 2. PATIENTS & APPOINTMENTS (SMARTQ OPD)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uhid VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  full_name VARCHAR(150),
  phone VARCHAR(20) NOT NULL DEFAULT '',
  age VARCHAR(10),
  gender VARCHAR(20),
  blood_group VARCHAR(10) DEFAULT 'Unknown',
  department VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  token_number VARCHAR(20) NOT NULL,
  uhid VARCHAR(50) NOT NULL,
  patient_id UUID,
  patient_name VARCHAR(150) NOT NULL,
  patient_phone VARCHAR(20),
  age VARCHAR(10),
  gender VARCHAR(20),
  doctor_id VARCHAR(50) NOT NULL,
  doctor_name VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'checked_in',
  chief_complaint TEXT,
  fee NUMERIC NOT NULL DEFAULT 800,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  ADD COLUMN IF NOT EXISTS patient_id UUID,
  ADD COLUMN IF NOT EXISTS appointment_id UUID,
  ADD COLUMN IF NOT EXISTS doctor_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'hospital_walkin';

CREATE INDEX IF NOT EXISTS idx_appointments_hospital_date
  ON public.appointments (hospital_id, appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor
  ON public.appointments (doctor_id, status, created_at DESC);

-- ============================================================================
-- 3. BILLS (ENTERPRISE) + LEGACY billing_invoices COMPAT
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  appointment_id UUID,
  patient_id UUID,
  patient_uhid VARCHAR(50) NOT NULL,
  patient_name VARCHAR(150) NOT NULL,
  patient_phone VARCHAR(20),
  booking_source VARCHAR(20) DEFAULT 'hospital_walkin',
  doctor_id VARCHAR(50) NOT NULL,
  doctor_name VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL DEFAULT 'OPD',
  consultation_fee NUMERIC DEFAULT 800,
  pharmacy_charges NUMERIC DEFAULT 0,
  other_charges NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  balance_amount NUMERIC DEFAULT 0,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  status VARCHAR(50) DEFAULT 'unpaid',
  facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  bill_type VARCHAR(50) DEFAULT 'opd_consultation',
  line_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  settled_at TIMESTAMPTZ
);

ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS patient_id UUID,
  ADD COLUMN IF NOT EXISTS facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  ADD COLUMN IF NOT EXISTS bill_type VARCHAR(50) DEFAULT 'opd_consultation',
  ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_bills_facility ON public.bills (facility_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_patient ON public.bills (patient_id, patient_uhid);

-- Legacy billing_invoices (kept for backward compatibility during migration)
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  appointment_id UUID,
  patient_id UUID,
  patient_name TEXT,
  patient_uhid TEXT,
  doctor_id TEXT,
  doctor_name TEXT,
  department TEXT,
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'unpaid',
  payment_status TEXT,
  payment_mode TEXT,
  payment_reference TEXT,
  facility_code TEXT DEFAULT 'RH-BLR-01',
  bill_type TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  lines JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. INVENTORY & PURCHASE ORDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  item_code VARCHAR(50) UNIQUE NOT NULL,
  item_name VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity_in_stock INT NOT NULL DEFAULT 0,
  in_stock INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 20,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  vendor_name VARCHAR(150) DEFAULT 'MedSupply Dispatch Pvt Ltd',
  facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS item_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS quantity_in_stock INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS facility_code VARCHAR(50) DEFAULT 'RH-BLR-01';

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  hospital_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  hospital_name TEXT DEFAULT 'Regal Hospital',
  vendor_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  vendor_name VARCHAR(150) NOT NULL DEFAULT 'MedSupply Dispatch Pvt Ltd',
  item_details TEXT,
  quantity_ordered INTEGER,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'ISSUED',
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS vendor_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  ADD COLUMN IF NOT EXISTS hospital_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  ADD COLUMN IF NOT EXISTS hospital_name TEXT DEFAULT 'Regal Hospital',
  ADD COLUMN IF NOT EXISTS item_details TEXT,
  ADD COLUMN IF NOT EXISTS quantity_ordered INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE public.purchase_orders
SET hospital_code = COALESCE(hospital_code, facility_code, 'RH-BLR-01')
WHERE hospital_code IS NULL;

CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES public.purchase_orders(id),
  vendor_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  tracking_number TEXT NOT NULL,
  carrier_name TEXT NOT NULL,
  driver_contact TEXT,
  status TEXT NOT NULL DEFAULT 'IN_TRANSIT',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES public.purchase_orders(id),
  vendor_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  invoice_number TEXT NOT NULL,
  subtotal NUMERIC(12, 2),
  tax_amount NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'SUBMITTED',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 5. UNIFIED COMMUNICATIONS & REALTIME EVENT BUS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  channel_type VARCHAR(100) DEFAULT 'vendor_procurement',
  recipient_type VARCHAR(50) DEFAULT 'all',
  recipient_id VARCHAR(100),
  sender_id VARCHAR(100) DEFAULT 'hospital_admin',
  sender_role VARCHAR(50) DEFAULT 'hospital_admin',
  sender_name VARCHAR(150) DEFAULT 'Regal Hospital Desk',
  subject VARCHAR(255),
  message TEXT NOT NULL DEFAULT '',
  message_text TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  vendor_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  hospital_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.channel_messages
  ADD COLUMN IF NOT EXISTS facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  ADD COLUMN IF NOT EXISTS sender_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS message_text TEXT,
  ADD COLUMN IF NOT EXISTS vendor_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  ADD COLUMN IF NOT EXISTS hospital_code VARCHAR(50) DEFAULT 'RH-BLR-01';

CREATE TABLE IF NOT EXISTS public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  event_type VARCHAR(100) NOT NULL,
  source_app VARCHAR(50) NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  severity VARCHAR(20) DEFAULT 'info',
  target_roles TEXT[] DEFAULT ARRAY['hospital','doctor','patient','vendor'],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.system_events
  ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT ARRAY['hospital','doctor','patient','vendor'];

CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  recipient_type VARCHAR(50) NOT NULL,
  recipient_id VARCHAR(100),
  recipient_name VARCHAR(150),
  category VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'normal',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  target_app VARCHAR(50),
  facility VARCHAR(50) DEFAULT 'RH-BLR-01',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.system_notifications
  ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS target_app VARCHAR(50),
  ADD COLUMN IF NOT EXISTS facility VARCHAR(50) DEFAULT 'RH-BLR-01';

-- ============================================================================
-- 6. RLS POLICIES (OPEN DEV / STAGING)
-- ============================================================================
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'doctor_profiles', 'patients', 'appointments', 'bills', 'billing_invoices',
        'inventory_items', 'purchase_orders', 'shipments', 'invoices',
        'channel_messages', 'system_events', 'system_notifications'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "open_select_%I" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "open_insert_%I" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "open_update_%I" ON public.%I;', t, t);
    EXECUTE format(
      'CREATE POLICY "open_select_%I" ON public.%I FOR SELECT TO anon, authenticated USING (true);',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "open_insert_%I" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true);',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "open_update_%I" ON public.%I FOR UPDATE TO anon, authenticated USING (true);',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================================
-- 7. ENABLE REALTIME PUBLICATION SAFELY
-- ============================================================================
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'doctor_profiles', 'patients', 'appointments', 'bills', 'billing_invoices',
    'inventory_items', 'purchase_orders', 'shipments', 'invoices',
    'channel_messages', 'system_events', 'system_notifications'
  ])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
