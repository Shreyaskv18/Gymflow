import React from 'react';
import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  RefreshCw, 
  Sparkles, 
  ArrowLeft,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { NavigationItem } from '../types';

interface ComingSoonPageProps {
  module: NavigationItem;
  onGoToDashboard: () => void;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ module, onGoToDashboard }) => {
  const getModuleDetails = (mod: NavigationItem) => {
    switch (mod) {
      case 'members':
        return {
          title: 'Member Management',
          icon: <Users className="w-7 h-7 text-indigo-600" />,
          description: 'Comprehensive directory for gym member onboarding, custom membership plan assignments, member profiles, and search/filtering.',
          stage2Features: [
            'Add, edit, and deactivate gym members',
            'Assign flexible plans (Monthly, 3-Month, 6-Month, Annual)',
            'Member profile detail views & contact history',
            'Quick member search and status filters',
          ],
        };
      case 'payments':
        return {
          title: 'Payments & Invoicing',
          icon: <CreditCard className="w-7 h-7 text-indigo-600" />,
          description: 'Track member payments across UPI, Card, NetBanking, and Cash with automated receipt generation and payment tracking.',
          stage2Features: [
            'Record incoming gym fees and personal training payments',
            'Generate INR tax invoices and digital payment receipts',
            'Pending payment reminders & overdue tracking',
            'Revenue filtering by payment mode (UPI, Cash, Card)',
          ],
        };
      case 'attendance':
        return {
          title: 'Attendance & Check-in Desk',
          icon: <CalendarCheck className="w-7 h-7 text-indigo-600" />,
          description: 'Live front-desk check-in logger, daily rush hour logs, and member attendance frequency records.',
          stage2Features: [
            'Quick member check-in with 1-click or member ID search',
            'Peak workout hours and daily footfall analysis',
            'Attendance history by individual member',
            'Monthly attendance consistency tracking',
          ],
        };
      case 'renewals':
        return {
          title: 'Membership Renewals',
          icon: <RefreshCw className="w-7 h-7 text-indigo-600" />,
          description: 'Automated renewal pipeline, expiring membership alerts, and retention management.',
          stage2Features: [
            'Proactive 7-day and 3-day expiry alerts',
            '1-click membership renewal workflows',
            'Expired membership re-activation tracker',
            'Member retention metrics and insights',
          ],
        };
      default:
        return {
          title: 'Module',
          icon: <Lock className="w-7 h-7 text-slate-600" />,
          description: 'This module is scheduled for development in Stage 2.',
          stage2Features: ['Extended SaaS functionality coming soon'],
        };
    }
  };

  const details = getModuleDetails(module);

  return (
    <div id="coming-soon-view" className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-10 shadow-sm text-left">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              {details.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {details.title}
                </h1>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Coming in Stage 2
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Scheduled for implementation in the next release cycle
              </p>
            </div>
          </div>

          <button
            onClick={onGoToDashboard}
            className="self-start sm:self-auto flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Description */}
        <div className="py-6 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Module Purpose
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            {details.description}
          </p>
        </div>

        {/* Planned Features List */}
        <div className="py-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Planned Stage 2 Scope</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {details.stage2Features.map((feat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-slate-800 font-medium leading-snug">
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 p-4 rounded-xl bg-[#0F172A] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border border-slate-800">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-slate-300">
              The underlying database models and schemas for this module are already configured in the Stage 1 data layer.
            </span>
          </div>
          <button
            onClick={onGoToDashboard}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
          >
            View Live Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
