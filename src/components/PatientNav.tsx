import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { MediQMark } from '@/components/MediQLogo';
import {
  Home, Stethoscope, Activity, CalendarDays, FolderHeart, Settings, LogOut,
  Menu, X, ChevronDown, User
} from 'lucide-react';
import { toast } from 'sonner';

const NAV_LINKS = [
  { label: 'Home',            to: '/',                icon: Home },
  { label: 'Doctors',         to: '/#specialists',    icon: Stethoscope },
  { label: 'Live Queue',      to: '/status',          icon: Activity },
  { label: 'My Appointments', to: '/my-appointments', icon: CalendarDays },
  { label: 'My Records',      to: '/my-records',      icon: FolderHeart },
  { label: 'Settings',        to: '/settings',        icon: Settings },
];

export default function PatientNav() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to.split('#')[0]) && to !== '/';
  };

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Patient';

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <MediQMark size={32} />
            <span className="hidden sm:block font-black text-lg tracking-tight text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              MediQ
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ label, to, icon: Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right: User or Login */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1B4332, #2DD4BF)' }}>
                    {displayName[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 rounded-2xl bg-white shadow-xl border border-gray-100 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User size={14} /> My Profile
                      </Link>
                      <Link
                        to="/my-appointments"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <CalendarDays size={14} /> My Appointments
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/patient-login"
                className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
                style={{ background: '#1B4332' }}
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-100 bg-white px-4 pb-4 overflow-hidden"
            >
              <div className="pt-3 space-y-1">
                {NAV_LINKS.map(({ label, to, icon: Icon }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        active ? 'bg-emerald-50 text-emerald-800' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </Link>
                  );
                })}
                {user && (
                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Click-outside to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </>
  );
}
