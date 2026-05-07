import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import DatePicker from "@/components/DatePicker";
import { useDoctorSlots, type DoctorScheduleRow } from "@/hooks/useDoctorSlots";
import { MOCK_DOCTORS } from "@/lib/mockData";
import { getTodayISTDateString, getNowIST, getISTDateString } from "@/lib/ist";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, Plus, Trash2, Edit2, CalendarDays,
  Clock, Users, CheckCircle2, X, Save, LogOut, Ban, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function dbPost(table: string, body: object) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SB_ANON,
      Authorization: `Bearer ${SB_ANON}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || res.statusText); }
  return res.json();
}

async function dbPatch(table: string, id: string, body: object) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SB_ANON,
      Authorization: `Bearer ${SB_ANON}`,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || res.statusText); }
  return res.json();
}

async function dbDelete(table: string, id: string) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || res.statusText); }
}

/** Bulk-cancel all active bookings for a doctor on a specific date. Returns count cancelled. */
async function cancelDayBookings(doctorId: string, date: string): Promise<number> {
  // Fetch all active bookings for this doctor + date
  const res = await fetch(
    `${SB_URL}/rest/v1/bookings?doctor_id=eq.${doctorId}&booking_date=eq.${date}&status=in.(waiting,ready,in-progress)&select=id`,
    { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, Accept: 'application/json' } }
  );
  const bookings: { id: string }[] = await res.json().catch(() => []);
  if (!Array.isArray(bookings) || bookings.length === 0) return 0;

  // Bulk PATCH all to cancelled (the WhatsApp webhook fires per row automatically)
  const patchRes = await fetch(
    `${SB_URL}/rest/v1/bookings?doctor_id=eq.${doctorId}&booking_date=eq.${date}&status=in.(waiting,ready,in-progress)`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SB_ANON,
        Authorization: `Bearer ${SB_ANON}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ status: 'cancelled' }),
    }
  );
  if (!patchRes.ok) {
    const e = await patchRes.json().catch(() => ({}));
    throw new Error(e.message || patchRes.statusText);
  }
  return bookings.length;
}

/** Count active bookings for a doctor on a date (for the confirmation preview). */
async function countDayBookings(doctorId: string, date: string): Promise<number> {
  const res = await fetch(
    `${SB_URL}/rest/v1/bookings?doctor_id=eq.${doctorId}&booking_date=eq.${date}&status=in.(waiting,ready,in-progress)&select=id`,
    { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, Accept: 'application/json' } }
  );
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows.length : 0;
}

type FormState = {
  start_time: string;
  end_time: string;
  slot_minutes: number;
  max_per_slot: number;
};

const DEFAULT_FORM: FormState = {
  start_time: '09:00',
  end_time: '13:00',
  slot_minutes: 20,
  max_per_slot: 5,
};

function formatTimeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function slotCount(row: DoctorScheduleRow): number {
  const parseM = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
  const start = parseM(row.start_time);
  const end = parseM(row.end_time);
  if (end <= start || row.slot_minutes <= 0) return 0;
  return Math.floor((end - start) / row.slot_minutes);
}

