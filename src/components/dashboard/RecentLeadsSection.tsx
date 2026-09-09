import React from 'react';
import { Sparkles, UserPlus, ArrowRight, MessageSquare, Phone, Calendar } from 'lucide-react';
import { formatDateIndian } from '../../utils/formatters';

interface RecentLeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  interestedPlanName: string;
  source: string;
  status: string;
  trialDate?: string;
  createdAt: string;
}

interface RecentLeadsSectionProps {
  leads: RecentLeadItem[];
  onAddLead?: () => void;
  onNavigateToLeads?: () => void;
}

export const RecentLeadsSection: React.FC<RecentLeadsSectionProps> = ({
  leads,
  onAddLead,
  onNavigateToLeads,
}) => {
  return (
    <div id="recent-leads-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-50 text-pink-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Inquiries & Leads</h2>
            <p className="text-xs text-gray-500">Prospective members captured via AI receptionist & walk-ins</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAddLead && (
            <button
              onClick={onAddLead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          )}

          {onNavigateToLeads && (
            <button
              onClick={onNavigateToLeads}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-pink-800 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">No recent leads captured.</div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Prospect</th>
                <th className="pb-3 px-4">Interested Plan</th>
                <th className="pb-3 px-4">Source</th>
                <th className="pb-3 px-4">Created Date</th>
                <th className="pb-3 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.slice(0, 6).map((l) => {
                const isNew = l.status === 'NEW';
                const isTrial = l.status === 'TRIAL_BOOKED';
                const isWon = l.status === 'CONVERTED';

                const badgeStyle = isNew
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : isTrial
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : isWon
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200';

                return (
                  <tr key={l.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-gray-900">{l.name}</div>
                      <div className="text-xs text-gray-500">{l.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{l.interestedPlanName}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {l.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {formatDateIndian(l.createdAt)}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
                        {l.status}
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
