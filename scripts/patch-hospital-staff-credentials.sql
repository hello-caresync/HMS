-- Run once in Supabase SQL Editor if staff provisioning fails with missing-column errors.
-- Safe: ADD COLUMN IF NOT EXISTS only — does not delete data.

ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS staff_id_code TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS passcode_key TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Optional: give existing roster rows a staff code if blank (does not set passcodes)
UPDATE public.hospital_staff
SET staff_id_code = 'RH-LEG-' || upper(substring(replace(id::text, '-', ''), 1, 6))
WHERE coalesce(staff_id_code, '') = '';

NOTIFY pgrst, 'reload schema';
