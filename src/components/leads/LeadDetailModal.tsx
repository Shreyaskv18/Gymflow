import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  MessageCircle,
  CheckCircle2,
  FileText,
  UserCheck,
  Tag,
  ArrowRight,
  Send,
  Sparkles,
  Bot,
  Building,
} from 'lucide-react';
import { Lead, LeadStatus } from '../../types';
import { leadsService } from '../../services/leadsService';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onLeadUpdated: (updatedLead: Lead) => void;
  onConvertToMember?: (lead: Lead) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  isOpen,
  onClose,
  lead,
  onLeadUpdated,
  onConvertToMember,
  showToast,
}) => {
  if (!isOpen || !lead) return null;

  const [notes, setNotes] = useState(lead.notes || '');
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const updated = await leadsService.updateLead(lead.id, {
        notes: notes.trim() || undefined,
        status,
      });
      onLeadUpdated(updated);
      showToast?.('success', 'Lead updated', `Saved changes for ${lead.name}`);
      onClose();
    } catch (err: any) {
      console.error('Failed to update lead:', err);
      showToast?.('error', 'Update failed', err.message || 'Could not update lead');
    } finally {
      setIsSaving(false);
    }
  };

  const openWhatsApp = (customMsg?: string) => {
    const defaultMsg = customMsg || `Hi ${lead.name}, this is regarding your inquiry with GymFlow Fitness Center. How can we assist you with your fitness journey today?`;
    const url = leadsService.getWhatsAppChatUrl(lead.phone, defaultMsg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const statusColors: Record<LeadStatus, { bg: string; text: string; border: string }> = {
    NEW: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    CONTACTED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    INTERESTED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    CONVERTED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    LOST: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  };

  return (
    <div
      id="modal-lead-detail-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-lead-detail"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[calc(100dvh-2rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">{lead.name}</h3>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusColors[lead.status].bg} ${statusColors[lead.status].text} ${statusColors[lead.status].border}`}
                >
                  {lead.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Inquired on {new Date(lead.created_at).toLocaleDateString()} at{' '}
                {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Contact & Source Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Phone Number</span>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${lead.phone}`}
                  className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lead.phone}</span>
                </a>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Email Address</span>
              <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{lead.email || 'Not provided'}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Interested Plan</span>
              <div className="text-sm font-semibold text-indigo-600 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>{lead.interested_plan_name || 'General Inquiry'}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Acquisition Source</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                {lead.source === 'AI_RECEPTIONIST' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    AI Receptionist
                  </span>
                ) : lead.source === 'WEBSITE' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Building className="w-3.5 h-3.5" />
                    Website
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {lead.source}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Trial Booking Info */}
          {lead.trial_date && (
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">
                    Scheduled Free Trial Workout
                  </span>
                  <div className="flex items-center gap-3 text-xs text-emerald-800 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {lead.trial_date}
                    </span>
                    {lead.trial_time && (
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" /> {lead.trial_time}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  openWhatsApp(
                    `Hi ${lead.name}, confirming your 1-day free trial workout pass at GymFlow for ${lead.trial_date} at ${lead.trial_time || 'your convenient time'}. Please bring training shoes & workout towel. See you soon!`
                  )
                }
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Confirm on WhatsApp</span>
              </button>
            </div>
          )}

          {/* Enquiry message */}
          {lead.message && (
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                Visitor Inquiry / Message:
              </span>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                "{lead.message}"
              </div>
            </div>
          )}

          {/* Status & Notes Management */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Update Lead Status:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'LOST'] as LeadStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                        status === st
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Staff Follow-up Notes:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about call discussion, visitor budget, workout preferences..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openWhatsApp()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            {lead.status !== 'CONVERTED' && onConvertToMember && (
              <button
                type="button"
                onClick={() => {
                  onConvertToMember(lead);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Convert to Member</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleUpdate}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
