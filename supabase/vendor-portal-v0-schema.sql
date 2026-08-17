-- Vendor Portal V0 · channel_messages + vendor profile extensions
-- Run in Supabase SQL Editor. Safe to re-run.

alter table public.vendors
  add column if not exists gstin text;

create table if not exists public.channel_messages (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null default '11111111-1111-1111-1111-111111111111',
  hospital_code text not null default 'NX-ALL',
  sender_role text not null,
  sender_name text not null,
  message_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_channel_messages_vendor on public.channel_messages (vendor_id, created_at);

alter table public.channel_messages enable row level security;

drop policy if exists "channel_messages_anon_all" on public.channel_messages;
create policy "channel_messages_anon_all" on public.channel_messages for all using (true) with check (true);

-- Enable Realtime: Dashboard → Publications → supabase_realtime → channel_messages

insert into public.vendors (id, company_name, email, phone, gstin)
values (
  '11111111-1111-1111-1111-111111111111',
  'MedSupply Dispatch Pvt Ltd',
  'dispatch@medsupply.in',
  '+91 98450 11223',
  '29AABCU9603R1ZM'
)
on conflict (id) do update set
  company_name = excluded.company_name,
  email = excluded.email,
  phone = excluded.phone,
  gstin = excluded.gstin;
