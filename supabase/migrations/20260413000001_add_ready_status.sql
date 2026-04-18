-- ============================================================
-- COMBINED QUEUE UPGRADE (works with TEXT status column)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add called_at column if not already added
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS called_at timestamptz;

-- 2. IST helpers (safe to re-run)
CREATE OR REPLACE FUNCTION public.ist_now()
RETURNS timestamptz
LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';
$$;

CREATE OR REPLACE FUNCTION public.ist_current_date()
RETURNS date
LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date;
$$;

-- 3. call_next_patient RPC
-- Doctor clicks "Call Next" → waiting → ready
-- Marks any current in-progress/ready as done, then promotes next waiting to ready
CREATE OR REPLACE FUNCTION public.call_next_patient(p_doctor_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_booking public.bookings%ROWTYPE;
  v_next_booking    public.bookings%ROWTYPE;
  v_result          json;
BEGIN
  -- A. Mark current active booking (in-progress OR ready) as done
  SELECT * INTO v_current_booking
  FROM public.bookings
  WHERE doctor_id    = p_doctor_id
    AND booking_date = public.ist_current_date()
    AND status       IN ('in-progress', 'ready')
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    UPDATE public.bookings
       SET status = 'done'
     WHERE id = v_current_booking.id;
  END IF;

  -- B. Find next waiting patient (lowest token)
  SELECT * INTO v_next_booking
  FROM public.bookings
  WHERE doctor_id    = p_doctor_id
    AND booking_date = public.ist_current_date()
    AND status       = 'waiting'
  ORDER BY token_number ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- C. Move next patient to ready and stamp called_at
  IF FOUND THEN
    UPDATE public.bookings
       SET status    = 'ready',
           called_at = public.ist_now()
     WHERE id = v_next_booking.id;

    v_result := json_build_object(
      'success',      true,
      'called_token', v_next_booking.token_number,
      'patient_name', v_next_booking.patient_name
    );
  ELSE
    v_result := json_build_object(
      'success', true,
      'called_token', null,
      'message', 'Queue is empty'
    );
  END IF;

  RETURN v_result;
END;
$$;

-- 4. process_auto_no_shows RPC
-- Scans for ready/in-progress patients older than 5 minutes and marks them no-show
CREATE OR REPLACE FUNCTION public.process_auto_no_shows()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired record;
  v_count   integer := 0;
BEGIN
  FOR v_expired IN
    SELECT *
    FROM public.bookings
    WHERE status       IN ('in-progress', 'ready')
      AND booking_date = public.ist_current_date()
      AND called_at    < (public.ist_now() - interval '5 minutes')
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.bookings
       SET status = 'no-show'
     WHERE id = v_expired.id;

    v_count := v_count + 1;

    -- Auto-advance the queue for that doctor
    PERFORM public.call_next_patient(v_expired.doctor_id);
  END LOOP;

  RETURN v_count;
END;
$$;
