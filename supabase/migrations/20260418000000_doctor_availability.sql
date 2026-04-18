-- ============================================================
-- Doctor Availability Tracking
-- ============================================================

-- Add new columns to doctor_settings table
ALTER TABLE public.doctor_settings
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS start_time text DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS end_time text DEFAULT '17:00';

-- Enable Realtime if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_settings;
