import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  ShieldAlert,
  CreditCard,
  Edit2,
  Trash2,
  MessageCircle,
  AlertCircle,
  Plus,
  Receipt,
  CheckCircle2,
  Clock,
  ExternalLink,
  CalendarCheck,
  Timer,
  LogOut,
  TrendingUp,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Member, Payment, MemberAttendanceStats, Attendance } from '../../types';
import {
  formatDateIndian,
  formatCurrencyINR,
  getDaysRemaining,
  getStatusBadgeStyle,
  getAttendanceStatusStyle,
} from '../../utils/formatters';
import { isValidPhoneNumber } from '../../utils/whatsapp';
import { WhatsAppReminderModal } from './WhatsAppReminderModal';
import { paymentService } from '../../services/paymentService';
import { attendanceService } from '../../services/attendanceService';
import { RecordPaymentModal } from '../payments/RecordPaymentModal';
import { PaymentDetailsModal } from '../payments/PaymentDetailsModal';
import { CheckOutConfirmModal } from '../attendance/CheckOutConfirmModal';
import { MarkAttendanceModal } from '../attendance/MarkAttendanceModal';
import { RenewMembershipModal } from '../renewals/RenewMembershipModal';

interface MemberProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onEdit?: (member: Member) => void;
  onDelete?: (member: Member) => void;
  onWhatsAppReminder?: (member: Member) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onMemberUpdated?: () => void;
}

