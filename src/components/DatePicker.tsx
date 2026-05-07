import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getNowIST, getISTDateString } from '@/lib/ist';

type Props = {
  selectedDate: string; // yyyy-mm-dd
  onDateSelect: (date: string) => void;
  /** Number of days to show including today (default: 7) */
  days?: number;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DatePicker({ selectedDate, onDateSelect, days = 7 }: Props) {
  const today = getISTDateString(getNowIST());

  const dateList = useMemo(() => {
    const now = getNowIST();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const iso = getISTDateString(d);
      return {
        iso,
        dayName: DAY_NAMES[d.getDay()],
        dayNum: d.getDate(),
        month: MONTH_NAMES[d.getMonth()],
        isToday: iso === today,
        isPast: false, // future list only
      };
    });
  }, [today, days]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {dateList.map((d) => {
        const isSelected = d.iso === selectedDate;
        return (
          <motion.button
            key={d.iso}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => onDateSelect(d.iso)}
            className={`
              flex flex-col items-center justify-center flex-shrink-0 w-14 h-[72px]
              rounded-2xl border-2 font-semibold transition-all duration-150 select-none
              ${isSelected
                ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-200'
                : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50'
              }
            `}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
              {d.isToday ? 'Today' : d.dayName}
            </span>
            <span className={`text-2xl font-black leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
              {d.dayNum}
            </span>
            <span className={`text-[10px] font-semibold ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
              {d.month}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
