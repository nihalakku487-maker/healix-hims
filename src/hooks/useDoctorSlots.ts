import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const dbGet = (path: string) =>
  fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, Accept: 'application/json' },
  }).then(r => r.json());

export type DoctorScheduleRow = {
  id: string;
  doctor_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  max_per_slot: number;
  created_at: string;
};

/**
 * An individual bookable time slot (derived from a DoctorScheduleRow).
 * When a schedule block is 10:00–12:00 with 30-min slots, this gives
 * [10:00, 10:30, 11:00, 11:30] as separate EnrichedSlot objects.
 */
export type EnrichedSlot = {
  /** Unique key: `${scheduleId}_${slotStart}` */
  key: string;
  scheduleId: string;
  date: string;
  /** "HH:mm" 24-hour */
  slotStart: string;
  /** "HH:mm" 24-hour */
  slotEnd: string;
  /** Display label e.g. "10:30 AM" */
  label: string;
  maxPerSlot: number;
  bookedCount: number;
  isFull: boolean;
  /** true if slot start time is in the past (for today's date) */
  isPast: boolean;
};

function parseMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minsToHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Expand a DoctorScheduleRow into individual EnrichedSlots. */
function expandSlots(
  row: DoctorScheduleRow,
  bookedMap: Record<string, number>,
  todayMins: number | null,
): EnrichedSlot[] {
  const slots: EnrichedSlot[] = [];
  const start = parseMins(row.start_time);
  const end = parseMins(row.end_time);
  const dur = row.slot_minutes;

  let cur = start;
  while (cur + dur <= end) {
    const slotStart = minsToHHMM(cur);
    const slotEnd = minsToHHMM(cur + dur);
    const key = `${row.id}_${slotStart}`;
    const bookedCount = bookedMap[slotStart] ?? 0;
    const isPast = todayMins !== null && cur <= todayMins;

    slots.push({
      key,
      scheduleId: row.id,
      date: row.schedule_date,
      slotStart,
      slotEnd,
      label: formatLabel(slotStart),
      maxPerSlot: row.max_per_slot,
      bookedCount,
      isFull: bookedCount >= row.max_per_slot,
      isPast,
    });
    cur += dur;
  }
  return slots;
}

type Params = {
  doctorId: string | null | undefined;
  date: string; // yyyy-mm-dd IST
  /** If provided, slots whose slotStart <= currentMins are marked isPast */
  currentMinsIST?: number | null;
};

export function useDoctorSlots({ doctorId, date, currentMinsIST = null }: Params) {
  const [schedules, setSchedules] = useState<DoctorScheduleRow[]>([]);
  const [slots, setSlots] = useState<EnrichedSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!doctorId || !date) {
      setSlots([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1. Fetch schedule rows for this doctor + date
    const rows: DoctorScheduleRow[] = await dbGet(
      `doctor_schedules?doctor_id=eq.${doctorId}&schedule_date=eq.${date}&order=start_time.asc`
    ).catch(() => []);

    // 2. Fetch bookings for this doctor + date (only active, non-terminal ones)
    const bookings: { time_slot: string }[] = await dbGet(
      `bookings?doctor_id=eq.${doctorId}&booking_date=eq.${date}&status=neq.done&status=neq.no-show&status=neq.cancelled&select=time_slot`
    ).catch(() => []);

    // Build booked count map: { "HH:mm" -> count }
    const bookedMap: Record<string, number> = {};
    for (const b of bookings) {
      if (!b.time_slot) continue;
      // time_slot may be stored as "10:30 AM" — normalise to "HH:mm"
      bookedMap[b.time_slot] = (bookedMap[b.time_slot] ?? 0) + 1;
      // Also support HH:mm directly
      const hhmm = to24h(b.time_slot);
      if (hhmm) bookedMap[hhmm] = (bookedMap[hhmm] ?? 0) + 1;
    }

    // 3. Expand rows into individual slots
    const expanded = rows.flatMap(r => expandSlots(r, bookedMap, currentMinsIST));
    setSchedules(rows);
    setSlots(expanded);
    setLoading(false);
  }, [doctorId, date, currentMinsIST]);

  useEffect(() => {
    fetchData();

    if (!doctorId || !date) return;

    // Realtime: watch doctor_schedules changes for this doctor
    const ch1 = supabase
      .channel(`slots-schedule-${doctorId}-${date}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'doctor_schedules',
        filter: `doctor_id=eq.${doctorId}`,
      }, () => { fetchData(); })
      .subscribe();

    // Realtime: watch booking changes for this doctor + date
    const ch2 = supabase
      .channel(`slots-bookings-${doctorId}-${date}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `doctor_id=eq.${doctorId}`,
      }, () => { fetchData(); })
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [doctorId, date, fetchData]);

  return { schedules, slots, loading, refetch: fetchData };
}

/** Convert "10:30 AM" → "10:30", "14:00" → "14:00" */
function to24h(label: string): string | null {
  const m12 = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1]);
    const min = m12[2];
    const ampm = m12[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${min}`;
  }
  if (/^\d{2}:\d{2}$/.test(label)) return label;
  return null;
}
