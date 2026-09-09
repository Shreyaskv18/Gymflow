import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  Plus,
  Search,
  Filter,
  Users,
  Activity,
  Calendar,
  CheckCircle2,
  AlertCircle,
  History,
  TrendingUp,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { Attendance, AttendanceSummary, AttendanceStatus, Member } from '../types';
import { attendanceService } from '../services/attendanceService';
import { memberService } from '../services/memberService';
import { AttendanceStatsCards } from '../components/attendance/AttendanceStatsCards';
import { AttendanceTable } from '../components/attendance/AttendanceTable';
import { MarkAttendanceModal } from '../components/attendance/MarkAttendanceModal';
import { CheckOutConfirmModal } from '../components/attendance/CheckOutConfirmModal';
import { AttendanceHistoryView } from '../components/attendance/AttendanceHistoryView';
import { MemberProfileDrawer } from '../components/members/MemberProfileDrawer';

interface AttendancePageProps {
  onNavigateToTab?: (tab: string) => void;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ onNavigateToTab }) => {
  // Active view: Live / Today vs Historical Analytics
  const [activeView, setActiveView] = useState<'live' | 'history'>('live');

  // Selected date (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(attendanceService.getTodayDateString());
  const isToday = selectedDate === attendanceService.getTodayDateString();

  // Search & Status filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');

  // Data state
  const [records, setRecords] = useState<Attendance[]>([]);
  const [allHistoryRecords, setAllHistoryRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    date: selectedDate,
    todayAttendance: 0,
    presentToday: 0,
    absentToday: 0,
    currentlyCheckedIn: 0,
    checkedOutCount: 0,
    totalActiveMembers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<Attendance | null>(null);

  // Member profile drawer
  const [selectedMemberForDrawer, setSelectedMemberForDrawer] = useState<Member | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Load attendance data
  const loadAttendanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dayRecords, stats, allRecords] = await Promise.all([
        attendanceService.getAttendanceForDate(selectedDate),
        attendanceService.getAttendanceStats(selectedDate),
        attendanceService.getAllAttendance(),
      ]);

      setRecords(dayRecords);
      setSummary(stats);
      setAllHistoryRecords(allRecords);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Filtered records for the table
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (r.memberName || r.member?.full_name || r.member?.name || '').toLowerCase();
        const phone = (r.phone || r.member?.phone || '').toLowerCase();
        const plan = (r.planName || r.member?.membershipPlan || '').toLowerCase();
        const id = (r.memberId || '').toLowerCase();

        return name.includes(q) || phone.includes(q) || plan.includes(q) || id.includes(q);
      }

      return true;
    });
  }, [records, statusFilter, searchQuery]);

  // Handle Mark Attendance Success
  const handleMarkSuccess = (newRecord: Attendance, memberName: string) => {
    showToast(`${memberName} checked in successfully.`, 'success');
    loadAttendanceData();
  };

  // Handle Check-out Success
  const handleCheckOutSuccess = (updated: Attendance, memberName: string, duration: string) => {
    showToast(`${memberName} checked out successfully. Duration: ${duration}`, 'success');
    loadAttendanceData();
  };

  // Handle View Member Profile
  const handleViewMember = async (memberId: string) => {
    try {
      const member = await memberService.getMemberById(memberId);
      if (member) {
        setSelectedMemberForDrawer(member);
      }
    } catch (err) {
      console.error('Error fetching member profile:', err);
    }
  };

  // Handle Delete Attendance
  const handleDeleteRecord = async (id: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove the check-in record for ${memberName}?`)) {
      try {
        await attendanceService.deleteAttendance(id);
        showToast(`Attendance record for ${memberName} was removed.`, 'info');
        loadAttendanceData();
      } catch (err) {
        console.error('Error deleting attendance:', err);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 transition-all animate-in slide-in-from-top duration-200 max-w-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Attendance Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Track member check-ins, check-outs, and gym capacity in real time
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Mark Attendance Button */}
          <button
            type="button"
            id="btn-open-mark-attendance"
            onClick={() => setIsMarkModalOpen(true)}
            className="px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Mark Attendance</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs (Live Attendance vs History) */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="tab-view-live-attendance"
            onClick={() => setActiveView('live')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'live'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Daily Attendance ({records.length})</span>
          </button>

          <button
            type="button"
            id="tab-view-attendance-history"
            onClick={() => setActiveView('history')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'history'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Attendance History ({allHistoryRecords.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadAttendanceData}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Refresh attendance records"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {activeView === 'live' ? (
        <div className="space-y-6">
          {/* Top Summary KPI Cards with Date Navigator */}
          <AttendanceStatsCards
            summary={summary}
            selectedDate={selectedDate}
            onDateChange={(newDate) => setSelectedDate(newDate)}
            isToday={isToday}
            onSetToday={() => setSelectedDate(attendanceService.getTodayDateString())}
          />

          {/* Search and Status Filters Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="search-attendance-input"
                placeholder="Search member by name, phone, plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">
                Status:
              </span>
              <button
                type="button"
                id="filter-status-all"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({records.length})
              </button>

              <button
                type="button"
                id="filter-status-checked-in"
                onClick={() => setStatusFilter('checked_in')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'checked_in'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Checked In ({summary.currentlyCheckedIn})</span>
              </button>

              <button
                type="button"
                id="filter-status-checked-out"
                onClick={() => setStatusFilter('checked_out')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'checked_out'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Checked Out ({summary.checkedOutCount})
              </button>
            </div>
          </div>

          {/* Today's Attendance Table / Responsive Mobile Cards */}
          <AttendanceTable
            records={filteredRecords}
            onCheckOut={(record) => setCheckoutTarget(record)}
            onViewMember={handleViewMember}
            onDeleteRecord={handleDeleteRecord}
            onOpenMarkAttendance={() => setIsMarkModalOpen(true)}
            isLoading={isLoading}
          />
        </div>
      ) : (
        /* Attendance History Analytics View */
        <AttendanceHistoryView
          allRecords={allHistoryRecords}
          onViewMember={handleViewMember}
        />
      )}

      {/* Mark Attendance Modal */}
      <MarkAttendanceModal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        onSuccess={handleMarkSuccess}
        selectedDate={selectedDate}
      />

      {/* Check-Out Confirm Modal */}
      <CheckOutConfirmModal
        isOpen={Boolean(checkoutTarget)}
        attendance={checkoutTarget}
        onClose={() => setCheckoutTarget(null)}
        onSuccess={handleCheckOutSuccess}
      />

      {/* Member Profile Drawer */}
      <MemberProfileDrawer
        isOpen={Boolean(selectedMemberForDrawer)}
        member={selectedMemberForDrawer}
        onClose={() => setSelectedMemberForDrawer(null)}
        onMemberUpdated={() => loadAttendanceData()}
      />
    </div>
  );
};
