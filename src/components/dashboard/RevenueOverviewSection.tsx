import React, { useState } from 'react';
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  Lock,
  ArrowRight,
  BarChart3,
  CreditCard,
} from 'lucide-react';
import { RevenueOverviewData } from '../../types';
import { formatCurrencyINR } from '../../utils/formatters';

interface RevenueOverviewSectionProps {
  data: RevenueOverviewData;
  onNavigateToPayments?: () => void;
}

export const RevenueOverviewSection: React.FC<RevenueOverviewSectionProps> = ({
  data,
  onNavigateToPayments,
}) => {
  const [activeInterval, setActiveInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data.canViewFinancials) {
    return (
      <div id="revenue-overview-restricted" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="p-2.5 rounded-lg bg-gray-100 text-gray-500">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Revenue Overview Restricted</h2>
            <p className="text-sm text-gray-500">
              Financial metrics and revenue trends are confidential and restricted to gym owners and authorized billing administrators.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentTrendList =
    activeInterval === 'daily'
      ? data.dailyTrend
      : activeInterval === 'weekly'
      ? data.weeklyTrend
      : data.monthlyTrend;

  const maxAmount = Math.max(1, ...currentTrendList.map((item) => item.amount));

  // Percentage comparison between this month and previous month
  const monthDiff = data.thisMonthRevenue - data.previousMonthRevenue;
  const growthPercent =
    data.previousMonthRevenue > 0
      ? Math.round((monthDiff / data.previousMonthRevenue) * 100)
      : data.thisMonthRevenue > 0
      ? 100
      : 0;

  return (
    <div id="revenue-overview-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Revenue Overview</h2>
            <p className="text-xs text-gray-500">Verified cashflow & earnings analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Interval tabs */}
          <div className="inline-flex p-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
            <button
              onClick={() => setActiveInterval('daily')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeInterval === 'daily'
                  ? 'bg-white text-gray-900 shadow-xs font-semibold'
                  : 'hover:text-gray-900'
              }`}
            >
              Daily (7d)
            </button>
            <button
              onClick={() => setActiveInterval('weekly')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeInterval === 'weekly'
                  ? 'bg-white text-gray-900 shadow-xs font-semibold'
                  : 'hover:text-gray-900'
              }`}
            >
              Weekly (4w)
            </button>
            <button
              onClick={() => setActiveInterval('monthly')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeInterval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-xs font-semibold'
                  : 'hover:text-gray-900'
              }`}
            >
              Monthly (6m)
            </button>
          </div>

          {onNavigateToPayments && (
            <button
              onClick={onNavigateToPayments}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <span>Payments Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Financial Key Figures */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-5">
        <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-xs font-medium text-gray-500">Today's Revenue</span>
          <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
            {formatCurrencyINR(data.todayRevenue)}
          </p>
          <span className="text-[11px] text-gray-400">Current calendar day</span>
        </div>

        <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-xs font-medium text-gray-500">This Week</span>
          <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
            {formatCurrencyINR(data.thisWeekRevenue)}
          </p>
          <span className="text-[11px] text-gray-400">Last 7 rolling days</span>
        </div>

        <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">This Month</span>
            {growthPercent !== 0 && (
              <span
                className={`text-[11px] font-semibold px-1.5 py-0.2 rounded ${
                  growthPercent >= 0 ? 'bg-emerald-200/70 text-emerald-800' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {growthPercent >= 0 ? `+${growthPercent}%` : `${growthPercent}%`}
              </span>
            )}
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-900 mt-1">
            {formatCurrencyINR(data.thisMonthRevenue)}
          </p>
          <span className="text-[11px] text-emerald-600">Current calendar month</span>
        </div>

        <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-xs font-medium text-gray-500">Previous Month</span>
          <p className="text-lg sm:text-xl font-bold text-gray-700 mt-1">
            {formatCurrencyINR(data.previousMonthRevenue)}
          </p>
          <span className="text-[11px] text-gray-400">Prior billing cycle</span>
        </div>
      </div>

      {/* Trend Visualizer */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{activeInterval.toUpperCase()} CASH INFLOW TREND</span>
          <span>Peak: {formatCurrencyINR(maxAmount)}</span>
        </div>

        {currentTrendList.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No payment records found for this period.</div>
        ) : (
          <div className="space-y-2">
            <div className="h-44 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
              {currentTrendList.map((item, index) => {
                const heightPercent = Math.max(8, Math.round((item.amount / maxAmount) * 100));
                const isHovered = hoveredIndex === index;

                return (
                  <div
                    key={item.key || index}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 px-2.5 py-1 bg-gray-900 text-white text-[11px] rounded-md shadow-lg whitespace-nowrap pointer-events-none">
                        <p className="font-semibold">{formatCurrencyINR(item.amount)}</p>
                        <p className="text-gray-300 text-[10px]">{item.label}</p>
                      </div>
                    )}

                    {/* Bar */}
                    <div className="w-full max-w-[48px] flex items-end justify-center h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          isHovered
                            ? 'bg-emerald-600'
                            : item.amount > 0
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : 'bg-gray-200'
                        }`}
                      />
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
        )}
      </div>
    </div>
  );
};
