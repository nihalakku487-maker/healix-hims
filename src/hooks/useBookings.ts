import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/supabase';
import { toast } from 'sonner';
export type { Booking };

import { getTodayISTDateString } from '@/lib/ist';

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

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
    // Use direct fetch to bypass auth lock contention with realtime subscriptions
    let path = `bookings?booking_date=eq.${bookingDate}&order=token_number.asc`;
    if (doctorId) path += `&doctor_id=eq.${doctorId}`;

    try {
      const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
        headers: {
          apikey: SB_ANON,
          Authorization: `Bearer ${SB_ANON}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setBookings(data as Booking[]);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load bookings');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();

    const channelName = doctorId ? `bookings-${doctorId}-${bookingDate}` : `bookings-${bookingDate}`;
    
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
          console.warn('[MediQ] Realtime channel error:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId, bookingDate]);

  return { bookings, loading, refetch: fetchBookings };
}
