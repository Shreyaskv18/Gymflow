import {
  Member,
  MembershipPlan,
  Payment,
  Activity,
  RenewalStats,
  RenewalItem,
  RenewalTab,
  RenewalCategory,
  RenewMembershipDTO,
} from '../types';
import { storageService } from './storageService';
import { memberService } from './memberService';
import { paymentService } from './paymentService';
import {
  calculateRenewalDates,
  formatDateIndian,
  getDaysRemaining,
} from '../utils/formatters';

class RenewalService {
  /**
   * Helper to check if a date is in current calendar month and year
   */
  private isCurrentMonth(dateStr?: string): boolean {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } catch {
      return false;
    }
  }

  /**
   * Compute aggregate Renewal KPI statistics from real storage data
   */
  public computeRenewalStats(): RenewalStats {
    const members = storageService.getMembers();
    const payments = storageService.getPayments();

    let expiringIn7Days = 0;
    let expiringIn3Days = 0;
    let expired = 0;

    // Categorize members
    members.forEach((m) => {
      if (m.status === 'inactive') return;
      const endDate = m.membership_end_date || m.membershipEndDate || '';
      const days = getDaysRemaining(endDate);

      if (days < 0) {
        expired++;
      } else if (days <= 3) {
        expiringIn3Days++;
        expiringIn7Days++;
      } else if (days <= 7) {
        expiringIn7Days++;
      }
    });

    // Renewed this month: count members who have a successful payment in the current month
    // where either the note says 'renewal' or payment date is current month and member has active status
    const currentMonthPayments = payments.filter((p) => {
      const isPaid = p.payment_status === 'Paid' || (p as any).status === 'completed';
      const isThisMonth = this.isCurrentMonth(p.payment_date || (p as any).paymentDate);
      return isPaid && isThisMonth;
    });

    // Compute unique members renewed this month or total renewal payment count
    const renewedMemberIds = new Set<string>();
    let renewedRevenue = 0;

    currentMonthPayments.forEach((p) => {
      const mId = p.member_id || (p as any).memberId;
      if (mId) {
        renewedMemberIds.add(mId);
      }
      renewedRevenue += Number(p.amount) || 0;
    });

    return {
      expiringIn7Days,
      expiringIn3Days,
      expired,
      renewedThisMonth: renewedMemberIds.size,
      renewedRevenueThisMonth: renewedRevenue,
      totalRenewableMembers: expiringIn7Days + expired + renewedMemberIds.size,
    };
  }

  /**
   * Retrieve and map all renewal candidate members with rich metadata
   */
  public async getRenewalItems(
    tab: RenewalTab = 'all',
    search = '',
    planId = 'all',
    sortBy: 'urgency' | 'expiry_asc' | 'expiry_desc' | 'name_asc' | 'name_desc' = 'urgency'
  ): Promise<RenewalItem[]> {
    const [allMembers, allPlans] = await Promise.all([
      memberService.getAllMembers(),
      Promise.resolve(storageService.getMembershipPlans()),
    ]);
    const payments = storageService.getPayments();

    // Map payments by member id for quick lookup
    const paymentsByMember = new Map<string, Payment[]>();
    payments.forEach((p) => {
      const mId = p.member_id || (p as any).memberId;
      if (mId) {
        const list = paymentsByMember.get(mId) || [];
        list.push(p);
        paymentsByMember.set(mId, list);
      }
    });

    // Build raw renewal items
    const rawItems: RenewalItem[] = allMembers.map((m) => {
      const plan = allPlans.find((p) => p.id === m.membership_plan_id) || m.membership_plan;
      const endDate = m.membership_end_date || m.membershipEndDate || '';
      const days = getDaysRemaining(endDate);

      // Check member's recent payments
      const mPayments = paymentsByMember.get(m.id) || [];
      mPayments.sort((a, b) => {
        const dateA = new Date(a.payment_date || (a as any).paymentDate || 0).getTime();
        const dateB = new Date(b.payment_date || (b as any).paymentDate || 0).getTime();
        return dateB - dateA;
      });

      const latestPayment = mPayments[0];
      const isRenewedThisMonth = mPayments.some((p) => {
        const isPaid = p.payment_status === 'Paid' || (p as any).status === 'completed';
        return isPaid && this.isCurrentMonth(p.payment_date || (p as any).paymentDate);
      });

      let category: RenewalCategory = 'active';
      if (days < 0) {
        category = 'expired';
      } else if (days === 0) {
        category = 'due_today';
      } else if (days <= 3) {
        category = 'due_3_days';
      } else if (days <= 7) {
        category = 'due_7_days';
      } else if (isRenewedThisMonth) {
        category = 'renewed';
      }

      return {
        member: m,
        plan,
        planName: plan?.name || m.membershipPlan || 'Standard Plan',
        planPrice: plan?.price || 0,
        daysRemaining: days,
        expiryDate: endDate,
        category,
        lastPaymentDate: latestPayment ? latestPayment.payment_date || (latestPayment as any).paymentDate : undefined,
        lastPaymentAmount: latestPayment ? latestPayment.amount : undefined,
        isRenewedThisMonth,
      };
    });

    // Filter by Tab
    let filtered = rawItems.filter((item) => {
      if (item.member.status === 'inactive' && tab !== 'all') return false;

      switch (tab) {
        case 'due_7_days':
          return item.daysRemaining >= 0 && item.daysRemaining <= 7;
        case 'due_3_days':
          return item.daysRemaining >= 0 && item.daysRemaining <= 3;
        case 'expired':
          return item.daysRemaining < 0;
        case 'renewed':
          return Boolean(item.isRenewedThisMonth);
        case 'all':
        default:
          return true;
      }
    });

    // Filter by Plan
    if (planId && planId !== 'all') {
      filtered = filtered.filter((item) => item.member.membership_plan_id === planId || item.plan?.id === planId);
    }

    // Filter by Search (Name, Phone, Email, Plan Name)
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((item) => {
        const name = (item.member.full_name || item.member.name || '').toLowerCase();
        const phone = (item.member.phone || '').toLowerCase();
        const email = (item.member.email || '').toLowerCase();
        const plan = (item.planName || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || email.includes(q) || plan.includes(q);
      });
    }

    // Sort items
    filtered.sort((a, b) => {
      if (sortBy === 'urgency') {
        // Priority order: Due Today (0) -> Expiring <=3 -> Expiring <=7 -> Expired -> Active -> Renewed
        const getWeight = (item: RenewalItem) => {
          if (item.daysRemaining === 0) return 1;
          if (item.daysRemaining > 0 && item.daysRemaining <= 3) return 2 + item.daysRemaining;
          if (item.daysRemaining > 3 && item.daysRemaining <= 7) return 10 + item.daysRemaining;
          if (item.daysRemaining < 0) return 20 + Math.abs(item.daysRemaining);
          if (item.isRenewedThisMonth) return 100;
          return 50 + item.daysRemaining;
        };
        return getWeight(a) - getWeight(b);
      } else if (sortBy === 'expiry_asc') {
        const dateA = new Date(a.expiryDate || '9999-12-31').getTime();
        const dateB = new Date(b.expiryDate || '9999-12-31').getTime();
        return dateA - dateB;
      } else if (sortBy === 'expiry_desc') {
        const dateA = new Date(a.expiryDate || '1970-01-01').getTime();
        const dateB = new Date(b.expiryDate || '1970-01-01').getTime();
        return dateB - dateA;
      } else if (sortBy === 'name_asc') {
        const nameA = a.member.full_name || a.member.name || '';
        const nameB = b.member.full_name || b.member.name || '';
        return nameA.localeCompare(nameB);
      } else if (sortBy === 'name_desc') {
        const nameA = a.member.full_name || a.member.name || '';
        const nameB = b.member.full_name || b.member.name || '';
        return nameB.localeCompare(nameA);
      }
      return 0;
    });

    return filtered;
  }

  /**
   * Preview calculated new start & end dates before submitting renewal
   */
  public calculateRenewalPreview(
    currentEndDate: string,
    durationMonths: number,
    paymentDate?: string
  ): {
    newStartDate: string;
    newEndDate: string;
    isExtendedFromCurrentExpiry: boolean;
    explanation: string;
  } {
    const dates = calculateRenewalDates(currentEndDate, durationMonths, paymentDate);
    const formattedStart = formatDateIndian(dates.newStartDate);
    const formattedEnd = formatDateIndian(dates.newEndDate);

    let explanation = '';
    if (dates.isExtendedFromCurrentExpiry) {
      explanation = `Since this membership is active, the renewal will seamlessly extend from the existing expiry date (${formatDateIndian(
        currentEndDate
      )}) without losing any remaining days. Valid until ${formattedEnd}.`;
    } else {
      explanation = `Since this membership has expired, the new membership cycle will start from the renewal date (${formattedStart}) and remain active until ${formattedEnd}.`;
    }

    return {
      ...dates,
      explanation,
    };
  }

  /**
   * Process and record a membership renewal:
   * 1. Extends/restarts membership dates based on active/expired status
   * 2. Updates member plan and status to 'active'
   * 3. Records a verified payment record via paymentService (single source of truth)
   * 4. Logs activity event
   */
  public async renewMembership(
    dto: RenewMembershipDTO
  ): Promise<{
    success: boolean;
    data?: { member: Member; payment: Payment };
    error?: string;
    message?: string;
  }> {
    if (!dto.member_id) {
      return { success: false, error: 'Please select a valid member.' };
    }
    if (!dto.membership_plan_id) {
      return { success: false, error: 'Please select a membership plan.' };
    }
    const numAmount = Number(dto.amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return { success: false, error: 'Renewal payment amount must be 0 or greater.' };
    }
    if (!dto.payment_date) {
      return { success: false, error: 'Please select a renewal payment date.' };
    }
    if (!dto.payment_method) {
      return { success: false, error: 'Please select a payment method.' };
    }

    const members = storageService.getMembers();
    const plans = storageService.getMembershipPlans();
    const memberIndex = members.findIndex((m) => m.id === dto.member_id);

    if (memberIndex === -1) {
      return { success: false, error: 'Selected member was not found in database.' };
    }

    const existingMember = members[memberIndex];
    const plan = plans.find((p) => p.id === dto.membership_plan_id);

    if (!plan) {
      return { success: false, error: 'Selected membership plan was not found.' };
    }

    // 1. Calculate renewal dates
    const currentEndDate = existingMember.membership_end_date || existingMember.membershipEndDate || '';
    const duration = plan.duration_months || 1;
    const { newStartDate, newEndDate, isExtendedFromCurrentExpiry } = this.calculateRenewalPreview(
      currentEndDate,
      duration,
      dto.payment_date
    );

    // 2. Prepare updated member object
    const updatedMember: Member = {
      ...existingMember,
      membership_plan_id: plan.id,
      membership_start_date: newStartDate,
      membership_end_date: newEndDate,
      status: 'active',
      membership_plan: plan,
      membershipPlan: plan.name,
      membershipStartDate: newStartDate,
      membershipEndDate: newEndDate,
      updated_at: new Date().toISOString(),
    };

    // 3. Save member locally
    members[memberIndex] = updatedMember;
    storageService.saveMembers(members);

    // 4. Try backend sync if API exists
    try {
      await fetch(`/api/members/${encodeURIComponent(updatedMember.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storageService.getAuthSession()?.token || 'gymflow_demo_token'}`,
          'x-admin-request': 'true',
        },
        body: JSON.stringify({
          membership_plan_id: plan.id,
          membership_start_date: newStartDate,
          membership_end_date: newEndDate,
          status: 'active',
        }),
      });
    } catch (e) {
      console.warn('Backend sync for member renewal skipped, local storage updated:', e);
    }

    // 5. Record Payment via existing paymentService (Single Source of Truth)
    const paymentNotes = dto.notes
      ? `${dto.notes} (Renewal: ${plan.name})`
      : `Membership renewal: ${plan.name} (${duration} month${duration > 1 ? 's' : ''}, valid till ${formatDateIndian(
          newEndDate
        )})`;

    const paymentRes = await paymentService.recordPayment({
      member_id: updatedMember.id,
      membership_plan_id: plan.id,
      amount: numAmount,
      payment_date: dto.payment_date,
      payment_method: dto.payment_method,
      payment_status: dto.payment_status || 'Paid',
      transaction_reference: dto.transaction_reference,
      notes: paymentNotes,
    });

    const payment = paymentRes.data || {
      id: `pay-rn-${Date.now()}`,
      member_id: updatedMember.id,
      membership_plan_id: plan.id,
      amount: numAmount,
      payment_date: dto.payment_date,
      payment_method: dto.payment_method,
      payment_status: dto.payment_status || 'Paid',
      transaction_reference: dto.transaction_reference,
      notes: paymentNotes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member: updatedMember,
      membership_plan: plan,
    };

    // 6. Log Activity event
    const activities = storageService.getActivities();
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: 'renewal',
      description: `${updatedMember.full_name || updatedMember.name} renewed ${plan.name}`,
      highlight: `New expiry: ${formatDateIndian(newEndDate)} (${isExtendedFromCurrentExpiry ? 'Extended' : 'Restarted'})`,
      createdAt: new Date().toISOString(),
      memberName: updatedMember.full_name || updatedMember.name,
      amount: numAmount,
    };
    storageService.saveActivities([newActivity, ...activities.slice(0, 49)]);

    // 7. Add audit log
    const session = storageService.getAuthSession();
    storageService.addAuditLog({
      user_id: session?.userId || 'unknown',
      user_name: session?.role === 'owner' ? 'Vikram' : 'Staff Member',
      user_role: (session?.role as any) || 'staff',
      action: `Processed membership renewal for ${updatedMember.full_name || updatedMember.name}`,
      module: 'renewals',
      details: `Plan: ${plan.name}, Extended until: ${formatDateIndian(newEndDate)}, Amount: ₹${numAmount.toLocaleString('en-IN')}`,
    });

    return {
      success: true,
      data: {
        member: updatedMember,
        payment,
      },
      message: `Membership renewed successfully! Valid until ${formatDateIndian(newEndDate)}.`,
    };
  }

  /**
   * Get all renewal history transactions
   */
  public async getRenewalHistory(): Promise<Payment[]> {
    const allPayments = storageService.getPayments();
    const populated = allPayments.map((p) => paymentService.populatePayment(p));

    // Sort newest first
    populated.sort((a, b) => {
      const dateA = new Date(a.payment_date || (a as any).paymentDate || 0).getTime();
      const dateB = new Date(b.payment_date || (b as any).paymentDate || 0).getTime();
      return dateB - dateA;
    });

    return populated;
  }
}

export const renewalService = new RenewalService();
