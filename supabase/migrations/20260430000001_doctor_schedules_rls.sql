-- ============================================================
-- MediQ — Doctor Schedules: Create Table + RLS + Realtime
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create doctor_schedules table (safe if already exists)
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     text NOT NULL,
  schedule_date date NOT NULL,
  start_time    time NOT NULL,
  end_time      time NOT NULL,
  slot_minutes  integer NOT NULL DEFAULT 20,
  max_per_slot  integer NOT NULL DEFAULT 5,
  created_at    timestamptz DEFAULT now()
);

-- Index for fast lookups by doctor + date
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_date
  ON public.doctor_schedules (doctor_id, schedule_date);

-- 2. Enable RLS
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

-- 3. SELECT — anyone (patients) can read slots
DROP POLICY IF EXISTS "Public can view doctor_schedules"    ON public.doctor_schedules;

CREATE POLICY "Public can view doctor_schedules"
  ON public.doctor_schedules
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. INSERT — anon + authenticated (doctors use anon key)
DROP POLICY IF EXISTS "Anon can insert doctor_schedules"   ON public.doctor_schedules;

CREATE POLICY "Anon can insert doctor_schedules"
  ON public.doctor_schedules
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5. UPDATE
DROP POLICY IF EXISTS "Anon can update doctor_schedules"   ON public.doctor_schedules;

CREATE POLICY "Anon can update doctor_schedules"
  ON public.doctor_schedules
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 6. DELETE
DROP POLICY IF EXISTS "Anon can delete doctor_schedules"   ON public.doctor_schedules;

CREATE POLICY "Anon can delete doctor_schedules"
  ON public.doctor_schedules
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 7. Service role full access
DROP POLICY IF EXISTS "Service role schedules"             ON public.doctor_schedules;

CREATE POLICY "Service role schedules"
  ON public.doctor_schedules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8. Add to Realtime publication (slot changes sync instantly)
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_schedules;

SELECT 'doctor_schedules table, RLS policies, and realtime setup complete.' AS result;
