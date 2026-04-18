-- MediQ hospital upgrade: multi-doctor queues, departments, patient files, IST-aware dates
-- This migration is additive and keeps existing flows working.

-- 1) Helpers: IST current date/time (Asia/Kolkata)
CREATE OR REPLACE FUNCTION public.ist_now()
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT (now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';
$$;

CREATE OR REPLACE FUNCTION public.ist_current_date()
RETURNS date
LANGUAGE sql
STABLE
AS $$
  SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date;
$$;

-- 2) Core directory tables
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  working_hours text,
  cover_image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, name)
);

CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  name text NOT NULL,
  specialty text,
  fee integer,
  photo_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Schedules can be either for a specific date OR a weekly weekday.
-- weekday: 0=Sunday..6=Saturday (JS convention)
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  schedule_date date,
  weekday smallint,
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_minutes integer NOT NULL DEFAULT 15,
  max_per_slot integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (schedule_date IS NOT NULL AND weekday IS NULL)
    OR (schedule_date IS NULL AND weekday IS NOT NULL)
  ),
  CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6)),
  CHECK (slot_minutes > 0),
  CHECK (max_per_slot > 0),
  CHECK (end_time > start_time)
);

-- 3) Patients + files
CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  name_last_seen text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patient_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  notes text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Extend bookings for hospital/department/doctor scoped queues + check-in timestamp
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS arrived_at timestamptz;

CREATE INDEX IF NOT EXISTS bookings_doctor_date_idx
  ON public.bookings (doctor_id, booking_date);

CREATE INDEX IF NOT EXISTS bookings_phone_idx
  ON public.bookings (phone);

-- 5) Token generation per doctor per booking_date (new RPC)
CREATE OR REPLACE FUNCTION public.get_next_token_for_doctor(p_doctor_id uuid, p_booking_date date)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(token_number), 0) + 1
  FROM public.bookings
  WHERE doctor_id = p_doctor_id
    AND booking_date = p_booking_date;
$$;

-- Keep the original RPC for backward compatibility (still “global per day”)
CREATE OR REPLACE FUNCTION public.get_next_token()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(token_number), 0) + 1
  FROM public.bookings
  WHERE booking_date = public.ist_current_date();
$$;

-- 6) RLS adjustments: allow public access for next 7 IST days (demo-friendly)
-- NOTE: For production hospitals, replace these with authenticated staff/patient policies.
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;

-- Directory tables: public read
DROP POLICY IF EXISTS "Anyone can view hospitals" ON public.hospitals;
CREATE POLICY "Anyone can view hospitals"
  ON public.hospitals FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
CREATE POLICY "Anyone can view departments"
  ON public.departments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can view doctors" ON public.doctors;
CREATE POLICY "Anyone can view doctors"
  ON public.doctors FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can view doctor schedules" ON public.doctor_schedules;
CREATE POLICY "Anyone can view doctor schedules"
  ON public.doctor_schedules FOR SELECT
  USING (true);

-- Bookings: broaden select/update to next 7 days in IST
DROP POLICY IF EXISTS "Anyone can view today bookings" ON public.bookings;
CREATE POLICY "Anyone can view next 7 days bookings"
  ON public.bookings FOR SELECT
  USING (booking_date >= public.ist_current_date() AND booking_date <= (public.ist_current_date() + 7));

DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;
CREATE POLICY "Anyone can update next 7 days bookings"
  ON public.bookings FOR UPDATE
  USING (booking_date >= public.ist_current_date() AND booking_date <= (public.ist_current_date() + 7));

-- Patients + files: public read/write (demo). Lock down with auth in production.
DROP POLICY IF EXISTS "Anyone can view patients" ON public.patients;
CREATE POLICY "Anyone can view patients"
  ON public.patients FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can upsert patients" ON public.patients;
CREATE POLICY "Anyone can upsert patients"
  ON public.patients FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update patients" ON public.patients;
CREATE POLICY "Anyone can update patients"
  ON public.patients FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can view patient files" ON public.patient_files;
CREATE POLICY "Anyone can view patient files"
  ON public.patient_files FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can create patient files" ON public.patient_files;
CREATE POLICY "Anyone can create patient files"
  ON public.patient_files FOR INSERT
  WITH CHECK (true);

-- 7) Realtime for new tables (optional; bookings is already in publication)
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_files;

