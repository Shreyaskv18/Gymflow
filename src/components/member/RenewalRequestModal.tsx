import React, { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle2, Calendar, Sparkles, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { Member, MembershipPlan } from '../../types';
import { memberService } from '../../services/memberService';

interface RenewalRequestModalProps {
  member: Member;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RenewalRequestModal: React.FC<RenewalRequestModalProps> = ({ member, onClose, onSuccess }) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(member.membership_plan_id || '');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      const activePlans = await memberService.getPlans();
      setPlans(activePlans);
      if (!selectedPlanId && activePlans.length > 0) {
        setSelectedPlanId(activePlans[0].id);
      }
    }
    loadPlans();
  }, [selectedPlanId]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await memberService.requestRenewal(selectedPlanId, notes);
      if (result.success) {
        setSuccessMessage(result.message || 'Renewal request submitted successfully!');
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(result.error || 'Failed to submit renewal request.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Request Membership Renewal</h3>
              <p className="text-xs text-slate-400">Extend your gym membership with front-desk confirmation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {successMessage ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Renewal Request Received!</h4>
            <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              {successMessage}
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 text-left space-y-1">
              <p><strong>Member:</strong> {member.full_name}</p>
              <p><strong>Requested Plan:</strong> {selectedPlan?.name || 'Selected Package'}</p>
              <p><strong>Package Price:</strong> ₹{selectedPlan?.price.toLocaleString('en-IN')}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Current Plan Status */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500">Current Plan:</span>
                <p className="font-bold text-slate-900 text-sm">{member.membershipPlan || 'Gym Member'}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Expires:</span>
                <p className="font-semibold text-slate-800">{member.membership_end_date}</p>
              </div>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Select Renewal Package
              </label>
              <div className="space-y-2.5">
                {plans.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                          <p className="text-xs text-slate-500 flex items-center mt-0.5">
                            <Clock className="w-3 h-3 mr-1" />
                            {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''} validity
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900 font-mono">
                          ₹{plan.price.toLocaleString('en-IN')}
                        </p>
                        {plan.duration_months >= 12 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Best Value
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Special Request Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Notes for Front Desk (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g., I would like to pay via UPI or request personal trainer addon..."
                className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Confirmation Banner */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Submitting this request alerts our front desk team. You can pay via UPI, Card, or Cash when you visit or check in at the gym.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedPlanId}
                className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Confirm Renewal Request
                    <ArrowRight className="w-4 h-4 ml-2" />
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
