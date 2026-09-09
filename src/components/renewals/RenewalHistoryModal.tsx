import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Search,
  Receipt,
  CreditCard,
  IndianRupee,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Payment } from '../../types';
import { renewalService } from '../../services/renewalService';
import { formatCurrencyINR, formatDateIndian } from '../../utils/formatters';
import { PaymentDetailsModal } from '../payments/PaymentDetailsModal';

interface RenewalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const RenewalHistoryModal: React.FC<RenewalHistoryModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [history, setHistory] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await renewalService.getRenewalHistory();
      setHistory(data);
    } catch (e) {
      console.error('Failed to load renewal history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredHistory = history.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const name = (p.member?.full_name || p.member?.name || '').toLowerCase();
    const plan = (p.membership_plan?.name || '').toLowerCase();
    const ref = (p.transaction_reference || '').toLowerCase();
    return name.includes(q) || plan.includes(q) || ref.includes(q);
  });

  return (
    <>
      <div
        id="renewal-history-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          id="renewal-history-modal-container"
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Renewal History Log</h3>
                <p className="text-xs text-slate-300">Audited log of membership transactions</p>
              </div>
            </div>

            <button
              type="button"
              id="close-renewal-history-button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200/80 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                id="renewal-history-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search member, plan, or transaction reference..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-2">
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading renewal logs...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs text-slate-500">No renewal transactions matching your search.</p>
              </div>
            ) : (
              filteredHistory.map((p) => {
                const memberName = p.member?.full_name || p.member?.name || 'Member';
                const planName = p.membership_plan?.name || 'Plan';
                const isPaid = p.payment_status === 'Paid';

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedReceipt(p)}
                    className="p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {memberName}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {planName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>{formatDateIndian(p.payment_date)}</span>
                        <span>•</span>
                        <span>{p.payment_method}</span>
                        {p.transaction_reference && (
                          <>
                            <span>•</span>
                            <span className="truncate">Ref: {p.transaction_reference}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-black text-slate-900 text-sm block">
                          {formatCurrencyINR(p.amount)}
                        </span>
                        <span
                          className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {p.payment_status}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>{filteredHistory.length} total recorded renewal payments</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Selected Receipt Modal */}
      <PaymentDetailsModal
        isOpen={Boolean(selectedReceipt)}
        payment={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        showToast={showToast}
      />
    </>
  );
};
