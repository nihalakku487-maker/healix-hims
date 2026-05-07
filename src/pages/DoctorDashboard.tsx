import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { MOCK_DOCTORS } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import { useBookings, type Booking } from "@/hooks/useBookings";
import { getTodayISTDateString } from "@/lib/ist";
import { isDoctorAvailableNow } from "@/lib/availability";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, FileText, ArrowRight, UserCircle, Video, Building2, Download, LogOut, CheckCircle, BellRing, UserX, ChevronDown, ChevronUp, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Direct REST helper — bypasses SDK auth lock (autoRefreshToken:false)
async function updateBooking(id: string, patch: Record<string, unknown>) {
  const res = await fetch(
    `${SB_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SB_ANON,
        Authorization: `Bearer ${SB_ANON}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body?.message || res.statusText);
  }
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  
  // Route Protection
  useEffect(() => {
    const auth = localStorage.getItem("mediq_auth");
    if (auth !== "doctor") {
      navigate("/login", { replace: true });
      toast.error("Unauthorized", { description: "Please log in as a Doctor." });
    }
    setIsChecking(false);
  }, [navigate]);

  // Load the logged-in doctor from localStorage
  const doctorId = localStorage.getItem("mediq_doctor_id") || "doc1";
  const doctor = MOCK_DOCTORS.find(d => d.id === doctorId);

  const bookingDate = getTodayISTDateString();
  const { bookings, loading } = useBookings({ bookingDate, doctorId });
  const [patientFiles, setPatientFiles] = useState<any[]>([]);
  const [elapsedMins, setElapsedMins] = useState(0);
  const [queueOpen, setQueueOpen] = useState(false); // mobile queue drawer
  
  // Realtime settings
  const [isAvailable, setIsAvailable] = useState(true);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [slotMinutes, setSlotMinutes] = useState(30);

  // Derived state
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const waitingBookings = safeBookings.filter(b => b?.status === "waiting").sort((a,b) => (a?.token_number || 0) - (b?.token_number || 0));
  const activeBooking = safeBookings.find(b => b?.status === "in-progress" || b?.status === "ready");
  
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('doctor_settings').select('*').eq('doctor_id', doctorId).maybeSingle();
      if (data) {
        if (data.is_available !== null) setIsAvailable(data.is_available);
        if (data.start_time) setStartTime(data.start_time);
        if (data.end_time) setEndTime(data.end_time);
        if (data.slot_minutes !== null) setSlotMinutes(data.slot_minutes);
      }
    };
    fetchSettings();

    const sub = supabase.channel('doctor-dash-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctor_settings', filter: `doctor_id=eq.${doctorId}` }, payload => {
        const row = payload.new as any;
        if (row) {
          if (row.is_available !== null) setIsAvailable(row.is_available);
          if (row.start_time) setStartTime(row.start_time);
          if (row.end_time) setEndTime(row.end_time);
          if (row.slot_minutes !== null) setSlotMinutes(row.slot_minutes);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [doctorId]);
  
  const updateSettings = async (updates: any) => {
    // Use direct REST fetch to bypass supabase-js auth lock
    // Prefer: resolution=merge-duplicates handles upsert on doctor_id conflict
    const res = await fetch(`${SB_URL}/rest/v1/doctor_settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SB_ANON,
        Authorization: `Bearer ${SB_ANON}`,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ doctor_id: doctorId, ...updates }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('Settings error:', body);
      toast.error("Failed to update settings", { description: body?.message || res.statusText });
    }
  };
  
  useEffect(() => {
    const fetchFiles = async () => {
      if (!activeBooking?.id) {
        setPatientFiles([]);
        return;
      }

      // Build query: match by booking_id, OR fallback to user_email if available
      // Note: Inside an `or=()` block, PostgREST requires using `.` instead of `=` for columns.
      // E.g., `or=(booking_id.eq.123,user_email.eq.test)`
      const bookingIdFilter = `booking_id.eq.${activeBooking.id}`;
      const emailFilter = activeBooking.user_email
        ? `user_email.eq.${encodeURIComponent(activeBooking.user_email)}`
        : null;

      const filterQuery = emailFilter
        ? `or=(${bookingIdFilter},${emailFilter})`
        : `booking_id=eq.${activeBooking.id}`; // Fallback to standard `?col=eq.val` syntax if no OR is needed

      const url = `${SB_URL}/rest/v1/patient_files?${filterQuery}&order=created_at.desc`;
      console.log('[MediQ] Fetching patient files:', url);

      const res = await fetch(url, {
        headers: {
          apikey: SB_ANON,
          Authorization: `Bearer ${SB_ANON}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json().catch(() => []);
      console.log('[MediQ] Patient files result:', data);
      setPatientFiles(Array.isArray(data) ? data : []);
    };

    fetchFiles();

    // Poll every 5s while a patient is active — catches async uploads
    const interval = setInterval(fetchFiles, 5000);
    return () => clearInterval(interval);
  }, [activeBooking?.id]);

  useEffect(() => {
    if (activeBooking?.called_at) {
      const updateElapsed = () => {
         const calledTime = new Date(activeBooking.called_at!).getTime();
         const now = new Date().getTime();
         setElapsedMins(Math.max(0, Math.floor((now - calledTime) / 60000)));
      };
      updateElapsed();
      const interval = setInterval(updateElapsed, 10000); // UI update every 10s for accuracy
      return () => clearInterval(interval);
    } else {
      setElapsedMins(0);
    }
  }, [activeBooking?.called_at]);

  // Auto no-show polling
  useEffect(() => {
    const interval = setInterval(async () => {
      await supabase.rpc('process_auto_no_shows');
    }, 30000); // Trigger DB check every 30s
    return () => clearInterval(interval);
  }, []);

  if (isChecking) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (localStorage.getItem("mediq_auth") !== "doctor") return null;
  if (!doctor) return null;

  const isCurrentlyWorking = isDoctorAvailableNow(isAvailable, startTime, endTime);

  const handleCallNext = async () => {
    if (!doctor) return;

    if (!isCurrentlyWorking) {
       toast.error("Action Blocked", { description: "You are currently marked as absent or outside working hours." });
       return;
    }

    // 1. Mark the current active booking as 'done'
    if (activeBooking) {
      try {
        await updateBooking(activeBooking.id, { status: 'done' });
      } catch (err: any) {
        toast.error('Failed to mark current patient as done', { description: err.message });
        console.error(err);
        return; // Halt if we couldn't properly close out the current patient
      }
    }

    // 2. Advance the queue if there is someone waiting
    if (waitingBookings.length > 0) {
      const nextBooking = waitingBookings[0];
      try {
        await updateBooking(nextBooking.id, { status: 'ready', called_at: new Date().toISOString() });
        toast.success(`Called Next Patient`, { description: `Token #${nextBooking.token_number} is up next.` });
      } catch (err: any) {
        toast.error('Failed to call next patient', { description: err.message });
        console.error(err);
      }
    } else {
      if (activeBooking) {
        toast.success("Consultation complete. Queue is clear.");
      } else {
        toast.info("Queue is empty.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mediq_auth");
    navigate("/");
    toast("Logged out securely.");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-200">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-100 shadow-sm z-10 sticky top-0">
        <div className="px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 text-white rounded-xl bg-teal-600 flex items-center justify-center flex-shrink-0">
              <Activity strokeWidth={2.5} size={18} />
            </div>
            <div>
              <p className="text-base sm:text-xl font-extrabold text-slate-800 tracking-tight leading-tight">Jeevodaya Mission Hospital</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Workspace</p>
            </div>
          </div>

          {/* Settings row — wraps on mobile */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Doctor info + manage schedule + logout */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/doctor/schedule')}
                className="text-teal-700 border-teal-200 hover:bg-teal-50 rounded-lg gap-1.5 hidden sm:flex"
              >
                <CalendarDays size={14} />
                <span>Manage Schedule</span>
              </Button>
              <button
                onClick={() => navigate('/doctor/schedule')}
                className="sm:hidden h-8 w-8 flex items-center justify-center rounded-xl border border-teal-200 text-teal-700 hover:bg-teal-50"
                title="Manage Schedule"
              >
                <CalendarDays size={15} />
              </button>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-3 py-1">
                <img src={doctor.image} alt={doctor.name} className="h-6 w-6 rounded-full object-cover" />
                <span className="text-xs font-bold text-slate-700 hidden sm:inline">{doctor.name}</span>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-2" onClick={handleLogout}>
                <LogOut size={16} />
                <span className="ml-1 hidden sm:inline">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Mobile Queue Toggle */}
        <div className="lg:hidden bg-white border-b border-slate-100 px-4 py-2">
          <button
            onClick={() => setQueueOpen(o => !o)}
            className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-700"
          >
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-teal-600" /> Live Queue
              <Badge className="bg-teal-100 text-teal-700 border-0 text-xs">{waitingBookings.length} Waiting</Badge>
            </span>
            {queueOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>
          <AnimatePresence>
            {queueOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pb-3 space-y-2 max-h-64 overflow-y-auto">
                  {activeBooking && (
                    <div className="p-3 rounded-xl bg-white border border-teal-500 text-sm">
                      <span className="font-bold text-slate-800">
                        #{activeBooking.token_number} · {activeBooking.patient_name}
                        {activeBooking.time_slot && ` (${activeBooking.time_slot})`}
                      </span>
                      <Badge className="ml-2 bg-teal-500 text-white border-0 text-xs">{activeBooking.status === 'ready' ? 'Ready' : 'Current'}</Badge>
                    </div>
                  )}
                  {waitingBookings.map(p => (
                    <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                      <span className="font-semibold text-slate-700">
                        #{p.token_number} · {p.patient_name}
                        {p.time_slot && ` (${p.time_slot})`}
                      </span>
                      <Badge className="ml-2 bg-slate-100 text-slate-500 border-0 text-xs">Waiting</Badge>
                    </div>
                  ))}
                  {waitingBookings.length === 0 && !activeBooking && (
                    <p className="text-slate-400 text-xs text-center py-2">Queue is empty</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Left Sidebar Queue — desktop only */}
        <aside className="hidden lg:flex w-72 xl:w-80 bg-white border-r border-slate-100 flex-col h-[calc(100vh-73px)]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-teal-600"/> Live Queue
            </h2>
            <Badge className="bg-teal-100 text-teal-700 border-0">{waitingBookings.length} Wait</Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            <AnimatePresence>
              {waitingBookings.length === 0 && !activeBooking && (
                <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-center text-slate-500 py-10 font-medium">Queue is empty!</motion.p>
              )}
              {activeBooking && (
                <motion.div key={activeBooking.id} layout className="p-4 rounded-2xl border bg-white border-teal-500 shadow-md ring-1 ring-teal-500/20">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800">
                      #{activeBooking.token_number} &middot; {activeBooking.patient_name}
                      {activeBooking.time_slot && <span className="text-teal-600 ml-1">({activeBooking.time_slot})</span>}
                    </span>
                    {activeBooking.status === 'ready' ? (
                      <Badge variant="default" className="bg-amber-500 text-white border-0">Ready</Badge>
                    ) : (
                      <Badge variant="default" className="bg-teal-500 text-white border-0">Current</Badge>
                    )}
                  </div>
                </motion.div>
              )}
              {waitingBookings.map((patient) => (
                <motion.div key={patient.id} layout className="p-4 rounded-2xl border bg-white border-slate-100 shadow-sm opacity-70">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800">
                      #{patient.token_number} &middot; {patient.patient_name}
                      {patient.time_slot && <span className="text-slate-500 ml-1">({patient.time_slot})</span>}
                    </span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0">Waiting</Badge>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 bg-slate-50/50 p-4 sm:p-8 overflow-y-auto">
          {!isCurrentlyWorking && (
            <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start sm:items-center justify-between shadow-sm gap-3">
              <div className="flex items-start sm:items-center gap-3 text-amber-800">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <UserX size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold">You are currently offline</h3>
                  <p className="text-sm text-amber-700/80">Queue progression is paused. Patients cannot book new slots.</p>
                </div>
              </div>
            </div>
          )}

          {activeBooking ? (
            <div className="max-w-4xl mx-auto">
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                 <div className="flex flex-col gap-2">
                   <h1 className="text-xl sm:text-3xl font-black text-slate-800 flex flex-wrap items-center gap-2 sm:gap-3">
                     <UserCircle className="text-slate-400 flex-shrink-0" size={28} />
                     <span>Token #{activeBooking.token_number} — {activeBooking.patient_name}</span>
                     {activeBooking.time_slot && (
                       <Badge className="bg-slate-100 text-slate-600 border border-slate-200 ml-2 text-sm">
                         {activeBooking.time_slot}
                       </Badge>
                     )}
                   </h1>
                   {activeBooking.status === 'ready' && (
                     <Badge className="bg-amber-100 text-amber-800 border-0 w-fit text-xs">Waiting for Receptionist</Badge>
                   )}
                   {activeBooking.called_at && (
                      <p className={`text-sm font-bold ${elapsedMins >= 5 ? 'text-red-500' : 'text-slate-500'}`}>
                        <Clock size={14} className="inline mr-1" />
                        In consultation for {elapsedMins} min{elapsedMins !== 1 ? 's' : ''}
                        {elapsedMins >= 5 && ' (Auto No-Show impending)'}
                      </p>
                   )}
                 </div>
                 <Button onClick={handleCallNext} size="lg" className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg border-0 h-12 px-6 w-full sm:w-auto">
                   Complete &amp; Call Next <ArrowRight className="ml-2" size={18} />
                 </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Consultation Details */}
                <Card className="border border-slate-200 shadow-sm rounded-3xl bg-white overflow-hidden">
                  <div className="p-6">
                     <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">Consultation Mode</h3>
                     {false ? (
                       <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center">
                         <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm mb-4">
                            <Video size={32} />
                         </div>
                         <h4 className="font-bold text-indigo-900 text-lg">Telehealth Consultation</h4>
                         <p className="text-indigo-700/80 text-sm mt-2 mb-6">Patient has selected online video calling.</p>
                         <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-md">Join Video Call</Button>
                       </div>
                     ) : (
                        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center">
                          <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm mb-4">
                             <Building2 size={32} />
                          </div>
                          <h4 className="font-bold text-orange-900 text-lg">In-Clinic Visit</h4>
                          {activeBooking.status === 'ready' ? (
                            <div className="mt-4 flex flex-col items-center gap-3">
                              <div className="w-full flex items-center justify-center gap-2 bg-amber-100 text-amber-700 border border-amber-200 h-12 rounded-xl font-bold text-sm">
                                <BellRing size={16} className="animate-pulse" /> Receptionist Notified — Awaiting Entry
                              </div>
                              <p className="text-xs text-orange-600/70">The receptionist will send the patient in shortly.</p>
                            </div>
                          ) : (
                            <div className="mt-4 flex flex-col items-center gap-3">
                              <div className="w-full flex items-center justify-center gap-2 bg-teal-100 text-teal-700 border border-teal-200 h-12 rounded-xl font-bold text-sm">
                                <CheckCircle size={16} /> Patient Sent In by Receptionist
                              </div>
                              <p className="text-xs text-orange-600/70">Click «Complete &amp; Call Next» when done.</p>
                            </div>
                          )}
                        </div>
                     )}
                  </div>
                </Card>

                {/* Secure Records (LocDoc Feature) */}
                <Card className="border border-slate-200 shadow-sm rounded-3xl bg-white overflow-hidden">
                  <div className="p-6">
                     <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">Secure Medical Records</h3>
                     
                     {patientFiles.length === 0 ? (
                       <div className="h-48 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                         <FileText size={32} className="mb-2 opacity-50" />
                         <p className="text-sm font-medium">No records uploaded by patient.</p>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         {patientFiles.map((doc, idx) => (
                           <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500">
                                   <FileText size={20} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{doc.file_name}</p>
                                </div>
                              </div>
                              <a
                                href={doc.file_path}
                                target="_blank"
                                rel="noreferrer"
                                title={`Download ${doc.file_name}`}
                                aria-label={`Download ${doc.file_name}`}
                                className="text-slate-500 hover:text-teal-600 hover:bg-teal-50 px-3 py-1 rounded"
                              >
                                <Download size={18} />
                              </a>
                           </div>
                         ))}
                       </div>
                     )}
                  </div>
                </Card>

              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
               <Activity size={64} className="mb-4 opacity-20" />
               <p className="text-xl font-bold text-slate-600">No active patients</p>
               <p className="text-sm mt-2 mb-6">Queue is waiting for you.</p>
               {waitingBookings.length > 0 ? (
                 <Button onClick={handleCallNext} size="lg" className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg border-0 h-14 px-8 text-lg font-bold">
                   Call First Patient <ArrowRight className="ml-2" size={20} />
                 </Button>
               ) : (
                 <p className="text-slate-400 italic">No patients in the queue right now.</p>
               )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
