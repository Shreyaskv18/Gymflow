import React, { useState, useEffect } from 'react';
import { Member, MembershipPlan } from '../../types';
import { storageService } from '../../services/storageService';
import { memberService } from '../../services/memberService';
import { X, RefreshCw, CheckCircle2, Calendar, Sparkles, Dumbbell } from 'lucide-react';

interface MemberRenewalModalProps {
  member: Member;
  onClose: () => void;
  onRenewSuccess: () => void;
}

export const MemberRenewalModal: React.FC<MemberRenewalModalProps> = ({
  member,
  onClose,
  onRenewSuccess,
}) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(member.membership_plan_id || 'plan-01');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadedPlans = storageService.getMembershipPlans().filter((p) => p.status === 'active');
    setPlans(loadedPlans);
    if (!loadedPlans.some((p) => p.id === selectedPlanId) && loadedPlans.length > 0) {
      setSelectedPlanId(loadedPlans[0].id);
    }
  }, [selectedPlanId]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await memberService.requestRenewal({
        plan_id: selectedPlanId,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Renewal request submitted successfully!');
        setTimeout(() => {
          onRenewSuccess();
          onClose();
        }, 1800);
      } else {
        setErrorMessage(res.error || 'Failed to submit renewal request.');
      }
    } catch (err) {
      setErrorMessage('Something went wrong. Please try again or speak to the front desk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="renewal-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="renewal-card"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-snug">Renew Gym Membership</h3>
              <p className="text-xs text-indigo-100">Extend your workout access seamlessly</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Banner */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-6 py-3.5 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Current Plan:</span>{' '}
            <span className="font-bold text-slate-800">{member.membership_plan?.name || member.membershipPlan || 'Standard Pass'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            Expires {new Date(member.membership_end_date || member.membershipEndDate || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* Form Body */}
        {successMessage ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Request Sent to Gym Desk!</h4>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMessage && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {errorMessage}
              </div>
            )}

            {/* Plan Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Select Renewal Package
              </label>
              <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {plans.map((p) => {
                  const isSelected = p.id === selectedPlanId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{p.name}</span>
                            {p.duration_months >= 12 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> Best Value
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            {p.duration_months} month{p.duration_months > 1 ? 's' : ''} duration
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900">
                          ₹{p.price.toLocaleString('en-IN')}
                        </span>
                        <p className="text-[10px] text-slate-400">All inclusive</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Special Notes / Timing */}
            <div>
              <label htmlFor="renewal-notes" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Special Request / Preferred Contact Time (Optional)
              </label>
              <textarea
                id="renewal-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please call me in the evening, or send UPI payment QR on WhatsApp."
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Summary Box */}
            {selectedPlan && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Dumbbell className="w-4 h-4 text-indigo-600" />
                  <span>Selected: <strong>{selectedPlan.name}</strong></span>
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  ₹{selectedPlan.price.toLocaleString('en-IN')}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                id="submit-renewal-btn"
                type="submit"
                disabled={isSubmitting || !selectedPlan}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Submit Renewal Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
