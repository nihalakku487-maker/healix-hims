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
import { Activity, Clock, FileText, ArrowRight, UserCircle, Video, Building2, Download, LogOut, CheckCircle, BellRing, UserX } from "lucide-react";
import { toast } from "sonner";

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
  
  // Realtime settings
  const [isAvailable, setIsAvailable] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
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
    const { error } = await supabase.from('doctor_settings').upsert({ doctor_id: doctorId, ...updates });
    if (error) {
      console.error(error);
      toast.error("Database Error", { description: "You must run the migration SQL file first!" });
    }
  };
  
  useEffect(() => {
    const fetchFiles = async () => {
      if (activeBooking && activeBooking.phone) {
         // 1. Get patient id by phone
         const { data: patientData } = await supabase
           .from('patients')
           .select('id')
           .eq('phone', activeBooking.phone)
           .maybeSingle();

         if (patientData && patientData.id) {
           // 2. Fetch all files for this patient
           const { data: filesData } = await supabase
             .from('patient_files')
             .select('*')
             .eq('patient_id', patientData.id)
             .order('uploaded_at', { ascending: false });
           setPatientFiles(filesData || []);
         } else {
           setPatientFiles([]);
         }
      } else {
         setPatientFiles([]);
      }
    };
    fetchFiles();
  }, [activeBooking?.id, activeBooking?.phone]);

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
      const { error: err1 } = await supabase
        .from('bookings')
        .update({ status: 'done' })
        .eq('id', activeBooking.id);
        
      if (err1) {
        toast.error(`Failed to mark current patient as done`);
        console.error(err1);
        return; // Halt if we couldn't properly close out the current patient
      }
    }

    // 2. Advance the queue if there is someone waiting
    if (waitingBookings.length > 0) {
      const nextBooking = waitingBookings[0];
      const { error: err2 } = await supabase
        .from('bookings')
        .update({ status: 'ready', called_at: new Date().toISOString() })
        .eq('id', nextBooking.id);

      if (err2) {
        toast.error(`Failed to call next patient`);
        console.error(err2);
      } else {
        toast.success(`Called Next Patient`, { description: `Token #${nextBooking.token_number} is up next.` });
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
      <header className="bg-white border-b border-slate-100 shadow-sm z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 text-white rounded-2xl bg-teal-600 flex items-center justify-center">
              <Activity strokeWidth={2.5} size={20} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-800 tracking-tight">Sastha Wellness Provider</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Header Availability Toggle */}
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-500">Working Hours</span>
                 <div className="flex gap-1 items-center">
                   <Input type="time" value={startTime} onChange={e => { setStartTime(e.target.value); updateSettings({start_time: e.target.value}); }} className="w-20 h-6 text-xs p-1" />
                   <span className="text-xs text-slate-400 mt-1">-</span>
                   <Input type="time" value={endTime} onChange={e => { setEndTime(e.target.value); updateSettings({end_time: e.target.value}); }} className="w-20 h-6 text-xs p-1" />
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 mx-1"></div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-500">Slot Size</span>
                <div className="flex items-center gap-1">
                   <Input type="number" min="5" max="120" step="5" value={slotMinutes} onChange={e => {
                     const val = parseInt(e.target.value);
                     if (!isNaN(val)) {
                       setSlotMinutes(val);
                       updateSettings({slot_minutes: val});
                     }
                   }} className="w-14 h-6 text-xs p-1" />
                   <span className="text-xs text-slate-400 mt-1">m</span>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 mx-1"></div>
              <div className="flex items-center gap-2">
                 <Switch checked={isAvailable} onCheckedChange={(val) => { setIsAvailable(val); updateSettings({is_available: val}); }} id="available-mode" />
                 <label htmlFor="available-mode" className={`text-sm font-bold ${isAvailable ? 'text-teal-600' : 'text-slate-400'}`}>
                   {isAvailable ? "Available" : "Absent"}
                 </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-4 border-r border-slate-100 pl-2">
              <div className="font-medium text-slate-700 text-right">
                <p className="text-sm font-bold">{doctor.name}</p>
                <p className="text-xs text-slate-500">{doctor.specialty}</p>
              </div>
              <img src={doctor.image} alt={doctor.name} className="h-10 w-10 rounded-full border border-slate-200" />
            </div>
            <Button variant="ghost" className="text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
              <LogOut size={18} className="mr-2" /> Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Queue */}
        <aside className="w-80 bg-white border-r border-slate-100 flex flex-col h-[calc(100vh-73px)]">
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
                <motion.div 
                  key={activeBooking.id}
                  layout
                  className={`p-4 rounded-2xl cursor-pointer border transition-all bg-white border-teal-500 shadow-md ring-1 ring-teal-500/20`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800">#{activeBooking.token_number} &middot; {activeBooking.patient_name}</span>
                    {activeBooking.status === 'ready' ? (
                      <Badge variant="default" className="bg-amber-500 text-white border-0">Ready</Badge>
                    ) : (
                      <Badge variant="default" className="bg-teal-500 text-white border-0">Current</Badge>
                    )}
                  </div>
                </motion.div>
              )}
              
              {waitingBookings.map((patient) => (
                <motion.div 
                  key={patient.id}
                  layout
                  className={`p-4 rounded-2xl cursor-pointer border transition-all bg-white border-slate-100 shadow-sm opacity-70`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800">#{patient.token_number} &middot; {patient.patient_name}</span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0">Waiting</Badge>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 bg-slate-50/50 p-8 h-[calc(100vh-73px)] overflow-y-auto">
          {!isCurrentlyWorking && (
             <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 text-amber-800">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <UserX size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold">You are currently offline</h3>
                    <p className="text-sm text-amber-700/80">Queue progression is paused. Patients cannot book new slots until you are available and within your working hours.</p>
                  </div>
                </div>
             </div>
          )}

          {activeBooking ? (
            <div className="max-w-4xl mx-auto">
              {/* Status Header */}
              <div className="flex items-center justify-between mb-8">
                 <div className="flex flex-col gap-2">
                   <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                     <UserCircle className="text-slate-400" size={32} />
                     Token #{activeBooking.token_number} - {activeBooking.patient_name}
                   </h1>
                   {activeBooking.status === 'ready' && (
                     <Badge className="bg-amber-100 text-amber-800 border-0 w-fit">Waiting for Receptionist (Not sent in yet)</Badge>
                   )}
                   {activeBooking.called_at && (
                      <p className={`text-sm font-bold ${elapsedMins >= 5 ? 'text-red-500' : 'text-slate-500'}`}>
                        <Clock size={14} className="inline mr-1" />
                        In consultation for {elapsedMins} min{elapsedMins !== 1 ? 's' : ''}
                        {elapsedMins >= 5 && ' (Auto No-Show impending)'}
                      </p>
                   )}
                 </div>
                 <Button onClick={handleCallNext} size="lg" className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg border-0 h-12 px-6">
                   Complete & Call Next <ArrowRight className="ml-2" size={18} />
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
                              <a href={doc.file_path} target="_blank" className="text-slate-500 hover:text-teal-600 hover:bg-teal-50 px-3 py-1 rounded">
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
