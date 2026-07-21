import dotenv from 'dotenv';
import path from 'path';

import {
  AppointmentStatus,
  AppointmentType,
  ClinicalOrderStatus,
  DischargeStatus,
  DocumentType,
  EncounterStatus,
  LabUrgency,
  PrismaClient,
  SurgeryStatus,
} from '@prisma/client';

// Hard-override: .env.local first, then .env (both override existing process.env)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('database:5432')) {
  throw new Error(
    `Invalid DATABASE_URL resolved: "${connectionString ?? ''}". Check your .env / .env.local files!`,
  );
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

async function main() {
  console.log('Seeding Nexora Doctor App…');

  await prisma.clinicalMessage.deleteMany();
  await prisma.clinicalDocument.deleteMany();
  await prisma.telemedicineSession.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.radiologyOrder.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.emergencyAlert.deleteMany();
  await prisma.ipdAdmission.deleteMany();
  await prisma.surgery.deleteMany();
  await prisma.formularyDrug.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();

  const doctor = await prisma.doctor.create({
    data: {
      userId: 'seed-doctor-user',
      fullName: 'Dr. Aishwarya D S',
      specialization: 'Internal Medicine / Cardiology',
      licenseNumber: 'REG_NEX_MD_9021',
      consultationFees: 500.0,
      workingHoursJson: {
        mon: '09:00-17:00',
        tue: '09:00-17:00',
        wed: '09:00-13:00',
        tele: '17:00-19:00',
      },
    },
  });

  const patients = await Promise.all(
    [
      {
        mrn: 'NX-MRN-9021',
        fullName: 'Aishwarya D S',
        age: 34,
        gender: 'Female',
        bloodGroup: 'O+',
        allergiesJson: ['Penicillin', 'Sulfa drugs'],
        chronicConditionsJson: ['Type 2 Diabetes', 'Hypertension'],
      },
      {
        mrn: 'NX-MRN-4398',
        fullName: 'K. Venkatesh',
        age: 61,
        gender: 'Male',
        bloodGroup: 'B+',
        allergiesJson: ['Aspirin'],
        chronicConditionsJson: ['CKD Stage 3', 'Atrial fibrillation'],
      },
      {
        mrn: 'NX-MRN-8841',
        fullName: 'P. Nandini',
        age: 52,
        gender: 'Female',
        bloodGroup: 'A+',
        allergiesJson: [],
        chronicConditionsJson: ['Post-cholecystectomy'],
      },
      {
        mrn: 'NX-MRN-7712',
        fullName: 'R. Suresh',
        age: 45,
        gender: 'Male',
        bloodGroup: 'AB+',
        allergiesJson: ['Penicillin'],
        chronicConditionsJson: ['Asthma'],
      },
      {
        mrn: 'NX-MRN-6601',
        fullName: 'V. Lakshmi',
        age: 29,
        gender: 'Female',
        bloodGroup: 'O-',
        allergiesJson: [],
        chronicConditionsJson: ['Hypothyroidism'],
      },
    ].map((p) => prisma.patient.create({ data: p })),
  );

  const [pOpd, pIcu, pChronic, pEr, pTele] = patients;

  await prisma.formularyDrug.createMany({
    data: [
      { brand: 'Metformin 500mg', generic: 'Metformin', route: 'PO', interactsWith: [], allergyConflict: [] },
      { brand: 'Amoxicillin 500mg', generic: 'Amoxicillin', route: 'PO', interactsWith: [], allergyConflict: ['Penicillin'] },
      { brand: 'Aspirin 75mg', generic: 'Aspirin', route: 'PO', interactsWith: ['Warfarin'], allergyConflict: ['Aspirin'] },
      { brand: 'Atorvastatin 20mg', generic: 'Atorvastatin', route: 'PO', interactsWith: [], allergyConflict: [] },
      { brand: 'Paracetamol 650mg', generic: 'Paracetamol', route: 'PO', interactsWith: [], allergyConflict: [] },
    ],
  });

  const today = new Date();
  const apptOpd = await prisma.appointment.create({
    data: {
      doctorId: doctor.id,
      patientId: pOpd.id,
      appointmentType: AppointmentType.OPD,
      status: AppointmentStatus.CHECKED_IN,
      scheduledAt: today,
    },
  });

  const apptFollow = await prisma.appointment.create({
    data: {
      doctorId: doctor.id,
      patientId: pChronic.id,
      appointmentType: AppointmentType.FOLLOWUP,
      status: AppointmentStatus.SCHEDULED,
      scheduledAt: new Date(today.getTime() + 2 * 3600000),
    },
  });

  const apptTele = await prisma.appointment.create({
    data: {
      doctorId: doctor.id,
      patientId: pTele.id,
      appointmentType: AppointmentType.TELEMEDICINE,
      status: AppointmentStatus.SCHEDULED,
      scheduledAt: new Date(today.getTime() + 8 * 3600000),
    },
  });

  const encIcu = await prisma.encounter.create({
    data: {
      doctorId: doctor.id,
      patientId: pIcu.id,
      chiefComplaint: 'Hyperkalemia · AKI on CKD',
      hpi: 'Reduced urine output · dyspnea',
      diagnosisIcd10Json: [{ code: 'N17.9', label: 'Acute kidney failure' }],
      physicalExamJson: { lungs: 'crackles' },
      soapNotesJson: {},
      status: EncounterStatus.IN_PROGRESS,
    },
  });

  const encEr = await prisma.encounter.create({
    data: {
      doctorId: doctor.id,
      patientId: pEr.id,
      chiefComplaint: 'Chest pain · trauma',
      hpi: 'MVC · hypotension',
      diagnosisIcd10Json: [{ code: 'R07.9', label: 'Chest pain' }],
      physicalExamJson: { gcs: 12 },
      soapNotesJson: {},
      status: EncounterStatus.IN_PROGRESS,
    },
  });

  await prisma.ipdAdmission.createMany({
    data: [
      {
        patientId: pIcu.id,
        doctorId: doctor.id,
        wardName: 'ICU',
        bedNumber: 'ICU-Bed 04',
        admissionDate: new Date(Date.now() - 3 * 86400000),
        dailyProgressNotesJson: [
          {
            at: new Date().toISOString(),
            author: doctor.fullName,
            s: 'Dyspnea overnight',
            o: 'K+ 6.1 · crackles',
            a: 'Hyperkalemia',
            p: 'Insulin-dextrose · nephrology',
          },
        ],
        status: DischargeStatus.ADMITTED,
      },
      {
        patientId: pOpd.id,
        doctorId: doctor.id,
        wardName: 'General Ward',
        bedNumber: 'Ward 2A',
        admissionDate: new Date(Date.now() - 2 * 86400000),
        dailyProgressNotesJson: [],
        status: DischargeStatus.ADMITTED,
      },
    ],
  });

  await prisma.prescription.create({
    data: {
      encounterId: encIcu.id,
      doctorId: doctor.id,
      patientId: pIcu.id,
      medicinesJson: [
        { drugName: 'Furosemide 40mg', dosage: '1 tab', frequency: 'OD', duration: '7d', instructions: 'AM' },
      ],
      digitalSignature: doctor.fullName,
      status: ClinicalOrderStatus.SENT_TO_PHARMACY,
    },
  });

  await prisma.labOrder.create({
    data: {
      encounterId: encEr.id,
      patientId: pEr.id,
      doctorId: doctor.id,
      testCodesJson: ['Troponin I', 'CBC', 'ABG'],
      urgency: LabUrgency.STAT,
      status: ClinicalOrderStatus.ORDERED,
      resultsJson: { potassium: { value: 6.2, flag: 'CRITICAL' } },
    },
  });

  await prisma.radiologyOrder.create({
    data: {
      encounterId: encEr.id,
      patientId: pEr.id,
      doctorId: doctor.id,
      modality: 'CT',
      bodyPart: 'Chest/Abdomen',
      urgency: LabUrgency.STAT,
      imageUrlsJson: [],
      reportText: 'Pending read',
      status: ClinicalOrderStatus.ORDERED,
    },
  });

  await prisma.emergencyAlert.createMany({
    data: [
      {
        doctorId: doctor.id,
        patientId: pEr.id,
        esiLevel: 1,
        title: 'Trauma Bay activation',
        body: 'MVC · hypotension · STAT pathway',
        bay: 'Trauma Bay 1',
      },
      {
        doctorId: doctor.id,
        patientId: pIcu.id,
        esiLevel: 2,
        title: 'Critical potassium',
        body: 'K+ 6.2 mmol/L · ICU-Bed 04',
        bay: 'ICU',
      },
    ],
  });

  await prisma.surgery.create({
    data: {
      patientId: pChronic.id,
      surgeonDoctorId: doctor.id,
      otRoom: 'OT-2',
      procedureName: 'Laparoscopic cholecystectomy',
      scheduledTime: new Date(today.getTime() + 5 * 3600000),
      preOpNotes: 'NPO from midnight',
      postOpOrders: 'PCA · early ambulation',
      status: SurgeryStatus.SCHEDULED,
    },
  });

  await prisma.clinicalDocument.create({
    data: {
      patientId: pOpd.id,
      doctorId: doctor.id,
      documentType: DocumentType.SICK_LEAVE,
      contentJson: { days: 2, reason: 'Viral fever' },
      digitalSignature: doctor.fullName,
    },
  });

  await prisma.telemedicineSession.create({
    data: {
      appointmentId: apptTele.id,
      roomId: `TELE-${pTele.mrn}`,
      callDurationSeconds: 0,
      chatTranscriptJson: [
        { from: 'patient', text: 'Good morning doctor, fever since yesterday.' },
        { from: 'doctor', text: 'Please share home vitals if available.' },
      ],
    },
  });

  await prisma.clinicalMessage.createMany({
    data: [
      { channelId: 'ch-nurse', doctorId: doctor.id, sender: 'Charge Nurse', body: 'Vitals updated for ICU-Bed 04', stat: true },
      { channelId: 'ch-lab', doctorId: doctor.id, sender: 'Lab Tech', body: 'STAT Troponin resulted', stat: false },
      { channelId: 'ch-pharm', doctorId: doctor.id, sender: 'Pharmacy', body: 'Rx dispensed for Venkatesh', stat: false },
      { channelId: 'ch-admin', doctorId: doctor.id, sender: 'Bed Manager', body: 'ICU bed available', stat: false },
    ],
  });

  console.log('Seed complete.');
  console.log('Set in .env.local: DEFAULT_DOCTOR_ID=' + doctor.id);
  console.log('Telemedicine appointment:', apptTele.id, 'OPD:', apptOpd.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
