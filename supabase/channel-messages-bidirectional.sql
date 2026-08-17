-- Bi-directional channel_messages · Hospital ⇄ Vendor ⇄ Doctor ⇄ Patient
-- Safe to re-run. Migrates legacy vendor-portal columns (vendor_id, hospital_code, message_text).

-- ── 1. Base table (new installs) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  channel_type VARCHAR(100) DEFAULT 'general',
  recipient_type VARCHAR(50) NOT NULL DEFAULT 'all',
  recipient_id VARCHAR(100),
  sender_role VARCHAR(50) NOT NULL,
  sender_name VARCHAR(150) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL DEFAULT '',
  priority VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Legacy vendor-portal columns (preserve existing rows) ───────────────
ALTER TABLE public.channel_messages
  ADD COLUMN IF NOT EXISTS vendor_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  ADD COLUMN IF NOT EXISTS hospital_code TEXT DEFAULT 'RH-BLR-01',
  ADD COLUMN IF NOT EXISTS message_text TEXT,
  ADD COLUMN IF NOT EXISTS hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  ADD COLUMN IF NOT EXISTS channel_type VARCHAR(100) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(50) DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS subject VARCHAR(255),
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sender_id VARCHAR(100);

-- Backfill sender_id for clinical routing (doctor/patient UUIDs or employee ids)
UPDATE public.channel_messages
SET sender_id = COALESCE(
  NULLIF(sender_id, ''),
  CASE
    WHEN LOWER(COALESCE(sender_role, '')) = 'vendor' THEN COALESCE(vendor_id::text, '11111111-1111-1111-1111-111111111111')
    WHEN LOWER(COALESCE(sender_role, '')) IN ('hospital', 'hospital_admin') THEN 'RH-BLR-01'
    ELSE NULL
  END
)
WHERE sender_id IS NULL;

-- Backfill unified columns from legacy vendor chat rows
UPDATE public.channel_messages
SET
  message = COALESCE(NULLIF(message, ''), message_text, ''),
  channel_type = COALESCE(NULLIF(channel_type, ''), 'vendor_procurement'),
  hospital_id = COALESCE(hospital_id, '11111111-1111-1111-1111-111111111111'::uuid),
  recipient_type = COALESCE(
    NULLIF(recipient_type, ''),
    CASE
      WHEN LOWER(COALESCE(sender_role, '')) IN ('vendor', 'vendors') THEN 'hospital'
      WHEN LOWER(COALESCE(sender_role, '')) IN ('hospital', 'hospital_admin') THEN 'vendor'
      ELSE 'all'
    END
  ),
  recipient_id = COALESCE(
    NULLIF(recipient_id, ''),
    CASE
      WHEN LOWER(COALESCE(sender_role, '')) IN ('vendor', 'vendors') THEN COALESCE(NULLIF(hospital_code, ''), 'RH-BLR-01')
      WHEN LOWER(COALESCE(sender_role, '')) IN ('hospital', 'hospital_admin') THEN COALESCE(vendor_id::text, '11111111-1111-1111-1111-111111111111')
      ELSE NULL
    END
  ),
  sender_role = LOWER(COALESCE(NULLIF(sender_role, ''), 'vendor')),
  priority = COALESCE(NULLIF(priority, ''), 'normal'),
  is_read = COALESCE(is_read, false)
WHERE message IS NULL OR message = '' OR recipient_type IS NULL OR recipient_type = '';

ALTER TABLE public.channel_messages
  ALTER COLUMN recipient_type SET NOT NULL,
  ALTER COLUMN sender_role SET NOT NULL,
  ALTER COLUMN sender_name SET NOT NULL,
  ALTER COLUMN message SET NOT NULL;

-- ── 3. Performance indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_channel_messages_recipient
  ON public.channel_messages (recipient_type, recipient_id);

CREATE INDEX IF NOT EXISTS idx_channel_messages_created_at
  ON public.channel_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_type
  ON public.channel_messages (channel_type, hospital_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_channel_messages_vendor_legacy
  ON public.channel_messages (vendor_id, created_at DESC);

-- ── 4. Row Level Security ──────────────────────────────────────────────────
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow open insert on channel_messages" ON public.channel_messages;
DROP POLICY IF EXISTS "Allow open read on channel_messages" ON public.channel_messages;
DROP POLICY IF EXISTS "Allow open update on channel_messages" ON public.channel_messages;
DROP POLICY IF EXISTS "channel_messages_anon_all" ON public.channel_messages;

CREATE POLICY "Allow open insert on channel_messages"
  ON public.channel_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow open read on channel_messages"
  ON public.channel_messages FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow open update on channel_messages"
  ON public.channel_messages FOR UPDATE TO anon, authenticated USING (true);

-- ── 5. Supabase Realtime ───────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'channel_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;
  END IF;
END $$;
