import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { MediQMark } from '@/components/MediQLogo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Stethoscope, Shield, Activity } from 'lucide-react';

export default function PatientAuth() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already logged in
  if (user) {
    navigate(redirect);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) { toast.error('Please enter your full name'); setLoading(false); return; }
        if (password.length < 6) { toast.error('Password must be at least 6 characters'); setLoading(false); return; }
        await signUp(email.trim(), password, name.trim());
        toast.success('Account created!', { description: 'Welcome to MediQ. You are now signed in.' });
      } else {
        await signIn(email.trim(), password);
        toast.success('Welcome back!');
      }
      navigate(redirect);
    } catch (err: any) {
      let msg = err.message ?? 'Something went wrong';
      if (msg.includes('Invalid login credentials')) msg = 'Incorrect email or password.';
      if (msg.includes('User already registered')) msg = 'An account with this email already exists. Sign in instead.';
      if (msg.includes('Email not confirmed')) msg = 'Please check your inbox to confirm your email.';
      toast.error(mode === 'signin' ? 'Sign In Failed' : 'Sign Up Failed', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left: Branding panel (hidden on mobile) */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0D2B20 0%, #1B4332 50%, #0D3B2C 100%)' }}
      >
        {/* Ambient circles */}
        <div className="absolute top-[-10%] right-[-10%] w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2DD4BF, transparent)' }} />
        <div className="absolute bottom-[-5%] left-[-10%] w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #34D399, transparent)' }} />

        <div>
          <div className="flex items-center gap-3 mb-16">
            <MediQMark size={44} />
            <span className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              MediQ
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Your health,<br />
            <span className="text-emerald-400">your records,</span><br />
            your queue.
          </h1>
          <p className="text-emerald-100/60 text-lg leading-relaxed max-w-sm">
            One account to book appointments, track your live queue position, and access all your medical records securely.
          </p>
        </div>

        {/* Feature pills */}
        <div className="space-y-4">
          {[
            { icon: Activity, text: 'Live queue tracking with real-time updates' },
            { icon: Shield, text: 'Your records are private and encrypted' },
            { icon: Stethoscope, text: 'Book with top specialists in seconds' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(45,212,191,0.15)' }}>
                <Icon size={15} className="text-emerald-400" />
              </div>
              <p className="text-sm text-emerald-100/70 font-medium">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <MediQMark size={36} />
            <span className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              MediQ
            </span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            {/* Mode Toggle */}
            <div className="flex p-1 rounded-2xl mb-8" style={{ background: '#F3F4F6' }}>
              {(['signin', 'signup'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    mode === m
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'signup' ? -20 : 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {mode === 'signin'
                      ? 'Sign in to access your appointments and records'
                      : 'Join MediQ for seamless healthcare management'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-gray-700">Full Name</Label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="patient-name"
                          required
                          placeholder="e.g. Agnel Thomas"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="pl-10 h-12 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-emerald-500 focus-visible:border-emerald-400"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-gray-700">Email Address</Label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="patient-email"
                        type="email"
                        required
                        placeholder="you@gmail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="pl-10 h-12 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-emerald-500 focus-visible:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-gray-700">Password</Label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="patient-password"
                        type={showPass ? 'text' : 'password'}
                        required
                        placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-emerald-500 focus-visible:border-emerald-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="patient-auth-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01] active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                      </span>
                    ) : (
                      <>
                        {mode === 'signin' ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  {mode === 'signin' ? 'Create one' : 'Sign in'}
                </button>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Are you a doctor or staff?{' '}
                <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                  Provider portal →
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
