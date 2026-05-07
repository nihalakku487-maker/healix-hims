import { motion } from 'framer-motion';
import type { EnrichedSlot } from '@/hooks/useDoctorSlots';
import { Users, Clock, Lock } from 'lucide-react';

type Props = {
  slots: EnrichedSlot[];
  loading: boolean;
  selectedSlotKey: string;
  onSelectSlot: (slot: EnrichedSlot) => void;
  /** Whether the doctor is currently marked available */
  doctorAvailable?: boolean;
};

export default function SlotGrid({
  slots,
  loading,
  selectedSlotKey,
  onSelectSlot,
  doctorAvailable = true,
}: Props) {
  if (!doctorAvailable) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
        <Lock size={32} className="mb-3 opacity-40" />
        <p className="font-semibold text-slate-500">Doctor is currently unavailable</p>
        <p className="text-sm mt-1">Bookings are paused while the doctor is marked absent.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
        <Clock size={32} className="mb-3 opacity-40" />
        <p className="font-semibold text-slate-500">No slots available</p>
        <p className="text-sm mt-1">Doctor hasn't added any slots for this date yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {slots.map((slot) => {
        const isSelected = slot.key === selectedSlotKey;
        const isDisabled = slot.isFull || slot.isPast;
        const pctFull = Math.min(1, slot.bookedCount / slot.maxPerSlot);

        return (
          <motion.button
            key={slot.key}
            type="button"
            disabled={isDisabled}
            whileTap={!isDisabled ? { scale: 0.94 } : {}}
            onClick={() => !isDisabled && onSelectSlot(slot)}
            className={`
              relative flex flex-col items-center justify-center py-3 px-1
              rounded-2xl border-2 text-sm font-semibold transition-all duration-150
              ${isDisabled
                ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                : isSelected
                  ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-200'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50'
              }
            `}
          >
            <span className="font-bold text-sm leading-tight">{slot.label}</span>

            {/* Booking count indicator */}
            <span className={`flex items-center gap-1 text-[10px] mt-1 font-semibold ${
              isSelected ? 'text-teal-100' : isDisabled ? 'text-slate-300' : 'text-slate-400'
            }`}>
              <Users size={9} />
              {slot.isFull
                ? 'Full'
                : `${slot.bookedCount}/${slot.maxPerSlot}`}
            </span>

            {/* Capacity fill bar */}
            {!isDisabled && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-xl bg-slate-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pctFull * 100}%` }}
                  className={`h-full rounded-b-xl ${
                    pctFull >= 0.8 ? 'bg-rose-400' : pctFull >= 0.5 ? 'bg-amber-400' : 'bg-teal-400'
                  }`}
                />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
