
-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('waiting', 'in-progress', 'done');

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  token_number INTEGER NOT NULL,
  status booking_status NOT NULL DEFAULT 'waiting',
  booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Everyone can read today's bookings (public queue display)
CREATE POLICY "Anyone can view today bookings"
  ON public.bookings FOR SELECT
  USING (booking_date = CURRENT_DATE);

-- Anyone can create a booking (no auth required for patients)
CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

-- Anyone can update bookings (front desk marks done)
CREATE POLICY "Anyone can update bookings"
  ON public.bookings FOR UPDATE
  USING (booking_date = CURRENT_DATE);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Function to get next token number for today
CREATE OR REPLACE FUNCTION public.get_next_token()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(token_number), 0) + 1
  FROM public.bookings
  WHERE booking_date = CURRENT_DATE;
$$;
