CREATE OR REPLACE FUNCTION public.notify_whatsapp_on_ready()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $func$
BEGIN
  IF NEW.status = 'ready' AND OLD.status IS DISTINCT FROM 'ready' THEN
    PERFORM net.http_post(
      url := 'https://tvapicdrldeegamttdaf.supabase.co/functions/v1/send-whatsapp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YXBpY2RybGRlZWdhbXR0ZGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTA2OTMsImV4cCI6MjA5MTI4NjY5M30.rGvgZsACPne537uwOtb7l2JKETWfPmdwT-5w6BKvG9U'
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'bookings',
        'schema', 'public',
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trigger_whatsapp_on_ready ON public.bookings;
CREATE TRIGGER trigger_whatsapp_on_ready
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_whatsapp_on_ready();
