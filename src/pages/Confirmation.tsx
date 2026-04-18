import { useParams, useNavigate } from 'react-router-dom';
import { useBookings } from '@/hooks/useBookings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Users, Clock, Hash, Timer } from 'lucide-react';
import { useMemo } from 'react';

const Confirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // We first fetch "today" bookings; once booking is found we will switch to doctor/date scoped queue.
  const { bookings: allTodayBookings, loading } = useBookings();

  const booking = useMemo(() => allTodayBookings.find(b => b.id === id), [allTodayBookings, id]);

  const { bookings: scopedBookings } = useBookings({
    doctorId: booking?.doctor_id ?? null,
    bookingDate: booking?.booking_date ?? null,
  });

  const patientsAhead = useMemo(() => {
    if (!booking) return 0;
    return scopedBookings.filter(
      b => b.token_number < booking.token_number && b.status === 'waiting'
    ).length;
  }, [scopedBookings, booking]);

  const estimatedWaitMinutes = patientsAhead * 10;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Booking not found</p>
      </div>
    );
  }

  const isDone = booking.status === 'done';
  const isInProgress = booking.status === 'in-progress';
  const isNoShow = booking.status === 'no-show';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary px-4 py-6">
        <div className="max-w-lg mx-auto text-center">
          <CheckCircle2 className="w-12 h-12 text-primary-foreground mx-auto mb-2" />
          <h1 className="text-xl font-bold text-primary-foreground">Booking Confirmed!</h1>
          <p className="text-primary-foreground/70 text-sm">{booking.patient_name}</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-accent rounded-xl">
                <Hash className="w-5 h-5 text-accent-foreground mx-auto mb-1" />
                <p className="text-2xl font-bold text-accent-foreground">{booking.token_number}</p>
                <p className="text-xs text-muted-foreground">Token</p>
              </div>
              <div className="text-center p-4 bg-accent rounded-xl">
                <Clock className="w-5 h-5 text-accent-foreground mx-auto mb-1" />
                <p className="text-2xl font-bold text-accent-foreground">{booking.time_slot}</p>
                <p className="text-xs text-muted-foreground">Slot</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6 text-center">
            {isDone ? (
              <div>
                <p className="text-lg font-semibold text-success">✓ Consultation Complete</p>
              </div>
            ) : isNoShow ? (
              <div>
                <p className="text-lg font-semibold text-destructive">Marked as No-Show</p>
                <p className="text-sm text-muted-foreground mt-1">Please visit the front desk if this is a mistake</p>
              </div>
            ) : isInProgress ? (
              <div>
                <p className="text-lg font-semibold text-primary animate-pulse">Your turn now!</p>
                <p className="text-sm text-muted-foreground mt-1">Please proceed to the doctor</p>
              </div>
            ) : (
              <div>
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold text-foreground">{patientsAhead}</p>
                <p className="text-sm text-muted-foreground">
                  {patientsAhead === 0 ? "You're next!" : `patient${patientsAhead > 1 ? 's' : ''} ahead of you`}
                </p>
                {patientsAhead > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-muted-foreground">
                    <Timer className="w-4 h-4" />
                    <p className="text-sm">
                      Estimated wait: <span className="font-semibold text-foreground">{estimatedWaitMinutes} minutes</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </main>
    </div>
  );
};

export default Confirmation;
