import {
  Payment,
  CreatePaymentDTO,
  UpdatePaymentDTO,
  PaymentStats,
  PaymentFilterState,
  PaymentMethod,
  PaymentStatus,
} from '../types';
import { storageService } from './storageService';

export interface PaymentServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  field?: string;
  message?: string;
  stats?: PaymentStats;
}

class PaymentService {
  /**
   * Helper to get request headers including auth token
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-admin-request': 'true',
    };
    const session = storageService.getAuthSession();
    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }
    return headers;
  }

  /**
   * Format Indian Rupee currency with standard grouping and ₹ symbol
   */
  public formatINR(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.round(amount || 0));
  }

  /**
   * Format date to Indian standard readable format (e.g. 15 Aug 2024)
   */
  public formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Calculate Payment Statistics from an array of payments
   */
  public computeStats(payments: Payment[]): PaymentStats {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalRevenue = 0;
    let thisMonthRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let refundedCount = 0;

    payments.forEach((p) => {
      const amount = Math.round(Number(p.amount) || 0);
      const isPaid = p.payment_status === 'Paid' || p.status === 'completed' || (p.payment_status as any) === 'completed';

      if (isPaid) {
        totalRevenue += amount;
        paidCount++;

        const pDate = new Date(p.payment_date || (p as any).paymentDate);
        if (!isNaN(pDate.getTime()) && pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
          thisMonthRevenue += amount;
        }
      } else if (p.payment_status === 'Pending' || p.status === 'pending') {
        pendingCount++;
      } else if (p.payment_status === 'Failed' || p.status === 'failed') {
        failedCount++;
      } else if (p.payment_status === 'Refunded' || p.status === 'refunded') {
        refundedCount++;
      }
    });

    return {
      totalRevenue,
      thisMonthRevenue,
      paidCount,
      pendingCount,
      failedCount,
      refundedCount,
      totalCount: payments.length,
    };
  }

  /**
   * Helper to populate payment with member & plan if missing
   */
  public populatePayment(p: Payment): Payment {
    const members = storageService.getMembers();
    const plans = storageService.getMembershipPlans();

    const member = members.find((m) => m.id === (p.member_id || p.memberId));
    const plan = plans.find((pl) => pl.id === (p.membership_plan_id || (p as any).membershipPlanId));

    return {
      ...p,
      member: p.member || member || undefined,
      membership_plan: p.membership_plan || plan || undefined,
      memberId: p.member_id || p.memberId,
      memberName: p.memberName || member?.full_name || member?.name || 'Unknown Member',
      planName: p.planName || plan?.name || 'Unknown Plan',
      paymentDate: p.payment_date || p.paymentDate,
      paymentMethod: p.payment_method || (p.paymentMethod as any) || 'UPI',
      status: (p.payment_status || 'Paid').toLowerCase() as any,
    };
  }

  /**
   * GET /api/payments with optional filtering
   */
  public async getPayments(filters?: PaymentFilterState): Promise<{
    payments: Payment[];
    stats: PaymentStats;
    total: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters?.dateRange && filters.dateRange !== 'all_time') params.set('dateRange', filters.dateRange);
      if (filters?.memberId) params.set('member_id', filters.memberId);

      const url = `/api/payments${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { headers: this.getHeaders() });

      if (response.ok) {
        const json = await response.json();
        const payments: Payment[] = (json.data || []).map((p: any) => this.populatePayment(p));
        const allPayments = storageService.getPayments();
        const stats: PaymentStats = json.stats || this.computeStats(allPayments);

        // Sync local storage cache
        storageService.savePayments(payments.length > 0 ? payments : allPayments);

        return {
          payments,
          stats,
          total: json.count || payments.length,
        };
      }
    } catch (e) {
      console.warn('Backend API /api/payments unavailable, using local storage fallback', e);
    }

    // Client-side filtering fallback
    let payments = storageService.getPayments().map((p) => this.populatePayment(p));

    if (filters?.memberId) {
      payments = payments.filter((p) => (p.member_id || p.memberId) === filters.memberId);
    }

    if (filters?.status && filters.status !== 'all') {
      payments = payments.filter(
        (p) => (p.payment_status || '').toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters?.dateRange && filters.dateRange !== 'all_time') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      payments = payments.filter((p) => {
        const pDate = new Date(p.payment_date || p.paymentDate || '').getTime();
        if (isNaN(pDate)) return true;

        if (filters.dateRange === 'today') {
          return pDate >= startOfToday && pDate < startOfToday + 86400000;
        } else if (filters.dateRange === 'this_week') {
          const dayOfWeek = now.getDay();
          const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
          return pDate >= startOfWeek;
        } else if (filters.dateRange === 'this_month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          return pDate >= startOfMonth;
        }
        return true;
      });
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      payments = payments.filter((p) => {
        const memberName = (p.memberName || p.member?.full_name || p.member?.name || '').toLowerCase();
        const memberPhone = (p.member?.phone || '').toLowerCase();
        const planName = (p.planName || p.membership_plan?.name || '').toLowerCase();
        const txRef = (p.transaction_reference || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        const method = (p.payment_method || '').toLowerCase();
        const status = (p.payment_status || '').toLowerCase();

        return (
          memberName.includes(q) ||
          memberPhone.includes(q) ||
          planName.includes(q) ||
          txRef.includes(q) ||
          notes.includes(q) ||
          method.includes(q) ||
          status.includes(q)
        );
      });
    }

    // Sort newest first
    payments.sort((a, b) => {
      const dateA = new Date(a.payment_date || a.paymentDate || '').getTime();
      const dateB = new Date(b.payment_date || b.paymentDate || '').getTime();
      if (dateB !== dateA) return dateB - dateA;
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });

    const allPayments = storageService.getPayments();
    const stats = this.computeStats(allPayments);

    return {
      payments,
      stats,
      total: payments.length,
    };
  }

  /**
   * GET /api/payments/:id
   */
  public async getPaymentById(id: string): Promise<PaymentServiceResponse<Payment>> {
    try {
      const response = await fetch(`/api/payments/${encodeURIComponent(id)}`, {
        headers: this.getHeaders(),
      });
      if (response.ok) {
        const json = await response.json();
        return { success: true, data: this.populatePayment(json.data) };
      }
    } catch (e) {
      console.warn('API lookup failed, fallback to local storage', e);
    }

    const payments = storageService.getPayments();
    const payment = payments.find((p) => p.id === id);
    if (payment) {
      return { success: true, data: this.populatePayment(payment) };
    }
    return { success: false, error: 'Payment record not found.' };
  }

  /**
   * Get all payments for a specific member
   */
  public async getPaymentsByMemberId(memberId: string): Promise<Payment[]> {
    const res = await this.getPayments({ memberId, status: 'all', dateRange: 'all_time' });
    return res.payments;
  }

  /**
   * POST /api/payments - Record a new payment
   */
  public async recordPayment(dto: CreatePaymentDTO): Promise<PaymentServiceResponse<Payment>> {
    // Client-side validations
    if (!dto.member_id) {
      return { success: false, error: 'Please select a member.', field: 'member_id' };
    }
    if (!dto.membership_plan_id) {
      return { success: false, error: 'Please select a membership plan.', field: 'membership_plan_id' };
    }
    const numAmount = Number(dto.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, error: 'Payment amount must be greater than ₹0.', field: 'amount' };
    }
    if (!dto.payment_date) {
      return { success: false, error: 'Payment date is required.', field: 'payment_date' };
    }
    if (!dto.payment_method) {
      return { success: false, error: 'Please choose a payment method.', field: 'payment_method' };
    }

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(dto),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        const newPayment = this.populatePayment(json.data);

        // Update local storage
        const current = storageService.getPayments();
        storageService.savePayments([newPayment, ...current.filter((p) => p.id !== newPayment.id)]);

        return {
          success: true,
          data: newPayment,
          message: json.message || 'Payment recorded successfully.',
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: json.error || 'Failed to record payment.',
          field: json.field,
        };
      }
    } catch (e) {
      console.warn('API call failed, saving to local storage fallback', e);
    }

    // Local storage fallback creation
    const members = storageService.getMembers();
    const plans = storageService.getMembershipPlans();
    const member = members.find((m) => m.id === dto.member_id);
    const plan = plans.find((p) => p.id === dto.membership_plan_id);

    if (!member) {
      return { success: false, error: 'Selected member was not found.', field: 'member_id' };
    }
    if (!plan) {
      return { success: false, error: 'Selected membership plan was not found.', field: 'membership_plan_id' };
    }

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      member_id: member.id,
      membership_plan_id: plan.id,
      amount: Math.round(numAmount * 100) / 100,
      payment_date: dto.payment_date,
      payment_method: dto.payment_method,
      payment_status: dto.payment_status || 'Paid',
      transaction_reference: dto.transaction_reference ? dto.transaction_reference.trim() : undefined,
      notes: dto.notes ? dto.notes.trim() : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member,
      membership_plan: plan,
      memberId: member.id,
      memberName: member.full_name,
      planName: plan.name,
      paymentDate: dto.payment_date,
      paymentMethod: dto.payment_method,
      status: (dto.payment_status || 'Paid').toLowerCase() as any,
    };

    const current = storageService.getPayments();
    storageService.savePayments([newPayment, ...current]);

    const session = storageService.getAuthSession();
    storageService.addAuditLog({
      user_id: session?.userId || 'unknown',
      user_name: session?.role === 'owner' ? 'Vikram' : 'Staff Member',
      user_role: (session?.role as any) || 'staff',
      action: `Collected payment of ₹${newPayment.amount.toLocaleString('en-IN')} for ${member.full_name}`,
      module: 'payments',
      details: `Method: ${newPayment.payment_method.toUpperCase()}, Status: ${newPayment.status.toUpperCase()}, Plan: ${plan.name}`,
    });

    return {
      success: true,
      data: newPayment,
      message: `Payment of ₹${newPayment.amount.toLocaleString('en-IN')} for ${member.full_name} recorded successfully.`,
    };
  }

  /**
   * PUT /api/payments/:id - Update payment record
   */
  public async updatePayment(id: string, dto: UpdatePaymentDTO): Promise<PaymentServiceResponse<Payment>> {
    try {
      const response = await fetch(`/api/payments/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(dto),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        const updated = this.populatePayment(json.data);

        // Update local storage
        const current = storageService.getPayments();
        storageService.savePayments(current.map((p) => (p.id === id ? updated : p)));

        return {
          success: true,
          data: updated,
          message: json.message || 'Payment updated successfully.',
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: json.error || 'Failed to update payment.',
          field: json.field,
        };
      }
    } catch (e) {
      console.warn('API call failed, fallback to local storage update', e);
    }

    // Local storage fallback update
    const current = storageService.getPayments();
    const index = current.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, error: 'Payment record not found.' };
    }

    const existing = current[index];
    const members = storageService.getMembers();
    const plans = storageService.getMembershipPlans();

    const memberId = dto.member_id || existing.member_id;
    const planId = dto.membership_plan_id || existing.membership_plan_id;
    const member = members.find((m) => m.id === memberId);
    const plan = plans.find((p) => p.id === planId);

    const updatedPayment: Payment = {
      ...existing,
      member_id: memberId,
      membership_plan_id: planId,
      amount: dto.amount !== undefined ? Number(dto.amount) : existing.amount,
      payment_date: dto.payment_date || existing.payment_date,
      payment_method: dto.payment_method || existing.payment_method,
      payment_status: dto.payment_status || existing.payment_status,
      transaction_reference:
        dto.transaction_reference !== undefined ? dto.transaction_reference.trim() : existing.transaction_reference,
      notes: dto.notes !== undefined ? dto.notes.trim() : existing.notes,
      updated_at: new Date().toISOString(),
      member: member || existing.member,
      membership_plan: plan || existing.membership_plan,
      memberId,
      memberName: member?.full_name || existing.memberName,
      planName: plan?.name || existing.planName,
      paymentDate: dto.payment_date || existing.payment_date,
      paymentMethod: dto.payment_method || existing.payment_method,
      status: (dto.payment_status || existing.payment_status).toLowerCase() as any,
    };

    current[index] = updatedPayment;
    storageService.savePayments(current);

    return {
      success: true,
      data: updatedPayment,
      message: 'Payment updated successfully.',
    };
  }

  /**
   * DELETE /api/payments/:id
   */
  public async deletePayment(id: string): Promise<PaymentServiceResponse<void>> {
    try {
      const response = await fetch(`/api/payments/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const current = storageService.getPayments();
        storageService.savePayments(current.filter((p) => p.id !== id));
        return { success: true, message: 'Payment record deleted successfully.' };
      }
    } catch (e) {
      console.warn('API delete call failed, removing from local storage fallback', e);
    }

    const current = storageService.getPayments();
    storageService.savePayments(current.filter((p) => p.id !== id));
    return { success: true, message: 'Payment record deleted successfully.' };
  }

  /**
   * Generate WhatsApp shareable receipt text for a payment record
   */
  public generateReceiptMessage(payment: Payment, gymName = 'GymFlow Fitness Center'): string {
    const memberName = payment.member?.full_name || payment.memberName || 'Valued Member';
    const planName = payment.membership_plan?.name || payment.planName || 'Membership Plan';
    const amount = this.formatINR(payment.amount);
    const date = this.formatDate(payment.payment_date);
    const method = payment.payment_method;
    const ref = payment.transaction_reference ? `\n*Ref ID:* ${payment.transaction_reference}` : '';

    return `Hi ${memberName},\n\nThank you for your payment to *${gymName}*.\n\n*Receipt Details:*\n• *Amount:* ${amount}\n• *Plan:* ${planName}\n• *Date:* ${date}\n• *Method:* ${method}${ref}\n• *Status:* ${payment.payment_status}\n\nFor any queries, please reach out to our front desk.\n\nStay fit and keep moving!\n— *${gymName} Team*`;
  }
}

export const paymentService = new PaymentService();
