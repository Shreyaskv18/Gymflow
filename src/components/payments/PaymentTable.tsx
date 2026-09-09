import React from 'react';
import {
  CreditCard,
  IndianRupee,
  Calendar,
  Share2,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  FileText,
  Building2,
  Plus,
} from 'lucide-react';
import { Payment } from '../../types';
import { paymentService } from '../../services/paymentService';

interface PaymentTableProps {
  payments: Payment[];
  onViewPayment: (payment: Payment) => void;
  onEditPayment: (payment: Payment) => void;
  onDeletePayment: (payment: Payment) => void;
  onWhatsAppReceipt: (payment: Payment) => void;
  onViewMember?: (memberId: string) => void;
  onRecordPaymentClick: () => void;
  isLoading?: boolean;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  onViewPayment,
  onEditPayment,
  onDeletePayment,
  onWhatsAppReceipt,
  onViewMember,
  onRecordPaymentClick,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Payment Records...
        </p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div
        id="empty-payments-state"
        className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto"
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Payments Found</h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          No payment transactions matched your active filters or search term.
        </p>
        <div className="mt-5">
          <button
            id="empty-record-payment-btn"
            onClick={onRecordPaymentClick}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record New Payment</span>
          </button>
        </div>
      </div>
    );
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Paid</span>
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case 'Refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <span>Refunded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const renderMethodPill = (method: string) => {
    let style = 'bg-slate-100 text-slate-700 border-slate-200';
    if (method === 'UPI') style = 'bg-violet-50 text-violet-700 border-violet-200';
    if (method === 'Cash') style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (method === 'Card') style = 'bg-blue-50 text-blue-700 border-blue-200';
    if (method === 'Bank Transfer') style = 'bg-sky-50 text-sky-700 border-sky-200';

    return (
      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${style}`}>
        {method}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Desktop Table (Hidden on mobile < md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="payments-data-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Payment Date</th>
                <th className="py-3.5 px-4 font-semibold">Member</th>
                <th className="py-3.5 px-4 font-semibold">Plan</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold">Method</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Ref / UTR</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {payments.map((p) => {
                const member = p.member;
                const plan = p.membership_plan;
                const memberName = member?.full_name || member?.name || p.memberName || 'Gym Member';
                const memberPhone = member?.phone || '';
                const planName = plan?.name || p.planName || 'Membership Plan';

                return (
                  <tr
                    key={p.id}
                    id={`payment-row-${p.id}`}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-900 font-medium text-xs">
                        {paymentService.formatDate(p.payment_date)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.id}
                      </span>
                    </td>

                    {/* Member */}
                    <td className="py-3.5 px-4">
                      <div className="min-w-[140px]">
                        {member?.id && onViewMember ? (
                          <button
                            onClick={() => onViewMember(member.id)}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left truncate block cursor-pointer"
                          >
                            {memberName}
                          </button>
                        ) : (
                          <span className="font-bold text-slate-900 truncate block">
                            {memberName}
                          </span>
                        )}
                        {memberPhone && (
                          <span className="text-xs text-slate-500 block truncate">
                            {memberPhone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-slate-800 truncate max-w-[160px]">
                        {planName}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {plan?.duration_months || 1} mo
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {paymentService.formatINR(p.amount)}
                      </span>
                    </td>

                    {/* Method */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderMethodPill(p.payment_method)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderStatusBadge(p.payment_status)}
                    </td>

                    {/* Reference */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {p.transaction_reference ? (
                        <span className="font-mono text-xs text-slate-600 max-w-[130px] truncate block" title={p.transaction_reference}>
                          {p.transaction_reference}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`view-payment-btn-${p.id}`}
                          onClick={() => onViewPayment(p)}
                          title="View Receipt Details"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          id={`whatsapp-receipt-btn-${p.id}`}
                          onClick={() => onWhatsAppReceipt(p)}
                          title="Send Receipt on WhatsApp"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`edit-payment-btn-${p.id}`}
                          onClick={() => onEditPayment(p)}
                          title="Edit Payment"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-payment-btn-${p.id}`}
                          onClick={() => onDeletePayment(p)}
                          title="Delete Payment"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Mobile Responsive Card List (Visible only on < md) */}
      <div id="payments-mobile-cards" className="md:hidden space-y-3">
        {payments.map((p) => {
          const member = p.member;
          const plan = p.membership_plan;
          const memberName = member?.full_name || member?.name || p.memberName || 'Gym Member';
          const memberPhone = member?.phone || '';
          const planName = plan?.name || p.planName || 'Membership Plan';

          return (
            <div
              key={p.id}
              id={`payment-card-${p.id}`}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3"
            >
              {/* Card Top: Member & Amount */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">{memberName}</h4>
                  </div>
                  {memberPhone && (
                    <p className="text-xs text-slate-500 mt-0.5">{memberPhone}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-slate-900">
                    {paymentService.formatINR(p.amount)}
                  </div>
                  <div className="mt-1">{renderStatusBadge(p.payment_status)}</div>
                </div>
              </div>

              {/* Plan & Method info */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Plan: </span>
                  <strong className="text-slate-800">{planName}</strong>
                </div>
                <div>{renderMethodPill(p.payment_method)}</div>
              </div>

              {/* Metadata row */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Date: {paymentService.formatDate(p.payment_date)}</span>
                {p.transaction_reference && (
                  <span className="font-mono text-[10px] text-slate-600 truncate max-w-[140px]">
                    Ref: {p.transaction_reference}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  id={`mobile-view-receipt-${p.id}`}
                  onClick={() => onViewPayment(p)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Receipt</span>
                </button>

                <button
                  id={`mobile-whatsapp-receipt-${p.id}`}
                  onClick={() => onWhatsAppReceipt(p)}
                  className="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  id={`mobile-edit-payment-${p.id}`}
                  onClick={() => onEditPayment(p)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  id={`mobile-delete-payment-${p.id}`}
                  onClick={() => onDeletePayment(p)}
                  className="p-2 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
