-- NEXORA Hospital Operations Central Hub schema
-- Run in Supabase SQL editor

create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  severity text not null default 'info',
  target_roles text[] not null default array['hospital','doctor','patient','vendor'],
  created_at timestamptz not null default now()
);

create table if not exists public.emergency_triages (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  patient_id uuid,
  chief_complaint text,
  priority text not null check (priority in ('P1','P2','P3')),
  vitals jsonb default '{}'::jsonb,
  status text not null default 'active',
  assigned_doctor_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.hospital_beds (
  id text primary key,
  ward text not null,
  bed_number text not null,
  bed_type text,
  is_occupied boolean not null default false,
  patient_id uuid,
  patient_name text,
  admission_id uuid,
  updated_at timestamptz not null default now(),
  unique (ward, bed_number)
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  sku text,
  quantity_in_stock integer not null default 0,
  reorder_level integer not null default 10,
  batch_number text,
  expiry_date date,
  unit_price numeric(12,2) default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.goods_receipt_notes (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id text,
  inventory_item_id uuid references public.inventory_items(id),
  quantity_received integer not null default 0,
  verified_by text,
  created_at timestamptz not null default now()
);

alter table public.purchase_orders add column if not exists inventory_item_id uuid;
alter table public.purchase_orders add column if not exists quantity_ordered integer;

insert into public.hospital_beds (id, ward, bed_number, bed_type, is_occupied)
select * from (values
  ('ICU-01','ICU','01','Critical',false),
  ('ICU-02','ICU','02','Critical',false),
  ('ICU-03','ICU','03','Critical',false),
  ('ICU-04','ICU','04','Critical',false),
  ('GW-01','General Ward','01','Standard',false),
  ('GW-02','General Ward','02','Standard',false),
  ('GW-03','General Ward','03','Standard',false),
  ('GW-04','General Ward','04','Standard',false),
  ('GW-05','General Ward','05','Standard',false),
  ('GW-06','General Ward','06','Standard',false),
  ('GW-07','General Ward','07','Standard',false),
  ('GW-08','General Ward','08','Standard',false),
  ('PR-01','Private Room','01','Private',false),
  ('PR-02','Private Room','02','Private',false),
  ('PR-03','Private Room','03','Private',false),
  ('PR-04','Private Room','04','Private',false)
) as v(id, ward, bed_number, bed_type, is_occupied)
where not exists (select 1 from public.hospital_beds limit 1);

alter table public.system_events enable row level security;
alter table public.emergency_triages enable row level security;
alter table public.hospital_beds enable row level security;
alter table public.inventory_items enable row level security;
alter table public.goods_receipt_notes enable row level security;

do $$ begin
  create policy "system_events_anon" on public.system_events for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "emergency_triages_anon" on public.emergency_triages for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hospital_beds_anon" on public.hospital_beds for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "inventory_items_anon" on public.inventory_items for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "goods_receipt_notes_anon" on public.goods_receipt_notes for all using (true) with check (true);
exception when duplicate_object then null; end $$;
