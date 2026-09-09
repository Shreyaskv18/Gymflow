import React, { useState, useEffect } from 'react';
import { X, UserPlus, Phone, Mail, FileText, Calendar, Clock, Layers, Sparkles } from 'lucide-react';
import { Lead, LeadSource, LeadStatus, MembershipPlan } from '../../types';
import { leadsService } from '../../services/leadsService';
import { storageService } from '../../services/storageService';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadSaved: (lead: Lead) => void;
  leadToEdit?: Lead | null;
  showToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadSaved,
  leadToEdit,
  showToast,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState('');
  const [source, setSource] = useState<LeadSource>('WALK_IN');
  const [status, setStatus] = useState<LeadStatus>('NEW');
  const [trialDate, setTrialDate] = useState('');
  const [trialTime, setTrialTime] = useState('');
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const activePlans = storageService.getMembershipPlans().filter((p) => p.status === 'active');
      setPlans(activePlans);

      if (leadToEdit) {
        setName(leadToEdit.name);
        setPhone(leadToEdit.phone);
        setEmail(leadToEdit.email || '');
        setPlanId(leadToEdit.interested_plan_id || '');
        setSource(leadToEdit.source);
        setStatus(leadToEdit.status);
        setTrialDate(leadToEdit.trial_date || '');
        setTrialTime(leadToEdit.trial_time || '');
        setMessage(leadToEdit.message || '');
        setNotes(leadToEdit.notes || '');
      } else {
        setName('');
        setPhone('');
        setEmail('');
        setPlanId(activePlans[0]?.id || '');
        setSource('WALK_IN');
        setStatus('NEW');
        setTrialDate('');
        setTrialTime('');
        setMessage('');
        setNotes('');
      }
    }
  }, [isOpen, leadToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast?.('error', 'Name required', 'Please enter prospective member name.');
      return;
    }
    if (!phone.trim()) {
      showToast?.('error', 'Phone required', 'Please enter a contact phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPlan = plans.find((p) => p.id === planId);

      let savedLead: Lead;
      if (leadToEdit) {
        savedLead = await leadsService.updateLead(leadToEdit.id, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          interested_plan_id: planId || undefined,
          interested_plan_name: selectedPlan?.name,
          status,
          trial_date: trialDate || undefined,
          trial_time: trialTime || undefined,
          notes: notes.trim() || undefined,
        });
        showToast?.('success', 'Lead updated', `Updated details for ${savedLead.name}`);
      } else {
        savedLead = await leadsService.createLead({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          interested_plan_id: planId || undefined,
          interested_plan_name: selectedPlan?.name,
          source,
          status,
          trial_date: trialDate || undefined,
          trial_time: trialTime || undefined,
          message: message.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        showToast?.('success', 'Lead created', `New lead added for ${savedLead.name}`);
      }

      onLeadSaved(savedLead);
      onClose();
    } catch (err: any) {
      console.error('Failed to save lead:', err);
      showToast?.('error', 'Operation failed', err.message || 'Could not save lead record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-add-lead-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-add-lead"
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[calc(100dvh-2rem)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {leadToEdit ? 'Edit Lead Details' : 'Record New Enquiry / Lead'}
              </h3>
              <p className="text-xs text-slate-500">
                {leadToEdit ? 'Update prospect status and follow-up notes' : 'Capture walk-in, phone, or website lead'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Interested Plan
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                >
                  <option value="">-- Select Membership Plan --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enquiry Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              >
                <option value="WALK_IN">Walk-in Visit</option>
                <option value="PHONE">Phone Call</option>
                <option value="AI_RECEPTIONIST">AI Receptionist (Website)</option>
                <option value="WEBSITE">Website Form</option>
                <option value="OTHER">Other / Referral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lead Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              >
                <option value="NEW">New Enquiry</option>
                <option value="CONTACTED">Contacted</option>
                <option value="INTERESTED">Interested / Follow-up</option>
                <option value="CONVERTED">Converted to Member</option>
                <option value="LOST">Lost / Not Interested</option>
              </select>
            </div>
          </div>

          {/* Trial Booking schedule */}
          <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Complimentary 1-Day Trial Booking (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Trial Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={trialDate}
                    onChange={(e) => setTrialDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Preferred Time</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={trialTime}
                    onChange={(e) => setTrialTime(e.target.value)}
                    placeholder="e.g. 06:30 AM or 06:00 PM"
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enquiry / Question (from Visitor)
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What questions did the visitor have? (e.g. Inquired about personal training packages)"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Staff Follow-up Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal follow-up notes (e.g. Sent brochure on WhatsApp, called on Monday)"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : leadToEdit ? 'Save Changes' : 'Record Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
