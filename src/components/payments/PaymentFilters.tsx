import React from 'react';
import { Search, Plus, Calendar, Download, RefreshCw, X } from 'lucide-react';
import { PaymentStatus, PaymentFilterState } from '../../types';

interface PaymentFiltersProps {
  filters: PaymentFilterState;
  onFilterChange: (filters: PaymentFilterState) => void;
  onRecordPaymentClick: () => void;
  onExportCSV?: () => void;
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  failedCount?: number;
  refundedCount?: number;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  filters,
  onFilterChange,
  onRecordPaymentClick,
  onExportCSV,
  totalCount,
  paidCount,
  pendingCount,
  failedCount = 0,
  refundedCount = 0,
}) => {
  const statusTabs: { id: PaymentStatus | 'all'; label: string; count?: number }[] = [
    { id: 'all', label: 'All Payments', count: totalCount },
    { id: 'Paid', label: 'Paid', count: paidCount },
    { id: 'Pending', label: 'Pending', count: pendingCount },
    { id: 'Failed', label: 'Failed', count: failedCount },
    { id: 'Refunded', label: 'Refunded', count: refundedCount },
  ];

  const dateRanges: { id: 'all_time' | 'today' | 'this_week' | 'this_month'; label: string }[] = [
    { id: 'all_time', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
  ];

  return (
    <div id="payment-filters-container" className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Top Row: Search & Record Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="payment-search-input"
            placeholder="Search by member name, phone, UTR/ref, plan..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1.5" />
            <select
              id="payment-date-range-select"
              value={filters.dateRange}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  dateRange: e.target.value as 'all_time' | 'today' | 'this_week' | 'this_month',
                })
              }
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer pr-1 py-1"
            >
              {dateRanges.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export CSV Button */}
          {onExportCSV && (
            <button
              id="export-payments-csv-btn"
              onClick={onExportCSV}
              title="Export payments list to CSV"
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export</span>
            </button>
          )}

          {/* Primary Record Payment Button */}
          <button
            id="record-payment-primary-btn"
            onClick={onRecordPaymentClick}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100">
        {statusTabs.map((tab) => {
          const isSelected = filters.status === tab.id;
          return (
            <button
              key={tab.id}
              id={`filter-tab-${tab.id.toLowerCase()}`}
              onClick={() => onFilterChange({ ...filters, status: tab.id })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/70 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
