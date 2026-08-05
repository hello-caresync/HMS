-- Hospital profile & first-time setup wizard

create table if not exists public.hospital_profile (
  id uuid primary key default gen_random_uuid(),
  hospital_name text not null default '',
  logo_url text,
  address text,
  tax_gst_id text,
  license_number text,
  phone text,
  email text,
  emergency_line text,
  tax_percentage numeric(5,2) default 0,
  currency_symbol text default '₹',
  invoice_prefix text default 'INV',
  payment_methods text[] default array['Cash', 'Card', 'UPI', 'Insurance'],
  opd_working_days text[] default array['Mon','Tue','Wed','Thu','Fri','Sat'],
  opd_hours_start time default '08:00',
  opd_hours_end time default '20:00',
  departments jsonb default '[]'::jsonb,
  wards jsonb default '[]'::jsonb,
  setup_completed boolean not null default false,
  setup_step integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Singleton row helper: only one hospital profile per deployment
create unique index if not exists hospital_profile_singleton on public.hospital_profile ((true));

alter table public.hospital_profile enable row level security;
drop policy if exists hospital_profile_anon on public.hospital_profile;
create policy hospital_profile_anon on public.hospital_profile for all using (true) with check (true);

comment on table public.hospital_profile is 'First-time setup wizard state and hospital identity';
