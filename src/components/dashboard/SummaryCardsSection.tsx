import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  IndianRupee,
  CalendarCheck,
  Clock,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import { DashboardSummaryCardsData } from '../../types';
import { formatCurrencyINR } from '../../utils/formatters';

interface SummaryCardsSectionProps {
  data: DashboardSummaryCardsData;
  onNavigate?: (tab: string) => void;
}

export const SummaryCardsSection: React.FC<SummaryCardsSectionProps> = ({ data, onNavigate }) => {
  const cards = [
    {
      id: 'card-total-members',
      title: 'Total Members',
      value: data.totalMembers.toString(),
      subtitle: 'All-time enrolled',
      icon: Users,
      color: 'text-blue-600',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-100',
      hoverBorder: 'hover:border-blue-300',
      targetTab: 'members',
    },
    {
      id: 'card-active-members',
      title: 'Active Members',
      value: data.activeMembers.toString(),
      subtitle: `${data.totalMembers > 0 ? Math.round((data.activeMembers / data.totalMembers) * 100) : 0}% active rate`,
      icon: UserCheck,
      color: 'text-emerald-600',
      bgLight: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      hoverBorder: 'hover:border-emerald-300',
      targetTab: 'members',
    },
    {
      id: 'card-inactive-expired',
      title: 'Inactive / Expired',
      value: data.inactiveExpiredMembers.toString(),
      subtitle: 'Need renewal follow-up',
      icon: UserX,
      color: 'text-rose-600',
      bgLight: 'bg-rose-50',
      borderColor: 'border-rose-100',
      hoverBorder: 'hover:border-rose-300',
      targetTab: 'renewals',
    },
    {
      id: 'card-new-members',
      title: 'New Members',
      value: data.newMembers.toString(),
      subtitle: 'Joined this month',
      icon: UserPlus,
      color: 'text-indigo-600',
      bgLight: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      hoverBorder: 'hover:border-indigo-300',
      targetTab: 'members',
    },
    {
      id: 'card-total-revenue',
      title: 'Total Revenue',
      value: data.canViewFinancials && data.totalRevenue !== null
        ? formatCurrencyINR(data.totalRevenue)
        : 'Restricted',
      subtitle: data.canViewFinancials ? 'All-time verified payments' : 'Owner/Admin access required',
      icon: data.canViewFinancials ? IndianRupee : Lock,
      color: data.canViewFinancials ? 'text-teal-600' : 'text-gray-400',
      bgLight: data.canViewFinancials ? 'bg-teal-50' : 'bg-gray-100',
      borderColor: data.canViewFinancials ? 'border-teal-100' : 'border-gray-200',
      hoverBorder: data.canViewFinancials ? 'hover:border-teal-300' : '',
      targetTab: data.canViewFinancials ? 'payments' : undefined,
      isRestricted: !data.canViewFinancials,
    },
    {
      id: 'card-today-revenue',
      title: "Today's Revenue",
      value: data.canViewFinancials && data.todayRevenue !== null
        ? formatCurrencyINR(data.todayRevenue)
        : 'Restricted',
      subtitle: data.canViewFinancials ? 'Collected today' : 'Owner/Admin access required',
      icon: data.canViewFinancials ? IndianRupee : Lock,
      color: data.canViewFinancials ? 'text-cyan-600' : 'text-gray-400',
      bgLight: data.canViewFinancials ? 'bg-cyan-50' : 'bg-gray-100',
      borderColor: data.canViewFinancials ? 'border-cyan-100' : 'border-gray-200',
      hoverBorder: data.canViewFinancials ? 'hover:border-cyan-300' : '',
      targetTab: data.canViewFinancials ? 'payments' : undefined,
      isRestricted: !data.canViewFinancials,
    },
    {
      id: 'card-today-attendance',
      title: "Today's Attendance",
      value: data.todayAttendance.toString(),
      subtitle: 'Check-ins recorded',
      icon: CalendarCheck,
      color: 'text-amber-600',
      bgLight: 'bg-amber-50',
      borderColor: 'border-amber-100',
      hoverBorder: 'hover:border-amber-300',
      targetTab: 'attendance',
    },
    {
      id: 'card-expiring-soon',
      title: 'Expiring In 7 Days',
      value: data.expiringWithin7Days.toString(),
      subtitle: 'Immediate renewal targets',
      icon: Clock,
      color: 'text-orange-600',
      bgLight: 'bg-orange-50',
      borderColor: 'border-orange-100',
      hoverBorder: 'hover:border-orange-300',
      targetTab: 'renewals',
    },
  ];

  return (
    <div id="dashboard-summary-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isClickable = Boolean(card.targetTab && onNavigate);

        return (
          <div
            key={card.id}
            id={card.id}
            onClick={() => isClickable && card.targetTab && onNavigate && onNavigate(card.targetTab)}
            className={`relative p-5 bg-white rounded-xl border ${card.borderColor} shadow-xs transition-all duration-200 ${
              isClickable ? `cursor-pointer ${card.hoverBorder} hover:shadow-md group` : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                  {card.title}
                </p>
                <div className="mt-2 flex items-baseline">
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 truncate">
                    {card.value}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-500 truncate">{card.subtitle}</p>
              </div>

              <div className={`p-2.5 rounded-lg ${card.bgLight} ${card.color} shrink-0 ml-3`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>

            {isClickable && (
              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-500 group-hover:text-emerald-600 transition-colors">
                <span>View details</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
