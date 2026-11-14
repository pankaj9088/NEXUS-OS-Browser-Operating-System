import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Lock, 
  User, 
  Mail, 
  KeyRound, 
  RotateCw, 
  UserPlus, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useOSStore } from '../../store/osStore';

export const LockScreen: React.FC = () => {
  const isLocked = useOSStore((s) => s.settings.isLocked);
  const unlockSystem = useOSStore((s) => s.unlockSystem);
  const settings = useOSStore((s) => s.settings);

  const user = useOSStore((s) => s.user);
  const isAuthenticated = useOSStore((s) => s.isAuthenticated);
  const authLoading = useOSStore((s) => s.isLoading);
  const authError = useOSStore((s) => s.authError);
  const login = useOSStore((s) => s.login);
  const register = useOSStore((s) => s.register);
  const logout = useOSStore((s) => s.logout);
  const checkAuth = useOSStore((s) => s.checkAuth);
  const continueAsGuest = useOSStore((s) => s.continueAsGuest);
  const clearError = useOSStore((s) => s.clearError);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  // Clock tick
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check existing session cookie on first mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isLocked) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Basic validation
    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (authMode === 'register' && (!displayName.trim() || displayName.trim().length < 2)) {
      setLocalError('Display name must be at least 2 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'register') {
        await register({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
        });
      } else {
        await login({
          email: email.trim(),
          password,
        });
      }
      setPassword('');
      unlockSystem();
    } catch (err: any) {
      setLocalError(err.message || 'Authentication request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlockExisting = (e: React.FormEvent) => {
    e.preventDefault();
    unlockSystem();
  };

  const handleSwitchAccount = async () => {
    await logout();
    setEmail('');
    setPassword('');
    setDisplayName('');
    setLocalError(null);
    setAuthMode('login');
  };

  const activeError = localError || authError;

  return (
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-between p-6 sm:p-8 select-none bg-cover bg-center transition-all duration-300"
      style={{
        backgroundImage: settings.wallpaper.startsWith('linear') ? settings.wallpaper : `url(${settings.wallpaper})`,
      }}
    >
      {/* Dark frosted glass overlay */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl pointer-events-none" />

      {/* Top Lock Badge */}
      <div className="relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 shadow-lg">
        <Lock className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-mono text-[11px] tracking-wide">Nexus Enclave Security System</span>
      </div>

      {/* Center Clock & Authentication Container */}
      <div className="relative z-10 flex flex-col items-center space-y-6 max-w-sm w-full text-center my-auto">
        {/* Giant Time Display */}
        <div>
          <div className="text-6xl sm:text-7xl font-bold font-mono tracking-tight text-white drop-shadow-2xl">
            {time}
          </div>
          <div className="text-sm font-medium text-slate-300 mt-2 tracking-wide">
            {date}
          </div>
        </div>

        {/* If authenticated user is already logged in, show quick resume card */}
        {isAuthenticated && user ? (
          <div className="w-full flex flex-col items-center space-y-4 bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-xl shadow-cyan-500/20">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-2xl font-bold text-cyan-300">
                {user.displayName.slice(0, 1).toUpperCase()}
              </div>
            </div>

            <div>
              <div className="text-base font-bold text-white tracking-wide">{user.displayName}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</div>
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 uppercase tracking-wider font-mono">
                <ShieldCheck className="w-3 h-3" />
                {user.role === 'admin' ? 'System Administrator' : 'Authenticated User'}
              </div>
            </div>

            <form onSubmit={handleUnlockExisting} className="w-full space-y-3 pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <span>Resume Desktop Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSwitchAccount}
                className="w-full py-1.5 text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch Account / Sign Out</span>
              </button>
            </form>
          </div>
        ) : (
          /* Login & Registration Form Card */
          <div className="w-full flex flex-col items-center bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-4">
            {/* Mode Toggle Tabs */}
            <div className="flex w-full p-1 rounded-xl bg-slate-950/70 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setLocalError(null);
                  clearError();
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  authMode === 'login'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setLocalError(null);
                  clearError();
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  authMode === 'register'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>

            {/* Error Banner */}
            {activeError && (
              <div className="w-full p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{activeError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="w-full space-y-3">
              {authMode === 'register' && (
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Full Display Name (e.g. Alex Vance)"
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address (e.g. user@nexus.os)"
                  autoComplete="email"
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === 'register' ? 'Choose Password (min 6 chars)' : 'Password'}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{authMode === 'register' ? 'Creating Account...' : 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'register' ? 'Create Enclave Account' : 'Authenticate & Unlock'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Guest option */}
              <div className="pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={continueAsGuest}
                  className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  Or explore as <span className="underline font-semibold text-slate-300">Guest Explorer</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Power Actions */}
      <div className="relative z-10 flex items-center gap-4 text-xs text-slate-400">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Restart OS</span>
        </button>
      </div>
    </div>
  );
};
