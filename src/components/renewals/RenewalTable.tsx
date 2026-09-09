import React from 'react';
import {
  MessageCircle,
  RefreshCw,
  Eye,
  Calendar,
  CreditCard,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { RenewalItem, Member } from '../../types';
import {
  formatDateIndian,
  formatINR,
  getRenewalCategoryStyle,
  formatDate,
} from '../../utils/formatters';

interface RenewalTableProps {
  items: RenewalItem[];
  onRenewMember: (member: Member) => void;
  onWhatsAppReminder: (member: Member) => void;
  onViewMember: (member: Member) => void;
}

export const RenewalTable: React.FC<RenewalTableProps> = ({
  items,
  onRenewMember,
  onWhatsAppReminder,
  onViewMember,
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Desktop Table View (hidden on small screens) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="renewals-desktop-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-bold">Member</th>
                <th className="py-3.5 px-4 font-bold">Membership Plan</th>
                <th className="py-3.5 px-4 font-bold">Expiry Date</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold">Last Payment</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((item) => {
                const member = item.member;
                const style = getRenewalCategoryStyle(item.daysRemaining, item.isRenewedThisMonth);
                const fullName = member.full_name || member.name || 'Member';
                const initials = fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <tr
                    key={member.id}
                    id={`renewal-row-${member.id}`}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Member Column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onViewMember(member)}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left truncate block cursor-pointer"
                          >
                            {fullName}
                          </button>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{member.phone || 'No phone'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Plan Column */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block truncate">
                        {item.planName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {item.planPrice > 0 ? formatINR(item.planPrice) : 'Standard'}
                        {item.plan?.duration_months ? ` / ${item.plan.duration_months} mo` : ''}
                      </span>
                    </td>

                    {/* Expiry Date Column */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">
                        {item.expiryDate ? formatDateIndian(item.expiryDate) : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.daysRemaining >= 0
                          ? `${item.daysRemaining} days remaining`
                          : `${Math.abs(item.daysRemaining)} days ago`}
                      </span>
                    </td>

                    {/* Status Column */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${style.bg} ${style.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        <span>{style.label}</span>
                      </span>
                    </td>

                    {/* Last Payment Column */}
                    <td className="py-3 px-4">
                      {item.lastPaymentDate ? (
                        <div>
                          <span className="font-medium text-slate-700 block">
                            {formatDate(item.lastPaymentDate)}
                          </span>
                          {item.lastPaymentAmount && (
                            <span className="text-[11px] text-slate-500 font-semibold">
                              {formatINR(item.lastPaymentAmount)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No receipt</span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp Action */}
                        <button
                          type="button"
                          id={`btn-whatsapp-renewal-${member.id}`}
                          onClick={() => onWhatsAppReminder(member)}
                          className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors cursor-pointer"
                          title="Send WhatsApp renewal reminder"
                          aria-label={`Send WhatsApp reminder to ${fullName}`}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* Renew Membership Action */}
                        <button
                          type="button"
                          id={`btn-renew-member-${member.id}`}
                          onClick={() => onRenewMember(member)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                          title="Renew membership"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Renew</span>
                        </button>

                        {/* View Details */}
                        <button
                          type="button"
                          id={`btn-view-member-renewal-${member.id}`}
                          onClick={() => onViewMember(member)}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          title="View member profile drawer"
                          aria-label={`View ${fullName}`}
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Mobile Card List View (visible on < md screens) */}
      <div id="renewals-mobile-card-list" className="md:hidden space-y-3">
        {items.map((item) => {
          const member = item.member;
          const style = getRenewalCategoryStyle(item.daysRemaining, item.isRenewedThisMonth);
          const fullName = member.full_name || member.name || 'Member';
          const initials = fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={member.id}
              id={`renewal-card-mobile-${member.id}`}
              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
            >
              {/* Header: Member info & Status pill */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onViewMember(member)}
                      className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left text-sm truncate block cursor-pointer"
                    >
                      {fullName}
                    </button>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{member.phone}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${style.bg} ${style.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  <span>{style.label}</span>
                </span>
              </div>

              {/* Plan & Expiry Details Grid */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                    Plan
                  </span>
                  <span className="font-bold text-slate-800 truncate block">
                    {item.planName}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {item.planPrice > 0 ? formatINR(item.planPrice) : 'Standard'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                    Expiry Date
                  </span>
                  <span className="font-bold text-slate-800 block">
                    {item.expiryDate ? formatDateIndian(item.expiryDate) : '—'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.daysRemaining >= 0
                      ? `${item.daysRemaining} days left`
                      : `${Math.abs(item.daysRemaining)} days ago`}
                  </span>
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  id={`btn-mobile-whatsapp-${member.id}`}
                  onClick={() => onWhatsAppReminder(member)}
                  className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  id={`btn-mobile-renew-${member.id}`}
                  onClick={() => onRenewMember(member)}
                  className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px] shadow-xs"
                >
                  <RefreshCw className="w-4 h-4 text-white" />
                  <span>Renew</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
