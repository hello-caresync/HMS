# Nexora Ecosystem Hub — Central Sync Architecture

Hospital App is the **central operational hub**. All apps read/write the same Supabase database. Patient App never notifies Doctor App directly — every mutation flows through `lib/ecosystem/ecosystem-hub.ts`.

## Architecture

```
Patient App ──► Central Backend (Supabase) ◄── Doctor App
                      │
                      ├── Hospital App (hub UI + orchestration)
                      └── Vendor App
```

## Database (run in Supabase SQL editor)

1. `supabase/hospital-v0-schema.sql`
2. `supabase/cross-app-realtime-schema.sql`
3. `supabase/ecosystem-hub-schema.sql` — `ecosystem_activity`, `audit_logs`

Enable Realtime on: `appointments`, `opd_visits`, `ecosystem_activity`, `notifications`, `billing_invoices`, `purchase_orders`, `pharmacy_inventory`

## Hub API (`lib/ecosystem/ecosystem-hub.ts`)

| Use case | Function |
|----------|----------|
| Patient books | `hubPatientBookAppointment` |
| Doctor accepts | `hubDoctorAcceptAppointment` |
| Reception check-in | `hubReceptionCheckIn` |
| Start consultation | `hubDoctorStartConsultation` |
| Complete consultation | `hubDoctorCompleteConsultation` (+ billing draft) |
| Admission request | `hubDoctorRequestAdmission` |
| Generate invoice | `hubGenerateInvoice` |
| Payment | `hubProcessPayment` |
| Low stock | `hubLowStockAlert` |
| Purchase order | `hubCreatePurchaseOrder` |
| Vendor delivery | `hubVendorDeliveryReceived` |

## Appointment statuses

`Pending` → `Confirmed` → `Checked-In` → `In Consultation` → `Completed`  
Also: `Cancelled`, `No Show`

## Realtime

- `HospitalSyncProvider` — hospital dashboard live refresh + activity feed
- `RealtimeSyncProvider` — patient/doctor read-only subscriptions to shared tables
- No direct Patient→Doctor notification calls from UI

## Audit

Every hub mutation writes to `audit_logs` and `ecosystem_activity` for the Hospital dashboard timeline.
