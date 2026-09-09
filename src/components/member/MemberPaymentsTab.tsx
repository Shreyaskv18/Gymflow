import React, { useState } from 'react';
import { CreditCard, FileText, CheckCircle2, Clock, Calendar, Download, Search, ShieldCheck } from 'lucide-react';
import { Payment, Member, Gym } from '../../types';

interface MemberPaymentsTabProps {
  member: Member;
  gym?: Gym | null;
  payments: Payment[];
  onOpenReceipt: (payment: Payment) => void;
}

export const MemberPaymentsTab: React.FC<MemberPaymentsTabProps> = ({
  member,
  payments,
  onOpenReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = payments.filter((p) => {
    const planName = (p.planName || '').toLowerCase();
    const date = (p.payment_date || p.paymentDate || '').toLowerCase();
    const method = (p.payment_method || p.paymentMethod || '').toLowerCase();
    const ref = (p.transaction_reference || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    return planName.includes(term) || date.includes(term) || method.includes(term) || ref.includes(term);
  });

  const totalPaid = payments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Payments & Receipts</h2>
          <p className="text-xs text-slate-500 mt-1">
            Official billing history, tax invoices, and payment receipts for your membership
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            ₹
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Lifetime Paid</p>
            <p className="text-lg font-black text-slate-900 font-mono">₹{totalPaid.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search payments by plan, date, or mode..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredPayments.length}</span> record{filteredPayments.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No payment records found</p>
            <p className="text-xs text-slate-400 mt-1">
              Your payments made at the gym front desk will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">Receipt / Date</th>
                    <th className="py-3.5 px-4">Membership Package</th>
                    <th className="py-3.5 px-4">Payment Mode</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((payment) => {
                    const receiptNo = `GF-${payment.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;
                    const paymentDate = payment.payment_date || payment.paymentDate || 'Recent';
                    const amount = Number(payment.amount || 0);

                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <p className="font-bold text-slate-900 font-mono">{receiptNo}</p>
                          <p className="text-[11px] text-slate-500 flex items-center mt-0.5">
                            <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                            {paymentDate}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-800">{payment.planName || member.membershipPlan || 'Gym Package'}</p>
                          {payment.transaction_reference && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Ref: {payment.transaction_reference}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium capitalize">
                            {payment.payment_method || payment.paymentMethod || 'UPI / Cash'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-mono text-sm font-black text-slate-900">
                            ₹{amount.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Paid
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => onOpenReceipt(payment)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< md screens) */}
            <div id="member-payments-mobile-cards" className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredPayments.map((payment) => {
                const receiptNo = `GF-${payment.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;
                const paymentDate = payment.payment_date || payment.paymentDate || 'Recent';
                const amount = Number(payment.amount || 0);

                return (
                  <div
                    key={payment.id}
                    id={`member-payment-card-${payment.id}`}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {receiptNo}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1.5">
                          {payment.planName || member.membershipPlan || 'Gym Package'}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center mt-0.5">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          {paymentDate}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-base font-black text-slate-900 block">
                          ₹{amount.toLocaleString('en-IN')}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
                          Paid
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-500">
                        Mode: <strong className="text-slate-700 capitalize">{payment.payment_method || payment.paymentMethod || 'UPI / Cash'}</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => onOpenReceipt(payment)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-300" />
                        <span>View Receipt</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Trust & GST footnote */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All receipts are official tax invoices generated under GST regulations.</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">GymFlow Secure Billing</span>
      </div>
    </div>
  );
};