export default function ManageSlots() {
  const navigate = useNavigate();
  const doctorId = localStorage.getItem("mediq_doctor_id") || "doc1";
  const doctor = MOCK_DOCTORS.find(d => d.id === doctorId);

  // Route guard
  useEffect(() => {
    if (localStorage.getItem("mediq_auth") !== "doctor") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const today = getTodayISTDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markingDayOff, setMarkingDayOff] = useState(false);
  const [dayOffCount, setDayOffCount] = useState<number | null>(null);
  const [showDayOffConfirm, setShowDayOffConfirm] = useState(false);

  const { schedules, loading, refetch } = useDoctorSlots({ doctorId, date: selectedDate });

  // When date changes, close any open edit form and reset day-off state
  useEffect(() => {
    setShowForm(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowDayOffConfirm(false);
    setDayOffCount(null);
  }, [selectedDate]);

  /** Step 1: Preview how many bookings will be cancelled */
  const handleDayOffPreview = async () => {
    setMarkingDayOff(true);
    try {
      const count = await countDayBookings(doctorId, selectedDate);
      setDayOffCount(count);
      setShowDayOffConfirm(true);
    } catch (err: any) {
      toast.error('Failed to check bookings', { description: err?.message });
    } finally {
      setMarkingDayOff(false);
    }
  };

  /** Step 2: Confirm and execute cancellation */
  const handleDayOffConfirm = async () => {
    setMarkingDayOff(true);
    try {
      const cancelled = await cancelDayBookings(doctorId, selectedDate);
      setShowDayOffConfirm(false);
      setDayOffCount(null);
      toast.success(
        cancelled > 0
          ? `${cancelled} booking${cancelled > 1 ? 's' : ''} cancelled`
          : 'Day marked as off (no active bookings affected)',
        { description: cancelled > 0 ? 'WhatsApp notifications will be sent to affected patients.' : undefined }
      );
      refetch();
    } catch (err: any) {
      toast.error('Failed to cancel bookings', { description: err?.message });
    } finally {
      setMarkingDayOff(false);
    }
  };

  const startEdit = (row: DoctorScheduleRow) => {
    setEditingId(row.id);
    setForm({
      start_time: row.start_time,
      end_time: row.end_time,
      slot_minutes: row.slot_minutes,
      max_per_slot: row.max_per_slot,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.start_time || !form.end_time) {
      toast.error("Please fill in all time fields.");
      return;
    }
    const parseM = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
    if (parseM(form.end_time) <= parseM(form.start_time)) {
      toast.error("End time must be after start time.");
      return;
    }
    if (form.slot_minutes < 5) {
      toast.error("Slot duration must be at least 5 minutes.");
      return;
    }
    const count = slotCount({ ...form, id: '', doctor_id: doctorId, schedule_date: selectedDate, created_at: '' });
    if (count === 0) {
      toast.error("Time range is too short for the slot duration.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await dbPatch('doctor_schedules', editingId, {
          start_time: form.start_time,
          end_time: form.end_time,
          slot_minutes: form.slot_minutes,
          max_per_slot: form.max_per_slot,
        });
        toast.success("Schedule updated!", { description: `${count} slot${count > 1 ? 's' : ''} available.` });
      } else {
        await dbPost('doctor_schedules', {
          doctor_id: doctorId,
          schedule_date: selectedDate,
          start_time: form.start_time,
          end_time: form.end_time,
          slot_minutes: form.slot_minutes,
          max_per_slot: form.max_per_slot,
        });
        toast.success("Schedule added!", { description: `${count} slot${count > 1 ? 's' : ''} created for ${selectedDate}.` });
      }
      cancelForm();
      refetch();
    } catch (err: any) {
      toast.error("Failed to save", { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dbDelete('doctor_schedules', id);
      toast.success("Schedule removed.");
      refetch();
    } catch (err: any) {
      toast.error("Failed to delete", { description: err?.message });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mediq_auth");
    navigate("/");
    toast("Logged out securely.");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost" size="icon"
              onClick={() => navigate("/doctor")}
              className="rounded-full hover:bg-slate-100"
            >
              <ArrowLeft size={18} className="text-slate-700" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-teal-600 rounded-xl flex items-center justify-center">
                <CalendarDays size={18} className="text-white" />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-800 leading-tight">Manage Schedule</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{doctor?.name}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {doctor && <img src={doctor.image} alt={doctor.name} className="h-8 w-8 rounded-full border border-slate-200 hidden sm:block" />}
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={handleLogout}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Date Picker */}
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Select Date</h2>
          <DatePicker selectedDate={selectedDate} onDateSelect={setSelectedDate} days={14} />
        </section>

        {/* Schedule list for selected date */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {selectedDate === today ? "Today's Schedule" : `Schedule — ${selectedDate}`}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Each block auto-generates individual booking slots</p>
            </div>
            {!showForm && (
              <div className="flex gap-2">
                {/* Mark Day Off */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDayOffPreview}
                  disabled={markingDayOff}
                  className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl gap-1.5"
                >
                  <Ban size={14} />
                  <span className="hidden sm:inline">{markingDayOff ? 'Checking...' : 'Mark Day Off'}</span>
                </Button>
                {/* Add Block */}
                <Button
                  size="sm"
                  onClick={() => setShowForm(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-1.5"
                >
                  <Plus size={15} /> Add Block
                </Button>
              </div>
            )}
          </div>

          {/* Day Off Confirmation Banner */}
          <AnimatePresence>
            {showDayOffConfirm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-5"
              >
                <div className="rounded-2xl bg-red-50 border border-red-200 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={18} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-red-800 mb-1">Mark {selectedDate} as Day Off?</p>
                      {dayOffCount !== null && dayOffCount > 0 ? (
                        <p className="text-sm text-red-700">
                          <strong>{dayOffCount} active booking{dayOffCount > 1 ? 's' : ''}</strong> will be cancelled.
                          WhatsApp notifications will be sent to each patient automatically.
                        </p>
                      ) : (
                        <p className="text-sm text-red-700">No active bookings on this date. Safe to mark as day off.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => { setShowDayOffConfirm(false); setDayOffCount(null); }}
                      className="rounded-xl text-slate-600"
                    >
                      <X size={14} className="mr-1" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDayOffConfirm}
                      disabled={markingDayOff}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-1.5"
                    >
                      <Ban size={14} />
                      {markingDayOff ? 'Cancelling...' : `Confirm${dayOffCount ? ` & Cancel ${dayOffCount}` : ''}`}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add / Edit Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <Card className="mb-5 border border-teal-200 bg-teal-50/50 rounded-3xl overflow-hidden">
                  <form onSubmit={handleSave} className="p-6 space-y-5">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      {editingId ? <Edit2 size={16} className="text-teal-600" /> : <Plus size={16} className="text-teal-600" />}
                      {editingId ? 'Edit Schedule Block' : 'New Schedule Block'}
                    </h3>

                    {/* Time range */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-600">Start Time</Label>
                          <Input
                            type="time"
                            value={form.start_time}
                            onChange={e => {
                              const newStart = e.target.value;
                              setForm(f => {
                                const updated = { ...f, start_time: newStart };
                                // Auto-bump end time if it's now <= new start
                                if (newStart >= f.end_time) {
                                  const [h, m] = newStart.split(':').map(Number);
                                  const bumpedH = h + 1;
                                  // Cap at 23:59 to avoid overflow
                                  updated.end_time = bumpedH <= 23
                                    ? `${String(bumpedH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
                                    : '23:59';
                                }
                                return updated;
                              });
                            }}
                            className="rounded-xl h-10 bg-white border-slate-200"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-600">End Time</Label>
                          <Input
                            type="time"
                            value={form.end_time}
                            min={form.start_time}
                            onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                            className={`rounded-xl h-10 bg-white border-slate-200 ${
                              form.end_time && form.start_time && form.end_time <= form.start_time
                                ? 'border-red-400 focus-visible:ring-red-400'
                                : ''
                            }`}
                            required
                          />
                        </div>
                      </div>
                      {/* Live inline time validation warning */}
                      {form.start_time && form.end_time && form.end_time <= form.start_time && (
                        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                          <AlertTriangle size={12} />
                          <span>End time must be after start time.</span>
                        </div>
                      )}
                    </div>

                    {/* Slot config */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Slot Duration (min)</Label>
                        <Input
                          type="number" min="5" max="120" step="5"
                          value={form.slot_minutes}
                          onChange={e => setForm(f => ({ ...f, slot_minutes: parseInt(e.target.value) || 20 }))}
                          className="rounded-xl h-10 bg-white border-slate-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Max Patients / Slot</Label>
                        <Input
                          type="number" min="1" max="50"
                          value={form.max_per_slot}
                          onChange={e => setForm(f => ({ ...f, max_per_slot: parseInt(e.target.value) || 5 }))}
                          className="rounded-xl h-10 bg-white border-slate-200"
                        />
                      </div>
                    </div>

                    {/* Preview count */}
                    {form.start_time && form.end_time && form.slot_minutes >= 5 && (() => {
                      const count = slotCount({ ...form, id: '', doctor_id: doctorId, schedule_date: selectedDate, created_at: '' });
                      return count > 0 ? (
                        <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2">
                          <CheckCircle2 size={13} />
                          <span>This will generate <strong>{count} slot{count > 1 ? 's' : ''}</strong> ({formatTimeLabel(form.start_time)} → {formatTimeLabel(form.end_time)}, {form.slot_minutes} min each, max {form.max_per_slot} patients)</span>
                        </div>
                      ) : null;
                    })()}

                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={cancelForm} className="rounded-xl">
                        <X size={14} className="mr-1" /> Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-1.5">
                        <Save size={14} /> {saving ? 'Saving…' : (editingId ? 'Update' : 'Save Block')}
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Schedule blocks list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-24 rounded-3xl bg-white animate-pulse border border-slate-100" />)}
            </div>
          ) : schedules.length === 0 && !showForm ? (
            <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-slate-200">
              <CalendarDays size={40} className="mx-auto mb-3 text-slate-200" />
              <p className="font-bold text-slate-500">No schedule for this date</p>
              <p className="text-sm text-slate-400 mt-1">Click "Add Block" to define your availability.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {schedules.map((row) => {
                  const count = slotCount(row);
                  return (
                    <motion.div
                      key={row.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <Card className="border border-slate-100 shadow-sm rounded-3xl bg-white overflow-hidden">
                        <div className="p-5 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                              <Clock size={20} className="text-teal-600" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-base">
                                {formatTimeLabel(row.start_time)} — {formatTimeLabel(row.end_time)}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                <Badge variant="outline" className="text-[11px] text-slate-500 border-slate-200 gap-1">
                                  <Clock size={10} /> {row.slot_minutes} min slots
                                </Badge>
                                <Badge variant="outline" className="text-[11px] text-slate-500 border-slate-200 gap-1">
                                  <Users size={10} /> {row.max_per_slot} max/slot
                                </Badge>
                                <Badge className="text-[11px] bg-teal-50 text-teal-700 border-teal-200 border">
                                  {count} slot{count !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => startEdit(row)}
                              className="h-8 w-8 rounded-xl hover:bg-teal-50 hover:text-teal-700"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => handleDelete(row.id)}
                              className="h-8 w-8 rounded-xl hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
