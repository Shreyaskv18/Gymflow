import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Calendar,
  User,
  Phone,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { Member } from '../../types';
import {
  cleanPhoneNumber,
  generateRenewalReminderMessage,
  generateWhatsAppClickToChatUrl,
  isValidPhoneNumber,
} from '../../utils/whatsapp';
import {
  formatDateLongIndian,
  getDaysRemaining,
  getStatusBadgeStyle,
} from '../../utils/formatters';
import { storageService } from '../../services/storageService';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  member,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !member) return null;

  const gym = storageService.getGym();
  const gymName = gym?.name || 'GymFlow Fitness Center';
  const memberName = member.full_name || member.name || 'Member';
  const memberPhone = member.phone || '';
  const planName =
    member.membership_plan?.name ||
    member.membershipPlan ||
    (member.membership_plan_id
      ? storageService.getMembershipPlans().find((p) => p.id === member.membership_plan_id)?.name
      : undefined) ||
    'Gym Membership';

  const endDate = member.membership_end_date || member.membershipEndDate || '';
  const daysRemaining = getDaysRemaining(endDate);
  const isExpired = daysRemaining < 0 || member.status === 'expired';

  const messageText = generateRenewalReminderMessage({
    memberName,
    planName,
    expiryDate: endDate,
    gymName,
    isExpired,
  });

  const hasValidPhone = isValidPhoneNumber(memberPhone);
  const whatsappUrl = generateWhatsAppClickToChatUrl(memberPhone, messageText);
  const statusStyle = getStatusBadgeStyle(member.status);

  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(messageText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handleOpenWhatsApp = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  return (
    <div
      id="whatsapp-reminder-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="whatsapp-reminder-modal-content"
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col h-[calc(100dvh-1.5rem)] sm:h-auto sm:max-h-[calc(100vh-3.5rem)]"
      >
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-inner text-emerald-100 shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                WhatsApp Renewal Reminder
              </h2>
              <p className="text-xs text-emerald-100">
                Click-to-chat with pre-filled message
              </p>
            </div>
          </div>
          <button
            id="close-whatsapp-modal-button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain pb-8 sm:pb-5">
          {/* Member & Expiry Summary Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Member
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {daysRemaining < 0
                  ? `Expired (${Math.abs(daysRemaining)}d ago)`
                  : daysRemaining <= 7
                  ? `Expiring (${daysRemaining}d left)`
                  : 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Full Name</p>
                <p className="font-bold text-slate-900 break-words">{memberName}</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-medium">Phone Number</p>
                <p
                  className={`font-semibold flex items-center gap-1 ${
                    hasValidPhone ? 'text-slate-900' : 'text-rose-600'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {memberPhone || 'Not provided'}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-medium">Membership Plan</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {planName}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {isExpired ? 'Expired On' : 'Expires On'}
                </p>
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {formatDateLongIndian(endDate) || endDate || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Missing Phone Warning (if applicable) */}
          {!hasValidPhone && (
            <div
              id="whatsapp-missing-phone-alert"
              className="flex items-start gap-2.5 p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No phone number available.</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  This member does not have a valid mobile number on file. Please edit their profile to add an Indian mobile number (e.g. +91 98765 11001) before sending a WhatsApp reminder.
                </p>
              </div>
            </div>
          )}

          {/* Message Preview Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Pre-filled Message Preview</span>
              </label>
              <button
                type="button"
                id="copy-whatsapp-message-button"
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200/70 px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-3.5 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto select-all shadow-inner">
              {messageText}
            </div>
          </div>

          {/* Privacy & Manual Dispatch Note */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500 border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <p>
              Clicking <strong className="text-slate-700">Open WhatsApp</strong> launches WhatsApp with the recipient and pre-filled message. You can review and manually press send.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-4 sm:px-5 py-3.5 sm:py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 sm:gap-3 flex-wrap pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            id="cancel-whatsapp-reminder-button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            Cancel
          </button>

          {hasValidPhone && whatsappUrl ? (
            <a
              id="open-whatsapp-link-button"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setTimeout(onClose, 500);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 hover:shadow transition-all cursor-pointer min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              id="open-whatsapp-disabled-button"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>No Phone Number Available</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
