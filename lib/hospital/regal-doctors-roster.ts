import type { OnboardingMemberDraft } from '@/lib/auth/hospital/member-types';

export const REGAL_HOSPITAL_ID = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

export type RegalDoctorRosterEntry = {
  id: string;
  hospital_id: string;
  full_name: string;
  department: string;
  specialization: string;
  consultation_fee: number;
  available_days?: string;
  start_time?: string;
  end_time?: string;
  experience?: string;
  languages?: string;
  rating?: number;
  review_count?: number;
  room?: string;
};

/** Complete 41-doctor Regal Hospital official roster */
export const REGAL_DOCTORS_DIRECTORY: RegalDoctorRosterEntry[] = [
  {
    id: 'd01',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr. SURIRAJU V',
    department: 'Urology',
    specialization: 'Urologist | Andrologist | Laparoscopic Surgeon',
    consultation_fee: 800,
    experience: '22 years',
    room: 'Room 101',
  },
  {
    id: 'd02',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr. GIRISH S KUNDARGI',
    department: 'Urology',
    specialization: 'Urologist | Andrologist | Laparoscopic Surgeon',
    consultation_fee: 750,
    experience: '9 years',
    room: 'Room 102',
  },
  {
    id: 'd03',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr SRIHARSHA GURRAM',
    department: 'Nephrology',
    specialization: 'Nephrologist | Renal Transplant Physician',
    consultation_fee: 850,
    experience: '11 years',
    room: 'Room 204',
  },
  {
    id: 'd04',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr HIMA BINDU B',
    department: 'Nephrology',
    specialization: 'Nephrologist',
    consultation_fee: 700,
    experience: '1 year',
    room: 'Room 205',
  },
  {
    id: 'd05',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr BHARAT KONAN',
    department: 'Gastroenterology',
    specialization: 'Surgical Gastroenterologist',
    consultation_fee: 900,
    experience: '10 years',
    room: 'Room 301',
  },
  {
    id: 'd06',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr CHANDRAKANTH S KESARI',
    department: 'General Surgery',
    specialization: 'General & Laparoscopic Surgery',
    consultation_fee: 700,
    experience: '15 years',
    room: 'Room 108',
  },
  {
    id: 'd07',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr SUDHAMSU REDDY',
    department: 'General Surgery',
    specialization: 'General & Laparoscopic Surgery',
    consultation_fee: 800,
    experience: '25 years',
    room: 'Room 109',
  },
  {
    id: 'd08',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr KANCHAN SANYAL',
    department: 'General Physician',
    specialization: 'General Physician',
    consultation_fee: 600,
    experience: '35 years',
    room: 'Room 01',
  },
  {
    id: 'd09',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr SURYA PRASAD',
    department: 'General Physician',
    specialization: 'General Physician',
    consultation_fee: 500,
    experience: '9 years',
    room: 'Room 02',
  },
  {
    id: 'd10',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr JAYARAMIREDDY',
    department: 'General Physician',
    specialization: 'General Physician',
    consultation_fee: 500,
    experience: '9 years',
    room: 'Room 03',
  },
  {
    id: 'd11',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr ARUNA JYOTHI',
    department: 'General Physician',
    specialization: 'General Physician',
    consultation_fee: 550,
    experience: '10 years',
    room: 'Room 04',
  },
  {
    id: 'd12',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr NAZIMA TABASSUM',
    department: 'Pediatrics & Pediatric Surgery',
    specialization: 'Pediatrics',
    consultation_fee: 500,
    experience: '13 years',
    room: 'Pediatrics Wing 1',
  },
  {
    id: 'd13',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr SHIV TEJ N',
    department: 'Pediatrics & Pediatric Surgery',
    specialization: 'Pediatric Intensivist, Asthma & Allergy Specialist',
    consultation_fee: 600,
    experience: '10 years',
    room: 'Pediatrics Wing 2',
  },
  {
    id: 'd14',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr AMBRISH C',
    department: 'Diabetology',
    specialization: 'Diabetologist & Endocrinologist',
    consultation_fee: 700,
    experience: '10 years',
    room: 'Room 105',
  },
  {
    id: 'd15',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr PRIYANKA S',
    department: 'Diabetology',
    specialization: 'Diabetologist & Endocrinologist',
    consultation_fee: 700,
    experience: '12 years',
    room: 'Room 106',
  },
  {
    id: 'd16',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr PRIYANKA B V',
    department: 'Obstetrics and Gynaecology',
    specialization: 'Obstetrics & Gynaecology',
    consultation_fee: 650,
    experience: '11 years',
    room: 'OBG OPD 1',
  },
  {
    id: 'd17',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr SYED AFREEN BEGUM',
    department: 'Obstetrics and Gynaecology',
    specialization: 'Obstetrics & Gynaecology',
    consultation_fee: 650,
    experience: '10 years',
    room: 'OBG OPD 2',
  },
  {
    id: 'd18',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr Annu Murali',
    department: 'Obstetrics and Gynaecology',
    specialization: 'Obstetrics & Gynaecology',
    consultation_fee: 550,
    experience: '4 years',
    room: 'OBG OPD 3',
  },
  {
    id: 'd19',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr PURUSHOTHAMA K',
    department: 'Orthopaedic',
    specialization: 'Orthopedic Surgeon',
    consultation_fee: 800,
    experience: '30 years',
    room: 'Ortho OPD 1',
  },
  {
    id: 'd20',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr ABDUL HADI SHAREEF',
    department: 'Orthopaedic',
    specialization: 'Orthopedic Surgeon & Joint Replacement Specialist',
    consultation_fee: 850,
    experience: '18 years',
    room: 'Ortho OPD 2',
  },
  {
    id: 'd21',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr DEVARAJ B.S',
    department: 'Orthopaedic',
    specialization: 'Orthopedic Surgeon - Trauma Specialist',
    consultation_fee: 750,
    experience: '15 years',
    room: 'Ortho OPD 3',
  },
  {
    id: 'd22',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr KRISHNA PRASAD',
    department: 'Neurosurgery',
    specialization: 'Neuro Surgeon',
    consultation_fee: 1000,
    experience: '15 years',
    room: 'Neuro Wing 1',
  },
  {
    id: 'd23',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr TEJESH SHAVI',
    department: 'Neurosurgery',
    specialization: 'Neurosurgery | Neurointerventional Surgery',
    consultation_fee: 950,
    experience: '5 years',
    room: 'Neuro Wing 2',
  },
  {
    id: 'd24',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr NIKHIL C HIREMATH',
    department: 'Neurosurgery',
    specialization: 'Neurologist',
    consultation_fee: 900,
    experience: '10 years',
    room: 'Neuro Wing 3',
  },
  {
    id: 'd25',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr CHANDAN SAURAV MAHAPATRO',
    department: 'Cardiology',
    specialization: 'Cardiologist',
    consultation_fee: 1000,
    experience: '13 years',
    room: 'Cardio OPD 1',
  },
  {
    id: 'd26',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr MADHUSUDHAN RAIKAR',
    department: 'Cardiology',
    specialization: 'Cardiologist',
    consultation_fee: 900,
    experience: '12 years',
    room: 'Cardio OPD 2',
  },
  {
    id: 'd27',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr AZHAR WAHAB',
    department: 'Cardiology',
    specialization: 'Cardiologist',
    consultation_fee: 950,
    experience: '10 years',
    room: 'Cardio OPD 3',
  },
  {
    id: 'd28',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Mrs. ASHWINI',
    department: 'Physiotherapy',
    specialization: 'Physiotherapist',
    consultation_fee: 450,
    experience: '20 years',
    room: 'Physio Center 1',
  },
  {
    id: 'd29',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Mr. Sai Harsha',
    department: 'Physiotherapy',
    specialization: 'Physiotherapist',
    consultation_fee: 450,
    experience: '20 years',
    room: 'Physio Center 2',
  },
  {
    id: 'd30',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr MADHU KUMAR',
    department: 'Anesthesiology',
    specialization: 'Anesthesiology Specialist',
    consultation_fee: 600,
    experience: '11 years',
    room: 'OT Complex 1',
  },
  {
    id: 'd31',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr OM SHIVA',
    department: 'Anesthesiology',
    specialization: 'Anesthesiology Specialist',
    consultation_fee: 600,
    experience: '12 years',
    room: 'OT Complex 2',
  },
  {
    id: 'd32',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr SUHAS C.M.V',
    department: 'ENT',
    specialization: 'ENT Surgeon',
    consultation_fee: 500,
    experience: '3 years',
    room: 'ENT Room 1',
  },
  {
    id: 'd33',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr SHRUTHI DECHAMMA',
    department: 'ENT',
    specialization: 'ENT Surgeon',
    consultation_fee: 600,
    experience: '7 years',
    room: 'ENT Room 2',
  },
  {
    id: 'd34',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr CHETHAN SATISH',
    department: 'Cosmetic Surgery',
    specialization: 'Plastic Surgeon',
    consultation_fee: 1100,
    experience: '15 years',
    room: 'Plastic Surgery Suite',
  },
  {
    id: 'd35',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr BOBBY CYRRIAC',
    department: 'Dental',
    specialization: 'Dentist',
    consultation_fee: 500,
    experience: '20 years',
    room: 'Dental Suite 1',
  },
  {
    id: 'd36',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr ANCY',
    department: 'Dental',
    specialization: 'Periodontist',
    consultation_fee: 500,
    experience: '8 years',
    room: 'Dental Suite 2',
  },
  {
    id: 'd37',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr SATISH KUMARAN P',
    department: 'Dental',
    specialization: 'Dentist',
    consultation_fee: 550,
    experience: '17 years',
    room: 'Dental Suite 3',
  },
  {
    id: 'd38',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr NADEEM AHMED',
    department: 'Dermatology',
    specialization: 'Dermatologist',
    consultation_fee: 650,
    experience: '25 years',
    room: 'Derma Room 1',
  },
  {
    id: 'd39',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr AMISHA SHAH',
    department: 'Radiology',
    specialization: 'Radiologist',
    consultation_fee: 700,
    experience: '9 years',
    room: 'Radiology Center',
  },
  {
    id: 'd40',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr Mahenthesh',
    department: 'Radiology',
    specialization: 'Radiologist',
    consultation_fee: 600,
    experience: '4 years',
    room: 'Radiology Center',
  },
  {
    id: 'd41',
    hospital_id: REGAL_HOSPITAL_ID,
    full_name: 'Dr Arjun',
    department: 'Vascular Surgery',
    specialization: 'Vascular Surgeon',
    consultation_fee: 850,
    experience: '4 years',
    room: 'Specialty Clinic',
  },
];

