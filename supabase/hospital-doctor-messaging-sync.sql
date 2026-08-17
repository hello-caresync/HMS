-- Hospital ⇄ Doctor bi-directional messaging · channel_messages protocol
-- Safe to re-run in Supabase SQL Editor

ALTER TABLE public.channel_messages
  ADD COLUMN IF NOT EXISTS channel_type VARCHAR(100) DEFAULT 'hospital_desk',
  ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50) DEFAULT 'hospital',
  ADD COLUMN IF NOT EXISTS sender_id VARCHAR(100) DEFAULT 'RH-ADMIN',
  ADD COLUMN IF NOT EXISTS sender_name VARCHAR(150) DEFAULT 'Regal Hospital Operations Desk',
  ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(50) DEFAULT 'doctor',
  ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS message_text TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_channel_messages" ON public.channel_messages;
DROP POLICY IF EXISTS "Allow open insert on channel_messages" ON public.channel_messages;
DROP POLICY IF EXISTS "Allow open read on channel_messages" ON public.channel_messages;
DROP POLICY IF EXISTS "Allow open update on channel_messages" ON public.channel_messages;
DROP POLICY IF EXISTS "channel_messages_anon_all" ON public.channel_messages;

CREATE POLICY "open_channel_messages"
  ON public.channel_messages
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

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

NOTIFY pgrst, 'reload schema';
