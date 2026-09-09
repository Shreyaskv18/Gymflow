import React from 'react';
import { 
  LayoutDashboard, 
  Layers,
  Users, 
  UserPlus,
  CreditCard, 
  CalendarCheck, 
  RefreshCw, 
  ShieldCheck,
  Settings, 
  LogOut, 
  Dumbbell,
  X
} from 'lucide-react';
import { NavigationItem, Admin, Gym } from '../../types';
import { authService } from '../../services/authService';

interface SidebarProps {
  currentTab: NavigationItem;
  onSelectTab: (tab: NavigationItem) => void;
  admin: Admin | null;
  gym: Gym | null;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  admin,
  gym,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}) => {
  const allNavItems: { id: NavigationItem; label: string; icon: React.ReactNode; isStage1: boolean; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, isStage1: true },
    { id: 'plans', label: 'Membership Plans', icon: <Layers className="w-5 h-5" />, isStage1: true },
    { id: 'members', label: 'Members', icon: <Users className="w-5 h-5" />, isStage1: true },
    { id: 'leads', label: 'Leads & Enquiries', icon: <UserPlus className="w-5 h-5" />, isStage1: true },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" />, isStage1: true },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck className="w-5 h-5" />, isStage1: true },
    { id: 'renewals', label: 'Renewals', icon: <RefreshCw className="w-5 h-5" />, isStage1: true },
    { id: 'staff', label: 'Staff & Roles', icon: <ShieldCheck className="w-5 h-5" />, isStage1: true },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, isStage1: true },
  ];

  // Filter items based on active user's permissions
  const navItems = allNavItems.filter((item) => authService.hasAccessToTab(item.id, admin));

  const roleLabel = admin?.role === 'owner' ? 'Gym Owner' : admin?.role === 'admin' ? 'Administrator' : 'Gym Staff';
  const roleBadgeColor = admin?.role === 'owner' 
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
    : admin?.role === 'admin' 
    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          id="mobile-sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-neutral-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-400 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Branding */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                <Dumbbell className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-xl tracking-tight">GymFlow</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {gym?.name || 'GymFlow Fitness Center'}
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              id="close-sidebar-button"
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Gym Context Pill */}
          <div className="mt-3.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-slate-300 text-[11px] font-medium truncate">Single-Gym Workspace</span>
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Active</span>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            Menu
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 group text-left cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium tracking-widest uppercase ${
                      isActive
                        ? 'bg-indigo-700 text-indigo-100 font-semibold'
                        : 'bg-slate-800 text-slate-500 border border-slate-700/40'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-800 mt-auto">
          <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {admin?.name ? (admin.name.length > 2 ? admin.name.substring(0, 2).toUpperCase() : admin.name.toUpperCase()) : 'VK'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {admin?.name || 'Vikram'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${roleBadgeColor}`}>
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <button
              id="sidebar-logout-button"
              onClick={onLogout}
              title="Log out of GymFlow"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors shrink-0 cursor-pointer"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
