import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getTodayISTDateString } from "@/lib/ist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Search, ArrowLeft } from "lucide-react";
import { MediQMark } from "@/components/MediQLogo";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function PatientTracker() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState<any>(null);
  const [liveQueueCount, setLiveQueueCount] = useState<number | null>(null);
  const [waitMultiplier, setWaitMultiplier] = useState(5);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsSearching(true);
    
    // Find today's booking for this phone
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("phone", phone)
      .eq("booking_date", getTodayISTDateString())
      .in("status", ["waiting", "ready", "in-progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      toast.error("No active booking found today for this number.");
      setBooking(null);
    } else {
      setBooking(data);
      fetchLiveStatus(data);
    }
    setIsSearching(false);
  };

  const fetchLiveStatus = async (b: any) => {
    // 1. Get how many people are waiting BEFORE this patient (token < this token)
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', b.doctor_id)
      .eq('booking_date', getTodayISTDateString())
      .in('status', ['waiting', 'ready', 'in-progress'])
      .lt('token_number', b.token_number);
    setLiveQueueCount(count ?? 0);

    // 2. Get Wait Multiplier
    const { data: setting } = await supabase.from('doctor_settings').select('avg_wait_minutes').eq('doctor_id', b.doctor_id).maybeSingle();
    if (setting) setWaitMultiplier(setting.avg_wait_minutes);
  };

  useEffect(() => {
    if (!booking) return;
    // Set up realtime sub
    const sub = supabase.channel('patient-tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
         if (payload.eventType === 'UPDATE' && payload.new && (payload.new as any).id === booking.id) {
            setBooking(payload.new);
         }
         fetchLiveStatus(booking);
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [booking?.id]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-200 flex flex-col p-6 items-center">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6 -ml-4 text-slate-500 hover:bg-slate-200/50">
          <ArrowLeft className="mr-2" size={18} /> Back to Home
        </Button>

        <Card className="border-0 shadow-lg bg-white p-8 rounded-[2rem] text-center mb-6">
           <div className="mx-auto mb-6">
             <MediQMark size={64} />
           </div>
           <h1 className="text-2xl font-black text-slate-800 tracking-tight">Patient Tracker</h1>
           <p className="text-sm font-medium text-slate-500 mb-8">Enter your registered phone number to check your live queue status.</p>

           <form onSubmit={handleSearch} className="flex gap-2">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-3 text-slate-400" size={18} />
               <Input 
                 placeholder="Enter phone..." 
                 className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200" 
                 value={phone}
                 onChange={e => setPhone(e.target.value)}
                 required
               />
             </div>
             <Button type="submit" disabled={isSearching} className="h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md">
               {isSearching ? "..." : "Track"}
             </Button>
           </form>
        </Card>

        {booking && (
          <Card className="border-2 border-teal-500 bg-teal-50 shadow-xl shadow-teal-500/10 rounded-[2rem] p-8 text-center relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/40 blur-3xl rounded-full"></div>
             
             <h3 className="font-black text-teal-900 text-xl mb-1">Hi, {booking.patient_name}</h3>
             <p className="font-semibold text-teal-700/70 text-sm mb-6">Your Token: <span className="text-teal-900 font-bold">#{booking.token_number}</span></p>

             <div className="bg-white rounded-2xl p-6 shadow-sm border border-teal-100 mb-4">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Patients Ahead</p>
               {liveQueueCount === 0 ? (
                 <p className="text-2xl font-black text-emerald-600">You're Next!</p>
               ) : (
                 <p className="text-5xl font-black text-slate-800">{liveQueueCount}</p>
               )}
             </div>

             <div className="bg-white rounded-2xl p-6 shadow-sm border border-teal-100">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-center flex items-center justify-center gap-1">
                 <Clock size={14}/> Est. Wait Time
               </p>
               {liveQueueCount === 0 ? (
                 <p className="text-2xl font-black text-slate-800">0 mins</p>
               ) : (
                 <p className="text-4xl font-black text-rose-500">~{(liveQueueCount || 0) * waitMultiplier}<span className="text-lg">m</span></p>
               )}
             </div>
          </Card>
        )}
      </div>
    </div>
  );
}
