import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Lock, 
  Mail, 
  Phone, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  User, 
  KeyRound,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { authService, LoginCredentials } from '../services/authService';
import { storageService } from '../services/storageService';
import { Admin, Member } from '../types';
import { MemberForgotPasswordModal } from '../components/member/MemberForgotPasswordModal';

interface LoginPageProps {
  onLoginSuccess: (admin: Admin) => void;
  onMemberLoginSuccess?: (member: Member) => void;
  onSwitchToMemberLogin?: () => void;
  initialMode?: 'admin' | 'member';
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess, 
  onMemberLoginSuccess, 
  onSwitchToMemberLogin,
  initialMode = 'admin'
}) => {
  const [authMode, setAuthMode] = useState<'admin' | 'member'>(initialMode);

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Member Form State
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [memberPassword, setMemberPassword] = useState('');

  // Common State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [demoMembers, setDemoMembers] = useState<Member[]>([]);

  useEffect(() => {
    // Load existing members for quick demo selection
    try {
      const allMembers = storageService.getMembers();
      setDemoMembers(allMembers.slice(0, 3));
    } catch (e) {
      console.warn('Could not load members for demo:', e);
    }
  }, []);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!adminEmail.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
      errors.email = 'Please enter a valid email format';
    }

    if (!adminPassword) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const credentials: LoginCredentials = {
        email: adminEmail.trim(),
        password: adminPassword,
      };

      const result = await authService.login(credentials);
      if (result.success && result.admin) {
        onLoginSuccess(result.admin);
      } else {
        setErrorMessage(result.errorMessage || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!memberIdentifier.trim()) {
      errors.identifier = 'Phone number or email is required';
    }

    if (!memberPassword) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.memberLogin({
        identifier: memberIdentifier.trim(),
        password: memberPassword,
      });

      if (result.success && result.member) {
        if (onMemberLoginSuccess) {
          onMemberLoginSuccess(result.member);
        }
      } else {
        setErrorMessage(result.errorMessage || 'Invalid phone/email or password.');
      }
    } catch (err) {
      console.error('Member login error:', err);
      setErrorMessage('Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFillMember = (m: Member) => {
    setMemberIdentifier(m.phone || m.email || '');
    setMemberPassword('member123');
    setFieldErrors({});
    setErrorMessage(null);
  };

  return (
    <div id="login-page" className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Brand Banner */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
            <Dumbbell className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">GymFlow</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 tracking-wider">
                Fitness Center
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Secure Gym Authentication</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md my-auto py-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
          {/* Subtle Accent Line */}
          <div className={`absolute top-0 left-0 right-0 h-1 transition-colors ${
            authMode === 'member' ? 'bg-emerald-500' : 'bg-indigo-600'
          }`} />

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
            <button
              id="switch-to-member-tab"
              type="button"
              onClick={() => {
                setAuthMode('member');
                setErrorMessage(null);
                setFieldErrors({});
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'member'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Member Portal</span>
            </button>

            <button
              id="switch-to-admin-tab"
              type="button"
              onClick={() => {
                setAuthMode('admin');
                setErrorMessage(null);
                setFieldErrors({});
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Staff / Owner</span>
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6 text-left">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {authMode === 'member' ? 'Member Sign In' : 'Staff & Admin Sign In'}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
              {authMode === 'member'
                ? 'Enter your registered phone or email to view your digital pass, check-in history, and renewals.'
                : 'Enter your staff or owner credentials to access the gym management dashboard.'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              id="login-error-alert"
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Member Login Form */}
          {authMode === 'member' ? (
            <form onSubmit={handleMemberSubmit} className="space-y-4" noValidate>
              {/* Phone or Email Field */}
              <div>
                <label htmlFor="member-login-identifier" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="member-login-identifier"
                    type="text"
                    value={memberIdentifier}
                    onChange={(e) => {
                      setMemberIdentifier(e.target.value);
                      if (fieldErrors.identifier) setFieldErrors({ ...fieldErrors, identifier: '' });
                    }}
                    placeholder="+91 98765 43210 or member@gmail.com"
                    disabled={isLoading}
                    className={`w-full bg-slate-950 border text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                      fieldErrors.identifier
                        ? 'border-rose-600 focus:border-rose-500'
                        : 'border-slate-800 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {fieldErrors.identifier && (
                  <p className="text-xs text-rose-400 mt-1 pl-1">{fieldErrors.identifier}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="member-login-password" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="member-login-password"
                    type="password"
                    value={memberPassword}
                    onChange={(e) => {
                      setMemberPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                    placeholder="••••••••••••"
                    disabled={isLoading}
                    className={`w-full bg-slate-950 border text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                      fieldErrors.password
                        ? 'border-rose-600 focus:border-rose-500'
                        : 'border-slate-800 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-rose-400 mt-1 pl-1">{fieldErrors.password}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Default initial password is <span className="font-mono text-emerald-400 font-bold">member123</span>
                </p>
              </div>

              {/* Submit Button */}
              <button
                id="member-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to Member Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Admin / Staff Login Form */
            <form onSubmit={handleAdminSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="login-email-input" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Staff / Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email-input"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    placeholder="admin@gymflow.demo"
                    disabled={isLoading}
                    className={`w-full bg-slate-950 border text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                      fieldErrors.email
                        ? 'border-rose-600 focus:border-rose-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p id="email-error-text" className="text-xs text-rose-400 mt-1 pl-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="login-password-input" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                    placeholder="••••••••••••"
                    disabled={isLoading}
                    className={`w-full bg-slate-950 border text-slate-100 placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                      fieldErrors.password
                        ? 'border-rose-600 focus:border-rose-500'
                        : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {fieldErrors.password && (
                  <p id="password-error-text" className="text-xs text-rose-400 mt-1 pl-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                id="login-submit-button"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to Admin Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Helper Section */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Demo Accounts</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">1-Click Auto-Fill</span>
            </div>

            {authMode === 'member' ? (
              <div className="space-y-1.5">
                {demoMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleQuickFillMember(m)}
                    className="w-full p-2.5 rounded-xl text-left border bg-slate-950/80 border-slate-800 hover:border-emerald-500/60 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{m.full_name}</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded">
                          {m.membershipPlan || 'Member'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{m.phone} • {m.email}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                      Fill
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('admin@gymflow.demo');
                    setAdminPassword('admin123');
                    setFieldErrors({});
                    setErrorMessage(null);
                  }}
                  className="p-2 rounded-xl text-left border bg-slate-950/80 border-slate-800 hover:border-indigo-500/60 text-slate-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-400">Vikram</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold uppercase">Owner</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">admin@gymflow.demo</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('staff@gymflow.demo');
                    setAdminPassword('staff123');
                    setFieldErrors({});
                    setErrorMessage(null);
                  }}
                  className="p-2 rounded-xl text-left border bg-slate-950/80 border-slate-800 hover:border-emerald-500/60 text-slate-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400">Rahul Sharma</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">Staff</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">staff@gymflow.demo</p>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <MemberForgotPasswordModal
          initialIdentifier={memberIdentifier}
          onClose={() => setShowForgotPassword(false)}
          onSuccess={(id) => {
            setShowForgotPassword(false);
            if (id) setMemberIdentifier(id);
          }}
        />
      )}

      {/* Footer Info */}
      <footer className="w-full max-w-md text-center py-4 text-xs text-slate-500">
        <p>GymFlow Fitness Center — Management & Member Platform</p>
      </footer>
    </div>
  );
};
