import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  IndianRupee,
  Calendar,
  User,
  Layers,
  FileText,
  Hash,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  Payment,
  Member,
  MembershipPlan,
  PaymentMethod,
  PaymentStatus,
  CreatePaymentDTO,
  UpdatePaymentDTO,
} from '../../types';
import { storageService } from '../../services/storageService';
import { paymentService } from '../../services/paymentService';
import { memberService } from '../../services/memberService';
import { membershipPlanService } from '../../services/membershipPlanService';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
  editingPayment?: Payment | null;
  preselectedMemberId?: string | null;
  showToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingPayment,
  preselectedMemberId,
  showToast,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  // Form State
  const [memberId, setMemberId] = useState<string>('');
  const [planId, setPlanId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  // Load available members and plans
  useEffect(() => {
    if (isOpen) {
      // 1. Synchronously load cached data from storage
      const allMembers = storageService.getMembers();
      const allPlans = storageService.getMembershipPlans();
      setMembers(allMembers);
      setPlans(allPlans);

      const today = new Date().toISOString().split('T')[0];

      if (editingPayment) {
        setMemberId(editingPayment.member_id || editingPayment.memberId || '');
        setPlanId(editingPayment.membership_plan_id || (editingPayment as any).membershipPlanId || '');
        setAmount(String(editingPayment.amount || ''));
        setPaymentDate(editingPayment.payment_date || editingPayment.paymentDate || today);
        setPaymentMethod(editingPayment.payment_method || 'UPI');
        setPaymentStatus(editingPayment.payment_status || 'Paid');
        setTransactionReference(editingPayment.transaction_reference || '');
        setNotes(editingPayment.notes || '');
      } else {
        const initialMemberId = preselectedMemberId || (allMembers.length > 0 ? allMembers[0].id : '');
        setMemberId(initialMemberId);

        // Find member's active plan if available
        const selectedMember = allMembers.find((m) => m.id === initialMemberId);
        const memberPlanId = selectedMember?.membership_plan_id || (allPlans.length > 0 ? allPlans[0].id : '');
        setPlanId(memberPlanId);

        const initialPlan = allPlans.find((p) => p.id === memberPlanId);
        setAmount(initialPlan ? String(initialPlan.price) : '');
        setPaymentDate(today);
        setPaymentMethod('UPI');
        setPaymentStatus('Paid');
        setTransactionReference('');
        setNotes('');
      }

      setErrors({});
      setSearchMemberQuery('');

      // 2. Asynchronously fetch fresh members & plans to ensure newly registered members appear instantly
      Promise.all([
        memberService.getAllMembers().catch(() => allMembers),
        membershipPlanService.getAllPlans().catch(() => ({ data: allPlans })),
      ]).then(([freshMembers, plansRes]) => {
        if (freshMembers && freshMembers.length > 0) {
          setMembers(freshMembers);
          if (!editingPayment && !preselectedMemberId) {
            setMemberId((prev) => prev || freshMembers[0].id);
          }
        }
        if (plansRes && plansRes.data && plansRes.data.length > 0) {
          setPlans(plansRes.data);
        }
      });
    }
  }, [isOpen, editingPayment, preselectedMemberId]);

  // When a plan is changed, auto-fill price suggestion if user hasn't typed a custom amount
  const handlePlanChange = (selectedPlanId: string) => {
    setPlanId(selectedPlanId);
    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    if (selectedPlan) {
      setAmount(String(selectedPlan.price));
      if (errors.membership_plan_id || errors.amount) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.membership_plan_id;
          delete next.amount;
          return next;
        });
      }
    }
  };

  // When a member is changed, if not in edit mode, auto-select their default plan
  const handleMemberChange = (selectedMemberId: string) => {
    setMemberId(selectedMemberId);
    if (!editingPayment) {
      const m = members.find((mem) => mem.id === selectedMemberId);
      if (m?.membership_plan_id) {
        const p = plans.find((pl) => pl.id === m.membership_plan_id);
        if (p) {
          setPlanId(p.id);
          setAmount(String(p.price));
        }
      }
    }
    if (errors.member_id) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.member_id;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const err: Record<string, string> = {};

    if (!memberId) {
      err.member_id = 'Please select a member.';
    }

    if (!planId) {
      err.membership_plan_id = 'Please select a membership plan.';
    }

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      err.amount = 'Please enter a valid amount greater than ₹0.';
    }

    if (!paymentDate) {
      err.payment_date = 'Payment date is required.';
    } else {
      const d = new Date(paymentDate);
      if (isNaN(d.getTime())) {
        err.payment_date = 'Please enter a valid date.';
      }
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Safely blur any focused input to prevent mobile keyboard viewport jumping
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const parsedAmount = Math.round(Number(amount) * 100) / 100;

      if (editingPayment) {
        const updatePayload: UpdatePaymentDTO = {
          member_id: memberId,
          membership_plan_id: planId,
          amount: parsedAmount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          transaction_reference: transactionReference.trim() || undefined,
          notes: notes.trim() || undefined,
        };

        const res = await paymentService.updatePayment(editingPayment.id, updatePayload);
        if (res.success && res.data) {
          showToast?.('success', 'Payment Updated', `Payment of ₹${parsedAmount.toLocaleString('en-IN')} updated successfully.`);
          onSuccess(res.data);
          onClose();
        } else {
          setErrors({ form: res.error || 'Failed to update payment.' });
          showToast?.('error', 'Update Failed', res.error || 'Failed to update payment.');
        }
      } else {
        const createPayload: CreatePaymentDTO = {
          member_id: memberId,
          membership_plan_id: planId,
          amount: parsedAmount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          transaction_reference: transactionReference.trim() || undefined,
          notes: notes.trim() || undefined,
        };

        const res = await paymentService.recordPayment(createPayload);
        if (res.success && res.data) {
          showToast?.(
            'success',
            'Payment Recorded',
            `Receipt created for ₹${parsedAmount.toLocaleString('en-IN')}.`
          );
          onSuccess(res.data);
          onClose();
        } else {
          setErrors({ form: res.error || 'Failed to record payment.' });
          showToast?.('error', 'Recording Failed', res.error || 'Failed to record payment.');
        }
      }
    } catch (err) {
      console.error('Error saving payment:', err);
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const paymentMethodsList: PaymentMethod[] = ['UPI', 'Cash', 'Card', 'Bank Transfer', 'Other'];
  const paymentStatusesList: PaymentStatus[] = ['Paid', 'Pending', 'Failed', 'Refunded'];

  const filteredMembers = members.filter((m) => {
    if (!searchMemberQuery.trim()) return true;
    const q = searchMemberQuery.toLowerCase();
    return (
      (m.full_name || m.name || '').toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q)
    );
  });

  const selectedMember = members.find((m) => m.id === memberId);
  const selectedPlan = plans.find((p) => p.id === planId);

  return (
    <div
      id="record-payment-modal-backdrop"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        id="record-payment-modal"
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col h-[calc(100dvh-1.5rem)] sm:h-auto sm:max-h-[calc(100vh-3.5rem)]"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingPayment ? 'Edit Payment Record' : 'Record New Payment'}
              </h2>
              <p className="text-xs text-slate-500 line-clamp-1 sm:line-clamp-none">
                {editingPayment
                  ? 'Update transaction details and receipt notes'
                  : 'Add a manual payment received at gym front desk'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-record-payment-modal"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 overscroll-contain pb-8 sm:pb-6">
            {errors.form && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Member Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Member <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="payment-member-select"
                  value={memberId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors min-h-[48px] ${
                    errors.member_id ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- Select Gym Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.name} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>
              {errors.member_id && (
                <p className="text-xs text-rose-600 mt-1">{errors.member_id}</p>
              )}
            </div>

            {/* Plan Selection & Amount in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Membership Plan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Membership Plan <span className="text-rose-500">*</span>
                </label>
                <select
                  id="payment-plan-select"
                  value={planId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors min-h-[48px] ${
                    errors.membership_plan_id ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- Select Plan --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price} / {p.duration_months} mo)
                    </option>
                  ))}
                </select>
                {errors.membership_plan_id && (
                  <p className="text-xs text-rose-600 mt-1">{errors.membership_plan_id}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount (₹ INR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="font-semibold text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    id="payment-amount-input"
                    min="1"
                    step="1"
                    placeholder="e.g. 4999"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.amount;
                          return next;
                        });
                      }
                    }}
                    className={`w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors min-h-[48px] ${
                      errors.amount ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-xs text-rose-600 mt-1">{errors.amount}</p>
                )}
              </div>
            </div>

            {/* Payment Date & Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Payment Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="payment-date-input"
                    value={paymentDate}
                    onChange={(e) => {
                      setPaymentDate(e.target.value);
                      if (errors.payment_date) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.payment_date;
                          return next;
                        });
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors min-h-[48px] ${
                      errors.payment_date ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.payment_date && (
                  <p className="text-xs text-rose-600 mt-1">{errors.payment_date}</p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <select
                  id="payment-method-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors min-h-[48px]"
                >
                  {paymentMethodsList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {paymentStatusesList.map((st) => {
                  const isSelected = paymentStatus === st;
                  let activeStyle = 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold';
                  if (st === 'Paid') activeStyle = 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold';
                  if (st === 'Pending') activeStyle = 'bg-amber-50 border-amber-500 text-amber-700 font-semibold';
                  if (st === 'Failed') activeStyle = 'bg-rose-50 border-rose-500 text-rose-700 font-semibold';
                  if (st === 'Refunded') activeStyle = 'bg-slate-100 border-slate-500 text-slate-700 font-semibold';

                  return (
                    <button
                      type="button"
                      key={st}
                      id={`payment-status-btn-${st.toLowerCase()}`}
                      onClick={() => setPaymentStatus(st)}
                      className={`py-2 px-3 rounded-xl text-xs border text-center transition-all cursor-pointer min-h-[44px] flex items-center justify-center ${
                        isSelected
                          ? activeStyle
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transaction Reference (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Transaction Reference / UTR</span>
                <span className="text-[11px] font-normal text-slate-400">Optional</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="payment-tx-ref-input"
                  placeholder="e.g. UPI/623819002341, POS-HDFC-9921, Cheque #091823"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors min-h-[48px]"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Useful for reconciliation with bank statement or UPI transactions.
              </p>
            </div>

            {/* Notes (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Payment Notes</span>
                <span className="text-[11px] font-normal text-slate-400">Optional</span>
              </label>
              <textarea
                id="payment-notes-input"
                rows={2}
                placeholder="e.g. Annual renewal paid in cash at front desk with locker key."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors min-h-[48px]"
              />
            </div>
          </div>

          {/* Action Buttons (Sticky at bottom) */}
          <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2.5 sm:gap-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              id="cancel-payment-modal-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-payment-btn"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingPayment ? 'Update Payment' : 'Record Payment'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
