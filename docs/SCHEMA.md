# Database Schema — Nexora Doctor App

PostgreSQL schema managed by Prisma (`prisma/schema.prisma`).

## Core entities

```
Hospital 1──* Doctor
Hospital 1──* Patient
Doctor   *──* Patient  (via DoctorPatientAssignment)
Doctor   1──* Appointment *──1 Patient
Appointment 1──* Encounter
Encounter 1──* Prescription | LabOrder | RadiologyOrder
Doctor   1──* ClinicalMessage
Doctor   1──* ClinicalNotification
Doctor   1──* IpdAdmission
Doctor   1──* Surgery
SystemAdmin (platform administrators)
```

## Key models

### Doctor
- Credentials: `email`, `passwordHash`, `licenseNumber`
- Clinical: `specialization`, `consultationFees`, `workingHoursJson`
- Soft delete: `deletedAt`

### Patient
- `mrn`, demographics, `allergiesJson`, `chronicConditionsJson`
- Initiates appointments via patient app → `Appointment.doctorId`

### Appointment
- `appointmentType`: OPD | TELEMEDICINE | FOLLOWUP | WALK_IN
- `status`: SCHEDULED → CHECKED_IN → IN_CONSULT → COMPLETED
- `scheduledAt`, `chiefComplaint`

### Prescription
- `medicinesJson` array with drug, dose, frequency, duration
- Linked to `Encounter`

### LabOrder / RadiologyOrder
- Status workflow: ORDERED → IN_PROGRESS → COMPLETED
- `urgency`: NORMAL | STAT

### ClinicalMessage
- `channelId` groups conversations (nursing, lab, patient-{id})

### SystemAdmin
- `role`: ENTREPRENEUR | SYSTEM_ADMIN | HOSPITAL_ADMIN
- Platform-wide or hospital-scoped

## Migrations

```bash
npm run db:push    # Apply schema
npm run db:seed    # Seed sample data
```

## Seed data includes

- 1 hospital, 1 doctor (with bcrypt password)
- 5 patients with assignments
- OPD, telemedicine, follow-up appointments
- Lab/radiology orders, prescriptions
- IPD admission, surgery, emergency alerts
- Clinical messages across 4 channels
- 1 system admin account
