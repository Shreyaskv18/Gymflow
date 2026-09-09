import React from 'react';
import { IndianRupee, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { PaymentStats } from '../../types';
import { paymentService } from '../../services/paymentService';

interface PaymentStatsBarProps {
  stats: PaymentStats;
}

export const PaymentStatsBar: React.FC<PaymentStatsBarProps> = ({ stats }) => {
  const currentMonthName = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div id="payment-stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Revenue */}
      <div
        id="stat-total-revenue"
        className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Revenue
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {paymentService.formatINR(stats.totalRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across {stats.paidCount} completed payments
          </p>
        </div>
      </div>

      {/* 2. This Month Revenue */}
      <div
        id="stat-month-revenue"
        className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            This Month ({new Date().toLocaleString('en-IN', { month: 'short' })})
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-indigo-900 tracking-tight">
            {paymentService.formatINR(stats.thisMonthRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Collected in {currentMonthName}
          </p>
        </div>
      </div>

      {/* 3. Paid Transactions */}
      <div
        id="stat-paid-count"
        className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Paid Receipts
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats.paidCount}
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>Verified settlements</span>
          </p>
        </div>
      </div>

      {/* 4. Pending & Failed Attention */}
      <div
        id="stat-pending-count"
        className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pending & Issues
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-800 tracking-tight">
              {stats.pendingCount}
            </span>
            <span className="text-xs text-slate-500">pending</span>
            {stats.failedCount > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-sm font-semibold text-rose-600">
                  {stats.failedCount} failed
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats.pendingCount > 0 ? 'Requires front desk follow-up' : 'All transactions cleared'}
          </p>
        </div>
      </div>
    </div>
  );
};
