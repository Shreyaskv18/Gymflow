import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  CreditCard,
  Phone,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Member, Attendance } from '../../types';
import { memberService } from '../../services/memberService';
import { attendanceService } from '../../services/attendanceService';
import {
  getCurrentTime12Hour,
  formatDateIndian,
  getDaysRemaining,
  getStatusBadgeStyle,
} from '../../utils/formatters';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: Attendance, memberName: string) => void;
  selectedDate?: string;
}

export const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedDate,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [checkInTime, setCheckInTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expiredWarning, setExpiredWarning] = useState<{ expiredDate: string; message: string } | null>(null);
  const [alreadyCheckedInInfo, setAlreadyCheckedInInfo] = useState<Attendance | null>(null);

  // Initialize time and members list
  useEffect(() => {
    if (isOpen) {
      setCheckInTime(getCurrentTime12Hour());
      setSelectedMember(null);
      setSearchQuery('');
      setErrorMessage(null);
      setExpiredWarning(null);
      setAlreadyCheckedInInfo(null);
      setNotes('');
      loadMembers();
    }
  }, [isOpen]);

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const data = await memberService.getAllMembers();
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members for attendance', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Filter members by name, phone, or ID
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show first 8 members when no search query
      return members.slice(0, 8);
    }
    const q = searchQuery.toLowerCase().trim();
    return members.filter((m) => {
      const name = (m.full_name || m.name || '').toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      const id = (m.id || '').toLowerCase();
      const plan = (m.membershipPlan || m.membership_plan?.name || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || id.includes(q) || plan.includes(q);
    });
  }, [members, searchQuery]);

  // Handle member selection
  const handleSelectMember = async (member: Member) => {
    setSelectedMember(member);
    setErrorMessage(null);
    setExpiredWarning(null);
    setAlreadyCheckedInInfo(null);

    const targetDate = selectedDate || attendanceService.getTodayDateString();

    // Check if member is already checked in for today
    const existing = await attendanceService.getTodayAttendanceForMember(member.id, targetDate);
    if (existing) {
      setAlreadyCheckedInInfo(existing);
    }

    // Check expiry
    const endDate = member.membership_end_date || member.membershipEndDate || '';
    const daysRemaining = getDaysRemaining(endDate);
    if (daysRemaining < 0 || member.status === 'expired') {
      setExpiredWarning({
        expiredDate: endDate ? formatDateIndian(endDate) : 'Expired',
        message: `Membership expired on ${endDate ? formatDateIndian(endDate) : 'past date'}.`,
      });
    }
  };

  const handleSetTimeToNow = () => {
    setCheckInTime(getCurrentTime12Hour());
  };

  const handleCheckIn = async (bypassExpiry = false) => {
    if (!selectedMember) {
      setErrorMessage('Please select a member to check in.');
      return;
    }

    if (alreadyCheckedInInfo) {
      setErrorMessage(
        `${selectedMember.full_name || selectedMember.name} is already checked in on this date (${alreadyCheckedInInfo.checkInTime}).`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const targetDate = selectedDate || attendanceService.getTodayDateString();
      const result = await attendanceService.checkInMember(
        {
          memberId: selectedMember.id,
          date: targetDate,
          checkInTime: checkInTime || getCurrentTime12Hour(),
          notes: notes.trim() || undefined,
          bypassExpiryWarning: bypassExpiry,
        },
        bypassExpiry
      );

      if (result.success && result.record) {
        onSuccess(result.record, selectedMember.full_name || selectedMember.name || 'Member');
        onClose();
      } else if (result.isExpiredWarning) {
        setExpiredWarning({
          expiredDate: result.expiredDate || 'Expired',
          message: result.error || 'Membership has expired.',
        });
      } else {
        setErrorMessage(result.error || 'Failed to record check-in.');
      }
    } catch (err: any) {
      console.error('Error during check-in:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while saving check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="mark-attendance-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overscroll-contain overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="mark-attendance-modal-content"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92dvh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Mark Member Attendance</h3>
              <p className="text-xs text-slate-500 font-medium">
                {selectedDate ? formatDateIndian(selectedDate) : 'Today'} Check-in
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-mark-attendance"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Search Member Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Search & Select Member
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="attendance-member-search-input"
                placeholder="Search by member name, phone number, or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedMember) setSelectedMember(null);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Member Selection List */}
            {!selectedMember && (
              <div className="mt-2.5 max-h-48 overflow-y-auto space-y-1.5 border border-slate-200/80 rounded-xl p-1.5 bg-slate-50/50">
                {isLoadingMembers ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading members...</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No members match "{searchQuery}".
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const memberName = m.full_name || m.name || 'Member';
                    const planName = m.membershipPlan || m.membership_plan?.name || 'Active Plan';
                    const endDate = m.membership_end_date || m.membershipEndDate || '';
                    const daysRemaining = getDaysRemaining(endDate);
                    const isExp = daysRemaining < 0 || m.status === 'expired';
                    const badge = getStatusBadgeStyle(m.status);

                    return (
                      <div
                        key={m.id}
                        id={`select-member-${m.id}`}
                        onClick={() => handleSelectMember(m)}
                        className="p-2.5 rounded-lg bg-white border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {memberName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-900">
                              {memberName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                              <span>{m.phone || 'No phone'}</span>
                              <span>•</span>
                              <span className="text-slate-600 font-medium">{planName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {isExp ? 'Expired' : 'Active'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Selected Member Details Card */}
          {selectedMember && (
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-3 animate-in fade-in-50 duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {(selectedMember.full_name || selectedMember.name || 'M').charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {selectedMember.full_name || selectedMember.name}
                    </h4>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{selectedMember.phone || 'No phone'}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    setExpiredWarning(null);
                    setAlreadyCheckedInInfo(null);
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-100/60 px-2 py-1 rounded-md transition-colors"
                >
                  Change
                </button>
              </div>

              {/* Membership Plan Info */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-100 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Membership Plan:</span>
                  <span className="font-bold text-slate-800">
                    {selectedMember.membershipPlan || selectedMember.membership_plan?.name || 'Active Plan'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Plan Expiry:</span>
                  <span
                    className={`font-bold ${
                      expiredWarning ? 'text-rose-600' : 'text-slate-800'
                    }`}
                  >
                    {selectedMember.membership_end_date || selectedMember.membershipEndDate
                      ? formatDateIndian(selectedMember.membership_end_date || selectedMember.membershipEndDate!)
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              {!expiredWarning && !alreadyCheckedInInfo && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-white p-2 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Membership active & verified (
                    {getDaysRemaining(selectedMember.membership_end_date || selectedMember.membershipEndDate || '')} days remaining)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Warning: Already Checked In Today */}
          {alreadyCheckedInInfo && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Member is already recorded for this date!</span>
              </div>
              <p className="text-amber-700 text-[11px]">
                {selectedMember?.full_name || selectedMember?.name} checked in at{' '}
                <strong>{alreadyCheckedInInfo.checkInTime}</strong>
                {alreadyCheckedInInfo.status === 'checked_out'
                  ? ` and checked out at ${alreadyCheckedInInfo.checkOutTime || 'earlier'} (Duration: ${
                      alreadyCheckedInInfo.duration || '—'
                    }).`
                  : ' and is currently active in the gym.'}
              </p>
            </div>
          )}

          {/* Warning: Expired Membership Notice & Explicit Choices */}
          {expiredWarning && !alreadyCheckedInInfo && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-rose-900">
                    Membership Expired Notice
                  </h5>
                  <p className="text-xs text-rose-700 mt-0.5">
                    {expiredWarning.message} This member is not currently active.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between gap-2">
                <span className="text-[11px] text-rose-600 font-medium">
                  Do you want to override and permit check-in?
                </span>
                <button
                  type="button"
                  id="btn-checkin-anyway"
                  disabled={isSubmitting}
                  onClick={() => handleCheckIn(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Checking in...' : 'Check In Anyway'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Check-in Time & Notes */}
          {selectedMember && !alreadyCheckedInInfo && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Check-in Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Time Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-600">Check-in Time</span>
                    <button
                      type="button"
                      onClick={handleSetTimeToNow}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
                    >
                      Set to Now
                    </button>
                  </div>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      id="attendance-checkin-time-input"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      placeholder="e.g. 06:42 PM"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Notes (Optional)
                  </span>
                  <input
                    type="text"
                    id="attendance-checkin-notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Morning cardio, guest"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            id="btn-cancel-mark-attendance"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors cursor-pointer min-h-[44px]"
          >
            Cancel
          </button>

          {selectedMember && !alreadyCheckedInInfo && (
            <button
              type="button"
              id="btn-submit-checkin"
              onClick={() => handleCheckIn(false)}
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[44px] ${
                expiredWarning
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Recording Check-in...'
                  : expiredWarning
                  ? 'Check In (Requires Review)'
                  : 'Check In'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
