import React from 'react';
import { Menu, Calendar, Building2, ShieldCheck, RefreshCw } from 'lucide-react';
import { Admin, Gym } from '../../types';

interface HeaderProps {
  admin: Admin | null;
  gym: Gym | null;
  onOpenMobileSidebar: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  admin,
  gym,
  onOpenMobileSidebar,
  onRefreshData,
  isRefreshing = false,
}) => {
  // Format current date e.g. "Monday, 31 August 2026"
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const firstName = admin?.name ? admin.name.split(' ')[0] : 'Vikram';

  return (
    <header id="app-header" className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 transition-all sticky top-0 z-30">
      {/* Left: Mobile Toggle & Header Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          id="mobile-menu-toggle-button"
          onClick={onOpenMobileSidebar}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg lg:hidden hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight leading-tight truncate">
            Good morning, {firstName}
          </h1>
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Here's what's happening at your gym today.
          </p>
        </div>
      </div>

      {/* Right: Date Indicator, Refresh, Workspace Indicator */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/70">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>

        {onRefreshData && (
          <button
            id="header-refresh-button"
            onClick={onRefreshData}
            disabled={isRefreshing}
            title="Refresh dashboard data"
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        )}

        <div className="flex flex-col items-end pl-2.5 sm:pl-3 border-l border-slate-200 text-right">
          <span className="text-xs font-bold text-indigo-600 tracking-tight leading-tight hidden sm:inline-block">
            {gym?.name || 'GymFlow Fitness Center'}
          </span>
          <span className="text-xs font-bold text-indigo-600 tracking-tight leading-tight inline-block sm:hidden">
            {gym?.name ? (gym.name.length > 20 ? 'GymFlow Fitness' : gym.name) : 'GymFlow Fitness'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
            Current Workspace
          </span>
        </div>
      </div>
    </header>
  );
};
