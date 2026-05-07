-- ============================================================
-- MediQ — Add 'cancelled' support to bookings.status
-- The status column is a plain text column (not a PG enum),
-- so 'cancelled' already works as a value. This migration
-- simply updates any existing check constraint to allow it.
-- ============================================================

-- Drop the old check constraint if it exists (may block 'cancelled' inserts)
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Re-add with 'cancelled' included
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('waiting', 'ready', 'in-progress', 'done', 'no-show', 'cancelled'));

SELECT 'bookings.status check constraint updated: cancelled is now allowed.' AS result;
