import React, { useState } from 'react';
import {
  X,
  CreditCard,
  IndianRupee,
  Calendar,
  User,
  Layers,
  FileText,
  Hash,
  Printer,
  Share2,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';
import { Payment } from '../../types';
import { paymentService } from '../../services/paymentService';
import { storageService } from '../../services/storageService';

interface PaymentDetailsModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
  onViewMember?: (memberId: string) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  payment,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onViewMember,
  showToast,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!isOpen || !payment) return null;

  const gym = storageService.getGym();
  const member = payment.member;
  const plan = payment.membership_plan;

  const memberName = member?.full_name || member?.name || payment.memberName || 'Gym Member';
  const memberPhone = member?.phone || 'N/A';
  const planName = plan?.name || payment.planName || 'Gym Membership';

  const handleWhatsAppReceipt = () => {
    if (!memberPhone || memberPhone === 'N/A') {
      showToast?.('error', 'No Phone Number', 'This member does not have a phone number on record.');
      return;
    }

    // Clean phone number: remove spaces, dashes, parentheses
    let cleanPhone = memberPhone.replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1);
    }
    // Default to Indian country code (91) if 10 digits
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const message = paymentService.generateReceiptMessage(payment, gym?.name || 'GymFlow Fitness');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    showToast?.('info', 'WhatsApp Opened', 'Receipt message preview loaded for member.');
  };

  const handlePrint = () => {
    window.print();
  };

  // Status styling
  let statusBadge = (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>Paid & Cleared</span>
    </span>
  );

  if (payment.payment_status === 'Pending') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        <span>Pending Clearance</span>
      </span>
    );
  } else if (payment.payment_status === 'Failed') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Payment Failed</span>
      </span>
    );
  } else if (payment.payment_status === 'Refunded') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
        <span>Refunded / Reversal</span>
      </span>
    );
  }

  return (
    <div
      id="payment-details-modal-backdrop"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="payment-details-modal"
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col h-[calc(100dvh-1.5rem)] sm:h-auto sm:max-h-[calc(100vh-3.5rem)]"
      >
        {/* Top Action Bar */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/90 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Receipt #{payment.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              title="Print Receipt Voucher"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              id="edit-payment-btn"
              onClick={() => onEdit(payment)}
              title="Edit Payment"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              id="close-payment-details-modal"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Voucher Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain">
          {/* Gym Header & Receipt Branding */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  GF
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {gym?.name || 'GymFlow Fitness Center'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {gym?.address || 'Main Road, Karnataka, India'}
              </p>
              <p className="text-xs text-slate-500">
                Phone: {gym?.phone || '+91 98765 43210'} • {gym?.email || 'contact@gymflow.in'}
              </p>
            </div>
            <div className="text-right">
              {statusBadge}
              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                Date: {paymentService.formatDate(payment.payment_date)}
              </p>
            </div>
          </div>

          {/* Amount Paid Block */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Amount Received
            </span>
            <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              {paymentService.formatINR(payment.amount)}
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 mt-2">
              <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200">
                Method: <strong className="text-slate-800">{payment.payment_method}</strong>
              </span>
              {payment.transaction_reference && (
                <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px]">
                  Ref: <strong className="text-slate-800">{payment.transaction_reference}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Member & Plan Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Member Card */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Member Details
                </span>
                {member?.id && onViewMember && (
                  <button
                    onClick={() => {
                      onViewMember(member.id);
                      onClose();
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    View Profile →
                  </button>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{memberName}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{memberPhone}</span>
                </div>
                {member?.email && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Card */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Membership Plan
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{planName}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Duration: {plan?.duration_months || 1} Month{plan && plan.duration_months > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Plan Base Price: ₹{(plan?.price || payment.amount).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Notes (If present) */}
          {payment.notes && (
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Desk Notes / Remarks
              </span>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "{payment.notes}"
              </p>
            </div>
          )}

          {/* Timestamp Info */}
          <div className="pt-2 text-[11px] text-slate-400 flex flex-wrap items-center justify-between border-t border-slate-100">
            <span>Created: {new Date(payment.created_at).toLocaleString('en-IN')}</span>
            <span>Recorded in GymFlow</span>
          </div>

          {/* Delete Confirmation Box (if toggled) */}
          {isConfirmingDelete && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Delete this payment record?</span>
              </div>
              <p className="text-xs text-rose-700">
                This will permanently delete receipt #{payment.id} for ₹{payment.amount}. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDelete(payment)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (WhatsApp Share, Edit, Delete) */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/90 border-t border-slate-100 print:hidden pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <div>
            {!isConfirmingDelete && (
              <button
                id="delete-payment-btn"
                onClick={() => setIsConfirmingDelete(true)}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1.5 p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer min-h-[44px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Receipt</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              id="whatsapp-share-receipt-btn"
              onClick={handleWhatsAppReceipt}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Receipt</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
