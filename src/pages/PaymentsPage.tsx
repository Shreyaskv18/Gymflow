import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  RefreshCw,
  Download,
  IndianRupee,
  FileSpreadsheet,
} from 'lucide-react';
import { Payment, PaymentStats, PaymentFilterState } from '../types';
import { paymentService } from '../services/paymentService';
import { storageService } from '../services/storageService';
import { PaymentStatsBar } from '../components/payments/PaymentStatsBar';
import { PaymentFilters } from '../components/payments/PaymentFilters';
import { PaymentTable } from '../components/payments/PaymentTable';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';
import { PaymentDetailsModal } from '../components/payments/PaymentDetailsModal';

interface PaymentsPageProps {
  showToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onViewMember?: (memberId: string) => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ showToast, onViewMember }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
    totalCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<PaymentFilterState>({
    search: '',
    status: 'all',
    dateRange: 'all_time',
  });

  // Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);

  // Load Payments
  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await paymentService.getPayments(filters);
      setPayments(res.payments);
      setStats(res.stats);
    } catch (err) {
      console.error('Failed to load payments:', err);
      showToast?.('error', 'Loading Error', 'Failed to retrieve payments from storage.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Handle Record / Edit Payment Success
  const handlePaymentSuccess = (savedPayment: Payment) => {
    loadPayments();
    // If viewing this payment, update the viewing state
    if (viewingPayment && viewingPayment.id === savedPayment.id) {
      setViewingPayment(savedPayment);
    }
  };

  // Handle Delete Payment
  const handleDeletePayment = async (paymentToDelete: Payment) => {
    try {
      const res = await paymentService.deletePayment(paymentToDelete.id);
      if (res.success) {
        showToast?.('success', 'Payment Deleted', `Receipt #${paymentToDelete.id} was removed.`);
        if (viewingPayment?.id === paymentToDelete.id) {
          setViewingPayment(null);
        }
        loadPayments();
      } else {
        showToast?.('error', 'Delete Failed', res.error || 'Failed to delete payment.');
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
      showToast?.('error', 'Error', 'Failed to delete payment.');
    }
  };

  // Handle WhatsApp Receipt
  const handleWhatsAppReceipt = (payment: Payment) => {
    const memberPhone = payment.member?.phone;
    if (!memberPhone) {
      showToast?.('error', 'Missing Phone', 'This member does not have a phone number on record.');
      return;
    }

    let cleanPhone = memberPhone.replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

    const gym = storageService.getGym();
    const message = paymentService.generateReceiptMessage(payment, gym?.name || 'GymFlow Fitness');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    showToast?.('info', 'WhatsApp Opened', 'Receipt message preview ready.');
  };

  // CSV Export
  const handleExportCSV = () => {
    if (payments.length === 0) {
      showToast?.('info', 'No Data', 'No payment records to export.');
      return;
    }

    const headers = [
      'Receipt ID',
      'Payment Date',
      'Member Name',
      'Phone Number',
      'Membership Plan',
      'Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Transaction Reference',
      'Notes',
    ];

    const rows = payments.map((p) => {
      const member = p.member;
      const plan = p.membership_plan;
      return [
        `"${p.id}"`,
        `"${p.payment_date}"`,
        `"${(member?.full_name || p.memberName || '').replace(/"/g, '""')}"`,
        `"${member?.phone || ''}"`,
        `"${(plan?.name || p.planName || '').replace(/"/g, '""')}"`,
        p.amount,
        `"${p.payment_method}"`,
        `"${p.payment_status}"`,
        `"${(p.transaction_reference || '').replace(/"/g, '""')}"`,
        `"${(p.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GymFlow_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast?.('success', 'Export Complete', `Exported ${payments.length} payment records to CSV.`);
  };

  return (
    <div id="payments-page-container" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Payments & Collections
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Stage 3 Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Record cash, UPI, card, and bank settlements, issue WhatsApp receipts, and track revenue.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="refresh-payments-btn"
            onClick={loadPayments}
            title="Refresh payment data"
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="header-record-payment-btn"
            onClick={() => {
              setEditingPayment(null);
              setIsRecordModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 1. Statistics Bar */}
      <PaymentStatsBar stats={stats} />

      {/* 2. Search & Filter Bar */}
      <PaymentFilters
        filters={filters}
        onFilterChange={setFilters}
        onRecordPaymentClick={() => {
          setEditingPayment(null);
          setIsRecordModalOpen(true);
        }}
        onExportCSV={handleExportCSV}
        totalCount={stats.totalCount}
        paidCount={stats.paidCount}
        pendingCount={stats.pendingCount}
        failedCount={stats.failedCount}
        refundedCount={stats.refundedCount}
      />

      {/* 3. Payments Table & Mobile Cards */}
      <PaymentTable
        payments={payments}
        onViewPayment={(p) => setViewingPayment(p)}
        onEditPayment={(p) => {
          setEditingPayment(p);
          setIsRecordModalOpen(true);
        }}
        onDeletePayment={handleDeletePayment}
        onWhatsAppReceipt={handleWhatsAppReceipt}
        onViewMember={onViewMember}
        onRecordPaymentClick={() => {
          setEditingPayment(null);
          setIsRecordModalOpen(true);
        }}
        isLoading={isLoading}
      />

      {/* Record / Edit Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingPayment(null);
        }}
        onSuccess={handlePaymentSuccess}
        editingPayment={editingPayment}
        showToast={showToast}
      />

      {/* Payment Details Voucher Modal */}
      <PaymentDetailsModal
        isOpen={Boolean(viewingPayment)}
        payment={viewingPayment}
        onClose={() => setViewingPayment(null)}
        onEdit={(p) => {
          setViewingPayment(null);
          setEditingPayment(p);
          setIsRecordModalOpen(true);
        }}
        onDelete={handleDeletePayment}
        onViewMember={onViewMember}
        showToast={showToast}
      />
    </div>
  );
};
