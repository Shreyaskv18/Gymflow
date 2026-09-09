import React, { useRef } from 'react';
import { Member, Gym } from '../../types';
import { Dumbbell, QrCode, ShieldCheck, Printer, Calendar, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

interface MemberPassCardProps {
  member: Member;
  gym?: Gym | null;
  compact?: boolean;
  onPrint?: () => void;
}

export const MemberPassCard: React.FC<MemberPassCardProps> = ({ member, gym, compact = false, onPrint }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const planName = member.membership_plan?.name || member.membershipPlan || 'GymFlow Membership';
  const endDate = member.membership_end_date || member.membershipEndDate || '2026-12-31';
  const isExpiring = member.status === 'expiring' || member.status === 'expiring_soon';
  const isExpired = member.status === 'expired';

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div
      ref={cardRef}
      id="member-pass-container"
      className={`relative overflow-hidden rounded-2xl shadow-xl transition-all duration-300 ${
        compact ? 'p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white' : 'p-7 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white border border-slate-700/50'
      }`}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              {gym?.name || 'GymFlow Fitness'}
              <ShieldCheck className="w-4 h-4 text-emerald-400 inline" />
            </h3>
            <p className="text-xs text-slate-300 font-medium">Digital Access Membership Pass</p>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isExpired
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : isExpiring
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isExpired ? (
              <>
                <AlertCircle className="w-3 h-3" /> Expired
              </>
            ) : isExpiring ? (
              <>
                <AlertCircle className="w-3 h-3" /> Expiring Soon
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3" /> Verified Active
              </>
            )}
          </span>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">ID: {member.id.toUpperCase()}</p>
        </div>
      </div>

      {/* Member Main Info */}
      <div className="relative z-10 my-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-inner border border-white/20">
            {member.full_name?.charAt(0)?.toUpperCase() || 'M'}
          </div>
          <div>
            <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{member.full_name}</h4>
            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2 mt-0.5">
              <span>{member.phone}</span>
              {member.email && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 truncate max-w-[180px]">{member.email}</span>
                </>
              )}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg bg-white/10 text-indigo-200 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {planName}
            </div>
          </div>
        </div>

        {/* QR Code Scannable Block */}
        <div className="flex flex-col items-center bg-white p-3 rounded-xl shadow-md border border-slate-200 text-slate-900 self-center sm:self-auto">
          {/* Stylized QR Code matrix rendering */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white flex flex-col items-center justify-center relative p-1">
            <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
              {/* Corner 1 */}
              <rect x="0" y="0" width="30" height="30" rx="3" />
              <rect x="5" y="5" width="20" height="20" fill="white" />
              <rect x="9" y="9" width="12" height="12" />
              {/* Corner 2 */}
              <rect x="70" y="0" width="30" height="30" rx="3" />
              <rect x="75" y="5" width="20" height="20" fill="white" />
              <rect x="79" y="9" width="12" height="12" />
              {/* Corner 3 */}
              <rect x="0" y="70" width="30" height="30" rx="3" />
              <rect x="5" y="75" width="20" height="20" fill="white" />
              <rect x="9" y="79" width="12" height="12" />
              {/* Data modules pattern */}
              <rect x="36" y="8" width="6" height="6" />
              <rect x="46" y="14" width="6" height="6" />
              <rect x="56" y="8" width="6" height="6" />
              <rect x="36" y="24" width="6" height="6" />
              <rect x="50" y="28" width="8" height="8" />
              <rect x="12" y="38" width="6" height="6" />
              <rect x="24" y="44" width="6" height="6" />
              <rect x="38" y="40" width="10" height="10" />
              <rect x="54" y="42" width="6" height="6" />
              <rect x="68" y="38" width="6" height="6" />
              <rect x="80" y="44" width="6" height="6" />
              <rect x="42" y="58" width="8" height="8" />
              <rect x="60" y="54" width="6" height="6" />
              <rect x="72" y="60" width="6" height="6" />
              <rect x="86" y="54" width="6" height="6" />
              <rect x="36" y="74" width="6" height="6" />
              <rect x="48" y="80" width="6" height="6" />
              <rect x="64" y="74" width="6" height="6" />
              <rect x="78" y="82" width="6" height="6" />
              <rect x="90" y="72" width="6" height="6" />
            </svg>
          </div>
          <span className="text-[10px] font-mono tracking-widest text-slate-600 font-bold uppercase mt-1">
            SCAN AT RECEPTION
          </span>
        </div>
      </div>

      {/* Barcode & Validity Strip */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Valid Until</p>
            <p className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Emergency Contact</p>
            <p className="text-sm font-semibold text-slate-200 mt-0.5">
              {member.emergency_contact_name || 'Not Provided'}
            </p>
          </div>
        </div>

        {/* Barcode graphic */}
        <div className="flex flex-col items-end">
          <div className="h-7 flex items-center gap-[2px] bg-white/90 px-2 py-1 rounded">
            {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 2, 4, 1, 3].map((width, i) => (
              <div
                key={i}
                className="h-full bg-slate-900"
                style={{ width: `${width}px` }}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5 tracking-widest">
            *{member.id.toUpperCase().replace('-', '')}*
          </span>
        </div>
      </div>

      {/* Print / Save Pass Action */}
      {!compact && (
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400" />
            Gym Desk: {gym?.phone || '+91 821 241 9900'}
          </span>
          <button
            id="print-pass-btn"
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save Pass
          </button>
        </div>
      )}
    </div>
  );
};
