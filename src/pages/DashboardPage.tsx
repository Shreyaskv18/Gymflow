import React, { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { dashboardService, AdvancedDashboardData } from '../services/dashboardService';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { Member, Admin } from '../types';

// Dashboard Components
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { SummaryCardsSection } from '../components/dashboard/SummaryCardsSection';
import { QuickActionsSection } from '../components/dashboard/QuickActionsSection';
import { NotificationsSummarySection } from '../components/dashboard/NotificationsSummarySection';
import { RevenueOverviewSection } from '../components/dashboard/RevenueOverviewSection';
import { MemberGrowthSection } from '../components/dashboard/MemberGrowthSection';
import { AttendanceOverviewSection } from '../components/dashboard/AttendanceOverviewSection';
import { ExpiringMembersSection } from '../components/dashboard/ExpiringMembersSection';
import { ExpiredMembersSection } from '../components/dashboard/ExpiredMembersSection';
import { RecentPaymentsSection } from '../components/dashboard/RecentPaymentsSection';
import { RecentMembersSection } from '../components/dashboard/RecentMembersSection';
import { PlanPerformanceSection } from '../components/dashboard/PlanPerformanceSection';
import { RecentLeadsSection } from '../components/dashboard/RecentLeadsSection';
import { ReportsModal } from '../components/dashboard/ReportsModal';

// Modals
import { MemberModal } from '../components/members/MemberModal';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';
import { MarkAttendanceModal } from '../components/attendance/MarkAttendanceModal';
import { RenewMembershipModal } from '../components/renewals/RenewMembershipModal';
import { WhatsAppReminderModal } from '../components/members/WhatsAppReminderModal';
import { AddLeadModal } from '../components/leads/AddLeadModal';
import { MemberProfileDrawer } from '../components/members/MemberProfileDrawer';

interface DashboardPageProps {
  onNavigateToTab?: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToTab }) => {
  const [data, setData] = useState<AdvancedDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

  // Modal states
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedRenewMember, setSelectedRenewMember] = useState<Member | null>(null);
  const [whatsAppMember, setWhatsAppMember] = useState<Member | null>(null);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [selectedProfileMember, setSelectedProfileMember] = useState<Member | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  }>({ show: false, type: 'info', title: '' });

  const showToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const admin = authService.getCurrentAdmin() || storageService.getAdmin();
      setCurrentAdmin(admin);

      const result = await dashboardService.getDashboardData();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
      setError('Unable to load gym statistics. Please check connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handlers for quick actions and row clicks
  const handleRenewMemberById = (memberId: string) => {
    const member = storageService.getMembers().find((m) => m.id === memberId);
    if (member) {
      setSelectedRenewMember(member);
      setIsRenewModalOpen(true);
    } else {
      onNavigateToTab?.('renewals');
    }
  };

  const handleViewMemberProfile = (memberId: string) => {
    const member = storageService.getMembers().find((m) => m.id === memberId);
    if (member) {
      setSelectedProfileMember(member);
    } else {
      onNavigateToTab?.('members');
    }
  };

  const handleWhatsAppReminderFromItem = (item: { id: string; name: string; phone: string }) => {
    const fullMember = storageService.getMembers().find((m) => m.id === item.id);
    if (fullMember) {
      setWhatsAppMember(fullMember);
    } else {
      // Fallback synthetic member
      setWhatsAppMember({
        id: item.id,
        gym_id: 'gym-default',
        full_name: item.name,
        name: item.name,
        phone: item.phone,
        status: 'active',
        created_at: new Date().toISOString(),
      } as unknown as Member);
    }
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <div id="dashboard-loading" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded-lg w-64" />
            <div className="h-4 bg-gray-100 rounded w-48" />
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-gray-100 p-4" />
          ))}
        </div>
        <div className="h-28 bg-white rounded-xl border border-gray-100" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white rounded-xl border border-gray-100" />
          <div className="h-72 bg-white rounded-xl border border-gray-100" />
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div id="dashboard-error" className="p-6 lg:p-10 max-w-xl mx-auto text-center mt-12 bg-white rounded-2xl shadow-xs border border-gray-100">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Failed to Load Dashboard</h2>
        <p className="text-xs text-gray-500 mb-6">{error || 'Something went wrong while synchronizing metrics.'}</p>
        <button
          onClick={() => fetchDashboardData()}
          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div id="dashboard-view" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border max-w-sm flex items-start gap-3 transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex-1">
            <p className="text-xs font-bold">{toast.title}</p>
            {toast.message && <p className="text-[11px] mt-0.5 opacity-90">{toast.message}</p>}
          </div>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="text-gray-400 hover:text-gray-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header: Welcome back, Owner Name, Gym, Role, Date, Refresh */}
      <DashboardHeader
        adminName={data.adminName}
        gymName={data.gymName}
        userRole={currentAdmin?.role || 'Owner'}
        onRefresh={() => fetchDashboardData(true)}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      {/* 2. Primary 8 Summary Cards */}
      <SummaryCardsSection
        data={data.summaryCards}
        onNavigate={onNavigateToTab}
      />

      {/* 3. Owner Quick Actions */}
      <QuickActionsSection
        admin={currentAdmin}
        onAddMember={() => setIsAddMemberOpen(true)}
        onRecordPayment={() => setIsRecordPaymentOpen(true)}
        onMarkAttendance={() => setIsMarkAttendanceOpen(true)}
        onRenewMembership={() => {
          setSelectedRenewMember(null);
          setIsRenewModalOpen(true);
        }}
        onAddPlan={() => onNavigateToTab?.('plans')}
        onViewReports={() => setIsReportsModalOpen(true)}
        onViewLeads={() => onNavigateToTab?.('leads')}
      />

      {/* 4. Live Notifications & Operational Alert Items */}
      {data.notifications && data.notifications.length > 0 && (
        <NotificationsSummarySection
          notifications={data.notifications}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {/* 5. Revenue Overview & Member Growth (2 Columns on Large Screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueOverviewSection
          data={data.revenueOverview}
          onNavigateToPayments={() => onNavigateToTab?.('payments')}
        />
        <MemberGrowthSection
          data={data.memberGrowth}
          onNavigateToMembers={() => onNavigateToTab?.('members')}
        />
      </div>

      {/* 6. Attendance Overview */}
      <AttendanceOverviewSection
        data={data.attendanceOverview}
        onMarkAttendance={() => setIsMarkAttendanceOpen(true)}
        onNavigateToAttendance={() => onNavigateToTab?.('attendance')}
      />

      {/* 7. Memberships Expiring Soon & Expired Memberships (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpiringMembersSection
          members={data.expiringMembers}
          onRenewMember={handleRenewMemberById}
          onWhatsAppReminder={handleWhatsAppReminderFromItem}
          onNavigateToRenewals={() => onNavigateToTab?.('renewals')}
        />
        <ExpiredMembersSection
          members={data.expiredMembers}
          onRenewMember={handleRenewMemberById}
          onViewMember={handleViewMemberProfile}
          onWhatsAppReminder={handleWhatsAppReminderFromItem}
          onNavigateToRenewals={() => onNavigateToTab?.('renewals')}
        />
      </div>

      {/* 8. Recent Payments & Recent Members (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentPaymentsSection
          payments={data.recentPayments}
          canViewFinancials={data.canViewFinancials}
          onNavigateToPayments={() => onNavigateToTab?.('payments')}
          onRecordPayment={() => setIsRecordPaymentOpen(true)}
        />
        <RecentMembersSection
          members={data.recentMembers}
          onNavigateToMembers={() => onNavigateToTab?.('members')}
          onAddMember={() => setIsAddMemberOpen(true)}
        />
      </div>

      {/* 9. Membership Plan Performance & Recent Leads (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlanPerformanceSection
          plans={data.popularPlans}
          canViewFinancials={data.canViewFinancials}
          onAddPlan={() => onNavigateToTab?.('plans')}
          onNavigateToPlans={() => onNavigateToTab?.('plans')}
        />
        <RecentLeadsSection
          leads={data.recentLeads}
          onAddLead={() => setIsAddLeadOpen(true)}
          onNavigateToLeads={() => onNavigateToTab?.('leads')}
        />
      </div>

      {/* --- MODALS & DRAWERS --- */}

      {/* Member Modal (Add Member) */}
      {isAddMemberOpen && (
        <MemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          onSuccess={(member, isNew) => {
            setIsAddMemberOpen(false);
            showToast('success', 'Member Added', `${member.full_name} enrolled successfully.`);
            fetchDashboardData(true);
          }}
          showToast={showToast}
        />
      )}

      {/* Record Payment Modal */}
      {isRecordPaymentOpen && (
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          onSuccess={(payment) => {
            setIsRecordPaymentOpen(false);
            showToast('success', 'Payment Recorded', `Payment of ₹${payment.amount} recorded.`);
            fetchDashboardData(true);
          }}
          showToast={showToast}
        />
      )}

      {/* Mark Attendance Modal */}
      {isMarkAttendanceOpen && (
        <MarkAttendanceModal
          isOpen={isMarkAttendanceOpen}
          onClose={() => setIsMarkAttendanceOpen(false)}
          onSuccess={(record, memberName) => {
            setIsMarkAttendanceOpen(false);
            showToast('success', 'Attendance Marked', `Checked in ${memberName}.`);
            fetchDashboardData(true);
          }}
        />
      )}

      {/* Renew Membership Modal */}
      {isRenewModalOpen && (
        <RenewMembershipModal
          isOpen={isRenewModalOpen}
          onClose={() => {
            setIsRenewModalOpen(false);
            setSelectedRenewMember(null);
          }}
          member={selectedRenewMember}
          onSuccess={(member) => {
            setIsRenewModalOpen(false);
            setSelectedRenewMember(null);
            showToast('success', 'Membership Renewed', `Renewed membership for ${member.full_name}.`);
            fetchDashboardData(true);
          }}
          showToast={showToast}
        />
      )}

      {/* WhatsApp Reminder Modal */}
      {whatsAppMember && (
        <WhatsAppReminderModal
          isOpen={Boolean(whatsAppMember)}
          member={whatsAppMember}
          onClose={() => setWhatsAppMember(null)}
        />
      )}

      {/* Add Lead Modal */}
      {isAddLeadOpen && (
        <AddLeadModal
          isOpen={isAddLeadOpen}
          onClose={() => setIsAddLeadOpen(false)}
          onLeadSaved={(lead) => {
            setIsAddLeadOpen(false);
            showToast('success', 'Lead Saved', `Inquiry for ${lead.name} saved.`);
            fetchDashboardData(true);
          }}
          showToast={showToast}
        />
      )}

      {/* Reports Modal */}
      {isReportsModalOpen && (
        <ReportsModal
          isOpen={isReportsModalOpen}
          onClose={() => setIsReportsModalOpen(false)}
          data={data}
        />
      )}

      {/* Member Profile Drawer */}
      {selectedProfileMember && (
        <MemberProfileDrawer
          isOpen={Boolean(selectedProfileMember)}
          onClose={() => setSelectedProfileMember(null)}
          member={selectedProfileMember}
          onMemberUpdated={(updated) => {
            setSelectedProfileMember(updated);
            fetchDashboardData(true);
          }}
          onMemberDeleted={() => {
            setSelectedProfileMember(null);
            fetchDashboardData(true);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};
