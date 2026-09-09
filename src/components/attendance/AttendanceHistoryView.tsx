import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Users,
  Timer,
  Award,
  Clock,
  TrendingUp,
  Download,
} from 'lucide-react';
import { Attendance } from '../../types';
import { formatDateIndian, formatMinutesToDuration, timeStringToMinutes } from '../../utils/formatters';

interface AttendanceHistoryViewProps {
  allRecords: Attendance[];
  onViewMember: (memberId: string) => void;
}

export const AttendanceHistoryView: React.FC<AttendanceHistoryViewProps> = ({
  allRecords,
  onViewMember,
}) => {
  const [historySearch, setHistorySearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all');

  // Filter records based on search and range
  const filteredHistory = useMemo(() => {
    let result = [...allRecords];

    // Date range filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoffDays = dateFilter === '7days' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(now.getDate() - cutoffDays);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      result = result.filter((r) => r.date >= cutoffStr);
    }

    // Search query
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase().trim();
      result = result.filter((r) => {
        const name = (r.memberName || '').toLowerCase();
        const phone = (r.phone || '').toLowerCase();
        const plan = (r.planName || '').toLowerCase();
        const date = (r.date || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || plan.includes(q) || date.includes(q);
      });
    }

    // Sort newest date and time first
    return result.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return timeStringToMinutes(b.checkInTime) - timeStringToMinutes(a.checkInTime);
    });
  }, [allRecords, historySearch, dateFilter]);

  // Overall Historical Summary Stats
  const historyStats = useMemo(() => {
    const totalVisits = filteredHistory.length;
    const uniqueMembers = new Set(filteredHistory.map((r) => r.memberId)).size;

    let totalDurationMinutes = 0;
    let completedWorkoutsCount = 0;

    filteredHistory.forEach((r) => {
      if (r.checkInTime && r.checkOutTime) {
        const inM = timeStringToMinutes(r.checkInTime);
        const outM = timeStringToMinutes(r.checkOutTime);
        let diff = outM - inM;
        if (diff < 0) diff += 24 * 60;
        if (diff > 0 && diff < 12 * 60) {
          totalDurationMinutes += diff;
          completedWorkoutsCount++;
        }
      }
    });

    const avgDuration =
      completedWorkoutsCount > 0
        ? formatMinutesToDuration(Math.round(totalDurationMinutes / completedWorkoutsCount))
        : '1h 15m';

    return {
      totalVisits,
      uniqueMembers,
      avgDuration,
      completedWorkoutsCount,
    };
  }, [filteredHistory]);

  // Group by date for structured reading
  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: Attendance[] } = {};
    filteredHistory.forEach((r) => {
      if (!groups[r.date]) {
        groups[r.date] = [];
      }
      groups[r.date].push(r);
    });
    return groups;
  }, [filteredHistory]);

  const datesList = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-5">
      {/* Historical Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Logged Visits */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Logged Visits
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {historyStats.totalVisits}
            </span>
            <p className="text-[11px] text-slate-500 font-medium">Recorded gym sessions</p>
          </div>
        </div>

        {/* Unique Members */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Unique Gym Members
            </span>
            <span className="text-2xl font-black text-indigo-600 tracking-tight">
              {historyStats.uniqueMembers}
            </span>
            <p className="text-[11px] text-slate-500 font-medium">Distinct members visited</p>
          </div>
        </div>

        {/* Average Visit Duration */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Avg Workout Duration
            </span>
            <span className="text-2xl font-black text-amber-600 tracking-tight">
              {historyStats.avgDuration}
            </span>
            <p className="text-[11px] text-slate-500 font-medium">Per completed session</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="history-search-input"
            placeholder="Search member, phone, or date..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">Range:</span>
          {(['all', '7days', '30days'] as const).map((range) => {
            const labels = {
              all: 'All Time',
              '7days': 'Last 7 Days',
              '30days': 'Last 30 Days',
            };
            const active = dateFilter === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => setDateFilter(range)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labels[range]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped Logs by Date */}
      {datesList.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 text-slate-400 text-xs shadow-2xs">
          No historical records match your search filter.
        </div>
      ) : (
        <div className="space-y-4">
          {datesList.map((date) => {
            const dayRecords = groupedByDate[date];
            return (
              <div
                key={date}
                className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden"
              >
                {/* Date Header Banner */}
                <div className="p-3.5 sm:px-5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900">
                      {formatDateIndian(date)}
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                    {dayRecords.length} {dayRecords.length === 1 ? 'visit' : 'visits'}
                  </span>
                </div>

                {/* Day's Records List */}
                <div className="divide-y divide-slate-100 text-xs">
                  {dayRecords.map((r) => {
                    const memberName = r.memberName || r.member?.full_name || r.member?.name || 'Member';
                    return (
                      <div
                        key={r.id}
                        className="p-3.5 sm:px-5 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div
                          onClick={() => onViewMember(r.memberId)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {memberName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {memberName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {r.phone || 'No phone'} • {r.planName || 'Active Plan'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto text-[11px]">
                          <div className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>In: {r.checkInTime}</span>
                          </div>

                          {r.checkOutTime && (
                            <div className="text-slate-600 font-medium">
                              Out: {r.checkOutTime}
                            </div>
                          )}

                          {r.duration && (
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {r.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
