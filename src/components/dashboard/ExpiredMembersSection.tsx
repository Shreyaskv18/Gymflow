import React from 'react';
import { UserX, RefreshCw, MessageSquare, ArrowRight, ShieldCheck, Eye } from 'lucide-react';
import { formatDateIndian } from '../../utils/formatters';

interface ExpiredMemberItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  planName: string;
  expiredDate: string;
  daysExpired: number;
  accountStatus: string;
  portalEnabled: boolean;
}

interface ExpiredMembersSectionProps {
  members: ExpiredMemberItem[];
  onRenewMember: (memberId: string) => void;
  onViewMember: (memberId: string) => void;
  onWhatsAppReminder: (member: ExpiredMemberItem) => void;
  onNavigateToRenewals: () => void;
}

export const ExpiredMembersSection: React.FC<ExpiredMembersSectionProps> = ({
  members,
  onRenewMember,
  onViewMember,
  onWhatsAppReminder,
  onNavigateToRenewals,
}) => {
  return (
    <div id="expired-members-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Expired Memberships</h2>
            <p className="text-xs text-gray-500">Lapsed memberships needing win-back follow-up</p>
          </div>
        </div>

        <button
          onClick={onNavigateToRenewals}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors self-start sm:self-auto"
        >
          <span>View All Lapsed</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Compliance banner */}
      <div className="my-3 px-3 py-2 bg-blue-50/60 rounded-lg border border-blue-100 flex items-center gap-2 text-xs text-blue-800">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Policy Note:</strong> Expired gym memberships do not block member portal login access; members can view expired status and renewal offers.
        </span>
      </div>

      {members.length === 0 ? (
        <div className="py-10 text-center">
          <UserX className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">No expired memberships</p>
          <p className="text-xs text-gray-400 mt-0.5">All gym memberships are in active or pending states.</p>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Member</th>
                <th className="pb-3 px-4">Last Plan</th>
                <th className="pb-3 px-4">Expired Date</th>
                <th className="pb-3 px-4">Lapsed Duration</th>
                <th className="pb-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.slice(0, 6).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.phone}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-700">{item.planName}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDateIndian(item.expiredDate)}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      {item.daysExpired === 0 ? 'Expired Today' : `${item.daysExpired}d Ago`}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => onViewMember(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        title="View profile"
                      >
                        <Eye className="w-3 h-3" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        onClick={() => onRenewMember(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs transition-colors"
                        title="Renew membership"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Renew</span>
                      </button>
                      <button
                        onClick={() => onWhatsAppReminder(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                        title="Send win-back message via WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
