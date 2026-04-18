export { supabase } from '@/integrations/supabase/client';

export type Booking = {
  id: string;
  patient_name: string;
  phone: string;
  time_slot: string;
  token_number: number;
  status: 'waiting' | 'ready' | 'in-progress' | 'done' | 'no-show';
  booking_date: string;
  created_at: string;
  doctor_id?: string | null;
  department_id?: string | null;
  hospital_id?: string | null;
  arrived_at?: string | null;
  called_at?: string | null;
};
