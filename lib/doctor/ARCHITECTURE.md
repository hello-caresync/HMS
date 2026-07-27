# Nexora Doctor Workspace — Product Architecture

Enterprise-grade consultant workstation for physicians, surgeons, specialists, and residents. **Not** a hospital admin panel.

## Design Philosophy

| Principle | Implementation |
|-----------|----------------|
| Minimal clicks | Command palette (⌘K), floating quick actions, context-aware CTAs |
| Real-time | Supabase subscriptions · toast on ER/STAT lab · live queue |
| Workflow-first | Consultation 7-step stepper · order bundles · split EHR views |
| Patient-first | Pre-encounter snapshot · allergy callouts · timeline |
| AI-assisted | Floating AI Copilot · differential engine · clinical suggestions |
| Premium UI | Sage & Cream palette · glassmorphism · animated status · sparklines |

**Aesthetic reference:** Apple Health clarity + Linear speed + Notion structure + Epic/Cerner clinical depth.

---

## Information Architecture (9 modules ≤ 11)

```
Sidebar
├── Dashboard          → Doctor Command Center
├── Schedule           → Day/Week/Month · OT blocks · tele
├── Patients           → Split EHR · timeline · vitals
├── Consultations      → OPD queue · SOAP · Rx · sign
├── Clinical Orders    → Lab · Rad · bundles · results drawer
├── Clinical Documents → Templates · live preview · QR
├── Communication      → Channels · tele · alerts
├── Analytics          → KPIs · trends · revenue
└── Profile & Settings → Signature · notifications · security
```

**Global shell (not sidebar items):** Command Palette · Notification Center · AI Copilot

---

## User Flows

### Appointment → Prescription → Billing (real-time)

```
Patient App books appointment
    ↓ Supabase INSERT appointments
Doctor Dashboard queue updates + notification
    ↓ Doctor accepts / Start consultation
Consultations workspace (SOAP → ICD → Plan/e-Rx)
    ↓ saveConsultation + sendPrescription
Patient App notification · Pharmacy queue · Manager analytics
    ↓ Lab orders if placed
Clinical Orders tracker · Lab App · critical value → Notification Center
```

### Emergency activation

```
ER triage ESI 1–2
    ↓ emergency_alerts realtime
Command Center ER panel + toast + Notification Center
    ↓ Doctor acknowledges
Orders (STAT bundles) · Communication (#Pathology-STAT)
```

---

## Module Specifications

### 1. Dashboard — Doctor Command Center

**Purpose:** Single glance operational control — not admin KPIs.

| Widget | Data source |
|--------|-------------|
| Today's appointments | `useCalendarEvents` + OPD queue |
| Current patient | First queue token |
| Live OPD queue | `useOpdQueue` |
| Emergency ESI 1–2 | `useEmergencyCases` |
| Critical alerts | `useNotificationsFeed` |
| Pending lab / radiology | Orders hub sync (mock + Supabase) |
| Upcoming surgeries | Calendar OT events |
| Follow-ups | Schedule + patient reminders |
| Recent messages | Clinical chat channels |
| AI recommendations | `MOCK_AI_DIFFERENTIALS` / copilot |
| Productivity & performance | Analytics aggregates |

### 2. Schedule

- `HOUR_HEIGHT = 64px` overlap-safe layout
- Session types: OPD · OT · Ward · Tele · Leave
- Add Event / Block OT modal
- Day · Week · Month views

### 3. Patients — EHR Workspace

**Left (4 cols):** Search · status chips (Allergic · IPD · Critical Vitals)

**Right (8 cols):** Vitals sparklines · meds/allergies · expandable timeline · labs · radiology · surgery · admission · documents · insurance · family · AI summary

### 4. Consultations

7-step stepper: Queue → Chief Complaint → HPI → Exam → Diagnosis → Plan/e-Rx → Sign

- Pre-encounter snapshot when no patient selected
- ICD-10 combobox · physical exam checklist · voice notes · digital signature
- `PrescriptionBuilder` embedded in Plan step

### 5. Clinical Orders

- Quick bundles: STAT Cardiac · Post-Op Fever · Routine Diabetic
- Status pipeline: Requested → Sample Collected → In Lab → Report Ready
- Results drawer with reference-range flags

