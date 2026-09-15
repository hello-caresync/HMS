-- Regal Hospital Ecosystem · Cross-app messaging & event bus (RH-BLR-01)
-- Run in Supabase SQL Editor · safe to re-run.

-- ─── 1. system_notifications ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  recipient_type VARCHAR(50) NOT NULL,
  recipient_id VARCHAR(100),
  sender_role VARCHAR(50) DEFAULT 'hospital_admin',
  category VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'normal',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.system_notifications
  ADD COLUMN IF NOT EXISTS hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50) DEFAULT 'hospital_admin',
  ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Legacy hospital composer columns (subject/body/target_app)
ALTER TABLE public.system_notifications
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS target_app TEXT,
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'Delivered',
  ADD COLUMN IF NOT EXISTS facility TEXT;

CREATE INDEX IF NOT EXISTS idx_system_notifications_recipient
  ON public.system_notifications (hospital_id, recipient_type, recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_notifications_unread
  ON public.system_notifications (recipient_type, is_read, created_at DESC);

-- ─── 2. system_events (extend existing hub table) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'info',
  target_roles TEXT[] NOT NULL DEFAULT ARRAY['hospital','doctor','patient','vendor'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_events
  ADD COLUMN IF NOT EXISTS hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  ADD COLUMN IF NOT EXISTS source_app VARCHAR(50),
  ADD COLUMN IF NOT EXISTS event_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_system_events_hospital
  ON public.system_events (hospital_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_events_type
  ON public.system_events (event_type, created_at DESC);

-- ─── 3. Realtime publication ─────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ─── 4. Dev-friendly RLS ───────────────────────────────────────────────────
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_notifications_anon_all ON public.system_notifications;
CREATE POLICY system_notifications_anon_all
  ON public.system_notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS system_events_anon_all ON public.system_events;
CREATE POLICY system_events_anon_all
  ON public.system_events FOR ALL USING (true) WITH CHECK (true);
