import React from 'react';
import { Clock, AlertTriangle, AlertCircle, RefreshCw, IndianRupee, ArrowRight } from 'lucide-react';
import { RenewalStats, RenewalTab } from '../../types';
import { formatINR } from '../../utils/formatters';

interface RenewalStatsCardsProps {
  stats: RenewalStats;
  activeTab: RenewalTab;
  onSelectTab: (tab: RenewalTab) => void;
}

export const RenewalStatsCards: React.FC<RenewalStatsCardsProps> = ({
  stats,
  activeTab,
  onSelectTab,
}) => {
  const cards = [
    {
      id: 'stat-expiring-7-days',
      title: 'Expiring in 7 Days',
      count: stats.expiringIn7Days,
      subtitle: 'Approaching membership expiry',
      tabKey: 'due_7_days' as RenewalTab,
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-50 text-amber-700',
      borderColor: activeTab === 'due_7_days' ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200/80 hover:border-amber-200',
      badge: 'Action Needed',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'stat-expiring-3-days',
      title: 'Expiring in 3 Days',
      count: stats.expiringIn3Days,
      subtitle: 'Critical follow-up window',
      tabKey: 'due_3_days' as RenewalTab,
      icon: <AlertTriangle className="w-5 h-5 text-amber-700" />,
      iconBg: 'bg-amber-100 text-amber-800',
      borderColor: activeTab === 'due_3_days' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/80 hover:border-amber-300',
      badge: 'High Priority',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    },
    {
      id: 'stat-expired',
      title: 'Expired',
      count: stats.expired,
      subtitle: 'Lapsed accounts needing recovery',
      tabKey: 'expired' as RenewalTab,
      icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
      iconBg: 'bg-rose-50 text-rose-700',
      borderColor: activeTab === 'expired' ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-slate-200/80 hover:border-rose-200',
      badge: 'Lapsed',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'stat-renewed-month',
      title: 'Renewed This Month',
      count: stats.renewedThisMonth,
      subtitle: `${formatINR(stats.renewedRevenueThisMonth)} recovered revenue`,
      tabKey: 'renewed' as RenewalTab,
      icon: <RefreshCw className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50 text-emerald-700',
      borderColor: activeTab === 'renewed' ? 'border-emerald-400 ring-2 ring-emerald-400/20' : 'border-slate-200/80 hover:border-emerald-200',
      badge: 'Retained',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <div id="renewal-stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((c) => {
        const isSelected = activeTab === c.tabKey;
        return (
          <div
            key={c.id}
            id={c.id}
            onClick={() => onSelectTab(c.tabKey)}
            className={`p-5 rounded-2xl bg-white shadow-xs border transition-all cursor-pointer flex flex-col justify-between group ${c.borderColor}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                  {c.icon}
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${c.badgeClass}`}>
                  {c.badge}
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                {c.title}
              </span>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {c.count}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {c.count === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px] truncate">{c.subtitle}</span>
              <span className={`text-[11px] font-bold flex items-center gap-1 shrink-0 ${
                isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'
              }`}>
                <span>{isSelected ? 'Viewing' : 'Filter'}</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
