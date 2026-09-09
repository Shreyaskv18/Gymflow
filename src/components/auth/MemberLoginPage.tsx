import React, { useState } from 'react';
import { Member } from '../../types';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';
import {
  Dumbbell,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  QrCode,
  Sparkles,
  ArrowLeft,
  UserCheck
} from 'lucide-react';

interface MemberLoginPageProps {
  onLoginSuccess: (member: Member) => void;
  onSwitchToStaffLogin: () => void;
}

export const MemberLoginPage: React.FC<MemberLoginPageProps> = ({
  onLoginSuccess,
  onSwitchToStaffLogin,
}) => {
  // Form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password flow
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);
  const [generatedDemoCode, setGeneratedDemoCode] = useState<string | null>(null);

  const gym = storageService.getGym();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await authService.memberLogin({ identifier, password });
      if (result.success && result.member) {
        onLoginSuccess(result.member);
      } else {
        setErrorMessage(result.errorMessage || 'Invalid credentials.');
      }
    } catch (err) {
      setErrorMessage('Login failed. Please check your phone or email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetErrorMessage(null);
    setResetSuccessMessage(null);

    const res = await authService.memberForgotPassword(forgotIdentifier);
    setResetLoading(false);

    if (res.success) {
      setResetSuccessMessage(res.message);
      if (res.resetCode) {
        setGeneratedDemoCode(res.resetCode);
        setResetCode(res.resetCode);
      }
      setResetStep('verify');
    } else {
      setResetErrorMessage(res.message || 'Unable to find member with this information.');
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetErrorMessage(null);

    const res = await authService.memberResetPassword(forgotIdentifier, resetCode, newPassword);
    setResetLoading(false);

    if (res.success) {
      setResetSuccessMessage('Password reset successful! You can now log in with your new password.');
      setTimeout(() => {
        setIsForgotMode(false);
        setResetStep('request');
        setIdentifier(forgotIdentifier);
        setPassword(newPassword);
        setResetSuccessMessage(null);
      }, 2000);
    } else {
      setResetErrorMessage(res.message || 'Invalid or expired reset code.');
    }
  };

  const handleQuickDemoFill = (demoPhone: string, demoPass: string) => {
    setIdentifier(demoPhone);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div id="member-login-page" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      {/* Visual lighting accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/25 mb-1">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {gym?.name || 'GymFlow'}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <QrCode className="w-3.5 h-3.5" />
            Member Self-Service Portal
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Access your digital gym pass, workout logs, payment invoices & membership renewals
          </p>
        </div>

        {/* Card Box */}
        <div className="mt-8 bg-slate-850/90 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-700/60">
          {!isForgotMode ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Identifier (Phone or Email) */}
              <div>
                <label htmlFor="member-identifier" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Registered Phone or Email
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="member-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. +91 98765 43210 or rahul@example.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="member-password" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <button
                    id="forgot-password-btn"
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setForgotIdentifier(identifier);
                      setResetErrorMessage(null);
                      setResetSuccessMessage(null);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="member-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Default password for demo members: <span className="font-mono text-indigo-300 font-semibold">member123</span>
                </p>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  id="member-submit-login-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/30 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing In...
                    </span>
                  ) : (
                    <>
                      Enter Member Portal <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Forgot Password Flow */
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <button
                  type="button"
                  onClick={() => setIsForgotMode(false)}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </button>
                <span className="text-xs font-bold text-indigo-300">Reset Portal Password</span>
              </div>

              {resetSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{resetSuccessMessage}</span>
                </div>
              )}

              {resetErrorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{resetErrorMessage}</span>
                </div>
              )}

              {resetStep === 'request' ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Enter your registered phone number or email address. We will generate a verification code to reset your password.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                      Phone or Email
                    </label>
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="+91 98765 43210 or email"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {resetLoading ? 'Verifying...' : 'Send Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyReset} className="space-y-4">
                  {generatedDemoCode && (
                    <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs">
                      <p className="text-indigo-300 font-bold">Demo Verification Code:</p>
                      <p className="font-mono text-base font-extrabold text-white mt-1 tracking-widest">
                        {generatedDemoCode}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Pre-filled automatically for seamless testing.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="e.g. 842196"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {resetLoading ? 'Resetting...' : 'Set New Password & Log In'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick Demo Test Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2.5">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Test Access Scenarios:</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Password: member123</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-demo-rahul"
                onClick={() => handleQuickDemoFill('+91 98765 11001', 'member123')}
                className="p-2.5 text-left bg-slate-900/70 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-[11px] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white">Rahul Sharma</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Inactive
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 mt-0.5">Account Active → Login Allowed</p>
              </button>

              <button
                type="button"
                id="btn-demo-priya"
                onClick={() => handleQuickDemoFill('+91 98765 43211', 'member123')}
                className="p-2.5 text-left bg-slate-900/70 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-[11px] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white">Priya Patel</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Expired
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 mt-0.5">Account Active → Login Allowed</p>
              </button>

              <button
                type="button"
                id="btn-demo-karthik"
                onClick={() => handleQuickDemoFill('+91 99012 34567', 'member123')}
                className="p-2.5 text-left bg-slate-900/70 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-[11px] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white">Karthik Sundaram</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 mt-0.5">Account Active → Login Allowed</p>
              </button>

              <button
                type="button"
                id="btn-demo-arun"
                onClick={() => handleQuickDemoFill('+91 98888 77771', 'member123')}
                className="p-2.5 text-left bg-slate-900/70 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-[11px] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white">Arun Verma</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/30">
                    No Plan
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 mt-0.5">Account Active → Login Allowed</p>
              </button>

              <button
                type="button"
                id="btn-demo-vikram"
                onClick={() => handleQuickDemoFill('+91 99999 00001', 'member123')}
                className="p-2.5 text-left bg-rose-950/20 hover:bg-rose-950/40 border border-rose-800/40 rounded-xl text-[11px] transition-colors cursor-pointer sm:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white">Vikram Malhotra</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40">
                    SUSPENDED
                  </span>
                </div>
                <p className="text-[10px] text-rose-400 mt-0.5">Disciplinary Hold by Owner → Login Blocked ❌</p>
              </button>
            </div>
          </div>
        </div>

        {/* Switch to Staff / Owner Portal */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Are you a Gym Owner, Admin, or Staff member?{' '}
            <button
              id="switch-to-staff-login-btn"
              type="button"
              onClick={onSwitchToStaffLogin}
              className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer ml-1"
            >
              Go to Staff Login →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
