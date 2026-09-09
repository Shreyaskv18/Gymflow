import React, { useState } from 'react';
import { 
  Dumbbell, 
  Calendar, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Flame, 
  Clock, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle, 
  AlertCircle,
  ShieldCheck,
  FileText,
  MapPin,
  PhoneCall
} from 'lucide-react';
import { Member, Gym, Payment } from '../../types';
import { AttendanceSummary } from '../../services/memberService';

interface MemberOverviewTabProps {
  member: Member;
  gym?: Gym | null;
  attendanceData: AttendanceSummary;
  payments: Payment[];
  onOpenDigitalPass: () => void;
  onOpenRenewalModal: () => void;
  onOpenReceipt: (payment: Payment) => void;
  onSwitchTab: (tab: any) => void;
}

export const MemberOverviewTab: React.FC<MemberOverviewTabProps> = ({
  member,
  gym,
  attendanceData,
  payments,
  onOpenDigitalPass,
  onOpenRenewalModal,
  onOpenReceipt,
  onSwitchTab,
}) => {
  const latestPayment = payments[0] || null;
  const isInactive = member.status === 'inactive' || !member.membership_plan_id || !member.membership_end_date;
  const isExpired = !isInactive && (member.status === 'expired' || (member.membership_end_date && new Date(member.membership_end_date).getTime() < new Date().setHours(0,0,0,0)));
  const isExpiring = !isInactive && !isExpired && (member.status === 'expiring' || (member.daysRemaining !== undefined && member.daysRemaining <= 7));

  // Calculate days remaining fallback
  const daysLeft = member.daysRemaining !== undefined ? member.daysRemaining : (() => {
    if (!member.membership_end_date) return 0;
    const end = new Date(member.membership_end_date).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  })();

  const memberFirstName = member.full_name.split(' ')[0] || member.full_name;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{gym?.name || 'GymFlow Fitness Center'} Member Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome, {memberFirstName}! 💪
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-xl">
              Track your gym attendance, manage membership renewals, make payments, view official receipts, and use your scannable digital check-in pass.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenDigitalPass}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4 mr-1.5 text-emerald-600" />
              Digital Pass
            </button>
            <button
              onClick={onOpenRenewalModal}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Renew Membership
            </button>
            <button
              onClick={onOpenRenewalModal}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4 mr-1.5 text-emerald-400" />
              Make Payment
            </button>
          </div>
        </div>

        {/* Inactive Membership Status Banner */}
        {isInactive && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300 text-sm sm:text-base">Your membership is currently inactive.</p>
                <p className="text-amber-200/90 text-xs mt-0.5">
                  Your login account is active, but you do not have an active gym package. Renew now or make a payment to begin workouts.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={onOpenRenewalModal}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-sm cursor-pointer"
              >
                Renew Membership
              </button>
              <button
                onClick={onOpenRenewalModal}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30 transition-colors cursor-pointer"
              >
                Make Payment
              </button>
              <button
                onClick={() => onSwitchTab('payments')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                View Payment History
              </button>
            </div>
          </div>
        )}

        {/* Expired Membership Status Banner */}
        {isExpired && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-300 text-sm sm:text-base">Your membership has expired.</p>
                <p className="text-rose-200/90 text-xs mt-0.5">
                  Your membership ended on {member.membership_end_date}. Your account remains accessible so you can renew or view records.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={onOpenRenewalModal}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-400 transition-colors shadow-sm cursor-pointer"
              >
                Renew Membership
              </button>
              <button
                onClick={onOpenRenewalModal}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40 hover:bg-rose-500/30 transition-colors cursor-pointer"
              >
                Make Payment
              </button>
              <button
                onClick={() => onSwitchTab('payments')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                View Payment History
              </button>
            </div>
          </div>
        )}

        {/* Expiry Warning Banner if close to expiration */}
        {isExpiring && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Your membership expires in {daysLeft} days</strong> ({member.membership_end_date}). Renew now to maintain uninterrupted facility access.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenRenewalModal}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shrink-0 cursor-pointer"
              >
                Renew Membership
              </button>
              <button
                onClick={onOpenRenewalModal}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 transition-colors cursor-pointer"
              >
                Make Payment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* High-Level Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Membership Plan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>Membership Status</span>
              <Dumbbell className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg font-extrabold text-slate-900 tracking-tight">
              {isInactive ? 'No Active Plan' : (member.membershipPlan || 'Gym Package')}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isInactive ? (
                <span className="text-amber-600 font-semibold">Status: Inactive</span>
              ) : isExpired ? (
                <span className="text-rose-600 font-semibold">Expired on {member.membership_end_date}</span>
              ) : (
                <>Expires: <span className="font-semibold text-slate-800">{member.membership_end_date}</span></>
              )}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Validity:</span>
            {isInactive ? (
              <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Inactive
              </span>
            ) : isExpired ? (
              <span className="font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                Expired
              </span>
            ) : (
              <span className={`font-bold px-2 py-0.5 rounded-full ${daysLeft <= 7 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {daysLeft} days remaining
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Attendance Visits */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>This Month's Workouts</span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">{attendanceData.stats.thisMonthVisits}</span>
              <span className="text-xs text-slate-500 font-semibold">check-ins</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total lifetime: <span className="font-semibold text-slate-800">{attendanceData.stats.totalVisits} sessions</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Current Streak:</span>
            <span className="font-bold text-orange-600 flex items-center">
              <Flame className="w-3.5 h-3.5 mr-1" />
              {attendanceData.stats.streakDays} days straight!
            </span>
          </div>
        </div>

        {/* Card 3: Latest Payment */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>Last Payment</span>
              <CreditCard className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">
              ₹{latestPayment ? Number(latestPayment.amount).toLocaleString('en-IN') : '0'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {latestPayment ? `Paid on ${latestPayment.payment_date || latestPayment.paymentDate}` : 'No payments yet'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Receipt:</span>
            {latestPayment ? (
              <button
                onClick={() => onOpenReceipt(latestPayment)}
                className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                View Receipt
              </button>
            ) : (
              <span className="text-slate-400">N/A</span>
            )}
          </div>
        </div>

        {/* Card 4: Quick Digital Pass Mini Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between border border-slate-800">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
              <span>Check-In Pass</span>
              <QrCode className="w-4 h-4" />
            </div>
            <p className="text-sm font-bold text-white font-mono">
              ID: GF-{member.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Tap below to display QR code at front desk
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/60">
            <button
              onClick={onOpenDigitalPass}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center justify-center space-x-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Show Digital Pass</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lower Section: Recent Attendance & Plan Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Check-in Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Check-In Activity</h3>
              <p className="text-xs text-slate-500">Your latest logged visits to the gym</p>
            </div>
            <button
              onClick={() => onSwitchTab('attendance')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center"
            >
              <span>View All Logs</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {attendanceData.records.slice(0, 5).map((att) => (
              <div key={att.id} className="py-3.5 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{att.date}</p>
                    <p className="text-xs text-slate-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {att.checkInTime} {att.checkOutTime ? `— ${att.checkOutTime}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {att.duration || '1h 15m'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Gym Info & Hours */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Facility Information</h3>
            <p className="text-xs text-slate-500">Gym hours and support contacts</p>
          </div>

          <div className="space-y-3.5 text-xs text-slate-700">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="font-bold text-slate-900 text-sm">{gym?.name || 'GymFlow Fitness Center'}</p>
              <p className="flex items-center text-slate-600">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                {gym?.address || '102, Gokulam Main Road, 3rd Stage, Mysuru, KA'}
              </p>
              <p className="flex items-center text-slate-600">
                <PhoneCall className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                {gym?.phone || '+91 98765 00000'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <p className="font-bold text-slate-900 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Workout Hours
              </p>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Monday – Friday:</span>
                  <span className="font-semibold text-slate-800">6:00 AM – 10:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="font-semibold text-slate-800">7:00 AM – 8:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="font-semibold text-slate-800">8:00 AM – 1:00 PM</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-900 space-y-1">
              <p className="font-bold flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Member Privilege
              </p>
              <p className="text-[11px] text-emerald-800">
                Full access to strength equipment, cardio floor, locker facilities, and complimentary locker towels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
