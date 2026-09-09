import React, { useState } from 'react';
import { Clock, RefreshCw, MessageSquare, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatDateIndian } from '../../utils/formatters';

interface ExpiringMemberItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  planName: string;
  planPrice: number;
  expiryDate: string;
  daysRemaining: number;
  category: 'due_1_day' | 'due_3_days' | 'due_7_days';
}

interface ExpiringMembersSectionProps {
  members: ExpiringMemberItem[];
  onRenewMember: (memberId: string) => void;
  onWhatsAppReminder: (member: ExpiringMemberItem) => void;
  onNavigateToRenewals: () => void;
}

export const ExpiringMembersSection: React.FC<ExpiringMembersSectionProps> = ({
  members,
  onRenewMember,
  onWhatsAppReminder,
  onNavigateToRenewals,
}) => {
  const [filter, setFilter] = useState<'all' | 'due_3_days' | 'due_1_day'>('all');

  const filteredMembers = members.filter((m) => {
    if (filter === 'due_1_day') return m.daysRemaining <= 1;
    if (filter === 'due_3_days') return m.daysRemaining <= 3;
    return true; // All ≤ 7 days
  });

  return (
    <div id="expiring-members-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Memberships Expiring Soon</h2>
            <p className="text-xs text-gray-500">Requires proactive renewal outreach (≤ 7 days)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick filter tabs */}
          <div className="inline-flex p-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'all' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'hover:text-gray-900'
              }`}
            >
              All (≤7d)
            </button>
            <button
              onClick={() => setFilter('due_3_days')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'due_3_days' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'hover:text-gray-900'
              }`}
            >
              ≤ 3 Days
            </button>
            <button
              onClick={() => setFilter('due_1_day')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'due_1_day' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'hover:text-gray-900'
              }`}
            >
              Today / 1d
            </button>
          </div>

          <button
            onClick={onNavigateToRenewals}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-800 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <span>Renewals Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="py-10 text-center">
          <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">No memberships expiring in this timeframe</p>
          <p className="text-xs text-gray-400 mt-0.5">All active memberships are healthy.</p>
        </div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Member</th>
                <th className="pb-3 px-4">Plan</th>
                <th className="pb-3 px-4">Expiry Date</th>
                <th className="pb-3 px-4">Remaining</th>
                <th className="pb-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMembers.slice(0, 6).map((item) => {
                const isUrgent = item.daysRemaining <= 3;
                const badgeColor =
                  item.daysRemaining <= 1
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : item.daysRemaining <= 3
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-orange-50 text-orange-700 border-orange-200';

                return (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-700">{item.planName}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDateIndian(item.expiryDate)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                        {item.daysRemaining === 0
                          ? 'Expires Today'
                          : item.daysRemaining === 1
                          ? '1 Day Left'
                          : `${item.daysRemaining} Days Left`}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => onRenewMember(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs transition-colors"
                          title="Renew membership plan"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Renew</span>
                        </button>
                        <button
                          onClick={() => onWhatsAppReminder(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                          title="Send renewal notification via WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
