import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  CreditCard,
  IndianRupee,
  Calendar,
  User,
  Layers,
  FileText,
  Hash,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  Member,
  MembershipPlan,
  PaymentMethod,
  PaymentStatus,
  RenewMembershipDTO,
} from '../../types';
import { storageService } from '../../services/storageService';
import { renewalService } from '../../services/renewalService';
import {
  formatDateIndian,
  formatINR,
  getDaysRemaining,
  getStatusBadgeStyle,
} from '../../utils/formatters';

interface RenewMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (member: Member) => void;
  member: Member | null;
  showToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const RenewMembershipModal: React.FC<RenewMembershipModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  member,
  showToast,
}) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load plans on modal open
  useEffect(() => {
    if (isOpen) {
      const allPlans = storageService.getMembershipPlans().filter((p) => p.status === 'active');
      setPlans(allPlans);

      const today = new Date().toISOString().split('T')[0];
      setPaymentDate(today);
      setPaymentMethod('UPI');
      setPaymentStatus('Paid');
      setTransactionReference('');
      setNotes('');
      setError(null);

      // Default plan to member's current plan if active, else first available
      if (member) {
        const initialPlanId = member.membership_plan_id || (allPlans.length > 0 ? allPlans[0].id : '');
        setSelectedPlanId(initialPlanId);

        const initialPlan = allPlans.find((p) => p.id === initialPlanId);
        if (initialPlan) {
          setAmount(String(initialPlan.price));
        } else if (allPlans.length > 0) {
          setAmount(String(allPlans[0].price));
        }
      }
    }
  }, [isOpen, member]);

  // Handle plan change
  const handlePlanChange = (newPlanId: string) => {
    setSelectedPlanId(newPlanId);
    const chosenPlan = plans.find((p) => p.id === newPlanId);
    if (chosenPlan) {
      setAmount(String(chosenPlan.price));
    }
  };

  if (!isOpen || !member) return null;

  const currentPlan = plans.find((p) => p.id === selectedPlanId);
  const currentEndDate = member.membership_end_date || member.membershipEndDate || '';
  const daysRemaining = getDaysRemaining(currentEndDate);
  const isExpired = daysRemaining < 0;
  const statusBadge = getStatusBadgeStyle(member.status);

  // Live calculation of preview
  const duration = currentPlan?.duration_months || 1;
  const preview = renewalService.calculateRenewalPreview(
    currentEndDate,
    duration,
    paymentDate || new Date().toISOString().split('T')[0]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setError('Please enter a valid renewal payment amount.');
      return;
    }
    if (!selectedPlanId) {
      setError('Please select a membership plan.');
      return;
    }
    if (!paymentDate) {
      setError('Please select a renewal payment date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dto: RenewMembershipDTO = {
        member_id: member.id,
        membership_plan_id: selectedPlanId,
        amount: numAmount,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        payment_date: paymentDate,
        transaction_reference: transactionReference.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const result = await renewalService.renewMembership(dto);

      if (result.success && result.data) {
        showToast?.(
          'success',
          'Membership Renewed',
          `${member.full_name || member.name}'s membership renewed until ${formatDateIndian(
            result.data.member.membership_end_date
          )}.`
        );
        onSuccess(result.data.member);
        onClose();
      } else {
        setError(result.error || 'Failed to renew membership.');
      }
    } catch (err: any) {
      console.error('Error during renewal:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="renew-membership-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        id="renew-membership-modal-container"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[calc(100dvh-2rem)] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <RefreshCw className="w-5 h-5 animate-spin-once" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Renew Membership</h3>
              <p className="text-xs text-slate-300">Extend subscription and record verified payment</p>
            </div>
          </div>

          <button
            type="button"
            id="close-renew-modal-button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Context Summary Card */}
        <div className="shrink-0 p-4 sm:px-6 bg-slate-50 border-b border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-slate-800 text-white font-bold text-sm flex items-center justify-center shrink-0 border-2 border-white shadow-xs">
                {(member.full_name || member.name || 'M')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {member.full_name || member.name}
                </h4>
                <p className="text-xs text-slate-500 truncate">{member.phone}</p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-xs">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                <span>{statusBadge.label}</span>
              </span>
              <span className="text-slate-500 text-[11px]">
                {currentEndDate ? `Expiry: ${formatDateIndian(currentEndDate)}` : 'No expiry set'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div
              id="renew-error-alert"
              className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Plan Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Renewal Plan *
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                id="renew-plan-select"
                value={selectedPlanId}
                onChange={(e) => handlePlanChange(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                required
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatINR(p.price)} ({p.duration_months} Month{p.duration_months > 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>
            {currentPlan?.description && (
              <p className="text-[11px] text-slate-500 mt-1 pl-1">{currentPlan.description}</p>
            )}
          </div>

          {/* Amount & Payment Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Renewal Amount (₹) *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  id="renew-amount-input"
                  min="0"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  placeholder="e.g. 9999"
                  required
                />
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  id="renew-date-input"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method *
              </label>
              <select
                id="renew-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                required
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash (Front Desk)</option>
                <option value="Card">Debit / Credit Card (POS)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Status *
              </label>
              <select
                id="renew-status-select"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                required
              >
                <option value="Paid">Paid (Confirmed Receipt)</option>
                <option value="Pending">Pending (Awaiting Settlement)</option>
              </select>
            </div>
          </div>

          {/* Transaction Reference (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reference / UPI ID / Receipt # (Optional)
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="renew-ref-input"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g. UPI/623819002341 or POS-10293"
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Renewal Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <textarea
                id="renew-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                rows={2}
                placeholder="e.g. Renewed at reception, confirmed locker access"
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
              />
            </div>
          </div>

          {/* Live Calculated Expiry Preview Box */}
          <div
            id="renewal-expiry-calculation-preview"
            className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Calculated Membership Dates</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md border border-indigo-200">
                {preview.isExtendedFromCurrentExpiry ? 'Seamless Extension' : 'Fresh Restart'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-indigo-200/50 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">New Period Start:</span>
                <span className="font-bold text-slate-900">
                  {formatDateIndian(preview.newStartDate)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">New Expiry Date:</span>
                <span className="font-bold text-indigo-700 text-sm">
                  {formatDateIndian(preview.newEndDate)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 flex items-start gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <span>{preview.explanation}</span>
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              id="cancel-renew-button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-renew-membership-button"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md shadow-slate-900/10 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recording Renewal...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Renewal & Record Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
