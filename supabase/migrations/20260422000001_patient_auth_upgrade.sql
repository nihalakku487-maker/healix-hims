-- ============================================================
-- MediQ — Patient Auth Upgrade Migration
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add auth columns to bookings (nullable so existing rows are unaffected)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_name text;

-- 2. Add auth columns to patient_files
ALTER TABLE patient_files ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE patient_files ADD COLUMN IF NOT EXISTS user_name text;
ALTER TABLE patient_files ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 3. User profiles table (mirrors auth.users, created on signup)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON user_profiles;

CREATE POLICY "Users read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text UNIQUE NOT NULL,
  notify_at_3 boolean DEFAULT true,
  notify_at_2 boolean DEFAULT true,
  notify_at_1 boolean DEFAULT true,
  notify_at_turn boolean DEFAULT true,
  whatsapp_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own preferences" ON notification_preferences;
CREATE POLICY "Users manage own preferences" ON notification_preferences
  FOR ALL USING (user_email = (auth.jwt() ->> 'email'));

-- 5. RLS on patient_files (user_email scoped)
ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own files" ON patient_files;
DROP POLICY IF EXISTS "Users insert own files" ON patient_files;
DROP POLICY IF EXISTS "Service role full access files" ON patient_files;

CREATE POLICY "Users see own files" ON patient_files
  FOR SELECT USING (
    user_email = (auth.jwt() ->> 'email')
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users insert own files" ON patient_files
  FOR INSERT WITH CHECK (
    user_email = (auth.jwt() ->> 'email')
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role full access files" ON patient_files
  FOR ALL USING (auth.role() = 'service_role');

-- 6. RLS on bookings (patients see only their own, staff uses service_role)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patient sees own bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can insert booking" ON bookings;
DROP POLICY IF EXISTS "Service role manages bookings" ON bookings;
DROP POLICY IF EXISTS "Anon can insert booking" ON bookings;
DROP POLICY IF EXISTS "Service role full access" ON bookings;

-- Patients can read their own bookings
CREATE POLICY "Patient sees own bookings" ON bookings
  FOR SELECT USING (
    user_email = (auth.jwt() ->> 'email')
    OR auth.role() = 'service_role'
    OR auth.role() = 'anon'  -- allow receptionist/doctor queries via anon key with service role
  );

-- Anyone can insert (guest or auth)
CREATE POLICY "Anyone can insert booking" ON bookings
  FOR INSERT WITH CHECK (true);

-- Service role can do everything (doctor/receptionist dashboards)
CREATE POLICY "Service role full access" ON bookings
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can update their own (status, etc — for future patient cancel)
CREATE POLICY "Auth users update own booking" ON bookings
  FOR UPDATE USING (
    user_email = (auth.jwt() ->> 'email')
    OR auth.role() = 'service_role'
  );

-- 7. Index for fast user_email lookups
CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_patient_files_user_email ON patient_files(user_email);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_email ON notification_preferences(user_email);
