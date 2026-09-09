import React from 'react';
import {
  UserPlus,
  CreditCard,
  CalendarCheck,
  RefreshCw,
  PlusCircle,
  FileBarChart,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Admin } from '../../types';

interface QuickActionsSectionProps {
  admin: Admin | null;
  onAddMember: () => void;
  onRecordPayment: () => void;
  onMarkAttendance: () => void;
  onRenewMembership: () => void;
  onAddPlan: () => void;
  onViewReports: () => void;
  onViewLeads: () => void;
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  admin,
  onAddMember,
  onRecordPayment,
  onMarkAttendance,
  onRenewMembership,
  onAddPlan,
  onViewReports,
  onViewLeads,
}) => {
  const isOwnerOrAdmin = !admin || admin.role === 'owner' || admin.role === 'admin';
  const perms = admin?.permissions;

  const actions = [
    {
      id: 'qa-add-member',
      label: 'Add Member',
      description: 'Onboard new gym member',
      icon: UserPlus,
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      onClick: onAddMember,
      visible: isOwnerOrAdmin || perms?.members?.add !== false,
    },
    {
      id: 'qa-record-payment',
      label: 'Record Payment',
      description: 'Log fee receipt or renewal',
      icon: CreditCard,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      onClick: onRecordPayment,
      visible: isOwnerOrAdmin || perms?.payments?.add !== false,
    },
    {
      id: 'qa-mark-attendance',
      label: 'Mark Attendance',
      description: 'Check-in member today',
      icon: CalendarCheck,
      color: 'bg-amber-600 hover:bg-amber-700 text-white',
      onClick: onMarkAttendance,
      visible: isOwnerOrAdmin || perms?.attendance?.mark !== false,
    },
    {
      id: 'qa-renew-membership',
      label: 'Renew Membership',
      description: 'Extend expiring package',
      icon: RefreshCw,
      color: 'bg-orange-600 hover:bg-orange-700 text-white',
      onClick: onRenewMembership,
      visible: isOwnerOrAdmin || perms?.renewals?.renew !== false,
    },
    {
      id: 'qa-add-plan',
      label: 'Add Plan',
      description: 'Create membership pricing',
      icon: PlusCircle,
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
      onClick: onAddPlan,
      visible: isOwnerOrAdmin || perms?.plans?.create !== false,
    },
    {
      id: 'qa-view-reports',
      label: 'View Reports',
      description: 'Financial & member analytics',
      icon: FileBarChart,
      color: 'bg-teal-600 hover:bg-teal-700 text-white',
      onClick: onViewReports,
      visible: isOwnerOrAdmin || perms?.reports?.view !== false,
    },
    {
      id: 'qa-view-leads',
      label: 'View Leads',
      description: 'Prospects & trial inquiries',
      icon: Sparkles,
      color: 'bg-pink-600 hover:bg-pink-700 text-white',
      onClick: onViewLeads,
      visible: isOwnerOrAdmin || perms?.leads?.view !== false,
    },
  ].filter((a) => a.visible);

  return (
    <div id="quick-actions-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Owner Quick Actions</h2>
          <p className="text-xs text-gray-500">Accelerate daily front-desk and management workflows</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mt-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              id={action.id}
              onClick={action.onClick}
              className={`p-3.5 rounded-xl flex flex-col items-center text-center transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${action.color}`}
            >
              <div className="p-2 rounded-lg bg-white/20 mb-2">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-xs sm:text-sm text-white">{action.label}</span>
              <span className="text-[10px] text-white/80 line-clamp-1 mt-0.5">{action.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
