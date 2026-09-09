import React from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  CreditCard,
  UserPlus,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { DashboardNotificationItem, NavigationItem } from '../../types';

interface NotificationsSummarySectionProps {
  notifications: DashboardNotificationItem[];
  onNavigateToTab?: (tab: string) => void;
}

export const NotificationsSummarySection: React.FC<NotificationsSummarySectionProps> = ({
  notifications,
  onNavigateToTab,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'expiring':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'lead':
        return <Sparkles className="w-4 h-4 text-pink-600" />;
      case 'new_member':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return 'border-l-4 border-l-rose-500 bg-rose-50/20';
      case 'warning':
        return 'border-l-4 border-l-amber-500 bg-amber-50/20';
      case 'success':
        return 'border-l-4 border-l-emerald-500 bg-emerald-50/20';
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-50/20';
    }
  };

  return (
    <div id="notifications-summary-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">System Notifications & Action Items</h2>
            <p className="text-xs text-gray-500">Live operational alerts generated from gym events</p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
          {notifications.length} Alerts
        </span>
      </div>

      {notifications.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">
          No pending notifications or urgent alerts at this time.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 mt-3">
          {notifications.slice(0, 5).map((notif) => (
            <div
              key={notif.id}
              onClick={() => notif.actionTab && onNavigateToTab && onNavigateToTab(notif.actionTab)}
              className={`p-3.5 my-1.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-all ${getBorderColor(
                notif.severity
              )} ${notif.actionTab ? 'cursor-pointer hover:shadow-xs group' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-md bg-white shadow-2xs">
                    {getIcon(notif.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {notif.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">{notif.description}</p>
                  </div>
                </div>

                {notif.actionTab && (
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                    <span className="hidden sm:inline">Resolve</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
