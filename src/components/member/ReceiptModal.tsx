import React from 'react';
import { X, Printer, CheckCircle, ShieldCheck, Dumbbell, Calendar, CreditCard, User, FileText } from 'lucide-react';
import { Payment, Member, Gym } from '../../types';

interface ReceiptModalProps {
  payment: Payment;
  member: Member;
  gym?: Gym | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, member, gym, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const invoiceNo = `GF-REC-${payment.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;
  const receiptDate = payment.payment_date || payment.paymentDate || new Date().toISOString().split('T')[0];
  const amount = Number(payment.amount || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:bg-white print:text-black">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">GymFlow</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-medium">Official Receipt</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div className="p-8 space-y-6 print:p-4 text-slate-800">
          {/* Top Info Grid */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-slate-200 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">PAYMENT RECEIPT</h2>
              <p className="text-xs text-slate-500 font-mono mt-1">Receipt No: <span className="text-slate-900 font-bold">{invoiceNo}</span></p>
              <p className="text-xs text-slate-500 font-mono">Date: <span className="text-slate-900 font-semibold">{receiptDate}</span></p>
              <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Payment Status: Paid
              </div>
            </div>

            <div className="sm:text-right text-xs text-slate-600 space-y-1">
              <p className="text-sm font-bold text-slate-900">{gym?.name || 'GymFlow Fitness Center'}</p>
              <p>{gym?.address || '102, Gokulam Main Road, 3rd Stage, Mysuru, KA'}</p>
              <p>Phone: {gym?.phone || '+91 98765 00000'}</p>
              <p>GSTIN: <span className="font-mono font-medium">29AABCG1234F1Z5</span></p>
            </div>
          </div>

          {/* Member Details Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To (Member)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-900">{member.full_name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">ID: {member.id}</span>
              </div>
              <div className="text-slate-600 text-xs sm:text-right">
                <span>Phone: {member.phone}</span>
                {member.email && <span className="block text-slate-500">{member.email}</span>}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4 text-center">Qty / Period</th>
                  <th className="py-3 px-4 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-900">{payment.planName || member.membershipPlan || 'Gym Membership Package'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Gym floor access, strength training & facilities</p>
                    {payment.transaction_reference && (
                      <p className="text-xs font-mono text-slate-400 mt-1">
                        Ref / UTR: {payment.transaction_reference}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center text-xs text-slate-600">
                    1 Term
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-right font-semibold text-slate-700">Subtotal</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{amount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="py-2 px-4 text-right text-xs text-slate-500">GST (18% inclusive)</td>
                  <td className="py-2 px-4 text-right text-xs font-mono text-slate-600">₹{Math.round(amount * 0.18 / 1.18).toLocaleString('en-IN')}</td>
                </tr>
                <tr className="border-t border-slate-300 bg-emerald-50/50">
                  <td colSpan={2} className="py-3 px-4 text-right font-bold text-slate-900">Total Paid</td>
                  <td className="py-3 px-4 text-right font-mono text-lg font-black text-emerald-700">
                    ₹{amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Method & Guarantee */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 gap-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Payment Mode: <strong className="text-slate-900">{payment.payment_method || payment.paymentMethod || 'UPI / Cash'}</strong></span>
            </div>
            <div className="flex items-center space-x-2 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
              <span>Computer-generated official receipt • GymFlow Verified</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[11px] text-slate-400 pt-2">
            Thank you for being a valued member of {gym?.name || 'GymFlow Fitness Center'}. For any inquiries, please contact the front desk.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-200 print:hidden space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
