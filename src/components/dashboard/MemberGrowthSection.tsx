import React, { useState } from 'react';
import { Users, UserPlus, UserCheck, UserX, ArrowRight, TrendingUp } from 'lucide-react';
import { MemberGrowthData } from '../../types';

interface MemberGrowthSectionProps {
  data: MemberGrowthData;
  onNavigateToMembers?: () => void;
}

export const MemberGrowthSection: React.FC<MemberGrowthSectionProps> = ({
  data,
  onNavigateToMembers,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxTotal = Math.max(1, ...data.growthTrend.map((t) => t.totalMembers));

  return (
    <div id="member-growth-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Member Growth & Retention</h2>
            <p className="text-xs text-gray-500">Acquisition vs. active retention rate</p>
          </div>
        </div>

        {onNavigateToMembers && (
          <button
            onClick={onNavigateToMembers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors self-start sm:self-auto"
          >
            <span>Member Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4 Member metric pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-1.5 text-blue-600 text-xs font-medium">
            <UserPlus className="w-3.5 h-3.5" />
            <span>New This Month</span>
          </div>
          <p className="text-xl font-bold text-blue-900 mt-1">{data.newMembersThisMonth}</p>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>Total Enrolled</span>
          </div>
          <p className="text-xl font-bold text-gray-900 mt-1">{data.totalMembers}</p>
        </div>

        <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Active Healthy</span>
          </div>
          <p className="text-xl font-bold text-emerald-900 mt-1">{data.activeMembers}</p>
        </div>

        <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
          <div className="flex items-center gap-1.5 text-rose-700 text-xs font-medium">
            <UserX className="w-3.5 h-3.5" />
            <span>Expired / Inactive</span>
          </div>
          <p className="text-xl font-bold text-rose-900 mt-1">{data.expiredInactiveMembers}</p>
        </div>
      </div>

      {/* 6-Month Growth Chart */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>6-MONTH ENROLLMENT TRAJECTORY</span>
          <span>Max Capacity: {maxTotal}</span>
        </div>

        <div className="h-44 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
          {data.growthTrend.map((item, index) => {
            const heightPercent = Math.max(10, Math.round((item.totalMembers / maxTotal) * 100));
            const isHovered = hoveredIdx === index;

            return (
              <div
                key={item.period || index}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 px-2.5 py-1 bg-gray-900 text-white text-[11px] rounded-md shadow-lg whitespace-nowrap pointer-events-none">
                    <p className="font-semibold">{item.totalMembers} total members</p>
                    <p className="text-blue-300 text-[10px]">+{item.newMembers} new additions</p>
                  </div>
                )}

                {/* Cumulative Bar with new addition highlight */}
                <div className="w-full max-w-[48px] flex items-end justify-center h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 relative ${
                      isHovered ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {item.newMembers > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600">
                        +{item.newMembers}
                      </span>
                    )}
                  </div>
                </div>

                {/* Label */}
                <span className="mt-2 text-[11px] font-medium text-gray-500 truncate max-w-[60px] text-center">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
