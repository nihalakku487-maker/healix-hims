import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/supabase';
import { toast } from 'sonner';
export type { Booking };

import { getTodayISTDateString } from '@/lib/ist';

type UseBookingsParams = {
  doctorId?: string | null;
  bookingDate?: string | null; // yyyy-mm-dd (IST)
};

export function useBookings(params: UseBookingsParams = {}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const bookingDate = useMemo(
    () => params.bookingDate ?? getTodayISTDateString(),
    [params.bookingDate]
  );
  const doctorId = params.doctorId ?? null;

  const fetchBookings = async () => {
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', bookingDate)
      .order('token_number', { ascending: true });

    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error(error.message || 'Failed to load bookings');
    } else if (data) {
      setBookings(data as Booking[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();

    const channelName = doctorId ? `bookings-${doctorId}-${bookingDate}` : `bookings-${bookingDate}`;
    
    // Safely construct the realtime options to avoid passing filter: undefined
    const realtimeOpts: Record<string, any> = {
      event: '*',
      schema: 'public',
      table: 'bookings'
    };
    if (doctorId) {
      realtimeOpts.filter = `doctor_id=eq.${doctorId}`;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', realtimeOpts as any, (payload) => {
        setBookings(prev => {
           if (payload.eventType === 'INSERT') {
              const newBooking = payload.new as Booking;
              // Prevent duplicates if already present locally
              if (prev.find(b => b.id === newBooking.id)) return prev;
              const nextState = [...prev, newBooking];
              return nextState.sort((a, b) => (a.token_number || 0) - (b.token_number || 0));
           }
           if (payload.eventType === 'UPDATE') {
              const newBooking = payload.new as Booking;
              return prev.map(b => b.id === newBooking.id ? { ...b, ...newBooking } : b);
           }
           if (payload.eventType === 'DELETE') {
              const oldBooking = payload.old as Booking;
              return prev.filter(b => b.id !== oldBooking?.id);
           }
           return prev;
        });
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          toast.error('Realtime connection failed. Please check your internet/Supabase settings.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId, bookingDate]);

  return { bookings, loading, refetch: fetchBookings };
}
