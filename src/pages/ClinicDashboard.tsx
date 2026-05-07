import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useBookings, type Booking } from '@/hooks/useBookings';
import { toast } from 'sonner';
import { UserPlus, CheckCircle, Clock, Users, XCircle, Undo2, Lock, FileText, Activity, BarChart2, LogOut } from 'lucide-react';
import { getTodayISTDateString } from '@/lib/ist';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MOCK_DOCTORS } from '@/lib/mockData';

function getNowISTHoursMinutes(): { hours24: number; minutes: number } {
  const ist = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const timePart = ist.split(', ')[1] ?? '';
  const match = timePart.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (!match) return { hours24: 0, minutes: 0 };
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return { hours24: hours, minutes };
}

type UndoAction = {
  bookingId: string;
  previousStatus: Booking['status'];
  label: string;
};

const ClinicDashboard = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem("mediq_auth");
    if (auth !== "receptionist" && auth !== "doctor") {
      navigate('/login', { replace: true });
      toast.error("Unauthorized", { description: "Please log in with staff credentials." });
    }
    setIsChecking(false);
  }, [navigate]);

  const bookingDate = getTodayISTDateString();
  const { bookings, loading, refetch } = useBookings({ bookingDate });
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInDoctor, setWalkInDoctor] = useState('');
  const [adding, setAdding] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [lastAction, setLastAction] = useState<UndoAction | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Booking | null>(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [patientFiles, setPatientFiles] = useState<any[]>([]);
  const [waitTimes, setWaitTimes] = useState<Record<string, number>>({});
  const [filterDoctor, setFilterDoctor] = useState<string>('all');;
  
  useEffect(() => {
    const fetchWaitTimes = async () => {
      const { data } = await supabase.from('doctor_settings').select('*');
      if (data) {
        const wt: Record<string, number> = {};
        data.forEach(d => wt[d.doctor_id] = d.avg_wait_minutes);
        setWaitTimes(wt);
      }
    };
    fetchWaitTimes();
    const sub = supabase.channel('settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctor_settings' }, fetchWaitTimes)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  // Auto no-show polling
  useEffect(() => {
    const interval = setInterval(async () => {
      await supabase.rpc('process_auto_no_shows');
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateWaitTime = async (doctorId: string, minutes: number) => {
    if (minutes < 1) return;
    const { error } = await supabase.from('doctor_settings').upsert({
      doctor_id: doctorId,
      avg_wait_minutes: minutes
    });
    if (error) toast.error('Failed to update wait time table (Have you run the SQL?)');
    else toast.success('Wait time updated!');
  };

  const jeevodayaDoctors = MOCK_DOCTORS.filter(d => d.hospitalId === "jeevodaya");

  // ── Must be above ALL early returns (Rules of Hooks) ──────────────────────
  const safeBookingsList = Array.isArray(bookings) ? bookings : [];
  const previousReadyCount = useRef(0);
  useEffect(() => {
    const currentReadyCount = safeBookingsList.filter(b => b.status === 'ready').length;
    if (currentReadyCount > previousReadyCount.current) {
      toast.info('A Doctor is ready for their next patient!', { description: 'Please send the patient in.'});
    }
    previousReadyCount.current = currentReadyCount;
  }, [safeBookingsList]);
  // ─────────────────────────────────────────────────────────────────────────

  if (isChecking) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (localStorage.getItem("mediq_auth") !== "receptionist" && localStorage.getItem("mediq_auth") !== "doctor") return null;

  const filteredBookings = filterDoctor === 'all' ? safeBookingsList : safeBookingsList.filter(b => b.doctor_id === filterDoctor);
  const waitingBookings = filteredBookings.filter(b => b.status === 'waiting');
  const activeBookings = filteredBookings.filter(b => b.status === 'in-progress' || b.status === 'ready');
  const doneBookings = filteredBookings.filter(b => b.status === 'done');
  const noShowBookings = filteredBookings.filter(b => b.status === 'no-show');

  const handleAddWalkIn = async () => {
    if (!walkInName.trim() || !walkInDoctor) {
      toast.error('Enter patient name and select a doctor');
      return;
    }
    setAdding(true);

    const doc = jeevodayaDoctors.find(d => d.id === walkInDoctor);

    const { data: tokenData } = await supabase.rpc('get_next_token_for_doctor', {
      p_doctor_id: walkInDoctor,
      p_booking_date: getTodayISTDateString()
    });
    const { hours24: hours, minutes } = getNowISTHoursMinutes();
    const h = hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const timeSlot = `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    const { error } = await supabase.from('bookings').insert({
      patient_name: walkInName.trim(),
      phone: walkInPhone.trim() || 'Walk-in',
      time_slot: timeSlot,
      token_number: tokenData,
      booking_date: getTodayISTDateString(),
      doctor_id: walkInDoctor,
      hospital_id: 'jeevodaya',
      department_id: doc?.departmentId,
      status: 'waiting'
    });

    if (error) {
      toast.error('Failed to add patient');
    } else {
      toast.success('Walk-in patient added');
      setWalkInName('');
      setWalkInPhone('');
      setShowWalkIn(false);
    }
    setAdding(false);
  };

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status'], currentStatus: Booking['status'], label: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to update');
    } else {
      setLastAction({ bookingId, previousStatus: currentStatus, label });
    }
  };

  const handleMarkDone = (bookingId: string) => {
    handleStatusChange(bookingId, 'done', 'in-progress', 'Mark Done');
  };

  const handleNoShow = (bookingId: string, currentStatus: Booking['status']) => {
    handleStatusChange(bookingId, 'no-show', currentStatus, 'No Show');
  };


  const handleUndo = async () => {
    if (!lastAction) return;
    const { error } = await supabase
      .from('bookings')
      .update({ status: lastAction.previousStatus })
      .eq('id', lastAction.bookingId);

    if (error) {
      toast.error('Failed to undo');
    } else {
      toast.success(`Undid: ${lastAction.label}`);
      setLastAction(null);
    }
  };

  const handleViewPatient = async (b: Booking) => {
    setSelectedPatient(b);
    setPatientModalOpen(true);
    const { data } = await supabase.from('patient_files').select('*').eq('booking_id', b.id);
    setPatientFiles(data || []);
  };

  // Render the dashboard directly now that Login.tsx handles auth

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-200">
      <header className="bg-white border-b border-slate-100 shadow-sm z-10 sticky top-0 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 text-white rounded-2xl bg-teal-600 shadow-md shadow-teal-200 flex items-center justify-center">
              <Activity strokeWidth={2.5} size={20} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Jeevodaya Mission Hospital</h1>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Front Desk Check-In</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/analytics')}
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 gap-2 font-bold">
              <BarChart2 size={15} /> Analytics
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem('mediq_auth'); navigate('/login'); }}
              className="rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 gap-2 font-bold">
              <LogOut size={15} /> Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* Doctor Filter Selection */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <p className="font-bold text-slate-700 ml-2">Currently Viewing:</p>
          <Select value={filterDoctor} onValueChange={setFilterDoctor}>
            <SelectTrigger className="w-[200px] border-slate-200 bg-slate-50 font-bold text-slate-800 rounded-xl h-12">
              <SelectValue placeholder="All Doctors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {jeevodayaDoctors.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-0 shadow-sm bg-white rounded-3xl">
            <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-teal-50 text-teal-600 mb-2 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 mx-auto" />
              </div>
              <p className="text-3xl font-black text-slate-800">{waitingBookings.length}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Waiting</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white rounded-3xl">
            <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 mb-2 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 mx-auto" />
              </div>
              <p className="text-3xl font-black text-slate-800">{activeBookings.length}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Active</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white rounded-3xl">
            <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 mb-2 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mx-auto" />
              </div>
              <p className="text-3xl font-black text-slate-800">{doneBookings.length}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Done</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex">
          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 sm:h-16 text-sm sm:text-base font-bold rounded-2xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
            onClick={() => setShowWalkIn(!showWalkIn)}
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add Walk-in Patient
          </Button>
        </div>

        {/* Undo Button */}
        {lastAction && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-muted-foreground"
            onClick={handleUndo}
          >
            <Undo2 className="w-4 h-4" />
            Undo: {lastAction.label}
          </Button>
        )}

        {/* Walk-in Form */}
        {showWalkIn && (
          <Card className="border-0 shadow-md bg-white rounded-[2rem] overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <p className="text-lg font-black text-slate-800">New Walk-In Patient</p>
              <Select value={walkInDoctor} onValueChange={setWalkInDoctor}>
                <SelectTrigger className="h-14 rounded-xl border-slate-200 bg-slate-50 text-slate-800 font-medium">
                  <SelectValue placeholder="Select Doctor" />
                </SelectTrigger>
                <SelectContent>
                  {jeevodayaDoctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.specialty})</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="Patient Full Name"
                value={walkInName}
                onChange={e => setWalkInName(e.target.value)}
                className="h-14 rounded-xl border-slate-200 bg-slate-50 placeholder:text-slate-400 font-medium text-slate-800"
              />
              <Input
                placeholder="Phone Number (optional)"
                value={walkInPhone}
                onChange={e => setWalkInPhone(e.target.value)}
                className="h-14 rounded-xl border-slate-200 bg-slate-50 placeholder:text-slate-400 font-medium text-slate-800"
              />
              <Button className="w-full h-14 rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white" onClick={handleAddWalkIn} disabled={adding}>
                {adding ? 'Adding to Queue...' : 'Confirm & Add to Queue'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active Patients */}
        {activeBookings.map(b => (
          <Card key={b.id} className={`border ${b.status === 'ready' ? 'border-amber-500 bg-amber-50' : 'border-teal-500 bg-teal-50'} shadow-lg rounded-[2rem] mb-4 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-4">
              <Badge className={`${b.status === 'ready' ? 'bg-amber-500' : 'bg-teal-500'} text-white border-0 font-bold uppercase tracking-wider`}>
                {b.status === 'ready' ? 'Ready for Doctor' : 'Now Seeing'}
              </Badge>
            </div>
            <CardContent className="p-6">
              <p className={`text-3xl font-black ${b.status === 'ready' ? 'text-amber-950' : 'text-teal-950'} mt-4 mb-2`}>
                #{b.token_number} — {b.patient_name}
              </p>
              <p className={`text-sm font-medium ${b.status === 'ready' ? 'text-amber-700' : 'text-teal-700'} mb-6 flex items-center gap-2`}><Clock size={16}/> {b.time_slot}</p>
              <div className="grid grid-cols-2 gap-3">
                {b.status === 'ready' ? (
                  <Button
                    className="h-14 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-white shadow-md shadow-amber-200"
                    onClick={() => handleStatusChange(b.id, 'in-progress', 'ready', 'Sent In')}
                  >
                    Send In Patient
                  </Button>
                ) : (
                  <Button
                    className="h-14 rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-white shadow-md shadow-teal-200"
                    onClick={() => handleMarkDone(b.id)}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Mark Done
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="h-14 rounded-xl bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 font-bold shadow-sm"
                  onClick={() => handleNoShow(b.id, b.status)}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  No Show
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Doctor Queues Overview */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <Activity className="text-teal-600" size={20} />
            <p className="text-lg font-extrabold text-slate-800 tracking-tight">Live Doctor Queues</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {jeevodayaDoctors.map(doc => {
                 let dBookings = bookings.filter(b => b.doctor_id === doc.id);
                 let w = dBookings.filter(b => b.status === 'waiting').length;
                 let i = dBookings.filter(b => b.status === 'in-progress').length;
                 let c = dBookings.filter(b => b.status === 'done').length;
                 return (
                   <Card key={doc.id} className="border border-slate-100 shadow-sm bg-white rounded-3xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="font-extrabold text-base text-slate-900">{doc.name}</p>
                         <p className="text-sm font-medium text-slate-500">{doc.specialty}</p>
                       </div>
                       <div className="text-right flex gap-4">
                          <div className="text-center"><p className="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-1">Wait</p><p className="font-black text-lg text-slate-800">{w}</p></div>
                          <div className="text-center"><p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-1">Active</p><p className="font-black text-lg text-slate-800">{i}</p></div>
                          <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Done</p><p className="font-black text-lg text-slate-800">{c}</p></div>
                       </div>
                     </div>
                     <div className="flex items-center justify-between bg-slate-50 p-2 sm:px-4 sm:py-2 rounded-xl">
                        <p className="text-xs font-bold text-slate-500 uppercase">Avg Wait (min)</p>
                        <Input 
                           type="number" 
                           defaultValue={waitTimes[doc.id] || 5}
                           className="w-20 h-9 font-bold bg-white text-center border-slate-200"
                           onBlur={(e) => handleUpdateWaitTime(doc.id, parseInt(e.target.value))}
                           onKeyDown={(e) => { if(e.key === 'Enter') handleUpdateWaitTime(doc.id, parseInt(e.currentTarget.value)) }}
                        />
                     </div>
                   </Card>
                 )
             })}
          </div>
        </div>

        {/* Queue List */}
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mb-4">
            <Clock size={20} className="text-teal-600"/> Current Queue <Badge className="bg-slate-200 text-slate-700 border-0 ml-2">{waitingBookings.length} Waiting</Badge>
          </h2>
          {loading ? (
            <p className="text-sm font-medium text-slate-500">Refreshing queue...</p>
          ) : waitingBookings.length === 0 ? (
            <Card className="border border-dashed border-slate-200 bg-transparent flex items-center justify-center h-32 rounded-[2rem]">
              <CardContent className="p-0 text-slate-400 font-bold flex flex-col items-center">
                <CheckCircle size={24} className="mb-2 opacity-50" />
                Queue is clear
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {waitingBookings.map((b, i) => (
                <Card key={b.id} className="border border-slate-100 shadow-sm bg-white rounded-2xl hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-lg font-black text-slate-700 shrink-0 border border-slate-200 shadow-sm">
                        {b.token_number}
                      </div>
                      <div className="cursor-pointer" onClick={() => handleViewPatient(b)}>
                        <p className="font-extrabold text-slate-900 text-base sm:text-lg hover:text-teal-600 transition-colors">{b.patient_name}</p>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-1"><Clock size={12}/> {b.time_slot}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      {i === 0 && (
                        <Badge className="bg-amber-100 text-amber-800 border-0 font-extrabold uppercase tracking-widest px-3">Next Up</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                        onClick={() => handleNoShow(b.id, 'waiting')}
                        title="Mark No Show"
                      >
                        <XCircle size={20} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Done & No-Show Lists */}
        {(doneBookings.length > 0 || noShowBookings.length > 0) && (
          <div className="space-y-3">
            {doneBookings.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Completed ({doneBookings.length})
                </p>
                <div className="space-y-1">
                  {doneBookings.map(b => (
                    <div key={b.id} className="flex items-center gap-3 px-3 py-2 opacity-50">
                      <span className="text-sm font-mono text-muted-foreground">#{b.token_number}</span>
                      <span className="text-sm text-muted-foreground line-through">{b.patient_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {noShowBookings.length > 0 && (
              <div>
                <p className="text-sm font-medium text-destructive/70 mb-2">
                  No-Shows ({noShowBookings.length})
                </p>
                <div className="space-y-1">
                  {noShowBookings.map(b => (
                    <div key={b.id} className="flex items-center gap-3 px-3 py-2 opacity-40">
                      <span className="text-sm font-mono text-muted-foreground">#{b.token_number}</span>
                      <span className="text-sm text-muted-foreground line-through">{b.patient_name}</span>
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">No-show</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog open={patientModalOpen} onOpenChange={setPatientModalOpen}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
             <div className="space-y-4">
               <div>
                 <p className="text-xs font-bold text-slate-500 uppercase">Name</p>
                 <p className="font-medium">{selectedPatient.patient_name}</p>
               </div>
               <div>
                 <p className="text-xs font-bold text-slate-500 uppercase">Phone</p>
                 <p className="font-medium">{selectedPatient.phone || "N/A"}</p>
               </div>
               <div>
                 <p className="text-xs font-bold text-slate-500 uppercase">Time Slot</p>
                 <p className="font-medium">{selectedPatient.time_slot}</p>
               </div>
               <div>
                 <p className="text-xs font-bold text-slate-500 uppercase mb-2">Uploaded Files</p>
                 {patientFiles.length > 0 ? (
                    patientFiles.map(f => (
                       <div key={f.id} className="p-3 border rounded-lg bg-slate-50 flex items-center gap-3">
                          <FileText size={20} className="text-teal-600"/>
                          <div>
                            <p className="font-bold text-sm text-slate-800">{f.file_name}</p>
                          </div>
                          <a href={f.file_path} target="_blank" className="ml-auto text-xs text-blue-600 font-bold hover:underline">View</a>
                       </div>
                    ))
                 ) : (
                    <p className="text-sm italic text-slate-500">No medical records uploaded.</p>
                 )}
               </div>
             </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicDashboard;
