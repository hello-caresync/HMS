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

export const REGAL_DOCTORS: RegalDoctor[] = [
  { employeeId: 'RH-D01', name: 'Dr. SURIRAJU V', department: 'Urology', specialization: 'Urologist | Andrologist | Laparoscopic Surgeon', fee: 800, slots: [...slots.standard] },
  { employeeId: 'RH-D02', name: 'Dr. GIRISH S KUNDARGI', department: 'Urology', specialization: 'Urologist | Andrologist | Laparoscopic Surgeon', fee: 750, slots: [...slots.late] },
  { employeeId: 'RH-D03', name: 'Dr SRIHARSHA GURRAM', department: 'Nephrology', specialization: 'Nephrologist | Renal Transplant Specialist', fee: 850, slots: [...slots.short] },
  { employeeId: 'RH-D04', name: 'Dr HIMA BINDU B', department: 'Nephrology', specialization: 'Nephrologist', fee: 700, slots: ['10:30 AM', '01:00 PM', '04:00 PM'] },
  { employeeId: 'RH-D05', name: 'Dr BHARAT KONAN', department: 'Gastroenterology', specialization: 'Surgical Gastroenterologist', fee: 900, slots: [...slots.late] },
  { employeeId: 'RH-D06', name: 'Dr CHANDRAKANTH S KESARI', department: 'General Surgery', specialization: 'General & Laparoscopic Surgery', fee: 700, slots: ['09:30 AM', '11:30 AM', '02:00 PM', '04:30 PM'] },
  { employeeId: 'RH-D07', name: 'Dr SUDHAMSU REDDY', department: 'General Surgery', specialization: 'General & Laparoscopic Surgery', fee: 800, slots: ['10:00 AM', '12:00 PM', '03:00 PM', '05:00 PM'] },
  { employeeId: 'RH-D08', name: 'Dr KANCHAN SANYAL', department: 'General Physician', specialization: 'General Physician', fee: 600, slots: ['09:00 AM', '10:30 AM', '12:00 PM', '04:00 PM'] },
  { employeeId: 'RH-D09', name: 'Dr SURYA PRASAD', department: 'General Physician', specialization: 'General Physician', fee: 500, slots: [...slots.late] },
  { employeeId: 'RH-D10', name: 'Dr JAYARAMIREDDY', department: 'General Physician', specialization: 'General Physician', fee: 500, slots: ['10:00 AM', '11:30 AM', '03:00 PM'] },
  { employeeId: 'RH-D11', name: 'Dr ARUNA JYOTHI', department: 'General Physician', specialization: 'General Physician', fee: 550, slots: ['10:30 AM', '01:00 PM', '04:30 PM'] },
  { employeeId: 'RH-D12', name: 'Dr NAZIMA TABASSUM', department: 'Pediatrics & Pediatric Surgery', specialization: 'Pediatrics', fee: 500, slots: ['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'] },
  { employeeId: 'RH-D13', name: 'Dr SHIV TEJ N', department: 'Pediatrics & Pediatric Surgery', specialization: 'Pediatric Intensivist, Asthma & Allergy', fee: 600, slots: ['09:30 AM', '11:15 AM', '02:30 PM', '05:00 PM'] },
  { employeeId: 'RH-D14', name: 'Dr AMBRISH C', department: 'Diabetology', specialization: 'Diabetologist & Endocrinologist', fee: 700, slots: [...slots.short] },
  { employeeId: 'RH-D15', name: 'Dr PRIYANKA S', department: 'Diabetology', specialization: 'Diabetologist & Endocrinologist', fee: 700, slots: ['10:30 AM', '01:00 PM', '04:00 PM'] },
  { employeeId: 'RH-D16', name: 'Dr PRIYANKA B V', department: 'Obstetrics and Gynaecology', specialization: 'Obstetrics & Gynaecology', fee: 650, slots: [...slots.standard] },
  { employeeId: 'RH-D17', name: 'Dr SYED AFREEN BEGUM', department: 'Obstetrics and Gynaecology', specialization: 'Obstetrics & Gynaecology', fee: 650, slots: [...slots.late] },
  { employeeId: 'RH-D18', name: 'Dr Annu Murali', department: 'Obstetrics and Gynaecology', specialization: 'Obstetrics & Gynaecology', fee: 550, slots: ['10:00 AM', '12:00 PM', '03:30 PM', '05:00 PM'] },
  { employeeId: 'RH-D19', name: 'Dr PURUSHOTHAMA K', department: 'Orthopaedics', specialization: 'Orthopedic Surgeon', fee: 800, slots: ['09:00 AM', '10:45 AM', '02:15 PM', '04:30 PM'] },
  { employeeId: 'RH-D20', name: 'Dr ABDUL HADI SHAREEF', department: 'Orthopaedics', specialization: 'Orthopedic Surgeon & Joint Replacement', fee: 850, slots: [...slots.late] },
  { employeeId: 'RH-D21', name: 'Dr DEVARAJ B.S', department: 'Orthopaedics', specialization: 'Orthopedic Surgeon - Trauma & Arthroscopy', fee: 750, slots: [...slots.short] },
  { employeeId: 'RH-D22', name: 'Dr KRISHNA PRASAD', department: 'Neurosurgery', specialization: 'Neuro Surgeon', fee: 1000, slots: ['10:00 AM', '11:30 AM', '02:30 PM', '04:30 PM'] },
  { employeeId: 'RH-D23', name: 'Dr TEJESH SHAVI', department: 'Neurosurgery', specialization: 'Neurosurgery | Neurointervention Specialist', fee: 950, slots: ['10:30 AM', '01:00 PM', '03:30 PM'] },
  { employeeId: 'RH-D24', name: 'Dr NIKHIL C HIREMATH', department: 'Neurosurgery', specialization: 'Neurologist', fee: 900, slots: ['11:00 AM', '02:00 PM', '05:00 PM'] },
  { employeeId: 'RH-D25', name: 'Dr CHANDAN SAURAV MAHAPATRO', department: 'Cardiology', specialization: 'Cardiologist', fee: 1000, slots: ['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'] },
  { employeeId: 'RH-D26', name: 'Dr MADHUSUDHAN RAIKAR', department: 'Cardiology', specialization: 'Cardiologist', fee: 900, slots: [...slots.late] },
  { employeeId: 'RH-D27', name: 'Dr AZHAR WAHAB', department: 'Cardiology', specialization: 'Cardiologist', fee: 950, slots: ['10:00 AM', '12:30 PM', '03:30 PM'] },
  { employeeId: 'RH-D28', name: 'Mrs. ASHWINI', department: 'Physiotherapy', specialization: 'Physiotherapist', fee: 450, slots: ['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'] },
  { employeeId: 'RH-D29', name: 'Mr. Sai Harsha', department: 'Physiotherapy', specialization: 'Physiotherapist', fee: 450, slots: ['09:30 AM', '11:30 AM', '02:30 PM', '04:30 PM'] },
  { employeeId: 'RH-D30', name: 'Dr MADHU KUMAR', department: 'Anesthesiology', specialization: 'Anesthesiology Specialist', fee: 600, slots: [...slots.short] },
  { employeeId: 'RH-D31', name: 'Dr OM SHIVA', department: 'Anesthesiology', specialization: 'Anesthesiology Specialist', fee: 600, slots: ['10:30 AM', '01:00 PM', '03:30 PM'] },
  { employeeId: 'RH-D32', name: 'Dr SUHAS C.M.V', department: 'ENT', specialization: 'ENT Surgeon', fee: 500, slots: [...slots.standard] },
  { employeeId: 'RH-D33', name: 'Dr SHRUTHI DECHAMMA', department: 'ENT', specialization: 'ENT Surgeon', fee: 600, slots: [...slots.late] },
  { employeeId: 'RH-D34', name: 'Dr CHETHAN SATISH', department: 'Cosmetic Surgery', specialization: 'Plastic Surgeon', fee: 1100, slots: ['10:00 AM', '12:00 PM', '03:30 PM'] },
  { employeeId: 'RH-D35', name: 'Dr BOBBY CYRRIAC', department: 'Dental', specialization: 'Dentist', fee: 500, slots: [...slots.late] },
  { employeeId: 'RH-D36', name: 'Dr ANCY', department: 'Dental', specialization: 'Periodontist', fee: 500, slots: [...slots.short] },
  { employeeId: 'RH-D37', name: 'Dr SATISH KUMARAN P', department: 'Dental', specialization: 'Dentist', fee: 550, slots: ['10:30 AM', '01:00 PM', '04:00 PM'] },
  { employeeId: 'RH-D38', name: 'Dr NADEEM AHMED', department: 'Dermatology', specialization: 'Dermatologist', fee: 650, slots: ['10:00 AM', '11:30 AM', '02:30 PM', '04:30 PM'] },
  { employeeId: 'RH-D39', name: 'Dr AMISHA SHAH', department: 'Radiology', specialization: 'Radiologist', fee: 700, slots: [...slots.standard] },
  { employeeId: 'RH-D40', name: 'Dr Mahenthesh', department: 'Radiology', specialization: 'Radiologist', fee: 600, slots: [...slots.late] },
  { employeeId: 'RH-D41', name: 'Dr Arjun', department: 'Vascular Surgery', specialization: 'Vascular Surgeon', fee: 850, slots: ['10:00 AM', '12:00 PM', '03:30 PM'] },
];

export const DEFAULT_REGAL_DOCTOR =
  REGAL_DOCTORS.find((doctor) => doctor.employeeId === 'RH-D06') ?? REGAL_DOCTORS[0];

export const REGAL_DOCTORS_BY_DEPARTMENT = REGAL_DOCTORS.reduce<
  Record<string, RegalDoctor[]>
>((directory, doctor) => {
  (directory[doctor.department] ??= []).push(doctor);
  return directory;
}, {});

export function findRegalDoctor(identifier: string): RegalDoctor | undefined {
  const normalized = identifier.trim().toLowerCase();
  return REGAL_DOCTORS.find(
    (doctor) =>
      doctor.employeeId.toLowerCase() === normalized ||
      doctor.name.toLowerCase() === normalized,
  );
}
