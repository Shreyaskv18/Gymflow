import React from 'react';
import { Payment, Member, Gym } from '../../types';
import { X, Printer, CheckCircle2, ShieldCheck, Dumbbell, Calendar, CreditCard, Hash } from 'lucide-react';

interface MemberInvoiceModalProps {
  payment: Payment | null;
  member: Member;
  gym?: Gym | null;
  onClose: () => void;
}

export const MemberInvoiceModal: React.FC<MemberInvoiceModalProps> = ({
  payment,
  member,
  gym,
  onClose,
}) => {
  if (!payment) return null;

  const invoiceNumber = `INV-${payment.id.toUpperCase().replace('PAY-', '')}-${new Date(payment.payment_date || payment.paymentDate || '').getFullYear() || '2026'}`;
  const planName = payment.planName || payment.membership_plan?.name || member.membershipPlan || 'GymFlow Membership';
  const paymentDate = new Date(payment.payment_date || payment.paymentDate || new Date()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="invoice-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="invoice-card"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8 text-slate-800 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Official Gym Payment Receipt
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-invoice-btn"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              id="close-invoice-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 sm:p-10 space-y-8 print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  {gym?.name || 'GymFlow Fitness & Health'}
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                  {gym?.address || 'Plot 42, Hebbal Industrial Area, Mysuru, Karnataka 570016'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  GSTIN: 29AABCU9603R1ZM • Ph: {gym?.phone || '+91 821 241 9900'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                {payment.payment_status || payment.status || 'PAID'}
              </span>
              <p className="text-xs text-slate-500 font-mono mt-2 flex items-center sm:justify-end gap-1">
                <Hash className="w-3 h-3 text-slate-400" />
                {invoiceNumber}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {paymentDate}
              </p>
            </div>
          </div>

          {/* Member & Billing Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Billed To (Member)</p>
              <h4 className="text-base font-bold text-slate-900 mt-1">{member.full_name}</h4>
              <p className="text-xs text-slate-600 mt-0.5">Phone: {member.phone}</p>
              {member.email && <p className="text-xs text-slate-600">Email: {member.email}</p>}
              {member.address && <p className="text-xs text-slate-500 mt-1">{member.address}</p>}
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Details</p>
              <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center sm:justify-end gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                {payment.payment_method || payment.paymentMethod || 'UPI / Cash'}
              </p>
              {payment.transaction_reference && (
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  Ref: {payment.transaction_reference}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Status: Cleared & Verified</p>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/75 text-slate-700 text-xs font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-center">Duration</th>
                  <th className="px-4 py-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{planName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gym Floor Access, Cardio, Free Weights & Locker Facilities
                    </p>
                    {payment.notes && <p className="text-xs text-indigo-600 italic mt-1">Note: {payment.notes}</p>}
                  </td>
                  <td className="px-4 py-4 text-center text-xs font-medium text-slate-600">
                    {payment.membership_plan?.duration_months || 1} Month(s)
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right text-slate-600">Subtotal:</td>
                  <td className="px-4 py-3 text-right text-slate-900">₹{payment.amount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="px-4 py-2 text-right text-slate-600">GST (18% Included):</td>
                  <td className="px-4 py-2 text-right text-slate-600 font-normal">
                    ₹{Math.round(payment.amount - payment.amount / 1.18).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className="border-t-2 border-slate-300 text-base">
                  <td colSpan={2} className="px-4 py-3 text-right font-bold text-slate-900">Total Paid:</td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-600 text-lg">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer with Seal & Stamp */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Thank you for working out with {gym?.name || 'GymFlow'}!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">This is a system generated receipt. No physical signature required.</p>
            </div>

            <div className="text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
              <div className="inline-block border-2 border-emerald-600/30 rounded-lg px-3 py-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                ✓ VERIFIED GYM RECEIPT
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Authorized Desk Officer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
