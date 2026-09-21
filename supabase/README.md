# Supabase schema (canonical)

## Use `migrations/` only

The numbered files in `migrations/` are the **canonical** database schema for Regal/CuraSync Phase 4 consolidation:

| File | Contents |
|------|----------|
| `0001_core_schema.sql` | `hospitals`, `appointments` |
| `0002_clinical_schema.sql` | `medical_records`, `emergency_alerts`, `opd_queue`, `clinical_notes` |
| `0003_staff_billing_schema.sql` | `hospital_staff`, `billing_invoices` |
| `0004_procurement_schema.sql` | `purchase_orders`, `shipments`, `invoices` |
| `0005_comms_events_schema.sql` | `channel_messages`, `system_notifications`, `system_events` |
| `0006_rls_realtime_grants.sql` | Open dev RLS, Realtime publication, grants |

Apply in numeric order on a **fresh** Supabase project (SQL Editor or `supabase db push`).

Later dated migrations (`20260907150000_*`, `20260908130000_*`) are additive and run **after** the `0001`–`0006` set.

## Do not run `_archive/`

Files in `_archive/` are **historical** SQL scripts that previously duplicated `CREATE TABLE` definitions. They are kept for reference only. **Do not execute them** on any database — they will conflict with the canonical migrations.

## Conventions enforced in canonical schema

- **`appointments` primary key:** `id` (UUID). Foreign keys reference `appointments(id)`.
- **`hospital_id`:** UUID foreign key to `public.hospitals(id)`.
- **`hospital_code`:** separate TEXT column for human-readable tenant codes (e.g. `HOSP-01`).
- **`opd_queue.token_number`:** TEXT.

## After applying migrations

Re-apply role-scoped policies from standalone RLS scripts if needed (e.g. `doctor-rls.sql`) once table/column names match this schema.
