import React from 'react';
import { X, Printer, Dumbbell, ShieldCheck, QrCode, CheckCircle2, AlertTriangle, Calendar, Phone, Heart } from 'lucide-react';
import { Member, Gym } from '../../types';

interface DigitalPassModalProps {
  member: Member;
  gym?: Gym | null;
  onClose: () => void;
}

export const DigitalPassModal: React.FC<DigitalPassModalProps> = ({ member, gym, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const isExpired = member.status === 'expired';
  const isExpiring = member.status === 'expiring';
  const memberCode = `GF-${member.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;

  // Simple deterministic barcode generator using SVG bars
  const generateBarcodeBars = (seed: string) => {
    const bars = [];
    const len = seed.length;
    for (let i = 0; i < 48; i++) {
      const charCode = seed.charCodeAt(i % len);
      const width = (charCode + i) % 3 === 0 ? 3 : (charCode + i) % 2 === 0 ? 2 : 1;
      bars.push(
        <rect
          key={i}
          x={i * 5}
          y="0"
          width={width}
          height="45"
          fill="#1e293b"
        />
      );
    }
    return bars;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-transparent my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Pass Actions Bar */}
        <div className="flex items-center justify-between mb-3 px-2 print:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
            <QrCode className="w-4 h-4 mr-1.5 text-emerald-400" />
            Digital Gym Check-In Pass
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Pass
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Digital Pass Card */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-2xl border border-slate-700/60 relative overflow-hidden print:border-slate-800 print:text-black print:bg-white">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-700/60">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-base tracking-tight text-white">{gym?.name || 'GYMFLOW FITNESS'}</h4>
                <p className="text-[11px] text-emerald-400 font-semibold tracking-wider uppercase">Official Member Pass</p>
              </div>
            </div>
            <div>
              {isExpired ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Expired
                </span>
              ) : isExpiring ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-ping" />
                  Expiring Soon
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Member Profile Info */}
          <div className="py-5 flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-emerald-500/40 flex items-center justify-center text-2xl font-black text-emerald-400 shadow-inner shrink-0">
              {member.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Member Name</p>
              <h3 className="text-xl font-black text-white truncate tracking-tight">{member.full_name}</h3>
              <p className="text-xs font-mono text-emerald-400/90 mt-0.5">ID: {memberCode}</p>
            </div>
          </div>

          {/* Membership Details Bento Grid */}
          <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 text-xs">
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-bold">Plan</p>
              <p className="font-bold text-white truncate text-xs mt-0.5">{member.membershipPlan || 'Gym Package'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-bold">Valid Until</p>
              <p className="font-bold text-white text-xs mt-0.5 flex items-center">
                <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                {member.membership_end_date}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-bold">Member Since</p>
              <p className="font-semibold text-slate-300 text-xs mt-0.5">{member.membership_start_date}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-bold">Emergency Contact</p>
              <p className="font-semibold text-slate-300 text-xs mt-0.5 truncate">
                {member.emergency_contact_phone || member.phone}
              </p>
            </div>
          </div>

          {/* Scannable Check-In QR Code & Barcode Box */}
          <div className="mt-5 p-4 rounded-2xl bg-white text-slate-900 text-center shadow-lg">
            <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Scan At Front Desk For Check-In</p>
            
            {/* Centered Realistic SVG QR Code */}
            <div className="flex justify-center my-2">
              <svg
                width="140"
                height="140"
                viewBox="0 0 100 100"
                className="rounded-lg p-1 bg-white"
              >
                {/* QR Corner Finders */}
                <rect x="5" y="5" width="28" height="28" rx="4" fill="#0f172a" />
                <rect x="9" y="9" width="20" height="20" rx="2" fill="#ffffff" />
                <rect x="13" y="13" width="12" height="12" rx="2" fill="#0f172a" />

                <rect x="67" y="5" width="28" height="28" rx="4" fill="#0f172a" />
                <rect x="71" y="9" width="20" height="20" rx="2" fill="#ffffff" />
                <rect x="75" y="13" width="12" height="12" rx="2" fill="#0f172a" />

                <rect x="5" y="67" width="28" height="28" rx="4" fill="#0f172a" />
                <rect x="9" y="71" width="20" height="20" rx="2" fill="#ffffff" />
                <rect x="13" y="75" width="12" height="12" rx="2" fill="#0f172a" />

                {/* QR Data Pattern Dots (Deterministic) */}
                <rect x="38" y="8" width="8" height="6" fill="#0f172a" />
                <rect x="50" y="8" width="6" height="8" fill="#0f172a" />
                <rect x="38" y="20" width="18" height="6" fill="#0f172a" />
                <rect x="10" y="38" width="18" height="6" fill="#0f172a" />
                <rect x="34" y="36" width="6" height="6" fill="#0f172a" />
                <rect x="46" y="36" width="8" height="8" fill="#10b981" />
                <rect x="60" y="38" width="12" height="6" fill="#0f172a" />
                <rect x="78" y="38" width="14" height="6" fill="#0f172a" />
                <rect x="38" y="48" width="6" height="14" fill="#0f172a" />
                <rect x="48" y="50" width="12" height="6" fill="#0f172a" />
                <rect x="66" y="48" width="8" height="14" fill="#0f172a" />
                <rect x="80" y="52" width="12" height="6" fill="#0f172a" />
                <rect x="38" y="68" width="8" height="8" fill="#0f172a" />
                <rect x="52" y="68" width="6" height="14" fill="#0f172a" />
                <rect x="64" y="70" width="14" height="6" fill="#0f172a" />
                <rect x="82" y="68" width="10" height="14" fill="#0f172a" />
                <rect x="38" y="84" width="18" height="6" fill="#0f172a" />
                <rect x="62" y="84" width="12" height="8" fill="#0f172a" />
              </svg>
            </div>

            {/* Barcode representation */}
            <div className="flex justify-center mt-2 overflow-hidden px-2">
              <svg width="240" height="35" viewBox="0 0 240 35" className="opacity-90">
                {generateBarcodeBars(member.id)}
              </svg>
            </div>
            <p className="font-mono text-[11px] font-bold tracking-widest text-slate-700 mt-1">{memberCode}</p>
          </div>

          {/* Security & Verification Footer */}
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Verified GymFlow Pass
            </span>
            <span>Non-transferable</span>
          </div>
        </div>

        {/* Footer print action button */}
        <div className="mt-4 text-center print:hidden">
          <button
            onClick={handlePrint}
            className="w-full py-3 px-4 rounded-2xl text-sm font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-xl transition-all flex items-center justify-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save Pass to Phone</span>
          </button>
        </div>
      </div>
    </div>
  );
};
