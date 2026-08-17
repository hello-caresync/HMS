-- Regal Hospital · Ecosystem Notification Ledger & Broadcast Dispatcher (RH-BLR-01)
-- Run in Supabase SQL Editor · safe to re-run.

-- 1. Ensure system_notifications table exists with broadcast schema
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  recipient_type VARCHAR(50) NOT NULL,
  recipient_id VARCHAR(100) DEFAULT 'ALL',
  recipient_name VARCHAR(150) DEFAULT 'All Audience',
  category VARCHAR(50) NOT NULL DEFAULT 'Announcement',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'Delivered',
  sender_role VARCHAR(50) DEFAULT 'hospital_admin',
  sender_name VARCHAR(150) DEFAULT 'Regal Hospital Operations Desk',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Backfill / extend legacy columns from earlier migrations
ALTER TABLE public.system_notifications
  ADD COLUMN IF NOT EXISTS hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  ADD COLUMN IF NOT EXISTS facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(100) DEFAULT 'ALL',
  ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(150) DEFAULT 'All Audience',
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Announcement',
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Delivered',
  ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50) DEFAULT 'hospital_admin',
  ADD COLUMN IF NOT EXISTS sender_name VARCHAR(150) DEFAULT 'Regal Hospital Operations Desk',
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS target_app VARCHAR(50),
  ADD COLUMN IF NOT EXISTS facility VARCHAR(50) DEFAULT 'RH-BLR-01',
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'Delivered',
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type
  ON public.system_notifications (recipient_type);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.system_notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_notifications_hospital
  ON public.system_notifications (hospital_id, created_at DESC);

-- 4. Row Level Security
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_notifications_access" ON public.system_notifications;
CREATE POLICY "open_notifications_access"
  ON public.system_notifications
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Enable Supabase Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'system_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_notifications;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
