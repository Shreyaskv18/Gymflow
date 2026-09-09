import React, { useState } from 'react';
import { CalendarCheck, Clock, Flame, Award, ArrowRight, UserCheck } from 'lucide-react';
import { AttendanceOverviewData } from '../../types';

interface AttendanceOverviewSectionProps {
  data: AttendanceOverviewData;
  onMarkAttendance?: () => void;
  onNavigateToAttendance?: () => void;
}

export const AttendanceOverviewSection: React.FC<AttendanceOverviewSectionProps> = ({
  data,
  onMarkAttendance,
  onNavigateToAttendance,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxCount = Math.max(1, ...data.dailyTrend.map((d) => d.count));

  return (
    <div id="attendance-overview-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Attendance Overview</h2>
            <p className="text-xs text-gray-500">Facility utilization and visit frequency</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onMarkAttendance && (
            <button
              onClick={onMarkAttendance}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Mark Attendance</span>
            </button>
          )}

          {onNavigateToAttendance && (
            <button
              onClick={onNavigateToAttendance}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <span>View Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 my-5">
        <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
          <span className="text-xs font-medium text-amber-800">Today's Check-ins</span>
          <p className="text-xl font-bold text-amber-900 mt-1">{data.todayCheckIns}</p>
          <span className="text-[11px] text-amber-600">Active visits today</span>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-xs font-medium text-gray-500">This Week</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{data.thisWeekAttendance}</p>
          <span className="text-[11px] text-gray-400">Total 7-day visits</span>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-xs font-medium text-gray-500">This Month</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{data.thisMonthAttendance}</p>
          <span className="text-[11px] text-gray-400">Monthly check-ins</span>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-xs font-medium text-gray-500">Daily Average</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{data.averageDailyAttendance}</p>
          <span className="text-[11px] text-gray-400">Expected visits / day</span>
        </div>

        <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1 text-emerald-800 text-xs font-medium">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Peak Day</span>
          </div>
          <p className="text-xl font-bold text-emerald-900 mt-1">
            {data.highestAttendanceDay?.count || data.todayCheckIns} visits
          </p>
          <span className="text-[11px] text-emerald-600">
            {data.highestAttendanceDay?.formattedDate || 'Recent high'}
          </span>
        </div>
      </div>

      {/* Daily Attendance Trend Visualizer */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>DAILY VISITS (PAST 7 DAYS)</span>
          <span>Highest: {maxCount} check-ins</span>
        </div>

        <div className="h-40 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
          {data.dailyTrend.map((item, index) => {
            const heightPercent = Math.max(10, Math.round((item.count / maxCount) * 100));
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={item.date || index}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {isHovered && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 px-2.5 py-1 bg-gray-900 text-white text-[11px] rounded-md shadow-lg whitespace-nowrap pointer-events-none">
                    <p className="font-semibold">{item.count} check-ins</p>
                    <p className="text-gray-300 text-[10px]">{item.date}</p>
                  </div>
                )}

                <div className="w-full max-w-[44px] flex items-end justify-center h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      isHovered ? 'bg-amber-600' : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                  />
                </div>

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
