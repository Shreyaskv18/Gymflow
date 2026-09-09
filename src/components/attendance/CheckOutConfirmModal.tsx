import React, { useState, useEffect } from 'react';
import {
  X,
  LogOut,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Calendar,
} from 'lucide-react';
import { Attendance } from '../../types';
import { attendanceService } from '../../services/attendanceService';
import {
  getCurrentTime12Hour,
  calculateVisitDuration,
  formatDateIndian,
} from '../../utils/formatters';

interface CheckOutConfirmModalProps {
  isOpen: boolean;
  attendance: Attendance | null;
  onClose: () => void;
  onSuccess: (updated: Attendance, memberName: string, duration: string) => void;
}

export const CheckOutConfirmModal: React.FC<CheckOutConfirmModalProps> = ({
  isOpen,
  attendance,
  onClose,
  onSuccess,
}) => {
  const [checkOutTime, setCheckOutTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && attendance) {
      setCheckOutTime(getCurrentTime12Hour());
      setNotes(attendance.notes || '');
      setErrorMessage(null);
    }
  }, [isOpen, attendance]);

  if (!isOpen || !attendance) return null;

  const liveDuration = calculateVisitDuration(attendance.checkInTime, checkOutTime);
  const memberName = attendance.memberName || attendance.member?.full_name || 'Member';

  const handleConfirmCheckout = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await attendanceService.checkOutMember({
        id: attendance.id,
        checkOutTime: checkOutTime || getCurrentTime12Hour(),
        notes: notes.trim() || undefined,
      });

      if (result.success && result.record) {
        onSuccess(result.record, memberName, result.duration || liveDuration);
        onClose();
      } else {
        setErrorMessage(result.error || 'Failed to complete check out.');
      }
    } catch (err: any) {
      console.error('Error checking out member:', err);
      setErrorMessage(err.message || 'An error occurred during checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="checkout-confirm-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overscroll-contain overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="checkout-confirm-modal-content"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Check Out Member</h3>
              <p className="text-xs text-slate-500 font-medium">Record workout completion</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-checkout-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Member Card Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{memberName}</h4>
                <p className="text-xs text-slate-500">{attendance.planName || 'Active Member'}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                In Gym
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Check-in Time:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{attendance.checkInTime}</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Workout Date:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDateIndian(attendance.date)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Check-out Time Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Check-Out Time
              </label>
              <button
                type="button"
                onClick={() => setCheckOutTime(getCurrentTime12Hour())}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                Set to Now
              </button>
            </div>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="checkout-time-input"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                placeholder="e.g. 08:05 PM"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Live Calculated Duration Preview Box */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900">
              <Timer className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold">Total Duration:</span>
            </div>
            <span className="text-sm font-extrabold text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200/60 shadow-2xs">
              {liveDuration}
            </span>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Checkout Notes (Optional)
            </label>
            <input
              type="text"
              id="checkout-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Personal training session finished"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors cursor-pointer min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-confirm-checkout-action"
            onClick={handleConfirmCheckout}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving Checkout...' : 'Confirm Check Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
