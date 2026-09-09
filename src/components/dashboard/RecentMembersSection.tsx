import React from 'react';
import { Users, UserPlus, ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDateIndian } from '../../utils/formatters';

interface RecentMemberItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  planName: string;
  joinDate: string;
  status: string;
}

interface RecentMembersSectionProps {
  members: RecentMemberItem[];
  onNavigateToMembers?: () => void;
  onAddMember?: () => void;
}

export const RecentMembersSection: React.FC<RecentMembersSectionProps> = ({
  members,
  onNavigateToMembers,
  onAddMember,
}) => {
  return (
    <div id="recent-members-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recently Enrolled Members</h2>
            <p className="text-xs text-gray-500">Latest additions to gym membership roster</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAddMember && (
            <button
              onClick={onAddMember}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          )}

          {onNavigateToMembers && (
            <button
              onClick={onNavigateToMembers}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {members.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">No members enrolled yet.</div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Member Name</th>
                <th className="pb-3 px-4">Contact</th>
                <th className="pb-3 px-4">Assigned Plan</th>
                <th className="pb-3 px-4">Join Date</th>
                <th className="pb-3 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.slice(0, 7).map((m) => {
                const isActive = m.status === 'active';
                const isExpiring = m.status === 'expiring';
                const isExpired = m.status === 'expired';

                const badgeStyle = isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isExpiring
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : isExpired
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200';

                return (
                  <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 pr-4 font-semibold text-gray-900">{m.name}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{m.phone}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{m.planName}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDateIndian(m.joinDate)}</td>
                    <td className="py-3 pl-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} capitalize`}>
                        {m.status}
                      </span>
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
