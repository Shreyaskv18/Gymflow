import React from 'react';
import {
  Clock,
  LogOut,
  Phone,
  User,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Timer,
  MoreVertical,
  Activity,
  Plus,
} from 'lucide-react';
import { Attendance, Member } from '../../types';
import { getAttendanceStatusStyle, formatTime12Hour } from '../../utils/formatters';

interface AttendanceTableProps {
  records: Attendance[];
  onCheckOut: (record: Attendance) => void;
  onViewMember: (memberId: string) => void;
  onDeleteRecord: (id: string, memberName: string) => void;
  onOpenMarkAttendance: () => void;
  isLoading?: boolean;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  onCheckOut,
  onViewMember,
  onDeleteRecord,
  onOpenMarkAttendance,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-2xs">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading attendance records...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-10 sm:p-14 text-center shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <Clock className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Attendance Records Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
          There are no member check-ins recorded for the selected filter or date. Members checked in will appear here.
        </p>
        <button
          type="button"
          id="btn-empty-mark-attendance"
          onClick={onOpenMarkAttendance}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Mark Attendance</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table (hidden on mobile, visible on md+) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 pl-5">Member</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Membership Plan</th>
                <th className="py-3.5 px-4">Check-In</th>
                <th className="py-3.5 px-4">Check-Out</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {records.map((record) => {
                const memberName = record.memberName || record.member?.full_name || record.member?.name || 'Member';
                const isCheckedIn = record.status === 'checked_in';
                const statusStyle = getAttendanceStatusStyle(record.status);
                const phone = record.phone || record.member?.phone || '—';
                const planName = record.planName || record.member?.membershipPlan || 'Active Plan';

                return (
                  <tr
                    key={record.id}
                    id={`attendance-row-${record.id}`}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Member */}
                    <td className="py-3.5 px-4 pl-5">
                      <div
                        onClick={() => onViewMember(record.memberId)}
                        className="flex items-center gap-3 cursor-pointer group/name"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 group-hover/name:bg-emerald-100 group-hover/name:text-emerald-800 transition-colors">
                          {memberName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover/name:text-emerald-700 transition-colors flex items-center gap-1">
                            <span>{memberName}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/name:opacity-100 text-emerald-600 transition-opacity" />
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">ID: {record.memberId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-600 font-medium flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{phone}</span>
                      </span>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/50">
                        {planName}
                      </span>
                    </td>

                    {/* Check In */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{record.checkInTime}</span>
                      </div>
                    </td>

                    {/* Check Out */}
                    <td className="py-3.5 px-4">
                      {record.checkOutTime ? (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <LogOut className="w-3.5 h-3.5 text-slate-400" />
                          <span>{record.checkOutTime}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">—</span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4">
                      {isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>In Workout</span>
                        </span>
                      ) : (
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 text-slate-400" />
                          <span>{record.duration || '—'}</span>
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusStyle.bg} ${statusStyle.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        <span>{statusStyle.label}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isCheckedIn ? (
                          <button
                            type="button"
                            id={`btn-checkout-table-${record.id}`}
                            onClick={() => onCheckOut(record)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="Check out member"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Check Out</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onViewMember(record.memberId)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            View Member
                          </button>
                        )}

                        <button
                          type="button"
                          id={`btn-delete-attendance-${record.id}`}
                          onClick={() => onDeleteRecord(record.id, memberName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete/Undo check-in record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List (visible on small screens < md) */}
      <div className="block md:hidden space-y-3">
        {records.map((record) => {
          const memberName = record.memberName || record.member?.full_name || record.member?.name || 'Member';
          const isCheckedIn = record.status === 'checked_in';
          const statusStyle = getAttendanceStatusStyle(record.status);
          const phone = record.phone || record.member?.phone || '—';
          const planName = record.planName || record.member?.membershipPlan || 'Active Plan';

          return (
            <div
              key={record.id}
              id={`mobile-attendance-card-${record.id}`}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3"
            >
              {/* Header: Avatar, Name, Plan, Status */}
              <div className="flex items-start justify-between gap-2">
                <div
                  onClick={() => onViewMember(record.memberId)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0">
                    {memberName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate flex items-center gap-1">
                      <span>{memberName}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </h4>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      <span>{planName}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${statusStyle.bg} ${statusStyle.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                  <span>{statusStyle.label}</span>
                </span>
              </div>

              {/* Attendance Details Grid */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Check-In</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{record.checkInTime}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Check-Out</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span>{record.checkOutTime || 'Active In Gym'}</span>
                  </span>
                </div>

                {record.duration && (
                  <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Workout Duration:</span>
                    <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {record.duration}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {isCheckedIn ? (
                  <button
                    type="button"
                    id={`btn-mobile-checkout-${record.id}`}
                    onClick={() => onCheckOut(record)}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Check Out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onViewMember(record.memberId)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>View Member</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteRecord(record.id, memberName)}
                  className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Delete record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
