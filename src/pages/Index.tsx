import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { MOCK_HOSPITALS, MOCK_DEPARTMENTS, MOCK_DOCTORS } from '@/lib/mockData';
import { supabase } from "@/lib/supabase";
import { getTodayISTDateString } from "@/lib/ist";
import { isDoctorAvailableNow } from "@/lib/availability";
import { Star, RefreshCw, ArrowRight, Activity, Stethoscope, Shield, Zap } from 'lucide-react';
import MediQLogo, { MediQMark } from '@/components/MediQLogo';

const HOSPITAL_ID = "sastha";

const Index = () => {
  const navigate = useNavigate();
  const hospital = MOCK_HOSPITALS.find((h) => h.id === HOSPITAL_ID);
  const doctors = MOCK_DOCTORS.filter((d) => d.hospitalId === HOSPITAL_ID);

  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [doctorAvailability, setDoctorAvailability] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchQueues = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('doctor_id, status, booking_date');
      if (error || !data) return;
      const counts: Record<string, number> = {};
      const today = getTodayISTDateString();
      data.forEach(booking => {
        if (booking.booking_date === today && (booking.status === 'waiting' || booking.status === 'in-progress')) {
          if (booking.doctor_id) {
            counts[booking.doctor_id] = (counts[booking.doctor_id] || 0) + 1;
          }
        }
      });
      setQueueCounts(counts);
    };

    const fetchAvailability = async () => {
      const { data, error } = await supabase.from('doctor_settings').select('doctor_id, is_available, start_time, end_time');
      if (error || !data) return;
      const avails: Record<string, any> = {};
      data.forEach(d => { avails[d.doctor_id] = d; });
      setDoctorAvailability(avails);
    };

    fetchQueues();
    fetchAvailability();

    const subs = supabase.channel('home-queue-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchQueues)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctor_settings' }, fetchAvailability)
      .subscribe();

    return () => { supabase.removeChannel(subs); };
  }, []);

  // Pick featured doctor for hero stats
  const featuredDoc = doctors[0];
  const featuredQueue = featuredDoc ? (queueCounts[featuredDoc.id] ?? 0) : 0;
  const featuredWait = featuredQueue * 5;

  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif] text-gray-900">

      {/* ──── NAVIGATION ──── */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <MediQMark size={36} />
            <MediQLogo size={42} />
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {['Clinics', 'Specialists', 'Sanctuary', 'Patient Portal'].map(label => (
              <button
                key={label}
                onClick={() => {
                  if (label === 'Specialists') document.getElementById('specialists')?.scrollIntoView({ behavior: 'smooth' });
                  else if (label === 'Patient Portal') navigate('/status');
                  else if (label === 'Clinics') document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm font-medium hover:opacity-60 transition-opacity"
                style={{ color: '#374151' }}
              >
                {label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => document.getElementById('specialists')?.scrollIntoView({ behavior: 'smooth' })}
            className="mediq-nav-btn text-sm hidden md:block"
          >
            Book Appointment
          </button>
        </div>
      </header>

      {/* ──── HERO SECTION ──── */}
      <section className="mediq-hero-bg relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Headline */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <p className="mediq-label text-emerald-400 mb-5 tracking-widest">SASTHA WELLNESS CENTER</p>
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.08] text-white mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Healthcare,{' '}
                <span className="text-emerald-400">simplified</span>{' '}
                for you.
              </h1>
              <p className="text-base lg:text-lg text-emerald-100/70 leading-relaxed mb-10 max-w-md">
                Experience clinical excellence within a sanctuary of calm. Managing your health journey should be as seamless as a breath of fresh air.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => document.getElementById('specialists')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105 active:scale-100"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.3)', color: 'white', backdropFilter: 'blur(8px)' }}
                >
                  Book Appointment
                </button>
                <Link
                  to="/status"
                  className="px-6 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105 active:scale-100 flex items-center gap-2"
                  style={{ background: '#2DD4BF', color: '#0D2B20' }}
                >
                  Track Live Queue <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* Right: Floating Live Status Card */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="relative hidden lg:flex justify-end"
            >
              {/* Doctor photo */}
              <div className="relative w-80">
                <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ height: '400px' }}>
                  {featuredDoc ? (
                    <img src={featuredDoc.image} alt={featuredDoc.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: '#1B4332' }}>
                      <Stethoscope size={64} className="text-emerald-400 opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Live status card overlaid */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -left-16 top-1/3 mediq-status-card rounded-2xl p-4 shadow-2xl min-w-[220px]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-gray-700 tracking-wide uppercase">Live Status</span>
                    </div>
                    <RefreshCw size={13} className="text-gray-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Current Wait Time</p>
                      <p className="text-2xl font-black text-gray-900">{featuredWait}<span className="text-sm font-medium text-gray-500 ml-1">mins</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Queue Position</p>
                      <p className="text-2xl font-black text-gray-900">#{featuredQueue > 0 ? featuredQueue + 1 : 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#F0FDF4' }}>
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Stethoscope size={12} className="text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">General OPD</p>
                      <p className="text-xs text-emerald-600">● Currently Seeing</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/status')}
                    className="w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                    style={{ background: '#1B4332', color: 'white' }}
                  >
                    View Full Schedule
                  </button>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* ─── Large MEDIQ watermark background text (like MEDVi) ─── */}
        <div
          className="absolute inset-0 flex items-end pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <span
            style={{
              fontSize: 'clamp(120px, 22vw, 320px)',
              fontWeight: 900,
              fontFamily: "'Plus Jakarta Sans', 'Montserrat', 'Arial Black', sans-serif",
              color: 'rgba(255,255,255,0.045)',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              userSelect: 'none',
              whiteSpace: 'nowrap',
              paddingLeft: '2rem',
              paddingBottom: '0.5rem',
            }}
          >
            MEDIQ
          </span>
        </div>
      </section>

      {/* ──── SPECIALISTS SECTION ──── */}
      <section id="specialists" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="mediq-label mb-3" style={{ color: '#1B4332' }}>EXPERTISE</p>
              <h2 className="text-4xl font-extrabold text-gray-900 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                World-class care from<br />leading specialists.
              </h2>
            </div>
            <button
              className="hidden md:flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: '#1B4332' }}
              onClick={() => document.getElementById('specialists')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View all specialists <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Featured doctor – large card (left) */}
            {doctors[0] && (() => {
              const doc = doctors[0];
              const av = doctorAvailability[doc.id];
              const isAvail = av ? isDoctorAvailableNow(av.is_available ?? true, av.start_time || '09:00', av.end_time || '18:00') : isDoctorAvailableNow(true, '09:00', '18:00');
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-3xl overflow-hidden relative flex flex-col"
                  style={{ background: '#F0FDF4', border: '1px solid #D1FAE5' }}
                >
                  <div className="p-6 flex-1">
                    <span className="mediq-label" style={{ color: '#065F46' }}>{doc.specialty.toUpperCase()}</span>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{doc.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">{doc.about}</p>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="flex items-center gap-1 text-sm font-medium text-gray-600">
                        <Star size={14} className="text-amber-400 fill-amber-400" /> {doc.rating}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-500">{doc.patients}+ Patients</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl mb-5" style={{ background: '#ECFDF5' }}>
                      <div className="text-center px-3 py-1 rounded-lg" style={{ background: 'white' }}>
                        <p className="text-xs text-gray-500">Queue</p>
                        <p className="text-xl font-black text-gray-900">{queueCounts[doc.id] ?? 0}</p>
                      </div>
                      <p className="text-xs text-emerald-700 font-medium flex-1">patients currently waiting in queue</p>
                    </div>
                    <div className="flex gap-2">
                      {isAvail ? (
                        <button
                          onClick={() => navigate(`/book/${doc.id}`)}
                          className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white transition hover:opacity-90"
                          style={{ background: '#1B4332' }}
                        >
                          Consult
                        </button>
                      ) : (
                        <button disabled className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-gray-400" style={{ background: '#F3F4F6' }}>
                          Offline
                        </button>
                      )}
                      <button className="px-4 py-2.5 rounded-2xl text-sm font-semibold border text-gray-600 hover:bg-gray-50 transition">
                        View Bio
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Right column: remaining doctors + walk-in card */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {doctors.slice(1).map((doc, i) => {
                  const av = doctorAvailability[doc.id];
                  const isAvail = av ? isDoctorAvailableNow(av.is_available ?? true, av.start_time || '09:00', av.end_time || '18:00') : isDoctorAvailableNow(true, '09:00', '18:00');
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-3xl p-5 cursor-pointer group transition-all hover:shadow-lg"
                      style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
                      onClick={() => isAvail && navigate(`/book/${doc.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img src={doc.image} alt={doc.name} className="w-12 h-12 rounded-2xl object-cover bg-gray-200 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate group-hover:text-emerald-700 transition-colors">{doc.name}</p>
                          <p className="text-xs text-gray-500 truncate">{doc.specialty}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <Star size={11} className="text-amber-400 fill-amber-400" /> {doc.rating}
                        </span>
                        <span className="text-gray-300 text-xs">·</span>
                        <span className="text-xs text-gray-500">{doc.patients}+ Reviews</span>
                      </div>
                      {isAvail ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#D1FAE5', color: '#065F46' }}>● Available</span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Offline</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Instant Walk-ins card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mediq-cta-card rounded-3xl p-6 flex items-center justify-between"
              >
                <div>
                  <p className="mediq-label text-emerald-400 mb-2">WALK-IN SERVICES</p>
                  <h3 className="text-xl font-bold text-white mb-1">Instant Walk-ins</h3>
                  <p className="text-sm text-emerald-200/70 max-w-xs">
                    Check availability in real-time across all our local sanctuary clinics.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/status')}
                  className="flex-shrink-0 px-5 py-3 rounded-2xl font-semibold text-sm transition hover:opacity-90"
                  style={{ background: '#2DD4BF', color: '#0D2B20' }}
                >
                  Find Near Me
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── PHILOSOPHY SECTION ──── */}
      <section className="py-20" style={{ background: '#F9FAFB' }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="mediq-label mb-3" style={{ color: '#1B4332' }}>OUR PHILOSOPHY</p>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-8 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                A holistic approach to<br />clinical care.
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: <Shield size={18} className="text-emerald-600" />,
                    title: 'The Calm Initiative',
                    desc: 'Waiting rooms designed with biophilic elements to reduce anxiety levels before your consultation.'
                  },
                  {
                    icon: <Zap size={18} className="text-emerald-600" />,
                    title: 'Precision Diagnosis',
                    desc: 'Leveraging the latest in AI-assisted imaging and non-invasive testing for faster, clearer results.'
                  },
                  {
                    icon: <Activity size={18} className="text-emerald-600" />,
                    title: 'Live Queue Tracking',
                    desc: 'Real-time updates on your position in queue so you can arrive exactly when needed.'
                  }
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ECFDF5' }}>
                      {icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ height: '480px' }}>
                <img
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop"
                  alt="Sastha Wellness Center"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="text-white font-medium italic text-base leading-relaxed">
                    "Healing begins the moment you step through our doors."
                  </p>
                  <p className="text-emerald-300 text-sm font-semibold mt-2">— Clinical Sanctuary Director</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ──── DEPARTMENTS ──── */}
      <section id="departments" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10">
            <p className="mediq-label mb-3" style={{ color: '#1B4332' }}>SERVICES</p>
            <h2 className="text-4xl font-extrabold text-gray-900 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Departments & Specialities
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {MOCK_DEPARTMENTS.map((dept, i) => (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-center cursor-default group transition-all hover:shadow-md"
                style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: '#ECFDF5' }}>
                  <Activity size={18} className="text-emerald-600" />
                </div>
                <span className="text-xs font-semibold text-gray-700 leading-tight">{dept.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── FOOTER ──── */}
      <footer style={{ background: '#0D2B20', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <MediQMark size={32} dark />
                <MediQLogo size={38} dark />
              </div>
              <p className="text-sm text-emerald-200/50 max-w-sm mt-2">
                Redefining the medical experience through empathy, design, and precision.
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              {['Privacy Policy', 'Terms of Service', 'Sustainability Report', 'Contact'].map(link => (
                <a key={link} href="#" className="text-xs font-medium transition-opacity hover:opacity-60" style={{ color: 'rgba(255,255,255,0.5)' }}>{link}</a>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © {new Date().getFullYear()} MEDIq · Clinical Sanctuary. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-medium text-emerald-400">Live queue active</p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Index;
