-- Appointment lifecycle: MISSED / reschedule support
-- Safe to re-run.

COMMENT ON COLUMN public.appointments.status IS
  'Lifecycle: CONFIRMED | CHECKED_IN | COMPLETED | MISSED | CANCELLED (legacy: WAITING, SCHEDULED, etc.)';

COMMENT ON COLUMN public.appointments.queue_status IS
  'Queue mirror of status — set to MISSED when patient no-shows';

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS missed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_appointments_status_missed
  ON public.appointments (status)
  WHERE upper(status) = 'MISSED';
