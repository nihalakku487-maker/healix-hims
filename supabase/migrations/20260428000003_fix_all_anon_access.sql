-- ============================================================
-- MediQ — Fix All Anon Access Issues (Consolidated)
-- Fixes:
--   1. notification_preferences upsert (Settings duplicate key)
--   2. patient_files insert via anon key (My Records upload)
--   3. patient_records storage bucket anon insert
-- ============================================================

-- ── 1. notification_preferences: allow anon upsert ──────────

-- Drop any existing restrictive-only policies
DROP POLICY IF EXISTS "patient_own_prefs"       ON public.notification_preferences;
DROP POLICY IF EXISTS "service_role_prefs"      ON public.notification_preferences;
DROP POLICY IF EXISTS "public_all_prefs"        ON public.notification_preferences;

-- Re-create with anon + authenticated access
CREATE POLICY "public_all_prefs" ON public.notification_preferences
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_prefs" ON public.notification_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 2. patient_files: allow anon insert/select ───────────────

DROP POLICY IF EXISTS "patients_own_files"      ON public.patient_files;
DROP POLICY IF EXISTS "service_role_files"      ON public.patient_files;
DROP POLICY IF EXISTS "public_insert_files"     ON public.patient_files;

CREATE POLICY "public_all_files" ON public.patient_files
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_files" ON public.patient_files
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Make patient_id nullable (safe no-op if already nullable)
ALTER TABLE public.patient_files
  ALTER COLUMN patient_id DROP NOT NULL;

-- Drop old broken FK (safe no-op if already dropped)
ALTER TABLE public.patient_files
  DROP CONSTRAINT IF EXISTS patient_files_patient_id_fkey;

-- ── 3. patient_records storage bucket: allow anon uploads ────

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient_records', 'patient_records', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop any restrictive policies and recreate open ones
DROP POLICY IF EXISTS "Public Access"  ON storage.objects;
DROP POLICY IF EXISTS "Public Insert"  ON storage.objects;
DROP POLICY IF EXISTS "Anon Upload"    ON storage.objects;
DROP POLICY IF EXISTS "Anon Read"      ON storage.objects;

CREATE POLICY "Anon Read" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'patient_records');

CREATE POLICY "Anon Upload" ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'patient_records');

SELECT 'Migration complete: anon access fixed for preferences, files, and storage.' AS result;
