-- ============================================================
-- Enable Real-Time specifically for Bookings with FULL replicas
-- ============================================================

-- Ensure bookings table exists in the supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END
$$;

-- Set Replica Identity to FULL so UPDATE/DELETE events contain full payload data
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- Provide same courtesy to patients and departments if needed later
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'patient_files'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_files;
  END IF;
END
$$;

NOTIFY pgrst, 'reload schema';
