import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import PatientNav from '@/components/PatientNav';
import { toast } from 'sonner';
import {
  FileText, Upload, Download, Lock, FolderHeart,
  Calendar, ImageIcon, File
} from 'lucide-react';

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type PatientFile = {
  id: string;
  file_name: string;
  file_path: string;
  created_at?: string | null;
  mime_type?: string;
  user_email?: string;
};

function FileIcon({ mime }: { mime?: string }) {
  if (mime?.startsWith('image/')) return <ImageIcon size={20} className="text-blue-500" />;
  if (mime === 'application/pdf') return <FileText size={20} className="text-red-500" />;
  return <File size={20} className="text-gray-400" />;
}

function formatDate(ts: string) {
  try {
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ts; }
}

export default function MyRecords() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    if (!user?.email) return;
    try {
      const rows = await fetch(
        `${SB_URL}/rest/v1/patient_files?user_email=eq.${encodeURIComponent(user.email)}&order=created_at.desc`,
        { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, Accept: 'application/json' } }
      ).then(r => r.json());
      if (Array.isArray(rows)) setFiles(rows as PatientFile[]);
    } catch (err) {
      console.error('Failed to fetch files', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    fetchFiles();
  }, [user, authLoading]);

  const uploadFile = async (file: File) => {
    if (!user?.email) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      // Use email-based folder so it works without a user.id from auth session
      const folder = user.email.replace(/[^a-zA-Z0-9]/g, '_');
      const storagePath = `${folder}/${safeName}`;

      // Upload via REST Storage API (bypasses SDK auth lock)
      const uploadRes = await fetch(
        `${SB_URL}/storage/v1/object/patient_records/${storagePath}`,
        {
          method: 'POST',
          headers: {
            apikey: SB_ANON,
            Authorization: `Bearer ${SB_ANON}`,
            'Content-Type': file.type || 'application/octet-stream',
            'x-upsert': 'false',
          },
          body: file,
        }
      );

      if (!uploadRes.ok) {
        const errBody = await uploadRes.json().catch(() => ({ message: uploadRes.statusText }));
        toast.error('Upload failed', { description: errBody?.message || uploadRes.statusText });
        return;
      }

      const publicUrl = `${SB_URL}/storage/v1/object/public/patient_records/${storagePath}`;

      // Save record to DB via direct REST (same pattern as bookings)
      const dbRes = await fetch(`${SB_URL}/rest/v1/patient_files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SB_ANON,
          Authorization: `Bearer ${SB_ANON}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          user_email: user.email,
          user_name: profile?.full_name ?? user.email.split('@')[0],
          file_name: file.name,
          file_path: publicUrl,
          mime_type: file.type || 'application/octet-stream',
        }),
      });

      if (!dbRes.ok) {
        const errBody = await dbRes.json().catch(() => ({ message: dbRes.statusText }));
        toast.error('Failed to save record', { description: errBody?.message || dbRes.statusText });
      } else {
        toast.success('File uploaded successfully!');
        fetchFiles();
      }
    } catch (err: any) {
      toast.error('Unexpected error', { description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
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
          <p className="text-gray-500 mb-8 max-w-sm">Your medical records are private. Sign in to access and manage your files.</p>
          <button
            onClick={() => navigate('/patient-login?redirect=/my-records')}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: '#1B4332' }}
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PatientNav />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0D2B20, #1B4332)' }} className="px-4 py-10">
        <div className="mx-auto max-w-3xl flex items-end justify-between">
          <div>
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-2">Secure Vault</p>
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              My Records
            </h1>
            <p className="text-white/50 text-sm mt-1">{files.length} file{files.length !== 1 ? 's' : ''} stored</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 flex-shrink-0 transition hover:opacity-90"
            style={{ background: '#2DD4BF' }}
          >
            <Upload size={15} />
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            title="Upload medical file"
            aria-label="Upload medical file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Upload area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative mb-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all p-8 text-center ${
            dragOver
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 bg-white'
          }`}
        >
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-sm font-semibold text-emerald-700">Uploading your file...</p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Upload size={22} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Drop a file here, or <span className="text-emerald-600">click to browse</span></p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC · Max 10MB</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Files list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}
          </div>
        ) : files.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <FolderHeart size={28} className="text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-700 mb-2">No Records Yet</h3>
            <p className="text-sm text-gray-400">Upload prescriptions, lab reports, or any medical documents here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 border border-transparent hover:border-gray-100 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <FileIcon mime={f.mime_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{f.file_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={11} /> {formatDate(f.created_at)}
                    </span>
                    {f.mime_type && (
                      <span className="text-xs text-gray-400 uppercase font-medium">
                        {f.mime_type.split('/')[1]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={f.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
