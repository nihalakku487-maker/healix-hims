-- Add slot_minutes configuration for time slot lengths
ALTER TABLE public.doctor_settings
ADD COLUMN IF NOT EXISTS slot_minutes INTEGER NOT NULL DEFAULT 30;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
