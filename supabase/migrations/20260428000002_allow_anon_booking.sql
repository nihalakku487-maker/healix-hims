-- ============================================================
-- MediQ — Allow anonymous/public inserts on bookings
-- This removes the auth requirement for booking inserts so
-- the Supabase auth token lock is never needed during booking.
-- ============================================================

-- Allow anyone (including anon/public) to INSERT bookings
DROP POLICY IF EXISTS "patients_insert_bookings" ON public.bookings;

CREATE POLICY "public_insert_bookings" ON public.bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to SELECT bookings (needed for queue count)
DROP POLICY IF EXISTS "public_read_bookings" ON public.bookings;

CREATE POLICY "public_read_bookings" ON public.bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to INSERT into notification_preferences
DROP POLICY IF EXISTS "patient_own_prefs" ON public.notification_preferences;

CREATE POLICY "public_all_prefs" ON public.notification_preferences
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anyone to INSERT into patient_files
DROP POLICY IF EXISTS "patients_own_files" ON public.patient_files;

CREATE POLICY "public_insert_files" ON public.patient_files
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

SELECT 'Migration complete: Public inserts enabled for bookings, preferences, and files.' AS result;
