-- ============================================================
-- WhatsApp Notification Log Table
-- Tracks sent notifications to prevent duplicate messages
-- ============================================================

-- Create notification_log table
CREATE TABLE IF NOT EXISTS public.notification_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  phone           text        NOT NULL,
  message_type    text        NOT NULL CHECK (message_type IN ('ready', 'reminder', 'no_show')),
  status          text        NOT NULL CHECK (status IN ('sent', 'failed')),
  twilio_sid      text,
  error_message   text,
  sent_at         timestamptz NOT NULL DEFAULT now()
);

-- Index for fast duplicate checks (booking_id + message_type = unique notification)
CREATE INDEX IF NOT EXISTS idx_notification_log_booking_type
  ON public.notification_log (booking_id, message_type);

-- Enable Row Level Security
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- Only service role (Edge Functions) can read/write — no public access
CREATE POLICY "service_role_only" ON public.notification_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE public.notification_log IS
  'Tracks all WhatsApp/SMS notifications sent to patients. Used for deduplication.';
