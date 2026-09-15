export interface DoctorDirectoryItem {
  name: string;
  department: string;
  experience: string;
  qualification: string;
  fee: number;
}

export const HOSPITAL_DOCTORS: DoctorDirectoryItem[] = [
  { name: 'Dr. Suriraju V', department: 'Urology', experience: '14+ Years', qualification: 'MS, MCh (Urology)', fee: 700 },
  { name: 'Dr. Chandrakanth S. Kesari', department: 'General Surgery', experience: '12+ Years', qualification: 'MS (Gen Surg)', fee: 800 },
  { name: 'Dr. Ananya R', department: 'General Medicine', experience: '9+ Years', qualification: 'MD (Gen Med)', fee: 600 },
  { name: 'Dr. Vikramaditya Rao', department: 'Cardiology', experience: '15+ Years', qualification: 'DM (Cardiology)', fee: 900 },
  { name: 'Dr. Meera Nambiar', department: 'Cardiology', experience: '10+ Years', qualification: 'MD, DNB (Cardio)', fee: 850 },
  { name: 'Dr. Rajesh Kumar Hegde', department: 'Orthopedics', experience: '16+ Years', qualification: 'MS (Ortho)', fee: 850 },
  { name: 'Dr. Shalini Deshmukh', department: 'Orthopedics', experience: '11+ Years', qualification: 'D.Ortho, DNB', fee: 750 },
  { name: 'Dr. Arvind Swamy', department: 'Neurology', experience: '13+ Years', qualification: 'DM (Neurology)', fee: 950 },
  { name: 'Dr. Kavitha Reddy', department: 'Neurosurgery', experience: '18+ Years', qualification: 'MCh (Neurosurg)', fee: 1200 },
  { name: 'Dr. Pradeep Verma', department: 'Gastroenterology', experience: '12+ Years', qualification: 'DM (Gastro)', fee: 800 },
  { name: 'Dr. Sunitha Gopal', department: 'Gastroenterology', experience: '10+ Years', qualification: 'MD, DNB (Gastro)', fee: 750 },
  { name: 'Dr. Anand Kulkarni', department: 'Nephrology', experience: '14+ Years', qualification: 'DM (Nephro)', fee: 850 },
  { name: 'Dr. Archana Bhat', department: 'Pediatrics', experience: '8+ Years', qualification: 'MD (Pediatrics)', fee: 650 },
  { name: "Dr. Rohan D'Souza", department: 'Pediatrics', experience: '9+ Years', qualification: 'DCH, DNB', fee: 650 },
  { name: 'Dr. Lavanya Krishnan', department: 'Pediatric Surgery', experience: '12+ Years', qualification: 'MCh (Ped Surg)', fee: 850 },
  { name: 'Dr. Deepa Shankar', department: 'Obstetrics & Gynecology', experience: '15+ Years', qualification: 'MS (OBG)', fee: 800 },
  { name: 'Dr. Priyanka Murthy', department: 'Obstetrics & Gynecology', experience: '11+ Years', qualification: 'DGO, DNB', fee: 750 },
  { name: 'Dr. Harish Prasad', department: 'Pulmonology', experience: '12+ Years', qualification: 'MD (Pulm Med)', fee: 700 },
  { name: 'Dr. Nandini Sen', department: 'Dermatology', experience: '9+ Years', qualification: 'MD (DVL)', fee: 600 },
  { name: 'Dr. Karthik Subramanian', department: 'ENT', experience: '10+ Years', qualification: 'MS (ENT)', fee: 650 },
  { name: 'Dr. Smita Joshi', department: 'Ophthalmology', experience: '13+ Years', qualification: 'MS (Ophthal)', fee: 700 },
  { name: 'Dr. Manoj Kumar', department: 'Ophthalmology', experience: '11+ Years', qualification: 'DO, DNB', fee: 700 },
  { name: 'Dr. Sangeetha Iyengar', department: 'Endocrinology', experience: '14+ Years', qualification: 'DM (Endo)', fee: 800 },
  { name: 'Dr. Rakesh Nair', department: 'Oncology', experience: '16+ Years', qualification: 'DM (Med Onco)', fee: 1000 },
  { name: 'Dr. Gautham Pai', department: 'Oncology', experience: '15+ Years', qualification: 'MCh (Surg Onco)', fee: 1000 },
  { name: 'Dr. Vani S. Rao', department: 'Psychiatry', experience: '10+ Years', qualification: 'MD (Psychiatry)', fee: 750 },
  { name: 'Dr. Ashok Patel', department: 'Rheumatology', experience: '12+ Years', qualification: 'FACR, DM', fee: 800 },
  { name: 'Dr. Varun Sundaram', department: 'Vascular Surgery', experience: '13+ Years', qualification: 'MCh (Vasc Surg)', fee: 900 },
  { name: 'Dr. Girish Menon', department: 'Cardiothoracic Surgery', experience: '17+ Years', qualification: 'MCh (CTVS)', fee: 1300 },
  { name: 'Dr. Sumeet Bhalla', department: 'Plastic Surgery', experience: '14+ Years', qualification: 'MCh (Plast Surg)', fee: 1100 },
  { name: 'Dr. Rashmi Kulkarni', department: 'Anaesthesiology', experience: '15+ Years', qualification: 'MD (Anaesth)', fee: 700 },
  { name: 'Dr. Nithya Srinivas', department: 'Pathology', experience: '8+ Years', qualification: 'MD (Pathology)', fee: 500 },
  { name: 'Dr. Jayakrishnan Nair', department: 'Radiology', experience: '11+ Years', qualification: 'MD (Radio-Diag)', fee: 600 },
  { name: 'Dr. Bhavana Shah', department: 'Radiology', experience: '10+ Years', qualification: 'DMRD, DNB', fee: 600 },
  { name: 'Dr. Santosh Shetty', department: 'Emergency Medicine', experience: '12+ Years', qualification: 'MEM, MD', fee: 800 },
  { name: 'Dr. Madhavi Latha', department: 'Nuclear Medicine', experience: '13+ Years', qualification: 'DRM, DNB', fee: 900 },
  { name: 'Dr. Chethan Gowda', department: 'Physical Medicine & Rehab', experience: '9+ Years', qualification: 'DPMR, DNB', fee: 650 },
  { name: 'Dr. Anushree Roy', department: 'Clinical Immunology', experience: '10+ Years', qualification: 'MD, Fellowship', fee: 750 },
  { name: 'Dr. Hemanth Kumar', department: 'Geriatrics', experience: '11+ Years', qualification: 'MD (Geriatrics)', fee: 700 },
  { name: 'Dr. Aparna Nair', department: 'Infectious Diseases', experience: '10+ Years', qualification: 'FNB, MD', fee: 750 },
  { name: 'Dr. Balaji Venkat', department: 'Pain Management', experience: '13+ Years', qualification: 'FIPM, MD', fee: 800 },
];

export const HOSPITAL_DEPARTMENTS = Array.from(
  new Set(HOSPITAL_DOCTORS.map((d) => d.department)),
).sort();

export const DEFAULT_HOSPITAL_DEPARTMENT = HOSPITAL_DEPARTMENTS.includes('General Medicine')
  ? 'General Medicine'
  : HOSPITAL_DEPARTMENTS[0];

export function directoryDoctorId(name: string): string {
  const slug = name
    .replace(/^dr\.?\s*/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
  return `RH-${slug || 'DOCTOR'}`;
}

export function normalizeClinicianName(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/^dr\.?\s*/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
