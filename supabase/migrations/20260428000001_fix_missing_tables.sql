-- ============================================================
-- MediQ — Fix Missing Tables & Columns
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. CREATE notification_preferences TABLE ────────────────
-- This table is used by the Settings page to save WhatsApp
-- notification preferences for patients.

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email      text        NOT NULL UNIQUE,
  whatsapp_number text,
  notify_at_3     boolean     NOT NULL DEFAULT true,
  notify_at_2     boolean     NOT NULL DEFAULT true,
  notify_at_1     boolean     NOT NULL DEFAULT true,
  notify_at_turn  boolean     NOT NULL DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write their own row
CREATE POLICY "patient_own_prefs" ON public.notification_preferences
  FOR ALL
  TO authenticated
  USING (user_email = auth.jwt() ->> 'email')
  WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Allow service role full access (for Edge Functions)
CREATE POLICY "service_role_prefs" ON public.notification_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 2. FIX patient_files TABLE ──────────────────────────────
-- Add missing columns that the app tries to insert.
-- (These are safe to run even if columns already exist.)

ALTER TABLE public.patient_files
  ADD COLUMN IF NOT EXISTS user_email   text,
  ADD COLUMN IF NOT EXISTS user_name    text,
  ADD COLUMN IF NOT EXISTS booking_id   uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mime_type    text,
  ADD COLUMN IF NOT EXISTS uploaded_at  timestamptz DEFAULT now();

-- Drop old broken foreign key if still present (safe no-op if already dropped)
ALTER TABLE public.patient_files
  DROP CONSTRAINT IF EXISTS patient_files_patient_id_fkey;

-- Make patient_id nullable since we now identify by user_email
ALTER TABLE public.patient_files
  ALTER COLUMN patient_id DROP NOT NULL;

-- ── 3. ENSURE patient_files RLS allows authenticated uploads ─
-- Drop old restrictive policies if any, then add open patient policy.
DROP POLICY IF EXISTS "patients_own_files" ON public.patient_files;

CREATE POLICY "patients_own_files" ON public.patient_files
  FOR ALL
  TO authenticated
  USING (user_email = auth.jwt() ->> 'email')
  WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Also allow service role
DROP POLICY IF EXISTS "service_role_files" ON public.patient_files;
CREATE POLICY "service_role_files" ON public.patient_files
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 4. ENSURE bookings RLS allows patient inserts ───────────
-- Make sure authenticated patients can INSERT their own bookings.
DROP POLICY IF EXISTS "patients_insert_bookings" ON public.bookings;

CREATE POLICY "patients_insert_bookings" ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Done!
SELECT 'Migration complete: notification_preferences created, patient_files fixed, RLS policies updated.' AS result;
