import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { ToastContainer, ToastMessage } from '../components/common/Toast';
import { DashboardPage } from '../pages/DashboardPage';
import { MembershipPlansPage } from '../pages/MembershipPlansPage';
import { MembersPage } from '../pages/MembersPage';
import { PaymentsPage } from '../pages/PaymentsPage';
import { AttendancePage } from '../pages/AttendancePage';
import { RenewalsPage } from '../pages/RenewalsPage';
import { StaffManagementPage } from '../pages/StaffManagementPage';
import { SettingsPage } from '../pages/SettingsPage';
import { LeadsPage } from '../pages/LeadsPage';
import { ComingSoonPage } from '../pages/ComingSoonPage';
import { NavigationItem, Admin, Gym } from '../types';
import { authService } from '../services/authService';

interface AppLayoutProps {
  gym: Gym;
  admin: Admin;
  onLogout: () => void;
  onGymUpdated: (gym: Gym) => void;
  onAdminUpdated: (admin: Admin) => void;
}

const TAB_METADATA: Record<NavigationItem, { label: string; requiredPermission: string; moduleName: string }> = {
  dashboard: { label: 'Dashboard', requiredPermission: 'dashboard.view', moduleName: 'Overview Dashboard' },
  members: { label: 'Members', requiredPermission: 'members.view', moduleName: 'Members Directory' },
  leads: { label: 'Leads & Enquiries', requiredPermission: 'leads.view', moduleName: 'Leads Management' },
  attendance: { label: 'Attendance', requiredPermission: 'attendance.view', moduleName: 'Attendance Tracking' },
  payments: { label: 'Payments', requiredPermission: 'payments.view', moduleName: 'Payment Records' },
  renewals: { label: 'Renewals', requiredPermission: 'renewals.view', moduleName: 'Membership Renewals' },
  plans: { label: 'Plans', requiredPermission: 'plans.view', moduleName: 'Membership Plans' },
  staff: { label: 'Staff Management', requiredPermission: 'staff.access', moduleName: 'Staff & Roles' },
  settings: { label: 'Settings', requiredPermission: 'settings.access', moduleName: 'Gym System Settings' },
};

export const AppLayout: React.FC<AppLayoutProps> = ({
  admin,
  gym,
  onLogout,
  onGymUpdated,
  onAdminUpdated,
}) => {
  // Parse initial tab from URL hash
  const getTabFromHash = (): NavigationItem => {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
    const validTabs: NavigationItem[] = [
      'dashboard',
      'members',
      'leads',
      'attendance',
      'payments',
      'renewals',
      'plans',
      'staff',
      'settings',
    ];
    if (validTabs.includes(hash as NavigationItem)) {
      return hash as NavigationItem;
    }
    return 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState<NavigationItem>(getTabFromHash);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Synchronize hash changes (when user types in URL bar or uses browser Back/Forward)
  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromHash();
      setCurrentTab(tab);
    };

    window.addEventListener('hashchange', handleHashChange);
    // Ensure hash matches initial tab if hash was empty
    if (!window.location.hash) {
      window.location.hash = `#/${currentTab}`;
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tab: NavigationItem) => {
    setCurrentTab(tab);
    if (window.location.hash !== `#/${tab}`) {
      window.location.hash = `#/${tab}`;
    }
  };

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast('info', 'Dashboard refreshed', 'Updated latest statistics from persistent storage.');
    }, 300);
  };

  // Verify role-based permission for current tab
  const isTabPermitted = authService.hasAccessToTab(currentTab, admin);
  const currentMeta = TAB_METADATA[currentTab] || {
    label: currentTab,
    requiredPermission: `${currentTab}.access`,
    moduleName: currentTab,
  };

  return (
    <div id="app-shell" className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => handleSelectTab(tab)}
        admin={admin}
        gym={gym}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Offset by sidebar width on lg) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <Header
          admin={admin}
          gym={gym}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onRefreshData={currentTab === 'dashboard' ? handleRefresh : undefined}
          isRefreshing={isRefreshing}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 pb-12">
          {!isTabPermitted ? (
            <div id="access-denied-view" className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl border border-rose-200/70 p-6 sm:p-10 shadow-sm text-center">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center mx-auto mb-5 text-rose-600 shadow-sm">
                  <ShieldAlert className="w-8 h-8" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/70 text-rose-800 border border-rose-200 mb-3 tracking-wide uppercase">
                  <Lock className="w-3.5 h-3.5" />
                  <span>HTTP 403 • Access Denied</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                  Access Restricted: {currentMeta.moduleName}
                </h1>

                <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mb-6">
                  Your current account <span className="font-semibold text-slate-800">{admin.name}</span> is logged in as <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-xs uppercase">{admin.role}</span>. You do not have permission to view or manage the <span className="font-medium text-slate-900">{currentMeta.label}</span> module.
                </p>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 max-w-md mx-auto mb-8 text-left text-xs text-slate-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Attempted Module:</span>
                    <span className="font-mono text-slate-800">{currentTab}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Required Permission:</span>
                    <span className="font-mono text-rose-700 font-semibold">{currentMeta.requiredPermission}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Account Role:</span>
                    <span className="font-mono text-slate-800 capitalize">{admin.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Resolution:</span>
                    <span className="text-slate-700">Contact the gym owner to grant this permission</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    id="btn-return-dashboard"
                    onClick={() => handleSelectTab('dashboard')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Dashboard</span>
                  </button>
                  <button
                    type="button"
                    id="btn-access-denied-logout"
                    onClick={onLogout}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-all cursor-pointer border border-slate-300/80"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out / Switch User</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardPage
                  key={refreshKey}
                  onNavigateToTab={(tab) => handleSelectTab(tab as NavigationItem)}
                />
              )}

              {currentTab === 'plans' && (
                <MembershipPlansPage
                  showToast={addToast}
                />
              )}

              {currentTab === 'members' && (
                <MembersPage
                  showToast={addToast}
                  onNavigateToPlans={() => handleSelectTab('plans')}
                />
              )}

              {currentTab === 'leads' && (
                <LeadsPage
                  showToast={addToast}
                  onNavigateToTab={(tab) => handleSelectTab(tab as NavigationItem)}
                />
              )}

              {currentTab === 'payments' && (
                <PaymentsPage
                  showToast={addToast}
                  onViewMember={(memberId) => {
                    handleSelectTab('members');
                  }}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsPage
                  onLogout={onLogout}
                  onGymUpdated={onGymUpdated}
                  onAdminUpdated={onAdminUpdated}
                  showToast={addToast}
                  onNavigateToPlans={() => handleSelectTab('plans')}
                />
              )}

              {currentTab === 'attendance' && (
                <AttendancePage
                  onNavigateToTab={(tab) => handleSelectTab(tab as NavigationItem)}
                />
              )}

              {currentTab === 'renewals' && (
                <RenewalsPage
                  showToast={addToast}
                  onNavigateToTab={(tab) => handleSelectTab(tab as NavigationItem)}
                />
              )}

              {currentTab === 'staff' && (
                <StaffManagementPage />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

