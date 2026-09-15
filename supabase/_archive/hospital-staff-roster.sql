-- Reset HOSP-01 hospital_staff to 1 admin, 3 staff, and exactly 41 doctors.
CREATE TABLE IF NOT EXISTS public.hospital_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL DEFAULT 'HOSP-01',
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL,
  department TEXT,
  qualification TEXT,
  consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hospital_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_read_staff" ON public.hospital_staff;
CREATE POLICY "allow_read_staff" ON public.hospital_staff FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_all_staff_admin" ON public.hospital_staff;
CREATE POLICY "allow_all_staff_admin" ON public.hospital_staff FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.hospital_staff TO anon, authenticated, service_role;

DELETE FROM public.hospital_staff WHERE hospital_id = 'HOSP-01';

INSERT INTO public.hospital_staff (hospital_id, full_name, email, role, department, qualification, consultation_fee, is_active)
VALUES ('HOSP-01', 'Regal Medical Superintendent', 'admin@regalhospital.com', 'admin', 'Hospital Administration', 'MHA / MBBS', 0.00, true);

INSERT INTO public.hospital_staff (hospital_id, full_name, email, role, department, qualification, consultation_fee, is_active) VALUES
('HOSP-01', 'Sneha V', 'sneha.v@regalhospital.com', 'staff', 'OPD Reception & Triage', 'B.Sc Nursing', 0.00, true),
('HOSP-01', 'Kavitha R', 'kavitha.r@regalhospital.com', 'staff', 'Billing & Checkout Desk', 'B.Com / Healthcare Billing', 0.00, true),
('HOSP-01', 'Manjunath S', 'manjunath.s@regalhospital.com', 'staff', 'Chief Pharmacist', 'B.Pharm', 0.00, true);

