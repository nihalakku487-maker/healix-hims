import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getTodayISTDateString } from '@/lib/ist';
import { MOCK_DOCTORS } from '@/lib/mockData';
import PatientNav from '@/components/PatientNav';
import { CalendarDays, Clock, Hash, Activity, ChevronRight, AlertCircle, Lock } from 'lucide-react';

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const dbGet = (path: string) =>
  fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, Accept: 'application/json' },
  }).then(r => r.json());

type Booking = {
  id: string;
  patient_name: string;
  token_number: number;
  status: string;
  doctor_id: string;
  booking_date: string;
  time_slot: string;
  user_email?: string;
};

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  waiting:      { label: 'Waiting',     color: '#3B82F6', bg: '#EFF6FF' },
  ready:        { label: 'Ready',       color: '#F59E0B', bg: '#FFFBEB' },
  'in-progress':{ label: 'Your Turn',   color: '#10B981', bg: '#ECFDF5' },
  done:         { label: 'Completed',   color: '#6B7280', bg: '#F9FAFB' },
  'no-show':    { label: 'No-Show',     color: '#EF4444', bg: '#FEF2F2' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.waiting;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ color: s.color, background: s.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export default function MyAppointments() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!user?.email) return;
    const rows = await dbGet(
      `bookings?user_email=eq.${encodeURIComponent(user.email)}&order=created_at.desc`
    );
    if (Array.isArray(rows)) setBookings(rows as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetchBookings();

    // Realtime — live status updates
    const sub = supabase.channel('my-appointments-live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => {
        setBookings(prev =>
          prev.map(b => b.id === (payload.new as any).id ? { ...b, ...payload.new } : b)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user, authLoading]);

  const today = getTodayISTDateString();
  const todayBookings = bookings.filter(b => b.booking_date === today);
  const pastBookings = bookings.filter(b => b.booking_date < today);

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
        <PatientNav />
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Sign In Required</h1>
          <p className="text-gray-500 mb-8 max-w-sm">Please sign in to view your appointments and track your queue status.</p>
          <button
            onClick={() => navigate('/patient-login?redirect=/my-appointments')}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: '#1B4332' }}
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PatientNav />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0D2B20, #1B4332)' }} className="px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-2">Patient Portal</p>
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            My Appointments
          </h1>
          <p className="text-white/50 text-sm mt-1">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <CalendarDays size={28} className="text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-700 mb-2">No Appointments Yet</h3>
            <p className="text-sm text-gray-400 mb-6">Your confirmed appointments will appear here.</p>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#1B4332' }}
            >
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <>
            {/* Today's section */}
            {todayBookings.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Today</h2>
                </div>
                <div className="space-y-3">
                  {todayBookings.map((b, i) => {
                    const doc = MOCK_DOCTORS.find(d => d.id === b.doctor_id);
                    const isActive = ['waiting', 'ready', 'in-progress'].includes(b.status);
                    return (
                      <motion.div
                        key={b.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                          isActive ? 'border-emerald-200 hover:shadow-md' : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {doc && (
                              <img src={doc.image} alt={doc.name}
                                className="w-12 h-12 rounded-2xl object-cover bg-gray-100 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">{doc?.name ?? 'Doctor'}</p>
                              <p className="text-xs text-gray-500 truncate">{doc?.specialty}</p>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Hash size={11} /> Token #{b.token_number}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Clock size={11} /> {b.time_slot}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <StatusBadge status={b.status} />
                            {isActive && (
                              <button
                                onClick={() => navigate('/status')}
                                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                              >
                                Track Live <ChevronRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Past section */}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Past Appointments</h2>
                <div className="space-y-3">
                  {pastBookings.map((b, i) => {
                    const doc = MOCK_DOCTORS.find(d => d.id === b.doctor_id);
                    return (
                      <motion.div
                        key={b.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-transparent"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {doc && (
                              <img src={doc.image} alt={doc.name}
                                className="w-10 h-10 rounded-xl object-cover bg-gray-100 flex-shrink-0 opacity-70" />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-700 truncate text-sm">{doc?.name ?? 'Doctor'}</p>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-xs text-gray-400">{b.booking_date}</span>
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Hash size={10} /> {b.token_number}
                                </span>
                                <span className="text-xs text-gray-400">{b.time_slot}</span>
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={b.status} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