export const REGAL_DEPARTMENTS = Array.from(
  new Set(REGAL_DOCTORS_DIRECTORY.map((doctor) => doctor.department)),
);

function parseExperienceYears(experience?: string): number {
  if (!experience) return 0;
  const match = experience.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const withoutPrefix = fullName
    .replace(/^(dr\.?|mrs\.?|mr\.?)\s*/i, '')
    .trim();
  const parts = withoutPrefix.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '.' };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

function inferQualification(doctor: RegalDoctorRosterEntry): string {
  const spec = doctor.specialization.toLowerCase();
  const dept = doctor.department.toLowerCase();

  if (spec.includes('physiotherapist')) return 'BPT, MPT';
  if (spec.includes('dentist') || spec.includes('periodontist')) return 'BDS, MDS';
  if (spec.includes('radiologist')) return 'MBBS, MD (Radiodiagnosis)';
  if (spec.includes('dermatologist')) return 'MBBS, MD (Dermatology)';
  if (spec.includes('anesthesiology')) return 'MBBS, MD (Anaesthesiology)';
  if (spec.includes('cardiologist')) return 'MBBS, MD, DM (Cardiology)';
  if (spec.includes('neurologist')) return 'MBBS, MD, DM (Neurology)';
  if (spec.includes('neuro') && spec.includes('surgeon')) return 'MBBS, MS, MCh (Neurosurgery)';
  if (spec.includes('urologist')) return 'MBBS, MS, MCh (Urology)';
  if (spec.includes('nephrologist')) return 'MBBS, MD, DM (Nephrology)';
  if (spec.includes('gastroenterologist')) return 'MBBS, MS, MCh (Surgical Gastroenterology)';
  if (spec.includes('orthopedic')) return 'MBBS, MS (Orthopaedics)';
  if (spec.includes('vascular')) return 'MBBS, MS, MCh (Vascular Surgery)';
  if (spec.includes('plastic')) return 'MBBS, MS, MCh (Plastic Surgery)';
  if (spec.includes('ent')) return 'MBBS, MS (ENT)';
  if (spec.includes('pediatric')) return 'MBBS, MD (Paediatrics)';
  if (spec.includes('diabetologist') || spec.includes('endocrinologist')) {
    return 'MBBS, MD (Endocrinology)';
  }
  if (dept.includes('obstetrics') || dept.includes('gynaecology')) {
    return 'MBBS, MS (Obstetrics & Gynaecology)';
  }
  if (spec.includes('surgeon') || dept.includes('surgery')) return 'MBBS, MS';
  if (spec.includes('general physician') || dept.includes('general physician')) {
    return 'MBBS, MD (General Medicine)';
  }
  return 'MBBS, MD';
}

