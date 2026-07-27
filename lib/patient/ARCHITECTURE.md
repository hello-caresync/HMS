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

- **Desktop:** flat sidebar (`PATIENT_NAV_ITEMS`, 13 modules)
- **Mobile:** 5-item bottom bar (Dashboard · Appointments · Health · Telemedicine & Messages · Account) + header SOS

## Design system (Plum & Beige — WCAG)

Tokens live in `lib/patient/theme.ts`, shared UI strings in `lib/patient/ui-tokens.ts`, and Tailwind (`patient-*` in `tailwind.config.ts` / `app/globals.css`):

| Token | Hex | Usage |
|--------|-----|--------|
| Dark plum | `#482A41` | Sidebar, top bar, headings on light surfaces |
| Soft beige | `#E2D2C8` | Main canvas |
| Dusty mauve | `#CEB2C0` | Cards, panels, modals |
| Muted lavender | `#8E7692` | Secondary buttons, borders, subtitles |
| Deep purple | `#572E54` | Primary CTAs, active tabs, progress fills |
| Success | `#5E8B7E` | Verified badges · label `#482A41` |
| Warning | `#D8A657` | Alerts · label `#482A41` |
| Emergency | `#E63946` | SOS · white text |

Shell: `PatientShell` — dark plum sidebar, deep purple active pill, soft beige content canvas.

## App Router map

```
/patient                    → redirect /patient/dashboard
/patient/dashboard
/patient/appointments
/patient/telemedicine          Video visits + secure messages (?tab=messages)
/patient/teleconsult           → redirect /patient/telemedicine
/patient/communication         → redirect /patient/telemedicine?tab=messages
/patient/health
/patient/medications
/patient/prescriptions
/patient/records            FHIR-oriented EMR vault
/patient/diagnostics        Labs + imaging (DICOM-ready)
/patient/care-plan           → redirect /patient/dashboard (module removed)
/patient/insurance
/patient/notifications
/patient/billing
/patient/emergency
/patient/profile
```

Legacy bookmarks: `/patient/teleconsult` and `/patient/communication` redirect into telemedicine.

## Ecosystem integration

Patient data reads/writes target Supabase tables shared with Hospital / Doctor modules (`patients`, `appointments`, `lab_orders`, etc.). No Next.js API routes at runtime (static `output: "export"`).

## Next phases (from full spec)

- JWT/OAuth + MFA/biometric wiring on `/patient/profile`
- Supabase Realtime for messages and appointment updates
- ABDM / HIPAA audit logging via `@nexora/shared` pipeline
- DICOM viewer component for `/patient/diagnostics`
