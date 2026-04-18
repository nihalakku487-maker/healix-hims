import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { getTodayISTDateString } from "@/lib/ist";
import { Activity, Users, Clock, CheckCircle, TrendingUp, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { MOCK_DOCTORS } from "@/lib/mockData";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    waiting: 0,
    inProgress: 0,
  });

  const [docStats, setDocStats] = useState<Record<string, number>>({});
  const [bookingsList, setBookingsList] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const today = getTodayISTDateString();
      const { data } = await supabase.from('bookings').select('*').eq('booking_date', today);
      
      if (data) {
        let t = 0, c = 0, w = 0, i = 0;
        const dStats: Record<string, number> = {};
        
        data.forEach(b => {
           t++;
           if (b.status === 'done') c++;
           if (b.status === 'waiting') w++;
           if (b.status === 'in-progress') i++;
           
           if (b.doctor_id) {
             dStats[b.doctor_id] = (dStats[b.doctor_id] || 0) + 1;
           }
        });
        
        setStats({ total: t, completed: c, waiting: w, inProgress: i });
        setDocStats(dStats);
        setBookingsList(data);
      }
    };
    
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000); // Polling for analytics every 15s instead of ws to save connections
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-200">
      <header className="bg-white border-b border-slate-100 shadow-sm z-10 sticky top-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 text-white rounded-2xl bg-indigo-600 flex items-center justify-center">
              <BarChart strokeWidth={2.5} size={20} />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-800 tracking-tight">Hospital Analytics</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Executive View</p>
            </div>
          </div>
          <Button variant="ghost" className="text-slate-500 hover:bg-slate-100" onClick={() => navigate("/")}>
             Exit
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
         <h2 className="text-2xl font-black text-slate-800 mb-6">Today's Overview</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="border-0 shadow-sm bg-white pt-6">
              <CardContent>
                <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Patients</p>
                     <p className="text-4xl font-black text-slate-800">{stats.total}</p>
                   </div>
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                     <Users size={24} />
                   </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white pt-6">
              <CardContent>
                <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                     <p className="text-4xl font-black text-slate-800">{stats.completed}</p>
                   </div>
                   <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                     <CheckCircle size={24} />
                   </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white pt-6">
              <CardContent>
                <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Waiting</p>
                     <p className="text-4xl font-black text-slate-800">{stats.waiting}</p>
                   </div>
                   <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                     <Clock size={24} />
                   </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white pt-6">
              <CardContent>
                <div className="flex justify-between items-start">
                   <div>
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">In-Progress</p>
                     <p className="text-4xl font-black text-slate-800">{stats.inProgress}</p>
                   </div>
                   <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                     <Activity size={24} />
                   </div>
                </div>
              </CardContent>
            </Card>
         </div>

         <h2 className="text-2xl font-black text-slate-800 mb-6">Patient Distribution by Doctor</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Object.keys(docStats).length === 0 ? (
               <p className="text-slate-500 text-sm italic">No data yet for today.</p>
            ) : Object.keys(docStats).map(docId => {
               const doc = MOCK_DOCTORS.find(d => d.id === docId);
               const shortName = doc ? `Dr. ${doc.name.split(' ')[1] || doc.name.split(' ')[0]}` : docId;
               return (
                 <Card key={docId} className="border-0 shadow-sm">
                   <CardContent className="p-6">
                     <p className="text-sm font-bold text-slate-500 uppercase">{shortName}</p>
                     <p className="text-3xl font-black text-indigo-600 mt-2">{docStats[docId]} <span className="text-sm text-slate-400 font-medium tracking-normal">patients</span></p>
                   </CardContent>
                 </Card>
               );
            })}
         </div>

         <h2 className="text-2xl font-black text-slate-800 mb-6 mt-12">Today's Appointments Directory</h2>
         <Card className="border border-slate-100 shadow-sm bg-white rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-xs tracking-wider">
                     <tr>
                        <th className="px-6 py-5">Patient Name</th>
                        <th className="px-6 py-5">Phone Number</th>
                        <th className="px-6 py-5">Doctor</th>
                        <th className="px-6 py-5">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {bookingsList.map((b, i) => {
                        const docName = MOCK_DOCTORS.find(d => d.id === b.doctor_id)?.name || b.doctor_id;
                        return (
                           <tr key={b.id || i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-extrabold text-slate-800">{b.patient_name}</td>
                              <td className="px-6 py-4 text-slate-600 font-medium">{b.phone || "N/A"}</td>
                              <td className="px-6 py-4 text-slate-800 font-bold">{docName}</td>
                              <td className="px-6 py-4">
                                 <Badge variant="secondary" className={`border-0 font-bold px-3 py-1 uppercase tracking-wider ${
                                    b.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                                    b.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                    b.status === 'no-show' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                 }`}>
                                    {b.status}
                                 </Badge>
                              </td>
                           </tr>
                        );
                     })}
                     {bookingsList.length === 0 && (
                        <tr>
                           <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold">
                              No appointments found for today.
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </Card>
      </main>
    </div>
  );
}
