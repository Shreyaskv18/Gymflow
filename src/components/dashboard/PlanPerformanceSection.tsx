import React from 'react';
import { Layers, Plus, ArrowRight, Award, IndianRupee } from 'lucide-react';
import { PlanPerformanceItem } from '../../types';
import { formatCurrencyINR } from '../../utils/formatters';

interface PlanPerformanceSectionProps {
  plans: PlanPerformanceItem[];
  canViewFinancials: boolean;
  onAddPlan?: () => void;
  onNavigateToPlans?: () => void;
}

export const PlanPerformanceSection: React.FC<PlanPerformanceSectionProps> = ({
  plans,
  canViewFinancials,
  onAddPlan,
  onNavigateToPlans,
}) => {
  return (
    <div id="plan-performance-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Membership Plan Performance</h2>
            <p className="text-xs text-gray-500">Plan popularity, enrollment share, and recurring renewals</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAddPlan && (
            <button
              onClick={onAddPlan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Plan</span>
            </button>
          )}

          {onNavigateToPlans && (
            <button
              onClick={onNavigateToPlans}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <span>Manage Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">No membership plans created yet.</div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Plan Name</th>
                <th className="pb-3 px-4">Price / Duration</th>
                <th className="pb-3 px-4">Active Members</th>
                <th className="pb-3 px-4">Market Share</th>
                {canViewFinancials && <th className="pb-3 px-4">Total Revenue</th>}
                <th className="pb-3 pl-4 text-right">Renewals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {plans.map((pl, idx) => (
                <tr key={pl.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {idx === 0 && (
                        <span title="Most popular plan" className="text-amber-500">
                          <Award className="w-4 h-4" />
                        </span>
                      )}
                      <span className="font-semibold text-gray-900">{pl.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    <span className="font-medium text-gray-900">{formatCurrencyINR(pl.price)}</span>
                    <span className="text-xs text-gray-400"> / {pl.durationMonths}m</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-gray-900">{pl.activeMembersCount}</span>
                    <span className="text-xs text-gray-400"> members</span>
                  </td>
                  <td className="py-3 px-4 min-w-[130px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, pl.sharePercentage)}%` }}
                          className={`h-full rounded-full ${
                            idx === 0 ? 'bg-purple-600' : 'bg-purple-400'
                          }`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-8">
                        {pl.sharePercentage}%
                      </span>
                    </div>
                  </td>
                  {canViewFinancials && (
                    <td className="py-3 px-4 font-bold text-emerald-800">
                      {formatCurrencyINR(pl.totalRevenue)}
                    </td>
                  )}
                  <td className="py-3 pl-4 text-right font-medium text-gray-700">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                      {pl.renewalsCount} renewals
                    </span>
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
