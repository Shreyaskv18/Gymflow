import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  LogOut, 
  QrCode, 
  LayoutDashboard, 
  CreditCard, 
  Calendar, 
  RefreshCw, 
  User, 
  Menu, 
  X, 
  ShieldCheck, 
  ChevronRight,
  Flame
} from 'lucide-react';
import { Member, Gym, Payment } from '../types';
import { memberService, AttendanceSummary } from '../services/memberService';
import { MemberOverviewTab } from '../components/member/MemberOverviewTab';
import { MemberPaymentsTab } from '../components/member/MemberPaymentsTab';
import { MemberAttendanceTab } from '../components/member/MemberAttendanceTab';
import { MemberRenewalsTab } from '../components/member/MemberRenewalsTab';
import { MemberProfileTab } from '../components/member/MemberProfileTab';
import { DigitalPassModal } from '../components/member/DigitalPassModal';
import { ReceiptModal } from '../components/member/ReceiptModal';
import { RenewalRequestModal } from '../components/member/RenewalRequestModal';
import { AIChatReceptionist } from '../components/receptionist/AIChatReceptionist';

export type MemberTab = 'overview' | 'attendance' | 'payments' | 'renewals' | 'profile';

interface MemberPortalLayoutProps {
  member: Member;
  gym?: Gym | null;
  onLogout: () => void;
  onMemberUpdated?: (updated: Member) => void;
  onUpdateMember?: (updated: Member) => void;
}

export const MemberPortalLayout: React.FC<MemberPortalLayoutProps> = ({
  member: initialMember,
  gym,
  onLogout,
  onMemberUpdated,
  onUpdateMember,
}) => {
  const [currentMember, setCurrentMember] = useState<Member>(initialMember);
  const [activeTab, setActiveTab] = useState<MemberTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceSummary>({
    records: [],
    stats: {
      thisMonthVisits: 14,
      totalVisits: 32,
      streakDays: 4,
      lastCheckIn: 'Today',
    },
  });

  // Modal states
  const [showPassModal, setShowPassModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

  // Sync initial member
  useEffect(() => {
    setCurrentMember(initialMember);
  }, [initialMember]);

  // Load member payments and attendance
  useEffect(() => {
    async function loadMemberData() {
      if (!currentMember?.id) return;
      const [pmts, att] = await Promise.all([
        memberService.getPayments(currentMember.id),
        memberService.getAttendance(currentMember.id),
      ]);
      setPayments(pmts);
      setAttendanceData(att);
    }
    loadMemberData();
  }, [currentMember?.id]);

  const handleMemberChange = (updated: Member) => {
    setCurrentMember(updated);
    if (onMemberUpdated) onMemberUpdated(updated);
    if (onUpdateMember) onUpdateMember(updated);
  };

  const navItems = [
    { id: 'overview' as MemberTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'attendance' as MemberTab, label: 'Attendance', icon: Calendar },
    { id: 'payments' as MemberTab, label: 'Payments & Receipts', icon: CreditCard },
    { id: 'renewals' as MemberTab, label: 'Plans & Renewals', icon: RefreshCw },
    { id: 'profile' as MemberTab, label: 'My Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand logo & Member portal badge */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">GymFlow</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Member Portal
                </span>
              </div>
            </div>

            {/* Middle: Desktop Tab Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Quick Pass CTA, Member Chip & Logout */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => setShowPassModal(true)}
                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 mr-1.5" />
                Pass
              </button>

              <div className="h-6 w-px bg-slate-800" />

              <div className="flex items-center space-x-2.5 pl-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                  {currentMember.full_name.charAt(0)}
                </div>
                <div className="text-left leading-none">
                  <p className="text-xs font-bold text-white truncate max-w-[130px]">{currentMember.full_name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]">{currentMember.membershipPlan || 'Gym Member'}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log Out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={() => setShowPassModal(true)}
                className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold"
              >
                <QrCode className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 space-y-1">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-emerald-400">
                  {currentMember.full_name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{currentMember.full_name}</p>
                  <p className="text-[10px] text-slate-400">{currentMember.phone}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10"
              >
                Sign Out
              </button>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Tab Views Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <MemberOverviewTab
            member={currentMember}
            gym={gym}
            attendanceData={attendanceData}
            payments={payments}
            onOpenDigitalPass={() => setShowPassModal(true)}
            onOpenRenewalModal={() => setShowRenewalModal(true)}
            onOpenReceipt={(payment) => setSelectedReceiptPayment(payment)}
            onSwitchTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'attendance' && (
          <MemberAttendanceTab
            member={currentMember}
            attendanceData={attendanceData}
            onOpenDigitalPass={() => setShowPassModal(true)}
          />
        )}

        {activeTab === 'payments' && (
          <MemberPaymentsTab
            member={currentMember}
            gym={gym}
            payments={payments}
            onOpenReceipt={(payment) => setSelectedReceiptPayment(payment)}
          />
        )}

        {activeTab === 'renewals' && (
          <MemberRenewalsTab
            member={currentMember}
            onOpenRenewalModal={() => setShowRenewalModal(true)}
          />
        )}

        {activeTab === 'profile' && (
          <MemberProfileTab
            member={currentMember}
            onMemberUpdated={handleMemberChange}
          />
        )}
      </main>

      {/* Global Modals */}
      {showPassModal && (
        <DigitalPassModal
          member={currentMember}
          gym={gym}
          onClose={() => setShowPassModal(false)}
        />
      )}

      {selectedReceiptPayment && (
        <ReceiptModal
          payment={selectedReceiptPayment}
          member={currentMember}
          gym={gym}
          onClose={() => setSelectedReceiptPayment(null)}
        />
      )}

      {showRenewalModal && (
        <RenewalRequestModal
          member={currentMember}
          onClose={() => setShowRenewalModal(false)}
          onSuccess={() => {
            // Refresh payments or member data
            memberService.getPayments(currentMember.id).then(setPayments);
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {gym?.name || 'GymFlow Fitness Center'}. Member Portal.</p>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Official Digital Pass Active</span>
            <span>•</span>
            <span>Support: {gym?.phone || '+91 98765 00000'}</span>
          </div>
        </div>
      </footer>

      {/* Floating AI Robot Chatbot for Authenticated Gym Members */}
      <AIChatReceptionist
        member={currentMember}
        gymName={gym?.name || 'GymFlow Fitness Center'}
      />
    </div>
  );
};
