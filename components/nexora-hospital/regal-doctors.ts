/**
 * Official Regal Hospital (RH-BLR-01) clinician directory — 41 doctors.
 * Used across the Doctor Directory, walk-in registration, and ecosystem messaging.
 */

export type RegalDoctor = {
  id: string;
  employee_id: string;
  full_name: string;
  department: string;
  consultation_fee: number;
  room_number: string;
  role: 'Doctor';
  is_on_duty: boolean;
};

function roomForIndex(index: number): string {
  const floor = Math.floor(index / 10) + 1;
  const room = (index % 10) + 1;
  return `Room ${floor}${String(room).padStart(2, '0')}`;
}

const DOCTOR_ROWS: Omit<RegalDoctor, 'room_number' | 'role' | 'is_on_duty'>[] = [
  { id: 'doc-rh-d01', employee_id: 'RH-D01', full_name: 'Dr. Suriraju V', department: 'Urology', consultation_fee: 700 },
  { id: 'doc-rh-d02', employee_id: 'RH-D02', full_name: 'Dr. Chandrakanth S. Kesari', department: 'General Surgery', consultation_fee: 800 },
  { id: 'doc-rh-d03', employee_id: 'RH-D03', full_name: 'Dr. Ananya R', department: 'General Medicine', consultation_fee: 600 },
  { id: 'doc-rh-d04', employee_id: 'RH-D04', full_name: 'Dr. Vikramaditya Rao', department: 'Cardiology', consultation_fee: 900 },
  { id: 'doc-rh-d05', employee_id: 'RH-D05', full_name: 'Dr. Meera Nambiar', department: 'Cardiology', consultation_fee: 850 },
  { id: 'doc-rh-d06', employee_id: 'RH-D06', full_name: 'Dr. Rajesh Kumar Hegde', department: 'Orthopedics', consultation_fee: 850 },
  { id: 'doc-rh-d07', employee_id: 'RH-D07', full_name: 'Dr. Shalini Deshmukh', department: 'Orthopedics', consultation_fee: 750 },
  { id: 'doc-rh-d08', employee_id: 'RH-D08', full_name: 'Dr. Arvind Swamy', department: 'Neurology', consultation_fee: 950 },
  { id: 'doc-rh-d09', employee_id: 'RH-D09', full_name: 'Dr. Kavitha Reddy', department: 'Neurosurgery', consultation_fee: 1200 },
  { id: 'doc-rh-d10', employee_id: 'RH-D10', full_name: 'Dr. Pradeep Verma', department: 'Gastroenterology', consultation_fee: 800 },
  { id: 'doc-rh-d11', employee_id: 'RH-D11', full_name: 'Dr. Sunitha Gopal', department: 'Gastroenterology', consultation_fee: 750 },
  { id: 'doc-rh-d12', employee_id: 'RH-D12', full_name: 'Dr. Anand Kulkarni', department: 'Nephrology', consultation_fee: 850 },
  { id: 'doc-rh-d13', employee_id: 'RH-D13', full_name: 'Dr. Archana Bhat', department: 'Pediatrics', consultation_fee: 650 },
  { id: 'doc-rh-d14', employee_id: 'RH-D14', full_name: "Dr. Rohan D'Souza", department: 'Pediatrics', consultation_fee: 650 },
  { id: 'doc-rh-d15', employee_id: 'RH-D15', full_name: 'Dr. Deepa Shankar', department: 'Obstetrics & Gynecology', consultation_fee: 800 },
  { id: 'doc-rh-d16', employee_id: 'RH-D16', full_name: 'Dr. Priyanka Murthy', department: 'Obstetrics & Gynecology', consultation_fee: 750 },
  { id: 'doc-rh-d17', employee_id: 'RH-D17', full_name: 'Dr. Harish Prasad', department: 'Pulmonology', consultation_fee: 700 },
  { id: 'doc-rh-d18', employee_id: 'RH-D18', full_name: 'Dr. Nandini Sen', department: 'Dermatology', consultation_fee: 600 },
  { id: 'doc-rh-d19', employee_id: 'RH-D19', full_name: 'Dr. Karthik Subramanian', department: 'ENT', consultation_fee: 650 },
  { id: 'doc-rh-d20', employee_id: 'RH-D20', full_name: 'Dr. Smita Joshi', department: 'Ophthalmology', consultation_fee: 700 },
  { id: 'doc-rh-d21', employee_id: 'RH-D21', full_name: 'Dr. Manoj Kumar', department: 'Ophthalmology', consultation_fee: 700 },
  { id: 'doc-rh-d22', employee_id: 'RH-D22', full_name: 'Dr. Sangeetha Iyengar', department: 'Endocrinology', consultation_fee: 800 },
  { id: 'doc-rh-d23', employee_id: 'RH-D23', full_name: 'Dr. Rakesh Nair', department: 'Oncology', consultation_fee: 1000 },
  { id: 'doc-rh-d24', employee_id: 'RH-D24', full_name: 'Dr. Gautham Pai', department: 'Oncology', consultation_fee: 1000 },
  { id: 'doc-rh-d25', employee_id: 'RH-D25', full_name: 'Dr. Vani S. Rao', department: 'Psychiatry', consultation_fee: 750 },
  { id: 'doc-rh-d26', employee_id: 'RH-D26', full_name: 'Dr. Ashok Patel', department: 'Rheumatology', consultation_fee: 800 },
  { id: 'doc-rh-d27', employee_id: 'RH-D27', full_name: 'Dr. Varun Sundaram', department: 'Vascular Surgery', consultation_fee: 900 },
  { id: 'doc-rh-d28', employee_id: 'RH-D28', full_name: 'Dr. Rashmi Kulkarni', department: 'Anaesthesiology', consultation_fee: 700 },
  { id: 'doc-rh-d29', employee_id: 'RH-D29', full_name: 'Dr. Sumeet Bhalla', department: 'Plastic Surgery', consultation_fee: 1100 },
  { id: 'doc-rh-d30', employee_id: 'RH-D30', full_name: 'Dr. Nithya Srinivas', department: 'Pathology', consultation_fee: 500 },
  { id: 'doc-rh-d31', employee_id: 'RH-D31', full_name: 'Dr. Jayakrishnan Nair', department: 'Radiology', consultation_fee: 600 },
  { id: 'doc-rh-d32', employee_id: 'RH-D32', full_name: 'Dr. Bhavana Shah', department: 'Radiology', consultation_fee: 600 },
  { id: 'doc-rh-d33', employee_id: 'RH-D33', full_name: 'Dr. Santosh Shetty', department: 'Emergency Medicine', consultation_fee: 800 },
  { id: 'doc-rh-d34', employee_id: 'RH-D34', full_name: 'Dr. Madhavi Latha', department: 'Nuclear Medicine', consultation_fee: 900 },
  { id: 'doc-rh-d35', employee_id: 'RH-D35', full_name: 'Dr. Chethan Gowda', department: 'Physical Medicine & Rehab', consultation_fee: 650 },
  { id: 'doc-rh-d36', employee_id: 'RH-D36', full_name: 'Dr. Anushree Roy', department: 'Clinical Immunology', consultation_fee: 750 },
  { id: 'doc-rh-d37', employee_id: 'RH-D37', full_name: 'Dr. Girish Menon', department: 'Cardiothoracic Surgery', consultation_fee: 1300 },
  { id: 'doc-rh-d38', employee_id: 'RH-D38', full_name: 'Dr. Lavanya Krishnan', department: 'Pediatric Surgery', consultation_fee: 850 },
  { id: 'doc-rh-d39', employee_id: 'RH-D39', full_name: 'Dr. Hemanth Kumar', department: 'Geriatrics', consultation_fee: 700 },
  { id: 'doc-rh-d40', employee_id: 'RH-D40', full_name: 'Dr. Aparna Nair', department: 'Infectious Diseases', consultation_fee: 750 },
  { id: 'doc-rh-d41', employee_id: 'RH-D41', full_name: 'Dr. Balaji Venkat', department: 'Pain Management', consultation_fee: 800 },
];

export const REGAL_DOCTORS: RegalDoctor[] = DOCTOR_ROWS.map((row, index) => ({
  ...row,
  room_number: roomForIndex(index),
  role: 'Doctor' as const,
  is_on_duty: index % 5 !== 4,
}));

export const DEFAULT_REGAL_DOCTOR = REGAL_DOCTORS[1];

export function findRegalDoctor(employeeId: string): RegalDoctor | undefined {
  return REGAL_DOCTORS.find((doctor) => doctor.employee_id === employeeId);
}

/** Staff-directory row shape consumed by HospitalOperationsCenter. */
export function regalDoctorsAsStaffRows(): Record<string, unknown>[] {
  return REGAL_DOCTORS.map((doctor) => ({
    id: doctor.id,
    employee_id: doctor.employee_id,
    display_name: doctor.full_name,
    full_name: doctor.full_name,
    role: doctor.role,
    department: doctor.department,
    consultation_fee: doctor.consultation_fee,
    room_number: doctor.room_number,
    is_on_duty: doctor.is_on_duty,
    email: `${doctor.employee_id.toLowerCase()}@regal.hospital`,
  }));
}
