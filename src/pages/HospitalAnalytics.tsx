import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Booking } from "@/lib/supabase";
import { MOCK_DOCTORS } from "@/lib/mockData";
import { getTodayISTDateString } from "@/lib/ist";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function restGet(path: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
import {
  Activity, Users, CheckCircle, XCircle, Clock, TrendingUp,
  TrendingDown, BarChart2, ArrowLeft, RefreshCw, AlertTriangle,
  UserCheck, Stethoscope, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtPct(n: number, d: number) {
  if (d === 0) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

function avgConsultMins(bookings: Booking[]): string {
  const completed = bookings.filter(
    (b) => b.status === "done" && b.called_at && b.created_at
  );
  if (!completed.length) return "—";
  const totalMs = completed.reduce((sum, b) => {
    const start = new Date(b.called_at!).getTime();
    const now = Date.now();
    return sum + Math.max(0, now - start);
  }, 0);
  return `${Math.round(totalMs / completed.length / 60000)} min`;
}

// Bin bookings into hourly slots (6 AM → 9 PM)
function buildHourlyBins(bookings: Booking[]): { hour: string; count: number; done: number }[] {
  const bins: Record<number, { count: number; done: number }> = {};
  for (let h = 6; h <= 21; h++) bins[h] = { count: 0, done: 0 };

  bookings.forEach((b) => {
    const created = new Date(b.created_at);
    const ist = new Date(created.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const h = ist.getHours();
    if (h >= 6 && h <= 21) {
      bins[h].count++;
      if (b.status === "done") bins[h].done++;
    }
  });

  return Object.entries(bins).map(([h, v]) => ({
    hour: `${parseInt(h) > 12 ? parseInt(h) - 12 : parseInt(h)}${parseInt(h) >= 12 ? "PM" : "AM"}`,
    count: v.count,
    done: v.done,
  }));
}

// ─── component ──────────────────────────────────────────────────────────────

export default function HospitalAnalytics() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISTDateString());
  const today = selectedDate;
  const jeevodayaDoctors = MOCK_DOCTORS.filter((d) => d.hospitalId === "jeevodaya");

  const fetchAll = async () => {
    setLoading(true);
    // Fetch last 7 days for trend context relative to selectedDate
    const selected = new Date(selectedDate);
    const sevenDaysAgo = new Date(selected);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const from = sevenDaysAgo.toISOString().slice(0, 10);

    try {
      const data = await restGet(
        `bookings?booking_date=gte.${from}&booking_date=lte.${selectedDate}&order=created_at.asc`
      );
      setBookings(Array.isArray(data) ? (data as Booking[]) : []);
    } catch (err: any) {
      toast.error("Failed to load analytics data", { description: err?.message });
    }
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    fetchAll();
    const sub = supabase
      .channel("analytics-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [selectedDate]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const todayBookings = bookings.filter((b) => b.booking_date === today);
  const totalToday = todayBookings.length;
  const done = todayBookings.filter((b) => b.status === "done").length;
  const noShow = todayBookings.filter((b) => b.status === "no-show").length;
  const waiting = todayBookings.filter((b) => b.status === "waiting").length;
  const active = todayBookings.filter((b) => b.status === "in-progress" || b.status === "ready").length;

  // Yesterday comparison
  const yday = new Date(selectedDate); yday.setDate(yday.getDate() - 1);
  const yesterdayStr = yday.toISOString().slice(0, 10);
  const yesterdayBookings = bookings.filter((b) => b.booking_date === yesterdayStr);
  const yTotal = yesterdayBookings.length;
  const yDone = yesterdayBookings.filter((b) => b.status === "done").length;

  // Hourly bins
  const hourlyBins = buildHourlyBins(todayBookings);
  const maxBinCount = Math.max(...hourlyBins.map((b) => b.count), 1);

  // Per-doctor stats
  const doctorStats = jeevodayaDoctors.map((doc) => {
    const db = todayBookings.filter((b) => b.doctor_id === doc.id);
    return {
      doc,
      total: db.length,
      done: db.filter((b) => b.status === "done").length,
      waiting: db.filter((b) => b.status === "waiting").length,
      active: db.filter((b) => b.status === "in-progress" || b.status === "ready").length,
      noShow: db.filter((b) => b.status === "no-show").length,
      avgConsult: avgConsultMins(db),
    };
  });

  // 7-day daily summary
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedDate); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const db = bookings.filter((b) => b.booking_date === ds);
    return {
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      date: ds,
      total: db.length,
      done: db.filter((b) => b.status === "done").length,
      noShow: db.filter((b) => b.status === "no-show").length,
    };
  });
  const max7 = Math.max(...days7.map((d) => d.total), 1);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-teal-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl">
              <ArrowLeft size={20} />
            </Button>
            <div className="h-10 w-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-md shadow-teal-200">
              <BarChart2 strokeWidth={2.5} size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Hospital Analytics</h1>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sastha Healthcare & Wellness Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium hidden sm:block">
              Refreshed {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-teal-500 transition-all">
              <Calendar size={14} className="text-teal-600" />
              <input 
                type="date"
                value={selectedDate}
                max={getTodayISTDateString()}
                title="Select analytics date"
                aria-label="Select analytics date"
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-0 text-sm font-bold text-teal-800 outline-none w-auto cursor-pointer"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── KPI Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Today", value: totalToday, icon: Users, color: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-600",
              sub: yTotal > 0 ? `${yTotal} yesterday` : "No data yesterday" },
            { label: "Completed", value: done, icon: CheckCircle, color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600",
              sub: fmtPct(done, totalToday) + " rate" },
            { label: "In Queue", value: waiting, icon: Clock, color: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-600",
              sub: `${active} active now` },
            { label: "No-Shows", value: noShow, icon: XCircle, color: "bg-red-500", bg: "bg-red-50", text: "text-red-600",
              sub: fmtPct(noShow, totalToday) + " rate" },
            { label: "Throughput", value: `${fmtPct(done, totalToday)}`, icon: TrendingUp, color: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-600",
              sub: done > yDone ? "↑ vs yesterday" : done < yDone ? "↓ vs yesterday" : "Same as yesterday" },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
              <Card className="border-0 shadow-sm bg-white rounded-3xl hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className={`w-10 h-10 ${kpi.bg} ${kpi.text} rounded-xl flex items-center justify-center`}>
                    <kpi.icon size={20} />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-800">{kpi.value}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{kpi.label}</p>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{kpi.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── Status Breakdown + 7-Day Trend ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Status Donut / Bar breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-base font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                  <Activity size={18} className="text-teal-600" /> Today's Status Breakdown
                </h2>
                <div className="space-y-3">
                  {[
                    { label: "Done", count: done, color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
                    { label: "Waiting", count: waiting, color: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
                    { label: "Active / Ready", count: active, color: "bg-teal-500", text: "text-teal-700", bg: "bg-teal-50" },
                    { label: "No-Show", count: noShow, color: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
                  ].map((s) => (
                    <div key={s.label} className={`flex items-center gap-3 ${s.bg} rounded-2xl px-4 py-3`}>
                      <span className={`text-lg font-black w-10 text-right ${s.text}`}>{s.count}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold text-slate-600">{s.label}</span>
                          <span className="text-xs text-slate-400">{fmtPct(s.count, totalToday)}</span>
                        </div>
                        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${s.color} rounded-full transition-all duration-700`}
                            style={{ width: totalToday > 0 ? `${(s.count / totalToday) * 100}%` : "0%" }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 7-Day Trend */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
            <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <h2 className="text-base font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                  <TrendingUp size={18} className="text-violet-500" /> 7-Day Patient Trend
                </h2>
                <div className="flex items-end gap-2 h-40">
                  {days7.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1">
                      <span className="text-[10px] font-bold text-slate-500">{d.total || ""}</span>
                      <div className="w-full flex flex-col gap-0.5 items-center">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-700 ${d.date === today ? "bg-teal-500" : "bg-slate-200"}`}
                          style={{ height: `${Math.max(4, (d.total / max7) * 120)}px` }}
                          title={`${d.total} patients`}
                        />
                        {d.noShow > 0 && (
                          <div className="w-full h-1 bg-red-300 rounded-b" title={`${d.noShow} no-shows`} />
                        )}
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase">{d.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-3">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-teal-500" /><span className="text-xs text-slate-500">Today</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-200" /><span className="text-xs text-slate-500">Past days</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded-sm bg-red-300" /><span className="text-xs text-slate-500">No-shows</span></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── Hourly Activity ───────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-base font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                <Clock size={18} className="text-amber-500" /> Hourly Patient Activity (Today)
              </h2>
              <div className="flex items-end gap-1.5 h-32 overflow-x-auto pb-1">
                {hourlyBins.map((bin) => (
                  <div key={bin.hour} className="flex-1 min-w-[36px] flex flex-col items-center justify-end gap-1">
                    {bin.count > 0 && (
                      <span className="text-[9px] font-bold text-slate-400">{bin.count}</span>
                    )}
                    <div className="w-full relative">
                      <div
                        className="w-full bg-amber-100 rounded-t-lg transition-all duration-700"
                        style={{ height: `${Math.max(4, (bin.count / maxBinCount) * 100)}px` }}
                      />
                      {bin.done > 0 && (
                        <div
                          className="w-full bg-emerald-400 rounded-t-lg absolute bottom-0 left-0 transition-all duration-700"
                          style={{ height: `${Math.max(2, (bin.done / maxBinCount) * 100)}px` }}
                        />
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{bin.hour}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-100" /><span className="text-xs text-slate-500">Booked</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-400" /><span className="text-xs text-slate-500">Completed</span></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Per-Doctor Breakdown ──────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}>
          <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <Stethoscope size={20} className="text-teal-600" /> Doctor Performance — Today
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {doctorStats.map((ds, i) => (
              <motion.div key={ds.doc.id} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
                <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-4">
                    {/* Doctor header */}
                    <div className="flex items-center gap-3">
                      <img src={ds.doc.image} alt={ds.doc.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-100 bg-slate-100"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ds.doc.name)}&background=0d9488&color=fff&rounded=true`; }}
                      />
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm">{ds.doc.name}</p>
                        <p className="text-xs text-slate-500">{ds.doc.specialty}</p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Total", value: ds.total, color: "text-slate-800", bg: "bg-slate-50" },
                        { label: "Done", value: ds.done, color: "text-emerald-700", bg: "bg-emerald-50" },
                        { label: "Waiting", value: ds.waiting, color: "text-amber-700", bg: "bg-amber-50" },
                      ].map((s) => (
                        <div key={s.label} className={`${s.bg} rounded-xl py-2 px-1`}>
                          <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
                        <span>Completion rate</span>
                        <span className="font-bold text-slate-700">{fmtPct(ds.done, ds.total)}</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: ds.total > 0 ? `${(ds.done / ds.total) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>

                    {/* Footer row */}
                    <div className="flex items-center justify-between pt-1">
                      {ds.noShow > 0 ? (
                        <div className="flex items-center gap-1 text-red-500">
                          <AlertTriangle size={12} />
                          <span className="text-xs font-bold">{ds.noShow} no-show{ds.noShow > 1 ? "s" : ""}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <UserCheck size={12} />
                          <span className="text-xs font-bold">Zero no-shows</span>
                        </div>
                      )}
                      <Badge className={`border-0 text-[10px] font-bold ${ds.active > 0 ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
                        {ds.active > 0 ? `${ds.active} active` : "Idle"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── No-Show Alert Panel ───────────────────────────────── */}
        {noShow > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
            <Card className="border border-red-100 bg-red-50 rounded-3xl shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-base font-extrabold text-red-800 mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500" /> No-Show Log — Today
                </h2>
                <div className="space-y-2">
                  {todayBookings
                    .filter((b) => b.status === "no-show")
                    .map((b) => {
                      const doc = jeevodayaDoctors.find((d) => d.id === b.doctor_id);
                      return (
                        <div key={b.id} className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-red-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-black text-sm">
                              #{b.token_number}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{b.patient_name}</p>
                              <p className="text-xs text-slate-400">{b.time_slot} · {doc?.name ?? "Unknown Doctor"}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-red-600 border-red-200 text-[10px] font-bold">No-Show</Badge>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Footer ───────────────────────────────────────────── */}
        <p className="text-center text-xs text-slate-400 font-medium pb-4">
          Live data from Supabase · Auto-refreshes on any booking change · All times in IST
        </p>
      </main>
    </div>
  );
}