export const MemberProfileDrawer: React.FC<MemberProfileDrawerProps> = ({
  isOpen,
  onClose,
  member,
  onEdit,
  onDelete,
  onWhatsAppReminder,
  showToast,
  onMemberUpdated,
}) => {
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [memberPayments, setMemberPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Attendance state for member
  const [attendanceStats, setAttendanceStats] = useState<MemberAttendanceStats | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<Attendance | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  const loadMemberPayments = async (mId: string) => {
    setIsLoadingPayments(true);
    try {
      const data = await paymentService.getPaymentsByMemberId(mId);
      setMemberPayments(data);
    } catch (err) {
      console.error('Error fetching member payments:', err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const loadMemberAttendance = async (mId: string) => {
    setIsLoadingAttendance(true);
    try {
      const stats = await attendanceService.getMemberAttendanceStats(mId);
      setAttendanceStats(stats);
    } catch (err) {
      console.error('Error fetching member attendance:', err);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (isOpen && member?.id) {
      loadMemberPayments(member.id);
      loadMemberAttendance(member.id);
    }
  }, [isOpen, member?.id]);

  if (!isOpen || !member) return null;

  const fullName = member.full_name || member.name || 'Unknown Member';
  const startDate = member.membership_start_date || member.membershipStartDate;
  const endDate = member.membership_end_date || member.membershipEndDate;
  const daysRemaining = getDaysRemaining(endDate);
  const badgeStyle = getStatusBadgeStyle(member.status);
  const planName = member.membership_plan?.name || member.membershipPlan || 'Standard Plan';
  const planPrice = member.membership_plan?.price;
  const planDuration = member.membership_plan?.duration_months;

  const hasPhone = isValidPhoneNumber(member.phone);
  const isExpiringOrExpired = daysRemaining <= 7 || member.status === 'expiring' || member.status === 'expired';

  // Initials for avatar
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleOpenWhatsApp = () => {
    if (onWhatsAppReminder) {
      onWhatsAppReminder(member);
    } else {
      setIsWhatsAppModalOpen(true);
    }
  };

  return (
    <>
      <div
        id="member-profile-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          id="member-profile-drawer"
          className="bg-white h-full w-full max-w-lg shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-sm">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900 leading-snug">{fullName}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">ID: {member.id}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                    {badgeStyle.label}
                  </span>
                  {daysRemaining >= 0 && daysRemaining <= 7 && member.status !== 'inactive' && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                      {daysRemaining === 0 ? 'Expires today' : `${daysRemaining}d remaining`}
                    </span>
                  )}
                  {daysRemaining < 0 && member.status !== 'inactive' && (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md border border-rose-200">
                      Expired {Math.abs(daysRemaining)}d ago
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              id="btn-close-profile-drawer"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Communication Actions & WhatsApp Reminder */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                {member.phone ? (
                  <a
                    href={`tel:${member.phone}`}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Call Phone</span>
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-400 cursor-not-allowed">
                    <Phone className="w-3.5 h-3.5" />
                    <span>No Phone</span>
                  </div>
                )}

                {member.email ? (
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Send Email</span>
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-400 cursor-not-allowed">
                    <Mail className="w-3.5 h-3.5" />
                    <span>No Email</span>
                  </div>
                )}
              </div>

              {/* Primary WhatsApp Reminder Action */}
              {hasPhone ? (
                <button
                  type="button"
                  id="btn-drawer-whatsapp-reminder"
                  onClick={handleOpenWhatsApp}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    isExpiringOrExpired
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Reminder</span>
                  <span className="text-[10px] opacity-75 font-normal ml-1">
                    (Click-to-chat preview)
                  </span>
                </button>
              ) : (
                <div
                  id="btn-drawer-whatsapp-disabled"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span>No phone number available.</span>
                </div>
              )}
            </div>

            {/* Membership Plan Details Card */}
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/15">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-500/10">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Membership Plan Details
                  </h4>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  {planDuration ? `${planDuration} Month${planDuration > 1 ? 's' : ''}` : 'Active Plan'}
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Plan Name:</span>
                  <span className="font-bold text-slate-900">{planName}</span>
                </div>
                {planPrice && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Plan Fee:</span>
                    <span className="font-bold text-slate-900">{formatCurrencyINR(planPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Start Date:</span>
                  <span className="font-semibold text-slate-800">{formatDateIndian(startDate)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Expiry Date:</span>
                  <span className="font-bold text-slate-900">{formatDateIndian(endDate)}</span>
                </div>
              </div>

              {/* Quick Renew Button */}
              <div className="mt-3.5 pt-3 border-t border-amber-500/10 flex items-center justify-between">
                <span className="text-xs text-amber-900/80 font-medium">
                  {daysRemaining < 0
                    ? `Expired ${Math.abs(daysRemaining)} days ago`
                    : daysRemaining <= 7
                    ? `Expiring in ${daysRemaining} days`
                    : `${daysRemaining} days remaining`}
                </span>
                <button
                  type="button"
                  id="btn-drawer-renew-membership"
                  onClick={() => setIsRenewModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Renew Membership</span>
                </button>
              </div>
            </div>

            {/* Member Attendance Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Member Attendance
                  </h4>
                </div>

                {attendanceStats?.isCheckedInToday ? (
                  <button
                    type="button"
                    id="btn-drawer-checkout-member"
                    onClick={() => {
                      if (attendanceStats.todayRecord) {
                        setCheckoutTarget(attendanceStats.todayRecord);
                      }
                    }}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Check Out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="btn-drawer-checkin-member"
                    onClick={() => setIsMarkModalOpen(true)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Mark Check-In</span>
                  </button>
                )}
              </div>

              {isLoadingAttendance ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                  <span className="text-xs text-slate-500">Loading attendance history...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Attendance KPI Summary Row */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Total Visits */}
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                        Total Visits
                      </span>
                      <span className="text-lg font-black text-emerald-700">
                        {attendanceStats?.totalVisits || 0}
                      </span>
                    </div>

                    {/* Current Month Visits */}
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-blue-800 uppercase block">
                        This Month
                      </span>
                      <span className="text-lg font-black text-blue-700">
                        {attendanceStats?.currentMonthVisits || 0}
                      </span>
                    </div>

                    {/* Avg Duration */}
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">
                        Avg Duration
                      </span>
                      <span className="text-lg font-black text-amber-700">
                        {attendanceStats?.avgDurationFormatted || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Last Visit Information */}
                  {attendanceStats?.lastVisit && (
                    <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Last Visit:</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatDateIndian(attendanceStats.lastVisit.date)} at {attendanceStats.lastVisit.checkInTime}
                        {attendanceStats.lastVisit.duration ? ` (${attendanceStats.lastVisit.duration})` : ''}
                      </span>
                    </div>
                  )}

                  {/* Recent Attendance Log Table */}
                  {attendanceStats?.recentHistory && attendanceStats.recentHistory.length > 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                      <div className="p-2.5 bg-slate-50/75 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Recent Visits</span>
                        <span>Check-In / Out</span>
                      </div>
                      {attendanceStats.recentHistory.slice(0, 5).map((visit) => {
                        const statusStyle = getAttendanceStatusStyle(visit.status);
                        return (
                          <div
                            key={visit.id}
                            className="p-2.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-800">
                                {formatDateIndian(visit.date)}
                              </p>
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${statusStyle.bg}`}
                              >
                                {visit.status === 'checked_in' ? 'In Workout' : visit.duration || 'Completed'}
                              </span>
                            </div>

                            <div className="text-right">
                              <p className="font-semibold text-slate-700">
                                {visit.checkInTime}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {visit.checkOutTime ? `Out: ${visit.checkOutTime}` : 'Active'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                      <p className="text-xs text-slate-500">No attendance check-ins recorded yet.</p>
                      <button
                        type="button"
                        onClick={() => setIsMarkModalOpen(true)}
                        className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Record first check-in
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment History & Collections Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span>Payment History ({memberPayments.length})</span>
                </h4>
                <button
                  type="button"
                  id="btn-drawer-record-payment"
                  onClick={() => setIsRecordPaymentOpen(true)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>

              {isLoadingPayments ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                  <span className="text-xs text-slate-500">Loading payment history...</span>
                </div>
              ) : memberPayments.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-500">No payment receipts recorded for this member yet.</p>
                  <button
                    type="button"
                    onClick={() => setIsRecordPaymentOpen(true)}
                    className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Record first payment
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-sm">
                  {memberPayments.map((p) => {
                    const isPaid = p.payment_status === 'Paid';
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedReceipt(p)}
                        className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {paymentService.formatINR(p.amount)}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-600">
                              {p.payment_method}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{paymentService.formatDate(p.payment_date)}</span>
                            {p.transaction_reference && (
                              <span>• Ref: {p.transaction_reference}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : p.payment_status === 'Pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {p.payment_status}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>Contact Information</span>
              </h4>

              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-sm">
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Phone</span>
                  <span className="font-semibold text-slate-800">{member.phone || '—'}</span>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Email</span>
                  <span className="font-medium text-slate-800">{member.email || '—'}</span>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Gender</span>
                  <span className="font-medium text-slate-800 capitalize">{member.gender || 'Not specified'}</span>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Date of Birth</span>
                  <span className="font-medium text-slate-800">
                    {member.date_of_birth ? formatDateIndian(member.date_of_birth) : 'Not provided'}
                  </span>
                </div>
                <div className="p-3.5 flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Residential Address</span>
                  <span className="font-medium text-slate-800">{member.address || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-400" />
                <span>Emergency Contact</span>
              </h4>

              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-sm">
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Contact Person</span>
                  <span className="font-semibold text-slate-800">
                    {member.emergency_contact_name || 'Not provided'}
                  </span>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Emergency Phone</span>
                  <span className="font-medium text-slate-800">
                    {member.emergency_contact_phone || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* Member Portal & Account Status (Distinction between Account and Membership) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Portal Login & Account Status</span>
              </h4>

              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-sm">
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Login Account Status</span>
                    <span className="text-[11px] text-slate-500">
                      Independent of gym membership status
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      member.account_status === 'SUSPENDED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        member.account_status === 'SUSPENDED' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />
                    {member.account_status === 'SUSPENDED' ? 'SUSPENDED (Login Blocked)' : 'ACTIVE (Login Allowed)'}
                  </span>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Gym Membership Status</span>
                  <span className="text-xs font-bold text-slate-700 capitalize">
                    {member.status || 'Active'}
                  </span>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Portal Last Login</span>
                  <span className="text-xs text-slate-700 font-medium">
                    {member.portal_last_login ? formatDateIndian(member.portal_last_login) : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p>Member Enrolled: {member.created_at || member.createdAt ? formatDateIndian(member.created_at || member.createdAt) : '—'}</p>
              <p>Last Modified: {member.updated_at ? formatDateIndian(member.updated_at) : '—'}</p>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              id="btn-drawer-delete-member"
              onClick={() => onDelete(member)}
              className="px-4 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-drawer-close"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Close
              </button>
              {onEdit && (
                <button
                  type="button"
                  id="btn-drawer-edit-member"
                  onClick={() => onEdit(member)}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded WhatsApp Reminder Modal for Drawer */}
      <WhatsAppReminderModal
        isOpen={isWhatsAppModalOpen}
        member={member}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

      {/* Record Payment Modal for this member */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSuccess={() => {
          if (member?.id) loadMemberPayments(member.id);
        }}
        preselectedMemberId={member.id}
        showToast={showToast}
      />

      {/* Receipt Details Modal */}
      <PaymentDetailsModal
        isOpen={Boolean(selectedReceipt)}
        payment={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        onEdit={(p) => {
          setSelectedReceipt(null);
        }}
        onDelete={async (p) => {
          await paymentService.deletePayment(p.id);
          setSelectedReceipt(null);
          if (member?.id) loadMemberPayments(member.id);
          showToast?.('success', 'Payment Removed', 'The receipt was removed.');
        }}
        showToast={showToast}
      />

      {/* Mark Attendance Modal */}
      <MarkAttendanceModal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        onSuccess={(rec, name) => {
          if (member?.id) loadMemberAttendance(member.id);
          showToast?.('success', 'Check-In Recorded', `${name} checked in successfully.`);
          onMemberUpdated?.();
        }}
      />

      {/* Check Out Modal */}
      <CheckOutConfirmModal
        isOpen={Boolean(checkoutTarget)}
        attendance={checkoutTarget}
        onClose={() => setCheckoutTarget(null)}
        onSuccess={(updated, name, duration) => {
          if (member?.id) loadMemberAttendance(member.id);
          showToast?.('success', 'Checked Out', `${name} checked out. Duration: ${duration}`);
          onMemberUpdated?.();
        }}
      />

      {/* Renew Membership Modal */}
      <RenewMembershipModal
        isOpen={isRenewModalOpen}
        member={member}
        onClose={() => setIsRenewModalOpen(false)}
        onSuccess={(updated) => {
          if (member?.id) {
            loadMemberPayments(member.id);
            loadMemberAttendance(member.id);
          }
          onMemberUpdated?.();
          setIsRenewModalOpen(false);
        }}
        showToast={showToast}
      />
    </>
  );
};
