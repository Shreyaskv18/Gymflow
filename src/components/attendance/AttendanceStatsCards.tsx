import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { AttendanceSummary } from '../../types';
import { formatDateLongIndian } from '../../utils/formatters';

interface AttendanceStatsCardsProps {
  summary: AttendanceSummary;
  selectedDate: string;
  onDateChange: (newDate: string) => void;
  isToday: boolean;
  onSetToday: () => void;
}

export const AttendanceStatsCards: React.FC<AttendanceStatsCardsProps> = ({
  summary,
  selectedDate,
  onDateChange,
  isToday,
  onSetToday,
}) => {
  // Navigation helper for date
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
  };

  const formattedDateTitle = formatDateLongIndian(selectedDate);

  return (
    <div className="space-y-4">
      {/* Date Header & Quick Navigator Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {formattedDateTitle}
              </h2>
              {isToday ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Today's Live
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Historical View
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live facility check-ins & member attendance tracking
            </p>
          </div>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            id="btn-prev-attendance-date"
            onClick={handlePrevDay}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            id="attendance-date-picker"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) onDateChange(e.target.value);
            }}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none px-2 py-1 cursor-pointer"
          />

          <button
            type="button"
            id="btn-next-attendance-date"
            onClick={handleNextDay}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              type="button"
              id="btn-reset-to-today"
              onClick={onSetToday}
              className="ml-1 px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* 5 KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Today's Attendance */}
        <div
          id="kpi-today-attendance"
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isToday ? "Today's Attendance" : 'Total Attendance'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {summary.todayAttendance}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Check-in events recorded
            </p>
          </div>
        </div>

        {/* 2. Present Today */}
        <div
          id="kpi-present-today"
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Present Today
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-blue-600 tracking-tight">
              {summary.presentToday}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Unique gym attendees
            </p>
          </div>
        </div>

        {/* 3. Absent Today */}
        <div
          id="kpi-absent-today"
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Absent Today
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600 tracking-tight">
              {summary.absentToday}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Active members not visited
            </p>
          </div>
        </div>

        {/* 4. Currently Checked In (Live) */}
        <div
          id="kpi-currently-checked-in"
          className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/15 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Checked In</span>
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">
              {summary.currentlyCheckedIn}
            </span>
            <p className="text-[11px] text-emerald-600/80 font-medium mt-0.5">
              Inside gym right now
            </p>
          </div>
        </div>

        {/* 5. Total Active Members */}
        <div
          id="kpi-total-active-members"
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Active Members
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {summary.totalActiveMembers}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Enrolled & unexpired
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