function buildRegalEmail(firstName: string, lastName: string, rosterId: string): string {
  const slug = `${firstName}.${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
  const local = slug || rosterId;
  return `${local}@regalhospital.com`;
}

/** Map official Regal roster entries to onboarding member draft rows. */
export function mapRegalDoctorsToMemberDrafts(
  roster: RegalDoctorRosterEntry[] = REGAL_DOCTORS_DIRECTORY,
): OnboardingMemberDraft[] {
  return roster.map((doctor) => {
    const { firstName, lastName } = parseFullName(doctor.full_name);
    return {
      key: `regal-${doctor.id}`,
      firstName,
      lastName,
      email: buildRegalEmail(firstName, lastName, doctor.id),
      phone: '+91 80 4950 1100',
      employeeId: `RH-${doctor.id.toUpperCase()}`,
      role: 'Doctor',
      departmentName: doctor.department,
      medicalLicenseNumber: `REGAL-KA-${doctor.id.toUpperCase()}`,
      specialization: doctor.specialization,
      qualification: inferQualification(doctor),
      experienceYears: parseExperienceYears(doctor.experience),
      consultationFee: doctor.consultation_fee,
      opdRoomNumber: doctor.room ?? '',
    };
  });
}

export const REGAL_DOCTOR_COUNT = REGAL_DOCTORS_DIRECTORY.length;