INSERT INTO public.hospital_staff (hospital_id, full_name, email, role, department, qualification, consultation_fee, is_active) VALUES
('HOSP-01', 'Dr. Suriraju V', 'dr.suriraju@regalhospital.com', 'doctor', 'Urology & Andrology', 'MBBS, MS, MCh (Urology)', 750.00, true),
('HOSP-01', 'Dr. Ramesh Kumar', 'dr.ramesh.kumar@regalhospital.com', 'doctor', 'General Medicine', 'MBBS, MD (General Medicine)', 500.00, true),
('HOSP-01', 'Dr. Ananya Sharma', 'dr.ananya.sharma@regalhospital.com', 'doctor', 'Obstetrics & Gynaecology', 'MBBS, DGO, MS (OBG)', 600.00, true),
('HOSP-01', 'Dr. Arvind Swamy', 'dr.arvind.swamy@regalhospital.com', 'doctor', 'Orthopaedics & Joint Replacement', 'MBBS, MS (Ortho), DNB', 700.00, true),
('HOSP-01', 'Dr. Priya Raghavan', 'dr.priya.raghavan@regalhospital.com', 'doctor', 'Paediatrics & Neonatology', 'MBBS, MD (Paediatrics)', 550.00, true),
('HOSP-01', 'Dr. Mohammed Farooq', 'dr.farooq@regalhospital.com', 'doctor', 'Cardiology', 'MBBS, MD, DM (Cardiology)', 900.00, true),
('HOSP-01', 'Dr. Deepa Natarajan', 'dr.deepa.n@regalhospital.com', 'doctor', 'Dermatology & Cosmetology', 'MBBS, DVD, MD', 650.00, true),
('HOSP-01', 'Dr. Suresh Babu', 'dr.suresh.babu@regalhospital.com', 'doctor', 'General & Laparoscopic Surgery', 'MBBS, MS (General Surgery)', 700.00, true),
('HOSP-01', 'Dr. Meera Nambiar', 'dr.meera.nambiar@regalhospital.com', 'doctor', 'Neurology', 'MBBS, MD, DM (Neurology)', 850.00, true),
('HOSP-01', 'Dr. Vikramaditya Rao', 'dr.vikramaditya@regalhospital.com', 'doctor', 'Neurosurgery', 'MBBS, MS, MCh (Neuro)', 1000.00, true),
('HOSP-01', 'Dr. Shalini Hegde', 'dr.shalini.hegde@regalhospital.com', 'doctor', 'ENT, Head & Neck Surgery', 'MBBS, MS (ENT)', 550.00, true),
('HOSP-01', 'Dr. Rajesh Deshmukh', 'dr.rajesh.d@regalhospital.com', 'doctor', 'Gastroenterology', 'MBBS, MD, DM (Gastro)', 800.00, true),
('HOSP-01', 'Dr. Neha Kulkarni', 'dr.neha.k@regalhospital.com', 'doctor', 'Pulmonology & Chest Medicine', 'MBBS, DTCD, MD (Pulmo)', 650.00, true),
('HOSP-01', 'Dr. Karthik Prasad', 'dr.karthik.prasad@regalhospital.com', 'doctor', 'Nephrology', 'MBBS, MD, DM (Nephrology)', 850.00, true),
('HOSP-01', 'Dr. Sunita Acharya', 'dr.sunita.a@regalhospital.com', 'doctor', 'Ophthalmology', 'MBBS, MS (Ophthalmology)', 500.00, true),
('HOSP-01', 'Dr. Vinay Mohan', 'dr.vinay.mohan@regalhospital.com', 'doctor', 'Psychiatry & Deaddiction', 'MBBS, MD (Psychiatry)', 700.00, true),
('HOSP-01', 'Dr. Rekha Kamath', 'dr.rekha.kamath@regalhospital.com', 'doctor', 'Endocrinology & Diabetology', 'MBBS, MD, DM (Endo)', 800.00, true),
('HOSP-01', 'Dr. Anand Joshi', 'dr.anand.joshi@regalhospital.com', 'doctor', 'Medical Oncology', 'MBBS, MD, DM (Oncology)', 950.00, true),
('HOSP-01', 'Dr. Sowmya Reddy', 'dr.sowmya.reddy@regalhospital.com', 'doctor', 'Surgical Oncology', 'MBBS, MS, MCh (Surg Onco)', 1000.00, true),
('HOSP-01', 'Dr. Harish Gowda', 'dr.harish.gowda@regalhospital.com', 'doctor', 'Rheumatology', 'MBBS, MD, Fellowship Rheumatology', 750.00, true),
('HOSP-01', 'Dr. Divya Iyer', 'dr.divya.iyer@regalhospital.com', 'doctor', 'Physical Medicine & Rehabilitation', 'MBBS, DPMR, DNB', 500.00, true),
('HOSP-01', 'Dr. Chetan Patil', 'dr.chetan.patil@regalhospital.com', 'doctor', 'Plastic & Reconstructive Surgery', 'MBBS, MS, MCh (Plastic)', 900.00, true),
('HOSP-01', 'Dr. Poornima Shenoy', 'dr.poornima.s@regalhospital.com', 'doctor', 'Pathology & Lab Medicine', 'MBBS, MD (Pathology)', 450.00, true),
('HOSP-01', 'Dr. Sandeep Verma', 'dr.sandeep.v@regalhospital.com', 'doctor', 'Radiodiagnosis & Imaging', 'MBBS, MD (Radiology)', 550.00, true),
('HOSP-01', 'Dr. Geetha Venkatesh', 'dr.geetha.v@regalhospital.com', 'doctor', 'Anaesthesiology & Pain Clinic', 'MBBS, DA, MD', 600.00, true),
('HOSP-01', 'Dr. Manoj Prabhakar', 'dr.manoj.p@regalhospital.com', 'doctor', 'Emergency Medicine & Trauma', 'MBBS, MEM, MRCEM', 650.00, true),
('HOSP-01', 'Dr. Roopa Mahadev', 'dr.roopa.m@regalhospital.com', 'doctor', 'Vascular Surgery', 'MBBS, MS, MCh (Vascular)', 850.00, true),
('HOSP-01', 'Dr. Kiran Somayaji', 'dr.kiran.s@regalhospital.com', 'doctor', 'Paediatric Surgery', 'MBBS, MS, MCh (Paed Surg)', 800.00, true),
('HOSP-01', 'Dr. Archana Bhat', 'dr.archana.bhat@regalhospital.com', 'doctor', 'Clinical Haematology', 'MBBS, MD, DM (Haematology)', 850.00, true),
('HOSP-01', 'Dr. Gautham Baliga', 'dr.gautham.b@regalhospital.com', 'doctor', 'Infectious Diseases', 'MBBS, MD, FNB (Infectious)', 700.00, true),
('HOSP-01', 'Dr. Shilpa Shetty', 'dr.shilpa.shetty@regalhospital.com', 'doctor', 'Nuclear Medicine', 'MBBS, DRM, DNB', 750.00, true),
('HOSP-01', 'Dr. Praveen Nayak', 'dr.praveen.nayak@regalhospital.com', 'doctor', 'Critical Care Medicine (ICU)', 'MBBS, IDCCM, EDIC', 700.00, true),
('HOSP-01', 'Dr. Snehalatha K', 'dr.snehalatha.k@regalhospital.com', 'doctor', 'Geriatric Medicine', 'MBBS, MD (Geriatrics)', 550.00, true),
('HOSP-01', 'Dr. Bharat Mallikarjun', 'dr.bharat.m@regalhospital.com', 'doctor', 'Interventional Radiology', 'MBBS, MD, FVIR', 900.00, true),
('HOSP-01', 'Dr. Tanuja Murthy', 'dr.tanuja.m@regalhospital.com', 'doctor', 'Fetal Medicine & Genetics', 'MBBS, MS, Fellowship Fetal Med', 800.00, true),
('HOSP-01', 'Dr. Shashi Kiran', 'dr.shashi.kiran@regalhospital.com', 'doctor', 'Sports Medicine & Arthroscopy', 'MBBS, MS (Ortho), Fellowship Sports', 750.00, true),
('HOSP-01', 'Dr. Lakshmi Prasanna', 'dr.lakshmi.p@regalhospital.com', 'doctor', 'Allergy & Clinical Immunology', 'MBBS, MD, Fellowship Allergy', 600.00, true),
('HOSP-01', 'Dr. Ajay Narang', 'dr.ajay.narang@regalhospital.com', 'doctor', 'Cardiothoracic Surgery', 'MBBS, MS, MCh (CTVS)', 1100.00, true),
('HOSP-01', 'Dr. Nandini Urs', 'dr.nandini.urs@regalhospital.com', 'doctor', 'Dentistry & Maxillofacial', 'BDS, MDS (Maxillofacial)', 500.00, true),
('HOSP-01', 'Dr. Jagadish Chandra', 'dr.jagadish.c@regalhospital.com', 'doctor', 'Hepato-Pancreato-Biliary (HPB)', 'MBBS, MS, MCh (HPB Surgery)', 1050.00, true),
('HOSP-01', 'Dr. Suhasini Rao', 'dr.suhasini.rao@regalhospital.com', 'doctor', 'Medical Genetics & Counseling', 'MBBS, MD (Genetics)', 700.00, true);

NOTIFY pgrst, 'reload schema';
