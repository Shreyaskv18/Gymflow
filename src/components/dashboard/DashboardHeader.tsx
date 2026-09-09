import React from 'react';
import { RefreshCw, ShieldCheck, Building2, Calendar, Sparkles } from 'lucide-react';
import { formatDateIndian } from '../../utils/formatters';

interface DashboardHeaderProps {
  adminName: string;
  gymName: string;
  userRole?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated?: Date;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  adminName,
  gymName,
  userRole = 'Owner',
  onRefresh,
  isRefreshing,
  lastUpdated,
}) => {
  const todayFormatted = formatDateIndian(new Date().toISOString());

  const roleBadge = () => {
    const r = userRole.toLowerCase();
    if (r === 'owner') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          Owner Access
        </span>
      );
    }
    if (r === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
        Staff Member
      </span>
    );
  };

  return (
    <div id="dashboard-header-container" className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Welcome back, <span className="text-emerald-600">{adminName || 'Owner'}</span>
          </h1>
          {roleBadge()}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-700">{gymName || 'GymFlow'}</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{todayFormatted}</span>
          </div>
          {lastUpdated && (
            <>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <span className="text-xs text-gray-400 hidden sm:inline">
                Synced at {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          id="dashboard-refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 transition-colors"
          title="Refresh real-time statistics"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-gray-500'}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
};
