export type RegalDoctor = {
  employeeId: string;
  name: string;
  department: string;
  specialization: string;
  fee: number;
  slots: string[];
};

const slots = {
  standard: ['09:00 AM', '11:00 AM', '02:00 PM', '04:30 PM'],
  late: ['09:30 AM', '11:30 AM', '02:30 PM', '05:00 PM'],
  short: ['10:00 AM', '12:00 PM', '03:00 PM'],
} as const;

/** Official 41-clinician Regal Hospital Doctor Portal roster */
export const REGAL_DOCTORS: RegalDoctor[] = [
  { employeeId: 'RH-D01', name: 'Dr SURIRAJU V', department: 'Urology', specialization: 'Urology', fee: 800, slots: [...slots.standard] },
  { employeeId: 'RH-D02', name: 'Dr CHANDRAKANTH S KESARI', department: 'General Surgery', specialization: 'General & Laparoscopic Surgery', fee: 700, slots: [...slots.late] },
  { employeeId: 'RH-D03', name: 'Dr ANANYA R', department: 'General Medicine', specialization: 'General Medicine', fee: 600, slots: [...slots.short] },
  { employeeId: 'RH-D04', name: 'Dr VIKRAMADITYA RAO', department: 'Cardiology', specialization: 'Cardiology', fee: 1000, slots: [...slots.standard] },
  { employeeId: 'RH-D05', name: 'Dr MEERA NAMBIAR', department: 'Cardiology', specialization: 'Cardiology', fee: 950, slots: [...slots.late] },
  { employeeId: 'RH-D06', name: 'Dr RAJESH KUMAR HEGDE', department: 'Orthopedics', specialization: 'Orthopedics', fee: 800, slots: [...slots.standard] },
  { employeeId: 'RH-D07', name: 'Dr SHALINI DESHMUKH', department: 'Orthopedics', specialization: 'Orthopedics', fee: 750, slots: [...slots.late] },
  { employeeId: 'RH-D08', name: 'Dr ARVIND SWAMY', department: 'Neurology', specialization: 'Neurology', fee: 900, slots: [...slots.short] },
  { employeeId: 'RH-D09', name: 'Dr KAVITHA REDDY', department: 'Neurosurgery', specialization: 'Neurosurgery', fee: 1100, slots: [...slots.standard] },
  { employeeId: 'RH-D10', name: 'Dr PRADEEP VERMA', department: 'Gastroenterology', specialization: 'Gastroenterology', fee: 850, slots: [...slots.late] },
  { employeeId: 'RH-D11', name: 'Dr SUNITHA GOPAL', department: 'Gastroenterology', specialization: 'Gastroenterology', fee: 800, slots: [...slots.short] },
  { employeeId: 'RH-D12', name: 'Dr ANAND KULKARNI', department: 'Nephrology', specialization: 'Nephrology', fee: 850, slots: [...slots.standard] },
  { employeeId: 'RH-D13', name: 'Dr ARCHANA BHAT', department: 'Pediatrics', specialization: 'Pediatrics', fee: 550, slots: [...slots.late] },
  { employeeId: 'RH-D14', name: 'Dr ROHAN D’SOUZA', department: 'Pediatrics', specialization: 'Pediatrics', fee: 550, slots: [...slots.short] },
  { employeeId: 'RH-D15', name: 'Dr DEEPA SHANKAR', department: 'Obstetrics & Gynecology', specialization: 'Obstetrics & Gynecology', fee: 650, slots: [...slots.standard] },
  { employeeId: 'RH-D16', name: 'Dr PRIYANKA MURTHY', department: 'Obstetrics & Gynecology', specialization: 'Obstetrics & Gynecology', fee: 650, slots: [...slots.late] },
  { employeeId: 'RH-D17', name: 'Dr HARISH PRASAD', department: 'Pulmonology', specialization: 'Pulmonology', fee: 750, slots: [...slots.short] },
  { employeeId: 'RH-D18', name: 'Dr NANDINI SEN', department: 'Dermatology', specialization: 'Dermatology', fee: 600, slots: [...slots.standard] },
  { employeeId: 'RH-D19', name: 'Dr KARTHIK SUBRAMANIAN', department: 'ENT', specialization: 'ENT', fee: 550, slots: [...slots.late] },
  { employeeId: 'RH-D20', name: 'Dr SMITA JOSHI', department: 'Ophthalmology', specialization: 'Ophthalmology', fee: 600, slots: [...slots.short] },
  { employeeId: 'RH-D21', name: 'Dr MANOJ KUMAR', department: 'Ophthalmology', specialization: 'Ophthalmology', fee: 600, slots: [...slots.standard] },
  { employeeId: 'RH-D22', name: 'Dr SANGEETHA IYENGAR', department: 'Endocrinology', specialization: 'Endocrinology', fee: 700, slots: [...slots.late] },
  { employeeId: 'RH-D23', name: 'Dr RAKESH NAIR', department: 'Oncology', specialization: 'Oncology', fee: 1000, slots: [...slots.short] },
  { employeeId: 'RH-D24', name: 'Dr GAUTHAM PAI', department: 'Oncology', specialization: 'Oncology', fee: 950, slots: [...slots.standard] },
  { employeeId: 'RH-D25', name: 'Dr VANI S. RAO', department: 'Psychiatry', specialization: 'Psychiatry', fee: 700, slots: [...slots.late] },
  { employeeId: 'RH-D26', name: 'Dr ASHOK PATEL', department: 'Rheumatology', specialization: 'Rheumatology', fee: 750, slots: [...slots.short] },
  { employeeId: 'RH-D27', name: 'Dr VARUN SUNDARAM', department: 'Vascular Surgery', specialization: 'Vascular Surgery', fee: 900, slots: [...slots.standard] },
  { employeeId: 'RH-D28', name: 'Dr RASHMI KULKARNI', department: 'Anaesthesiology', specialization: 'Anaesthesiology', fee: 650, slots: [...slots.late] },
  { employeeId: 'RH-D29', name: 'Dr SUMEET BHALLA', department: 'Plastic Surgery', specialization: 'Plastic Surgery', fee: 1100, slots: [...slots.short] },
  { employeeId: 'RH-D30', name: 'Dr NITHYA SRINIVAS', department: 'Pathology', specialization: 'Pathology', fee: 600, slots: [...slots.standard] },
  { employeeId: 'RH-D31', name: 'Dr JAYAKRISHNAN NAIR', department: 'Radiology', specialization: 'Radiology', fee: 700, slots: [...slots.late] },
  { employeeId: 'RH-D32', name: 'Dr BHAVANA SHAH', department: 'Radiology', specialization: 'Radiology', fee: 700, slots: [...slots.short] },
  { employeeId: 'RH-D33', name: 'Dr SANTOSH SHETTY', department: 'Emergency Medicine', specialization: 'Emergency Medicine', fee: 650, slots: [...slots.standard] },
  { employeeId: 'RH-D34', name: 'Dr MADHAVI LATHA', department: 'Nuclear Medicine', specialization: 'Nuclear Medicine', fee: 800, slots: [...slots.late] },
  { employeeId: 'RH-D35', name: 'Dr CHETHAN GOWDA', department: 'Physical Medicine & Rehab', specialization: 'Physical Medicine & Rehab', fee: 550, slots: [...slots.short] },
  { employeeId: 'RH-D36', name: 'Dr ANUSHREE ROY', department: 'Clinical Immunology', specialization: 'Clinical Immunology', fee: 750, slots: [...slots.standard] },
  { employeeId: 'RH-D37', name: 'Dr GIRISH MENON', department: 'Cardiothoracic Surgery', specialization: 'Cardiothoracic Surgery', fee: 1200, slots: [...slots.late] },
  { employeeId: 'RH-D38', name: 'Dr LAVANYA KRISHNAN', department: 'Pediatric Surgery', specialization: 'Pediatric Surgery', fee: 900, slots: [...slots.short] },
  { employeeId: 'RH-D39', name: 'Dr HEMANTH KUMAR', department: 'Geriatrics', specialization: 'Geriatrics', fee: 600, slots: [...slots.standard] },
  { employeeId: 'RH-D40', name: 'Dr APARNA NAIR', department: 'Infectious Diseases', specialization: 'Infectious Diseases', fee: 700, slots: [...slots.late] },
  { employeeId: 'RH-D41', name: 'Dr BALAJI VENKAT', department: 'Pain Management', specialization: 'Pain Management', fee: 650, slots: [...slots.short] },
];

export const DEFAULT_REGAL_DOCTOR =
  REGAL_DOCTORS.find((doctor) => doctor.employeeId === 'RH-D02') ?? REGAL_DOCTORS[0];

export const REGAL_DOCTORS_BY_DEPARTMENT = REGAL_DOCTORS.reduce<
  Record<string, RegalDoctor[]>
>((directory, doctor) => {
  (directory[doctor.department] ??= []).push(doctor);
  return directory;
}, {});

export function formatClinicianOption(doctor: RegalDoctor): string {
  return `${doctor.name} (${doctor.employeeId}) - ${doctor.department}`;
}

export function findRegalDoctor(identifier: string): RegalDoctor | undefined {
  const normalized = identifier.trim().toLowerCase();
  return REGAL_DOCTORS.find(
    (doctor) =>
      doctor.employeeId.toLowerCase() === normalized ||
      doctor.name.toLowerCase() === normalized,
  );
}
