-- ============================================================
-- MediQ — Allow anon/authenticated to UPDATE bookings
-- The doctor dashboard uses the anon key (no Supabase Auth session)
-- to update booking status (ready, in-progress, done, no-show).
-- Without this policy, all UPDATE calls from the doctor dashboard
-- are blocked by RLS and fail silently.
-- ============================================================

-- Allow UPDATE on bookings for anon + authenticated
DROP POLICY IF EXISTS "public_update_bookings" ON public.bookings;

CREATE POLICY "public_update_bookings" ON public.bookings
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

SELECT 'Migration complete: anon UPDATE on bookings enabled.' AS result;
