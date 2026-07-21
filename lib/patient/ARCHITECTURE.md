# Nexora Patient App — Architecture (Phase 1)

Enterprise patient companion within the Nexora static-export Next.js PWA (`curasync`).

## Stack (aligned with spec)

| Layer | Choice in repo |
|--------|----------------|
| UI | Next.js App Router · Tailwind · Lucide |
| State | Zustand (`lib/patient/store/patient-app-store.ts`) — profile, MFA/biometric flags, offline queue |
| Data | TanStack Query via `PatientProviders` · Supabase client (same pattern as Doctor app) |
| Interop | FHIR R4-lite types (`lib/patient/fhir/resource-types.ts`) |
| Auth | Hospital IAM + client session (static export); MFA/biometric hooks on profile module |
| Offline | Persisted offline action queue in Zustand (sync when Supabase available) |

## Navigation

Canonical routes: `lib/patient/navigation.ts` → `PATIENT_ROUTES` / `PATIENT_NAV_ITEMS`.

- **Desktop:** grouped sidebar (Care journey · Records & meds · Billing · Safety · Account)
- **Mobile:** 5-item bottom bar (Dashboard · Appointments · Health · Messages · Account) + header SOS

## Design system (Rose Coral)

Tokens live in `lib/patient/theme.ts` and Tailwind (`patient-*` in `tailwind.config.ts` / `app/globals.css`):

| Token | Hex |
|--------|-----|
| Primary | `#f47c8c` |
| Hover | `#e06373` |
| Light tint | `#fde8eb` |
| Border | `#f0d8dc` |
| Headings | `#8c2b39` |
| Muted text | `#736366` |
| Canvas | `#faf6f7` |
| Emergency | `#e63946` |

Shell: solid coral sidebar (`PatientShell`), white active nav pill, deep rose active text.

## App Router map

```
/patient                    → redirect /patient/dashboard
/patient/dashboard
/patient/appointments
/patient/teleconsult
/patient/health
/patient/medications
/patient/prescriptions
/patient/records            FHIR-oriented EMR vault
/patient/diagnostics        Labs + imaging (DICOM-ready)
/patient/billing
/patient/communication
/patient/emergency
/patient/profile
```

## Ecosystem integration

Patient data reads/writes target Supabase tables shared with Hospital / Doctor modules (`patients`, `appointments`, `lab_orders`, etc.). No Next.js API routes at runtime (static `output: "export"`).

## Next phases (from full spec)

- JWT/OAuth + MFA/biometric wiring on `/patient/profile`
- Supabase Realtime for messages and appointment updates
- ABDM / HIPAA audit logging via `@nexora/shared` pipeline
- DICOM viewer component for `/patient/diagnostics`