### 6. Clinical Documents

- Templates: Discharge Summary · Referral · Fitness Certificate
- Auto-fill demographics · diagnoses · admission dates
- Split editor + print preview · letterhead · QR verification

### 7. Communication

Channels: Nursing · Pathology · Radiology · Pharmacy · Reception · Consultant Team

- STAT priority · attachments · voice notes · referral cards in thread
- Teleconsult workspace · notification hub tab

### 8. Analytics

- Patients seen · consult time · follow-up rate
- Prescription & diagnosis trends · surgery outcomes
- Revenue · satisfaction · productivity KPIs

### 9. Settings

Tabs: Profile & Qualifications · Digital Signature · Notification Rules · Security & Integration (Supabase sync logs)

---

## Cross-App Integration

| App | Integration |
|-----|-------------|
| Patient App | Appointments → queue · Rx notifications · portal messages |
| Hospital App | Admissions · bed board · OT schedule |
| Manager App | Analytics aggregates · revenue |
| Vendor App | Procurement (indirect via hospital) |
| Laboratory | Order sync · critical values |
| Radiology | PACS orders · report ready |
| Pharmacy | e-Rx dispatch |
| Billing | Consultation codes · procedure charges |

**Transport:** Supabase realtime + React Query invalidation (`useSupabaseClinicalRealtime`)

---

## Role Permissions (RBAC)

| Role | Access |
|------|--------|
| Consultant / Physician | Full workstation |
| Resident | Consultations · orders (cosign required) · limited sign |
| Surgeon | OT schedule · surgery orders · IPD |
| Locum | Read-only charts · supervised Rx |

Enforced via `@nexora/auth` profile roles (future middleware on `/doctor/*`).

---

## Technical Stack (Production)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (server mode — APIs enabled) |
| Database | PostgreSQL via Prisma 6 |
| Auth | Cookie session + Supabase Auth (optional) |
| API | REST `/api/*` with Zod validation |
| Client state | React Query + Zustand |
| Realtime | Supabase subscriptions (ER + STAT labs) |
| Audit | `audit_logs` table — all clinical writes |

### Bootstrapping

```bash
cp .env.example .env.local
npm run db:push
npm run db:seed
npm run dev
```

Login: `dr.aishwarya@nexora.clinical` / `nexora123`

### API Endpoints (authenticated)

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/doctor/auth/login` | POST, DELETE | Session login/logout |
| `/api/doctor/auth/session` | GET | Current doctor |
| `/api/doctor/dashboard` | GET | Aggregated command center |
| `/api/doctor/dashboard/stats` | GET | KPI widgets |
| `/api/opd/queue` | GET, PATCH | Live queue · accept/start |
| `/api/opd/consultation` | POST | Save encounter (SOAP) |
| `/api/patients` | GET | Assigned patients (paginated) |
| `/api/patients/[id]` | GET | Patient workspace |
| `/api/prescriptions` | POST | e-Rx → pharmacy notification |
| `/api/lab-orders` | GET, POST | Lab orders + tracking |
| `/api/ipd/admissions` | GET, POST | Ward census · admission request |
| `/api/notifications` | GET, POST | Notification center |
| `/api/messages` | GET, POST | Clinical chat |
| `/api/documents/generate` | POST | Clinical documents |
| `/api/analytics` | GET | Insights KPIs |
| `/api/calendar` | GET | Schedule events |
| `/api/doctor/audit` | GET | Activity / audit trail |
| `/api/telemedicine` | GET | Teleconsult session |

### RBAC

- Doctors scoped to `hospitalId`
- Patients via `doctor_patient_assignments` (or all hospital patients if none assigned)
- Middleware protects `/doctor/*` (except `/doctor/auth/login`)

---

## Empty States

Every module defines clinical empty states (queue empty → "Appointments sync from Patient App", no results → order CTA, no messages → channel onboarding).

---

## Future Roadmap

1. Wire production LLM to `/api/doctor/ai/differential`
2. Deep-link Emergency Suite + IPD Ward from dashboard panels
3. Unified patient context bar persisted across modules (Zustand)
4. Offline queue for rural connectivity
5. FHIR export for interoperability
