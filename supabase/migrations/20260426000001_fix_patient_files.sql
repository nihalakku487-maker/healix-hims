-- ============================================================
-- MediQ — Fix Patient Files Foreign Key
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================

-- The old patient_id constraint references the legacy "patients" table.
-- Since we now use Supabase Auth and user_profiles, we need to drop
-- the old foreign key constraint to allow uploading files.

ALTER TABLE public.patient_files
  DROP CONSTRAINT IF EXISTS patient_files_patient_id_fkey;

-- We can optionally make patient_id nullable since we now use user_email
ALTER TABLE public.patient_files
  ALTER COLUMN patient_id DROP NOT NULL;
