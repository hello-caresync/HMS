BEGIN;

-- Canonical communications & events schema (Phase 4 consolidation)
-- Sources:
--   channel_messages, system_events → regal-enterprise-platform.sql
--   system_notifications → regal-enterprise-platform.sql + system-notifications-broadcast.sql
-- Safe on existing databases: CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS per column.

-- ============================================================================
-- channel_messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'
    REFERENCES public.hospitals(id),
  hospital_code VARCHAR(50) NOT NULL DEFAULT 'HOSP-01',
  facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  channel_type VARCHAR(100) DEFAULT 'vendor_procurement',
  recipient_type VARCHAR(50) DEFAULT 'all',
  recipient_id VARCHAR(100),
  sender_id VARCHAR(100) DEFAULT 'hospital_admin',
  sender_role VARCHAR(50) DEFAULT 'hospital_admin',
  sender_name VARCHAR(150) DEFAULT 'Regal Hospital Desk',
  subject VARCHAR(255),
  message TEXT NOT NULL DEFAULT '',
  message_text TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  vendor_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS hospital_code VARCHAR(50) NOT NULL DEFAULT 'HOSP-01';
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS facility_code VARCHAR(50) DEFAULT 'RH-BLR-01';
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS channel_type VARCHAR(100) DEFAULT 'vendor_procurement';
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(50) DEFAULT 'all';
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(100);
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS sender_id VARCHAR(100) DEFAULT 'hospital_admin';
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50) DEFAULT 'hospital_admin';
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(150) DEFAULT 'Regal Hospital Desk';
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS message_text TEXT;
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS vendor_id UUID DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.channel_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_channel_messages_hospital
  ON public.channel_messages (hospital_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_channel_messages_recipient
  ON public.channel_messages (recipient_type, recipient_id);

-- ============================================================================
-- system_notifications (merged regal + broadcast)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'
    REFERENCES public.hospitals(id),
  hospital_code TEXT NOT NULL DEFAULT 'HOSP-01',
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
  subject TEXT,
  body TEXT,
  target_app VARCHAR(50),
  delivery_status TEXT DEFAULT 'Delivered',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS hospital_code TEXT NOT NULL DEFAULT 'HOSP-01';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS facility_code VARCHAR(50) DEFAULT 'RH-BLR-01';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(50) NOT NULL DEFAULT 'all';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(100) DEFAULT 'ALL';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(150) DEFAULT 'All Audience';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'Announcement';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'Notification';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Delivered';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50) DEFAULT 'hospital_admin';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS sender_name VARCHAR(150) DEFAULT 'Regal Hospital Operations Desk';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS target_app VARCHAR(50);
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'Delivered';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type
  ON public.system_notifications (recipient_type);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.system_notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_notifications_hospital
  ON public.system_notifications (hospital_id, created_at DESC);

-- ============================================================================
-- system_events
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'
    REFERENCES public.hospitals(id),
  hospital_code TEXT NOT NULL DEFAULT 'HOSP-01',
  event_type VARCHAR(100) NOT NULL,
  source_app VARCHAR(50) NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  severity VARCHAR(20) DEFAULT 'info',
  target_roles TEXT[] DEFAULT ARRAY['hospital', 'doctor', 'patient', 'vendor'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_events ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.system_events ADD COLUMN IF NOT EXISTS hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.system_events ADD COLUMN IF NOT EXISTS hospital_code TEXT NOT NULL DEFAULT 'HOSP-01';
ALTER TABLE public.system_events ADD COLUMN IF NOT EXISTS event_type VARCHAR(100) NOT NULL DEFAULT 'unknown';
ALTER TABLE public.system_events ADD COLUMN IF NOT EXISTS source_app VARCHAR(50) NOT NULL DEFAULT 'unknown';
ALTER TABLE public.system_events ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.system_events ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'info';
ALTER TABLE public.system_events ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT ARRAY['hospital', 'doctor', 'patient', 'vendor'];
ALTER TABLE public.system_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_system_events_hospital
  ON public.system_events (hospital_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_events_type
  ON public.system_events (event_type, created_at DESC);

COMMIT;
