import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Check, ArrowRight, ShieldCheck, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { Member, MembershipPlan } from '../../types';
import { memberService } from '../../services/memberService';

interface MemberRenewalsTabProps {
  member: Member;
  onOpenRenewalModal: () => void;
}

export const MemberRenewalsTab: React.FC<MemberRenewalsTabProps> = ({
  member,
  onOpenRenewalModal,
}) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchPlans() {
      setLoading(true);
      const activePlans = await memberService.getPlans();
      setPlans(activePlans);
      setLoading(false);
    }
    fetchPlans();
  }, []);

  const daysLeft = member.daysRemaining !== undefined ? member.daysRemaining : (() => {
    const end = new Date(member.membership_end_date).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  })();

  const isExpiring = daysLeft <= 7;

  return (
    <div className="space-y-6">
      {/* Current Plan Status Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Subscription</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {member.membershipPlan || 'Gym Package'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Started on <span className="font-semibold text-slate-800">{member.membership_start_date}</span> • Valid until <span className="font-semibold text-slate-800">{member.membership_end_date}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                isExpiring ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {daysLeft} days remaining
              </span>
            </div>
            <button
              onClick={onOpenRenewalModal}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Request Renewal
            </button>
          </div>
        </div>

        {/* Expiry timeline bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>Membership Progress</span>
            <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isExpiring ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.max(5, Math.min(100, (daysLeft / 365) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Available Plans Section */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Available Renewal Packages</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose a plan that matches your training goals and submit an instant renewal request
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            <p className="text-xs">Loading membership packages...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const isCurrent = plan.id === member.membership_plan_id;
              const isAnnual = plan.duration_months >= 12;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between relative ${
                    isAnnual
                      ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {isAnnual && (
                    <div className="absolute -top-3 right-5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Best Value
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-base text-slate-900">{plan.name}</h4>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                          Current Plan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{plan.description || 'Full gym facility access'}</p>

                    <div className="mb-6 flex items-baseline">
                      <span className="text-3xl font-black text-slate-900 font-mono">
                        ₹{plan.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold ml-1.5">
                        / {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>All gym floor equipment & weights</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Cardio zone & fitness tracking</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Locker room & shower access</span>
                      </li>
                      {isAnnual && (
                        <li className="flex items-center space-x-2 text-emerald-700 font-semibold">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>1 complimentary PT orientation</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <button
                    onClick={onOpenRenewalModal}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      isAnnual
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Request This Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAQs / Information */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-xs text-slate-600 space-y-3">
        <h4 className="font-bold text-sm text-slate-900">How Membership Renewals Work</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">1. Instant Front-Desk Notification</p>
            <p>
              When you submit a renewal request, our front desk team is notified with your package selection.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">2. Flexible Payment Modes</p>
            <p>
              Pay via UPI, credit/debit card, or cash during your next visit. Your membership duration is updated immediately upon payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
