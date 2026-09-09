import React, { useState } from 'react';
import { Flame, Clock, Calendar, CheckCircle2, Trophy, Dumbbell, Award, ArrowUpRight } from 'lucide-react';
import { Member } from '../../types';
import { AttendanceSummary } from '../../services/memberService';

interface MemberAttendanceTabProps {
  member: Member;
  attendanceData: AttendanceSummary;
  onOpenDigitalPass: () => void;
}

export const MemberAttendanceTab: React.FC<MemberAttendanceTabProps> = ({
  member,
  attendanceData,
  onOpenDigitalPass,
}) => {
  const [filterMonth, setFilterMonth] = useState<string>('all');

  const records = attendanceData.records;

  // Days of the week activity simulation for current week
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const attendedDaysIndices = [0, 1, 2, 4]; // Mon, Tue, Wed, Fri attended

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Workout Attendance & Streak</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track your gym visits, daily check-ins, workout duration, and personal fitness consistency
          </p>
        </div>

        <button
          onClick={onOpenDigitalPass}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-all"
        >
          <Dumbbell className="w-4 h-4 mr-2 text-emerald-400" />
          Check-In Pass
        </button>
      </div>

      {/* Stats Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-orange-100 uppercase tracking-wider">
            <span>Workout Streak</span>
            <Flame className="w-5 h-5 text-yellow-200 animate-bounce" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-black">{attendanceData.stats.streakDays}</span>
              <span className="text-xs font-semibold text-orange-100">days active</span>
            </div>
            <p className="text-[11px] text-orange-100 mt-1">Consistency pays off! Keep going strong.</p>
          </div>
          <div className="text-[11px] font-medium bg-white/20 px-2.5 py-1 rounded-lg w-fit">
            🔥 Level 2 Gym Beast
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>This Month</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-slate-900">{attendanceData.stats.thisMonthVisits}</span>
            <span className="text-xs text-slate-500 ml-2 font-medium">sessions</span>
            <p className="text-xs text-slate-500 mt-1">Goal: 16 sessions/mo</p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (attendanceData.stats.thisMonthVisits / 16) * 100)}%` }}
            />
          </div>
        </div>

        {/* Lifetime Visits */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Lifetime Visits</span>
            <Trophy className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-slate-900">{attendanceData.stats.totalVisits}</span>
            <span className="text-xs text-slate-500 ml-2 font-medium">workouts logged</span>
            <p className="text-xs text-slate-500 mt-1">Since {member.membership_start_date}</p>
          </div>
          <span className="text-xs font-bold text-indigo-600">Top 15% dedicated member</span>
        </div>

        {/* Avg Duration */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Avg Session Time</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-slate-900">1h 20m</span>
            <p className="text-xs text-slate-500 mt-1">Optimal hypertrophic training window</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
            Great Intensity
          </span>
        </div>
      </div>

      {/* Weekly Activity Heatmap Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Current Week Breakdown</h3>
            <p className="text-xs text-slate-500">Your daily attendance log for this week</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
            4 / 6 Days Completed
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day, idx) => {
            const isAttended = attendedDaysIndices.includes(idx);
            return (
              <div
                key={day}
                className={`rounded-xl p-1.5 sm:p-3 text-center border transition-all ${
                  isAttended
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                <p className="text-[10px] sm:text-xs font-bold uppercase">{day}</p>
                <div className="my-1 sm:my-1.5 flex justify-center">
                  {isAttended ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-slate-300" />
                  )}
                </div>
                <p className="text-[9px] sm:text-[10px] font-semibold truncate">
                  {isAttended ? 'Attended' : idx === 6 ? 'Rest' : 'Off'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Check-In Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Attendance History Log</h3>
          <span className="text-xs text-slate-500">Showing all records</span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-4">Check-In</th>
                <th className="py-3.5 px-4">Check-Out</th>
                <th className="py-3.5 px-4">Workout Duration</th>
                <th className="py-3.5 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    {att.date}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-mono">
                    {att.checkInTime}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-mono">
                    {att.checkOutTime || '—'}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {att.duration || '1h 30m'}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (< md screens) */}
        <div id="member-attendance-mobile-cards" className="md:hidden divide-y divide-slate-100 p-3 space-y-2.5">
          {records.map((att) => (
            <div
              key={att.id}
              id={`member-attendance-card-${att.id}`}
              className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {att.date}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                  Completed
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">In</span>
                  <span className="font-mono text-slate-700 font-medium">{att.checkInTime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Out</span>
                  <span className="font-mono text-slate-700 font-medium">{att.checkOutTime || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Duration</span>
                  <span className="font-bold text-slate-800">{att.duration || '1h 30m'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
