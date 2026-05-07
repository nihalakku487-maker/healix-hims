import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import PatientNav from '@/components/PatientNav';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Bell, User, LogOut, Phone, Lock, ChevronRight,
  Check, Settings as SettingsIcon, MessageCircle
} from 'lucide-react';

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Format phone number for display: +91 91425 88422
function formatPhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+91') && digits.length > 3) {
    const local = digits.slice(3);
    if (local.length <= 5) return `+91 ${local}`;
    return `+91 ${local.slice(0, 5)} ${local.slice(5, 10)}`;
  }
  return digits;
}

function stripFormatting(v: string): string {
  return v.replace(/\s/g, '');
}

type NotificationPrefs = {
  notify_at_3: boolean;
  notify_at_2: boolean;
  notify_at_1: boolean;
  notify_at_turn: boolean;
  whatsapp_number: string;
};

const DEFAULT_PREFS: NotificationPrefs = {
  notify_at_3: true,
  notify_at_2: true,
  notify_at_1: true,
  notify_at_turn: true,
  whatsapp_number: '+91',
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      title={label ?? 'Toggle notification'}
      aria-label={label ?? 'Toggle notification'}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-emerald-600' : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

export default function Settings() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  useEffect(() => {
    if (authLoading || !user?.email) { setLoadingPrefs(false); return; }
    
    const loadPrefs = async () => {
      try {
        const rows = await fetch(
          `${SB_URL}/rest/v1/notification_preferences?user_email=eq.${encodeURIComponent(user.email!)}&limit=1`,
          { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, Accept: 'application/json' } }
        ).then(r => r.json());
        const data = Array.isArray(rows) ? rows[0] : null;
        if (data) {
          setPrefs({
            notify_at_3: data.notify_at_3 ?? true,
            notify_at_2: data.notify_at_2 ?? true,
            notify_at_1: data.notify_at_1 ?? true,
            notify_at_turn: data.notify_at_turn ?? true,
            whatsapp_number: data.whatsapp_number || '+91',
          });
        }
      } catch (err) {
        console.error('Failed to load prefs', err);
      } finally {
        setLoadingPrefs(false);
      }
    };
    
    loadPrefs();
  }, [user, authLoading]);

  const savePrefs = async () => {
    if (!user?.email) return;
    setSavingPrefs(true);
    try {
      // Use direct fetch to bypass auth lock — same approach as booking insert
      const res = await fetch(`${SB_URL}/rest/v1/notification_preferences?on_conflict=user_email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SB_ANON,
          Authorization: `Bearer ${SB_ANON}`,
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          user_email: user.email,
          notify_at_3: prefs.notify_at_3,
          notify_at_2: prefs.notify_at_2,
          notify_at_1: prefs.notify_at_1,
          notify_at_turn: prefs.notify_at_turn,
          whatsapp_number: stripFormatting(prefs.whatsapp_number) || null,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        toast.error('Failed to save', { description: err?.message || res.statusText });
      } else {
        toast.success('Notification preferences saved!');
      }
    } catch (err: any) {
      toast.error('Failed to save', { description: err?.message || 'Network error' });
    }
    setSavingPrefs(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/');
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
        <PatientNav />
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Sign In Required</h1>
          <p className="text-gray-500 mb-8 max-w-sm">Sign in to manage your notification preferences and account settings.</p>
          <button
            onClick={() => navigate('/patient-login?redirect=/settings')}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: '#1B4332' }}
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Patient';

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PatientNav />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0D2B20, #1B4332)' }} className="px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-2">Account</p>
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Settings</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Profile</h2>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: '#F9FAFB' }}>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1B4332, #2DD4BF)' }}
            >
              {displayName[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900">{displayName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Notification Preferences</h2>
          </div>
          <p className="text-xs text-gray-400 mb-6">Get WhatsApp alerts when your queue position reaches a threshold.</p>

          {/* WhatsApp Number */}
          <div className="mb-6">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
              <MessageCircle size={14} className="text-emerald-600" /> WhatsApp Number
            </Label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={formatPhone(prefs.whatsapp_number)}
                onChange={e => {
                  // Strip spaces before storing, reformat on display
                  const raw = stripFormatting(e.target.value);
                  setPrefs(p => ({ ...p, whatsapp_number: raw }));
                }}
                className="pl-10 h-12 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-emerald-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Include country code (e.g. +91 for India). Must be active on WhatsApp.</p>
          </div>

          {/* Notification toggles */}
          <div className="space-y-4">
            {[
              { key: 'notify_at_3', label: 'Notify when 3 patients ahead', desc: 'Start heading to the clinic' },
              { key: 'notify_at_2', label: 'Notify when 2 patients ahead', desc: 'Be ready to check in' },
              { key: 'notify_at_1', label: 'Notify when 1 patient ahead', desc: 'Move to the waiting area' },
              { key: 'notify_at_turn', label: "Notify when it's your turn", desc: 'Proceed to the doctor now' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <Toggle
                  checked={prefs[key as keyof NotificationPrefs] as boolean}
                  onChange={v => setPrefs(p => ({ ...p, [key]: v }))}
                  label={label}
                />
              </div>
            ))}
          </div>

          <button
            onClick={savePrefs}
            disabled={savingPrefs || loadingPrefs}
            className="w-full mt-6 h-12 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}
          >
            {savingPrefs ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Check size={16} /> Save Preferences</>
            )}
          </button>
        </motion.div>

        {/* Account Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-2 flex items-center gap-2">
            <SettingsIcon size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Account</h2>
          </div>
          <div>
            <button
              onClick={() => navigate('/my-appointments')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-sm font-medium text-gray-700">My Appointments</span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
            <div className="h-px bg-gray-50 mx-6" />
            <button
              onClick={() => navigate('/my-records')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-sm font-medium text-gray-700">My Medical Records</span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
            <div className="h-px bg-gray-50 mx-6" />
            <button
              onClick={handleSignOut}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-50 transition-colors text-left"
            >
              <span className="text-sm font-semibold text-red-600">Sign Out</span>
              <LogOut size={16} className="text-red-300" />
            </button>
          </div>
        </motion.div>

        <p className="text-center text-xs text-gray-400 pb-4">
          MediQ · Your health data is encrypted and never shared.
        </p>
      </div>
    </div>
  );
}
