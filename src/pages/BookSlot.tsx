import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MOCK_DOCTORS } from "@/lib/mockData";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Upload, Video, Building2, CheckCircle2, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getTodayISTDateString, getNowIST } from "@/lib/ist";
import { isDoctorAvailableNow } from "@/lib/availability";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorSlots } from "@/hooks/useDoctorSlots";

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function getISTTimeString(): string {
  const ist = getNowIST();
  let h = ist.getHours();
  const m = ist.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function BookSlot() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const doctor = MOCK_DOCTORS.find((d) => d.id === doctorId);

  const [mode, setMode] = useState<"clinic" | "online">("clinic");
  const [file, setFile] = useState<File | null>(null);
  const [booked, setBooked] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [finalToken, setFinalToken] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveQueueCount, setLiveQueueCount] = useState<number | null>(null);
  const [waitMultiplier, setWaitMultiplier] = useState(5);
  
  const [isAvail, setIsAvail] = useState<boolean>(true);
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  const istNow = getNowIST();
  const currentMinsIST = (istNow.getHours() * 60) + istNow.getMinutes();
  const { slots: doctorSlots, loading: slotsLoading } = useDoctorSlots({ 
    doctorId: doctor?.id, 
    date: getTodayISTDateString(), 
    currentMinsIST 
  });
  const [bookingError, setBookingError] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const realtimeSubRef = React.useRef<any>(null);

  useEffect(() => {
    if (!doctor) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .eq('booking_date', getTodayISTDateString())
        .in('status', ['waiting', 'in-progress']);
      setLiveQueueCount(count ?? 0);
    };
    const fetchSetting = async () => {
      const { data } = await supabase.from('doctor_settings').select('*').eq('doctor_id', doctor.id).maybeSingle();
      if (data) {
        if (data.avg_wait_minutes) setWaitMultiplier(data.avg_wait_minutes);
        setIsAvail(data.is_available ?? true); // Only check global presence toggle, disregard legacy start/end time
        setIsAvail(data.is_available ?? true);
      }
    };
    fetchCount();
    fetchSetting();
    const sub = supabase.channel('bookslot-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchCount)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctor_settings', filter: `doctor_id=eq.${doctor.id}` }, payload => {
          const row = payload.new as any;
          if (row) {
             if (row.avg_wait_minutes) setWaitMultiplier(row.avg_wait_minutes);
             if (row.is_available !== undefined) setIsAvail(row.is_available);
          }
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [doctor?.id]);

  if (!doctor) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-700">Doctor not found.</h2>
        <Button onClick={() => navigate("/")} className="ml-4">Go Home</Button>
      </div>
    );
  }

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!isAvail) {
      toast.error("Booking failed", { description: "Doctor is currently offline or outside of working hours." });
      return;
    }
    
    if (!selectedSlot) {
      toast.error("Please select a time slot", { description: "You must pick an available slot before confirming." });
      return;
    }
    
    setIsSubmitting(true);

    // Calculate next token
    const tokenNumber = (liveQueueCount ?? 0) + 1;

    // ── PAUSE REALTIME to release auth lock before DB insert (non-blocking) ──
    if (realtimeSubRef.current) {
      supabase.removeChannel(realtimeSubRef.current);
      realtimeSubRef.current = null;
    }

    // ── Use direct fetch instead of supabase-js to bypass auth lock ──
    let insertData: any[] | null = null;
    try {
      toast.success("Starting booking process...");
      const payloadDate = getTodayISTDateString();
      const payloadTime = typeof selectedSlot === 'string' ? selectedSlot : (selectedSlot as any).label;
      
      const bookingPayload: any = {
        patient_name: name,
        phone: phone,
        booking_date: payloadDate,
        time_slot: payloadTime,
        doctor_id: doctor.id,
        hospital_id: 'sastha',
        token_number: tokenNumber,
        status: 'waiting',
        ...(user?.email ? { user_email: user.email, user_name: profile?.full_name ?? name } : {}),
      };
      if (doctor.departmentId) {
        bookingPayload.department_id = doctor.departmentId;
      }

      toast.success("Sending to database...");
      const res = await fetch(`${SB_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SB_ANON_KEY,
          'Authorization': `Bearer ${SB_ANON_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(bookingPayload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: res.statusText }));
        const msg = errBody?.message || errBody?.details || res.statusText;
        console.error('Booking fetch error:', errBody);
        toast.error(`Booking failed: ${msg}`);
        setBookingError(`Failed to book: ${msg}`);
        setIsSubmitting(false);
        return;
      }
      insertData = await res.json();
    } catch (err: any) {
      console.error('Booking fetch exception:', err);
      toast.error(`Network error: ${err?.message ?? 'Unknown error'}`);
      setBookingError(`Application error: ${err?.message ?? 'Unknown error'}`);
      setIsSubmitting(false);
      return;
    }

    const bookingId: string | null = insertData?.[0]?.id ?? null;
    console.log('[MediQ] Booking created, ID:', bookingId);

    // ── Confirm booking immediately — don't let upload block navigation ──
    setIsSubmitting(false);
    setFinalToken(tokenNumber);
    setBooked(true);
    toast.success("Appointment Confirmed!", {
      description: `Your consultation with ${doctor.name} is scheduled.`,
    });
    setTimeout(() => navigate('/status'), 1200);

    // Handle file upload in background (fire-and-forget)
    if (file && bookingId) {
      const uploadFile = async () => {
        try {
          const uploaderId = user?.id ?? 'guest';
          const fileExt = file.name.split('.').pop() || 'pdf';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${uploaderId}/${fileName}`;

          const uploadRes = await fetch(
            `${SB_URL}/storage/v1/object/patient_records/${filePath}`,
            {
              method: 'POST',
              headers: {
                'apikey': SB_ANON_KEY,
                'Authorization': `Bearer ${SB_ANON_KEY}`,
                'Content-Type': file.type || 'application/octet-stream',
              },
              body: file,
            }
          );

          if (uploadRes.ok) {
            const publicUrl = `${SB_URL}/storage/v1/object/public/patient_records/${filePath}`;
            const fileRecord: any = {
              patient_id: uploaderId,
              file_name: file.name,
              file_path: publicUrl,
              mime_type: file.type || 'application/pdf',
              user_email: user?.email ?? null,
              user_name: profile?.full_name ?? name,
              booking_id: bookingId,
            };

            await fetch(`${SB_URL}/rest/v1/patient_files`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SB_ANON_KEY,
                'Authorization': `Bearer ${SB_ANON_KEY}`,
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify(fileRecord),
            });
            console.log('[MediQ] Medical record uploaded and linked.');
          } else {
            console.error('[MediQ] File upload failed:', await uploadRes.text());
          }
        } catch (err: any) {
          console.error('[MediQ] Upload error:', err?.message);
        }
      };
      uploadFile();
    }
  };

  if (booked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center max-w-md border border-slate-100"
        >
          <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Booking Confirmed!</h2>
          <p className="text-slate-500 font-medium mb-8">
            You are <b>#{finalToken}</b> in the queue. 
            We will notify you when it's your turn.
          </p>
          <Button className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-xl text-lg shadow-md" onClick={() => navigate("/")}>
            Return Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-200">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Button>
            <div className="text-xl font-extrabold tracking-tight text-slate-800">Complete Booking</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 relative">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Column: Doctor & Queue */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-28">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden bg-white mb-6">
                  <div className="h-24 bg-teal-600"></div>
                  <div className="p-6 relative">
                    <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-slate-100 absolute -top-12 left-6">
                      <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-14">
                      <Badge variant="outline" className="mb-2 bg-slate-50 text-slate-600 border-slate-200">{doctor.specialty}</Badge>
                      <h2 className="text-2xl font-bold text-slate-900">{doctor.name}</h2>
                      <p className="text-sm text-slate-500 mt-1">{doctor.availability}</p>
                    </div>
                  </div>
                </Card>

                <Card className="border border-teal-100 bg-teal-50 shadow-sm rounded-[2rem] p-6 relative overflow-hidden">
                  <div className="absolute right-[-20%] top-[-20%] w-32 h-32 bg-teal-200/50 rounded-full blur-2xl"></div>
                  <h3 className="font-bold text-teal-900 mb-4 flex items-center gap-2">
                    <Clock size={18} /> Live Queue Status
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-teal-100 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Queue Size</p>
                      {liveQueueCount === null ? (
                        <p className="text-slate-400 text-sm">Loading...</p>
                      ) : liveQueueCount === 0 ? (
                        <p className="text-lg font-bold text-teal-600">Clear</p>
                      ) : (
                        <p className="text-3xl font-black text-slate-800">{liveQueueCount}</p>
                      )}
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-teal-100 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Wait</p>
                      {liveQueueCount === null ? (
                        <p className="text-slate-400 text-sm">...</p>
                      ) : liveQueueCount === 0 ? (
                        <p className="text-lg font-bold text-teal-600">0m</p>
                      ) : (
                        <p className="text-3xl font-black text-rose-500">~{liveQueueCount * waitMultiplier}<span className="text-sm font-bold">m</span></p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Right Column: Booking Form */}
          <div className="w-full lg:w-2/3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {!isAvail && (
                 <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 text-amber-800">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <AlertCircle size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-bold">Currently Offline</h3>
                        <p className="text-sm text-amber-700/80">Dr. {doctor.name} is currently offline or outside working hours. New bookings are paused.</p>
                      </div>
                    </div>
                 </div>
              )}
              
              <Card className={`border border-slate-100 shadow-sm rounded-[2rem] bg-white p-6 sm:p-10 ${!isAvail ? 'opacity-60 pointer-events-none' : ''}`}>
                <form onSubmit={handleBook} className="space-y-10">
                  
                  {/* Consultation Mode */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">1. Consultation Mode</h3>
                    <RadioGroup defaultValue="clinic" onValueChange={(val: any) => setMode(val)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <RadioGroupItem value="clinic" id="clinic" className="peer sr-only" />
                        <Label
                          htmlFor="clinic"
                          className="flex flex-col items-center justify-between rounded-2xl border-2 border-slate-100 bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:bg-teal-50 peer-data-[state=checked]:text-teal-900 cursor-pointer transition-all"
                        >
                          <Building2 className="mb-3 h-6 w-6" />
                          <span className="font-bold">In-Clinic Visit</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="online" id="online" className="peer sr-only" />
                        <Label
                          htmlFor="online"
                          className="flex flex-col items-center justify-between rounded-2xl border-2 border-slate-100 bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:bg-teal-50 peer-data-[state=checked]:text-teal-900 cursor-pointer transition-all"
                        >
                          <Video className="mb-3 h-6 w-6" />
                          <span className="font-bold">Online Consultation</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Available Slots */}
                  {isAvail && (
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">2. Select Time Slot</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {slotsLoading ? (
                          <div className="col-span-full text-slate-500 text-sm">Loading slots...</div>
                        ) : doctorSlots.length === 0 ? (
                          <div className="col-span-full text-slate-500 text-sm">No schedule blocks found for today.</div>
                        ) : (
                          doctorSlots.map((slot) => {
                            const disabled = slot.isPast || slot.isFull;
                            return (
                               <button
                                  key={slot.key}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => setSelectedSlot(slot.label)}
                                  className={`py-2 px-1 text-sm font-semibold rounded-xl border-2 transition-all ${
                                    disabled ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-60' :
                                    selectedSlot === slot.label ? 'bg-teal-600 border-teal-600 text-white shadow-md' :
                                    'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50'
                                  }`}
                               >
                                  {slot.label}
                               </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Patient Details */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
                      {isAvail ? "3." : "2."} Patient Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-600 font-semibold">Full Name</Label>
                        <Input id="name" required placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} className="rounded-xl h-12 bg-slate-50 border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-600 font-semibold">Phone Number</Label>
                        <Input id="phone" required placeholder="+91" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl h-12 bg-slate-50 border-slate-200" />
                      </div>
                    </div>
                  </div>

                  {/* Secure Medical Records feature (from LocDoc) */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
                      {isAvail ? "4." : "3."} Share Medical Records (Optional)
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">Securely share previous prescriptions or diagnostic reports with {doctor.name} before the consultation.</p>
                    <Label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-teal-500 mb-2" />
                        <p className="text-sm text-slate-600 font-medium">{file ? file.name : "Click to upload files PDF/JPG"}</p>
                      </div>
                      <Input 
                        id="file-upload" 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setFile(e.target.files[0]);
                          }
                        }}
                      />
                    </Label>
                  </div>

                  {bookingError && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 font-medium">{bookingError}</p>
                    </div>
                  )}

                  <Button disabled={isSubmitting} type="submit" size="lg" className="w-full bg-teal-600 hover:bg-teal-700 h-14 rounded-xl text-lg font-bold shadow-xl shadow-teal-200">
                    {isSubmitting ? "Booking..." : "Confirm Booking & Join Queue"}
                  </Button>

                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
