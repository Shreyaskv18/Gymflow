import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Sparkles,
  Clock,
  Phone,
  MessageCircle,
  MapPin,
  CheckSquare,
  FileText,
  Save,
  RotateCcw,
} from 'lucide-react';
import { AIReceptionistSettings } from '../../types';
import { receptionistService } from '../../services/receptionistService';

interface ReceptionistSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const ReceptionistSettingsModal: React.FC<ReceptionistSettingsModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [settings, setSettings] = useState<AIReceptionistSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'persona' | 'timings' | 'facilities' | 'faq'>('persona');
  const [newFacility, setNewFacility] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const data = await receptionistService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load receptionist settings:', err);
      showToast?.('error', 'Failed to load settings', 'Please check connection.');
    }
  };

  if (!isOpen || !settings) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await receptionistService.updateSettings(settings);
      setSettings(updated);
      showToast?.('success', 'Settings saved', 'AI Receptionist knowledge base updated.');
      onClose();
    } catch (err: any) {
      console.error('Failed to update receptionist settings:', err);
      showToast?.('error', 'Save failed', err.message || 'Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFacility = () => {
    if (!newFacility.trim() || !settings) return;
    if (!settings.facilities.includes(newFacility.trim())) {
      setSettings({
        ...settings,
        facilities: [...settings.facilities, newFacility.trim()],
      });
    }
    setNewFacility('');
  };

  const handleRemoveFacility = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      facilities: settings.facilities.filter((_, i) => i !== index),
    });
  };

  return (
    <div
      id="modal-receptionist-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-receptionist-settings"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">AI Receptionist Settings</h3>
              <p className="text-xs text-slate-500">Configure greeting persona, knowledge base & timings</p>
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

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('persona')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'persona'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Persona & Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timings')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'timings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Operating Timings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('facilities')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'facilities'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Gym Facilities
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'faq'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Rules & FAQ
          </button>
        </div>

        {/* Content form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'persona' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receptionist Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.receptionist_name}
                    onChange={(e) => setSettings({ ...settings, receptionist_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tone of Voice
                  </label>
                  <input
                    type="text"
                    value={settings.receptionist_tone}
                    onChange={(e) => setSettings({ ...settings, receptionist_tone: e.target.value })}
                    placeholder="e.g. Professional, warm, and encouraging"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Welcome Greeting
                </label>
                <textarea
                  rows={3}
                  value={settings.welcome_message}
                  onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={settings.contact_phone}
                      onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <MessageCircle className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={settings.whatsapp_phone}
                      onChange={(e) => setSettings({ ...settings, whatsapp_phone: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gym Location / Address
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timings' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                The AI receptionist references these exact hours when answering visitor queries:
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monday - Friday (Weekdays)
                </label>
                <input
                  type="text"
                  value={settings.gym_timings.weekdays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      gym_timings: { ...settings.gym_timings, weekdays: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Saturday</label>
                <input
                  type="text"
                  value={settings.gym_timings.saturday}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      gym_timings: { ...settings.gym_timings, saturday: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sunday</label>
                <input
                  type="text"
                  value={settings.gym_timings.sunday}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      gym_timings: { ...settings.gym_timings, sunday: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'facilities' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Add or remove amenities that the AI receptionist highlights to prospective members:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Steam Room, Olympic Lifting Platform"
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFacility();
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddFacility}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {settings.facilities.map((fac, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                  >
                    <span>{fac}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFacility(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gym Rules, FAQ & Admission Guidelines
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  The AI uses this policy knowledge when answering questions about shoes, trial passes, towels, lockers, parking, etc.
                </p>
                <textarea
                  rows={6}
                  value={settings.rules_and_faq}
                  onChange={(e) => setSettings({ ...settings, rules_and_faq: e.target.value })}
                  placeholder="e.g. Shoes policy, personal training rules, trial passes eligibility, water bottles..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed resize-none"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save AI Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
