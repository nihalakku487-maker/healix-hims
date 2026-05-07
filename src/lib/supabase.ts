export { supabase } from '@/integrations/supabase/client';

export type Booking = {
  id: string;
  patient_name: string;
  phone: string;
  time_slot: string;
  token_number: number;
  status: 'waiting' | 'ready' | 'in-progress' | 'done' | 'no-show' | 'cancelled';
  booking_date: string;
  created_at: string;
  doctor_id?: string | null;
  department_id?: string | null;
  hospital_id?: string | null;
  arrived_at?: string | null;
  called_at?: string | null;
  /** Optional: the scheduled appointment date (may differ from booking_date for future bookings) */
  appointment_date?: string | null;
  /** Optional: the scheduled slot time label (e.g. "10:30 AM") */
  slot_time?: string | null;
  /** Email of the logged-in patient who made the booking */
  user_email?: string | null;
  /** Name of the logged-in patient */
  user_name?: string | null;
};
