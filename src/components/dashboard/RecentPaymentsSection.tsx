import React from 'react';
import { IndianRupee, CreditCard, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { formatCurrencyINR, formatDateIndian } from '../../utils/formatters';

interface RecentPaymentItem {
  id: string;
  memberId: string;
  memberName: string;
  planName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  paymentStatus: string;
}

interface RecentPaymentsSectionProps {
  payments: RecentPaymentItem[];
  canViewFinancials: boolean;
  onNavigateToPayments?: () => void;
  onRecordPayment?: () => void;
}

export const RecentPaymentsSection: React.FC<RecentPaymentsSectionProps> = ({
  payments,
  canViewFinancials,
  onNavigateToPayments,
  onRecordPayment,
}) => {
  if (!canViewFinancials) {
    return (
      <div id="recent-payments-restricted" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="p-2 rounded-lg bg-gray-100 text-gray-500">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Recent Transactions Restricted</h3>
            <p className="text-xs text-gray-500">Staff permission required to inspect transaction logs.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="recent-payments-section" className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Payments</h2>
            <p className="text-xs text-gray-500">Real-time incoming receipts & billing history</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRecordPayment && (
            <button
              onClick={onRecordPayment}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          )}

          {onNavigateToPayments && (
            <button
              onClick={onNavigateToPayments}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">No payment records logged yet.</div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Member</th>
                <th className="pb-3 px-4">Plan</th>
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 px-4">Method</th>
                <th className="pb-3 px-4">Date</th>
                <th className="pb-3 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.slice(0, 7).map((p) => {
                const isCompleted = p.paymentStatus === 'Paid' || p.paymentStatus === 'completed';

                return (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 pr-4 font-semibold text-gray-900">{p.memberName}</td>
                    <td className="py-3 px-4 text-gray-600">{p.planName}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {formatCurrencyINR(p.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {formatDateIndian(p.paymentDate)}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{p.paymentStatus}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
