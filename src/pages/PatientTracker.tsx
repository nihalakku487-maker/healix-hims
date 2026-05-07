import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getTodayISTDateString } from '@/lib/ist';
import { MOCK_DOCTORS } from '@/lib/mockData';
import PatientNav from '@/components/PatientNav';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Activity, Clock, Users, Hash, CheckCircle2, AlertCircle,
  Stethoscope, Search, Bell, RefreshCw, Wifi, WifiOff
} from 'lucide-react';

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

const STATUS_CONFIG = {
  waiting:     { label: 'Waiting',     color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  icon: Clock },
  ready:       { label: 'Ready',       color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  icon: Bell },
  'in-progress': { label: 'Your Turn!', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle2 },
  done:        { label: 'Done',        color: '#6B7280', bg: 'rgba(107,114,128,0.1)', icon: CheckCircle2 },
  'no-show':   { label: 'No-Show',     color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   icon: AlertCircle },
};

export default function PatientTracker() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [patientsAhead, setPatientsAhead] = useState<number | null>(null);
  const [currentToken, setCurrentToken] = useState<number | null>(null);
  const [waitMultiplier, setWaitMultiplier] = useState(7);
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  const doctor = booking ? MOCK_DOCTORS.find(d => d.id === booking.doctor_id) : null;

  // Auto-load booking for logged-in user
  // Also set a 2s timeout so the page doesn't get stuck if auth never resolves
  useEffect(() => {
    const timer = setTimeout(() => setAuthTimedOut(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authLoading && !authTimedOut) return;
    if (user?.email) {
      loadBookingByEmail(user.email);
    }
  }, [user, authLoading, authTimedOut]);

  // Realtime subscription
  useEffect(() => {
    if (!booking) return;
    const sub = supabase.channel(`tracker-${booking.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        setPulse(true);
        setTimeout(() => setPulse(false), 1000);
        if (payload.eventType === 'UPDATE' && (payload.new as any)?.id === booking.id) {
          setBooking(payload.new as Booking);
        }
        fetchQueueStatus(booking);
      })
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(sub); };
  }, [booking?.id]);

  const loadBookingByEmail = async (email: string) => {
    const today = getTodayISTDateString();
    const rows = await dbGet(
      `bookings?user_email=eq.${encodeURIComponent(email)}&booking_date=eq.${today}&status=in.(waiting,ready,in-progress)&order=created_at.desc&limit=1`
    );
    const data = Array.isArray(rows) ? rows[0] ?? null : null;
    if (data) {
      setBooking(data);
      fetchQueueStatus(data);
    }
  };

  const handlePhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSearching(true);
    const today = getTodayISTDateString();
    const rows = await dbGet(
      `bookings?phone=eq.${encodeURIComponent(phone.trim())}&booking_date=eq.${today}&status=in.(waiting,ready,in-progress)&order=created_at.desc&limit=1`
    );
    const data = Array.isArray(rows) ? rows[0] ?? null : null;
    if (!data) {
      toast.error('No active booking found today for this number.');
    } else {
      setBooking(data);
      fetchQueueStatus(data);
    }
    setSearching(false);
  };

  const fetchQueueStatus = async (b: Booking) => {
    const today = getTodayISTDateString();
    const [aheadRows, servingRows, settingRows] = await Promise.all([
      dbGet(`bookings?doctor_id=eq.${b.doctor_id}&booking_date=eq.${today}&status=in.(waiting,ready,in-progress)&token_number=lt.${b.token_number}&select=id`),
      dbGet(`bookings?doctor_id=eq.${b.doctor_id}&booking_date=eq.${today}&status=eq.in-progress&order=token_number.asc&limit=1&select=token_number`),
      dbGet(`doctor_settings?doctor_id=eq.${b.doctor_id}&select=avg_wait_minutes&limit=1`),
    ]);
    setPatientsAhead(Array.isArray(aheadRows) ? aheadRows.length : 0);
    setCurrentToken(Array.isArray(servingRows) && servingRows[0] ? servingRows[0].token_number : null);
    if (Array.isArray(settingRows) && settingRows[0]?.avg_wait_minutes) setWaitMultiplier(settingRows[0].avg_wait_minutes);
  };

  const statusConfig = booking
    ? (STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.waiting)
    : null;

  const waitMinutes = (patientsAhead ?? 0) * waitMultiplier;
  const isMyTurn = booking?.status === 'in-progress' || booking?.status === 'ready';

  return (
    <div className="min-h-screen" style={{ background: '#F0F4F8', fontFamily: "'Inter', sans-serif" }}>
      <PatientNav />

      {/* Hero tracker area */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0D2B20 0%, #1B4332 60%, #0D3B2C 100%)', minHeight: 420 }}
      >
        {/* Ambient glow */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #2DD4BF, transparent)' }} />
        <div className="absolute bottom-[-20%] left-[-5%] w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #34D399, transparent)' }} />

        <div className="relative mx-auto max-w-3xl px-4 pt-10 pb-20 text-center">
          {/* Realtime indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            {realtimeConnected
              ? <><Wifi size={12} className="text-emerald-400" /><span className="text-xs font-semibold text-emerald-300">Live Updates Active</span></>
              : <><WifiOff size={12} className="text-gray-400" /><span className="text-xs font-semibold text-gray-400">Connecting...</span></>
            }
          </div>

          {authLoading ? (
            <div className="text-white/50 text-sm">Loading your booking...</div>
          ) : booking ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={booking.id + booking.status}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                {/* Patient name */}
                <p className="text-emerald-300/70 text-sm font-semibold uppercase tracking-widest mb-2">
                  {booking.patient_name}
                </p>

                {/* Status badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                  style={{ background: statusConfig?.bg, border: `1px solid ${statusConfig?.color}40` }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusConfig?.color }} />
                  <span className="text-sm font-bold" style={{ color: statusConfig?.color }}>
                    {statusConfig?.label}
                  </span>
                </div>

                {/* Giant token */}
                <motion.div
                  animate={pulse ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="mb-4"
                >
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-0">Your Token</p>
                  <p
                    className="font-black text-white leading-none"
                    style={{ fontSize: 'clamp(96px, 18vw, 160px)', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      textShadow: '0 0 60px rgba(45,212,191,0.3)' }}
                  >
                    #{booking.token_number}
                  </p>
                </motion.div>

                {/* Stats row */}
                {!isMyTurn && (
                  <div className="flex items-center justify-center gap-6 flex-wrap">
                    <div className="text-center">
                      <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-1">Patients Ahead</p>
                      <p className="text-4xl font-black text-white">{patientsAhead ?? '—'}</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                      <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-1">Est. Wait</p>
                      <p className="text-4xl font-black" style={{ color: '#2DD4BF' }}>
                        {patientsAhead === 0 ? 'Now' : `~${waitMinutes}m`}
                      </p>
                    </div>
                    {currentToken && (
                      <>
                        <div className="w-px h-10 bg-white/10" />
                        <div className="text-center">
                          <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-1">Now Serving</p>
                          <p className="text-4xl font-black text-amber-400">#{currentToken}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {isMyTurn && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <p className="text-2xl font-bold text-emerald-400 animate-pulse">🎉 It's your turn!</p>
                    <p className="text-white/60 text-sm mt-2">Please proceed to the doctor's room now.</p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : !user ? (
            // Phone search fallback
            <div>
              <p className="text-white/70 text-lg mb-2 font-semibold">Track Your Queue</p>
              <p className="text-white/40 text-sm mb-8">
                <button onClick={() => navigate('/patient-login')} className="text-emerald-400 underline font-medium">Sign in</button>
                {' '}to auto-track, or enter your phone number below.
              </p>
              <form onSubmit={handlePhoneSearch} className="flex gap-2 max-w-sm mx-auto">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Phone number..."
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 h-12 rounded-xl text-sm text-white placeholder-white/30 border border-white/20 bg-white/10 focus:outline-none focus:border-emerald-400 backdrop-blur"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="h-12 px-5 rounded-xl text-sm font-semibold text-gray-900 flex-shrink-0 transition hover:opacity-90"
                  style={{ background: '#2DD4BF' }}
                >
                  {searching ? '...' : 'Track'}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <p className="text-white/60 text-base mb-4">No active booking found for today.</p>
              <button
                onClick={() => navigate('/#specialists')}
                className="px-6 py-3 rounded-full text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition"
              >
                Book an Appointment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress steps — only if booking is active */}
      {booking && (
        <div className="mx-auto max-w-3xl px-4 -mt-6 relative z-10 pb-12">
          {/* Queue progress bar */}
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Queue Progress</h3>
              <button
                onClick={() => fetchQueueStatus(booking)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 transition-colors"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {/* Steps */}
            <div className="relative">
              <div className="flex items-center">
                {[
                  { label: 'Booked', done: true },
                  { label: 'Waiting', done: patientsAhead !== null },
                  { label: 'Ready', done: booking.status === 'ready' || booking.status === 'in-progress' || booking.status === 'done' },
                  { label: 'Your Turn', done: booking.status === 'in-progress' || booking.status === 'done' },
                  { label: 'Done', done: booking.status === 'done' },
                ].map((step, i, arr) => (
                  <div key={step.label} className={`flex items-center ${i < arr.length - 1 ? 'flex-1' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                      step.done ? 'text-white' : 'bg-gray-100 text-gray-400'
                    }`} style={{ background: step.done ? '#1B4332' : undefined }}>
                      {step.done ? '✓' : i + 1}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex-1 h-1 mx-1 rounded-full transition-all"
                        style={{ background: step.done ? '#1B4332' : '#E5E7EB' }} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {['Booked', 'Waiting', 'Ready', 'Your Turn', 'Done'].map(l => (
                  <span key={l} className="text-xs text-gray-400 font-medium" style={{ minWidth: 40, textAlign: 'center' }}>{l}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Doctor card + booking details */}
          <div className="grid sm:grid-cols-2 gap-4">
            {doctor && (
              <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
                <img src={doctor.image} alt={doctor.name}
                  className="w-16 h-16 rounded-2xl object-cover bg-gray-100 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">{doctor.name}</p>
                  <p className="text-sm text-gray-500">{doctor.specialty}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-600">Active Queue</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Booking Details</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Time Slot</span>
                  <span className="font-semibold text-gray-900">{booking.time_slot}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Token</span>
                  <span className="font-semibold text-gray-900">#{booking.token_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="font-semibold capitalize" style={{ color: statusConfig?.color }}>
                    {statusConfig?.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notification shortcut */}
          {user && (
            <button
              onClick={() => navigate('/settings')}
              className="w-full mt-4 p-4 rounded-2xl flex items-center justify-between group transition-all hover:shadow-md"
              style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', border: '1px solid #D1FAE5' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#D1FAE5' }}>
                  <Bell size={18} className="text-emerald-700" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-900">WhatsApp Notifications</p>
                  <p className="text-xs text-emerald-700/60">Get notified when your turn approaches</p>
                </div>
              </div>
              <div className="text-emerald-600 group-hover:translate-x-1 transition-transform">→</div>
            </button>
          )}
        </div>
      )}

      {/* Empty state for guests */}
      {!booking && !authLoading && (
        <div className="mx-auto max-w-3xl px-4 -mt-6 relative z-10 pb-12">
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Activity size={28} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Booking</h3>
            <p className="text-sm text-gray-500 mb-6">
              {user
                ? "You don't have an active booking today. Book an appointment to see your live queue status here."
                : 'Sign in or search by phone number to track your queue position.'}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => navigate('/#specialists')}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: '#1B4332' }}
              >
                Book Appointment
              </button>
              {!user && (
                <button
                  onClick={() => navigate('/patient-login')}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
