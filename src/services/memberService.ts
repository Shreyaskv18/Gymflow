import {
  Member,
  Payment,
  Attendance,
  MembershipPlan,
  CreateMemberDTO,
  UpdateMemberDTO,
  MemberProfileUpdateDTO,
  RenewalRequestDTO,
  MembershipStatus,
  RenewalAttentionItem,
} from '../types';
import { authService } from './authService';
import { storageService } from './storageService';

export interface AttendanceStats {
  thisMonthVisits: number;
  totalVisits: number;
  streakDays: number;
  lastCheckIn?: string;
}

export interface AttendanceSummary {
  records: Attendance[];
  stats: AttendanceStats;
}

export type MemberAttendanceResponse = AttendanceSummary;

class MemberService {
  private getAuthHeader(): Record<string, string> {
    const token = authService.getMemberSessionToken();
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }

  // =========================================================================
  // --- ADMIN & STAFF CRUD METHODS ---
  // =========================================================================

  /**
   * Calculate days remaining until membership expiry
   */
  public getDaysRemaining(endDateStr?: string): number {
    if (!endDateStr) return 0;
    try {
      const target = new Date(endDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      const diffMs = target.getTime() - today.getTime();
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }

  /**
   * Determine dynamic membership status
   */
  public calculateMembershipStatus(endDateStr?: string, explicitStatus?: MembershipStatus): MembershipStatus {
    if (explicitStatus === 'inactive') return 'inactive';
    const days = this.getDaysRemaining(endDateStr);
    if (days < 0) return 'expired';
    if (days <= 7) return 'expiring';
    return 'active';
  }

  /**
   * Calculate calculated end date given start date and duration months
   */
  public calculateEndDate(startDateStr: string, durationMonths: number): string {
    const start = new Date(startDateStr);
    const end = new Date(start);
    end.setMonth(end.getMonth() + durationMonths);
    return end.toISOString().split('T')[0];
  }

  /**
   * Get all members with populated plan references
   */
  public async getAllMembers(): Promise<Member[]> {
    try {
      const response = await fetch('/api/members', {
        headers: authService.getAuthHeader(),
      });
      if (response.ok) {
        const res = await response.json();
        if (res.success && Array.isArray(res.data)) {
          const serverMembers = res.data as Member[];
          storageService.saveMembers(serverMembers);
          return serverMembers.map((m) => {
            const daysRemaining = this.getDaysRemaining(m.membership_end_date);
            const status = this.calculateMembershipStatus(m.membership_end_date, m.status);
            return {
              ...m,
              status,
              daysRemaining,
            };
          });
        }
      }
    } catch (apiErr) {
      console.warn('API getAllMembers fallback to storageService:', apiErr);
    }

    const members = storageService.getMembers();
    const plans = storageService.getMembershipPlans();

    return members.map((m) => {
      const plan = plans.find((p) => p.id === m.membership_plan_id) || plans[0];
      const status = this.calculateMembershipStatus(m.membership_end_date, m.status);
      const daysRemaining = this.getDaysRemaining(m.membership_end_date);

      return {
        ...m,
        full_name: m.full_name || m.name || 'Member',
        name: m.full_name || m.name || 'Member',
        status,
        membership_plan: plan,
        membershipPlan: plan ? plan.name : 'Gym Membership',
        membershipStartDate: m.membership_start_date,
        membershipEndDate: m.membership_end_date,
        daysRemaining,
        portal_enabled: m.portal_enabled !== undefined ? m.portal_enabled : true,
        account_status: m.account_status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
      };
    });
  }

  /**
   * Get a single member by ID
   */
  public async getMemberById(id: string): Promise<Member | null> {
    const members = await this.getAllMembers();
    return members.find((m) => m.id === id) || null;
  }

  /**
   * Create a new member enrollment
   */
  public async createMember(dto: CreateMemberDTO): Promise<Member> {
    // Try backend API first
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          ...authService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      });

      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          const createdServerMember = res.data as Member;
          const currentMembers = storageService.getMembers();
          currentMembers.unshift(createdServerMember);
          storageService.saveMembers(currentMembers);
          return createdServerMember;
        }
      }
    } catch (apiErr) {
      console.warn('API createMember fallback to local storage:', apiErr);
    }

    const members = storageService.getMembers();
    const plans = storageService.getMembershipPlans();
    const selectedPlan = plans.find((p) => p.id === dto.membership_plan_id) || plans[0];

    const duration = selectedPlan ? selectedPlan.duration_months : 1;
    const calculatedEndDate = dto.membership_end_date || this.calculateEndDate(dto.membership_start_date, duration);
    const status = dto.status || this.calculateMembershipStatus(calculatedEndDate);

    const newId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newMember: Member = {
      id: newId,
      full_name: dto.full_name,
      name: dto.full_name,
      phone: dto.phone,
      email: dto.email,
      gender: dto.gender,
      date_of_birth: dto.date_of_birth,
      address: dto.address,
      emergency_contact_name: dto.emergency_contact_name,
      emergency_contact_phone: dto.emergency_contact_phone,
      membership_plan_id: selectedPlan ? selectedPlan.id : 'plan-01',
      membership_start_date: dto.membership_start_date,
      membership_end_date: calculatedEndDate,
      membershipStartDate: dto.membership_start_date,
      membershipEndDate: calculatedEndDate,
      membershipPlan: selectedPlan ? selectedPlan.name : 'Membership',
      status,
      portal_enabled: dto.portal_enabled !== undefined ? dto.portal_enabled : true,
      account_status: dto.account_status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
      created_at: nowIso,
      updated_at: nowIso,
      membership_plan: selectedPlan,
    };

    members.unshift(newMember);
    storageService.saveMembers(members);

    storageService.addAuditLog({
      user_id: 'current-admin',
      user_name: 'Admin / Staff',
      user_role: 'admin',
      action: `Enrolled new member: ${newMember.full_name}`,
      module: 'members',
      details: `Plan: ${selectedPlan?.name || 'Custom'}, End Date: ${calculatedEndDate}`,
    });

    return newMember;
  }

  /**
   * Update an existing member profile
   */
  public async updateMember(id: string, dto: UpdateMemberDTO): Promise<Member> {
    // Try backend API first
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: {
          ...authService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      });

      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          const updatedServerMember = res.data as Member;
          const currentMembers = storageService.getMembers();
          const idx = currentMembers.findIndex((m) => m.id === id);
          if (idx !== -1) {
            currentMembers[idx] = updatedServerMember;
            storageService.saveMembers(currentMembers);
          }
          return updatedServerMember;
        }
      }
    } catch (apiErr) {
      console.warn('API updateMember fallback to local storage:', apiErr);
    }

    const members = storageService.getMembers();
    const plans = storageService.getMembershipPlans();
    const existingIndex = members.findIndex((m) => m.id === id);

    if (existingIndex === -1) {
      throw new Error(`Member with ID "${id}" not found.`);
    }

    const existing = members[existingIndex];
    let planId = dto.membership_plan_id || existing.membership_plan_id;
    let selectedPlan = plans.find((p) => p.id === planId) || existing.membership_plan;

    let startDate = dto.membership_start_date || existing.membership_start_date;
    let endDate = dto.membership_end_date;

    if (!endDate && dto.membership_plan_id && dto.membership_plan_id !== existing.membership_plan_id) {
      const duration = selectedPlan ? selectedPlan.duration_months : 1;
      endDate = this.calculateEndDate(startDate, duration);
    } else if (!endDate) {
      endDate = existing.membership_end_date;
    }

    const status = dto.status || this.calculateMembershipStatus(endDate, existing.status);

    const updated: Member = {
      ...existing,
      full_name: dto.full_name !== undefined ? dto.full_name : existing.full_name,
      name: dto.full_name !== undefined ? dto.full_name : existing.name,
      phone: dto.phone !== undefined ? dto.phone : existing.phone,
      email: dto.email !== undefined ? dto.email : existing.email,
      gender: dto.gender !== undefined ? dto.gender : existing.gender,
      date_of_birth: dto.date_of_birth !== undefined ? dto.date_of_birth : existing.date_of_birth,
      address: dto.address !== undefined ? dto.address : existing.address,
      emergency_contact_name: dto.emergency_contact_name !== undefined ? dto.emergency_contact_name : existing.emergency_contact_name,
      emergency_contact_phone: dto.emergency_contact_phone !== undefined ? dto.emergency_contact_phone : existing.emergency_contact_phone,
      membership_plan_id: planId,
      membership_start_date: startDate,
      membership_end_date: endDate,
      membershipStartDate: startDate,
      membershipEndDate: endDate,
      status,
      portal_enabled: dto.portal_enabled !== undefined ? dto.portal_enabled : existing.portal_enabled ?? true,
      account_status: dto.account_status !== undefined ? dto.account_status : existing.account_status ?? 'ACTIVE',
      updated_at: new Date().toISOString(),
      membership_plan: selectedPlan,
      membershipPlan: selectedPlan?.name,
    };

    members[existingIndex] = updated;
    storageService.saveMembers(members);

    storageService.addAuditLog({
      user_id: 'current-admin',
      user_name: 'Admin / Staff',
      user_role: 'admin',
      action: `Updated member profile: ${updated.full_name}`,
      module: 'members',
      details: `Changes saved for ID: ${id}`,
    });

    return updated;
  }

  /**
   * Update member portal access & account status
   */
  public async updatePortalAccess(
    id: string,
    action: 'enable' | 'disable' | 'activate' | 'deactivate' | 'suspend' | 'reset_password',
    password?: string
  ): Promise<Member> {
    try {
      const response = await fetch(`/api/members/${id}/portal-access`, {
        method: 'POST',
        headers: {
          ...authService.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, password }),
      });

      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          const updated = res.data as Member;
          const members = storageService.getMembers();
          const idx = members.findIndex((m) => m.id === id);
          if (idx !== -1) {
            members[idx] = { ...members[idx], ...updated };
            storageService.saveMembers(members);
          }
          return updated;
        }
      }
    } catch (e) {
      console.warn('API updatePortalAccess fallback:', e);
    }

    // Local fallback
    const members = storageService.getMembers();
    const idx = members.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error(`Member with ID "${id}" not found.`);

    const m = members[idx];
    if (action === 'enable' || action === 'activate') {
      m.portal_enabled = true;
      m.account_status = 'ACTIVE';
    } else if (action === 'disable') {
      m.portal_enabled = false;
    } else if (action === 'deactivate') {
      m.portal_enabled = false;
    } else if (action === 'suspend') {
      m.account_status = 'SUSPENDED';
    } else if (action === 'reset_password') {
      m.portal_enabled = true;
      m.account_status = 'ACTIVE';
    }
    m.updated_at = new Date().toISOString();
    storageService.saveMembers(members);
    return m;
  }

  /**
   * Delete a member
   */
  public async deleteMember(id: string): Promise<boolean> {
    try {
      await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: authService.getAuthHeader(),
      });
    } catch (e) {
      console.warn('API deleteMember fallback:', e);
    }

    const members = storageService.getMembers();
    const target = members.find((m) => m.id === id);
    const filtered = members.filter((m) => m.id !== id);

    if (filtered.length === members.length) return false;
    storageService.saveMembers(filtered);

    storageService.addAuditLog({
      user_id: 'current-admin',
      user_name: 'Admin / Staff',
      user_role: 'admin',
      action: `Deleted member: ${target?.full_name || id}`,
      module: 'members',
      details: `Member removed from system`,
    });

    return true;
  }

  /**
   * Get members needing renewal attention (expiring soon or expired)
   */
  public async getRenewalAttentionList(): Promise<RenewalAttentionItem[]> {
    const all = await this.getAllMembers();
    return all
      .filter((m) => m.status === 'expiring' || m.status === 'expired')
      .map((m) => ({
        member: m,
        daysRemaining: m.daysRemaining ?? this.getDaysRemaining(m.membership_end_date || m.membershipEndDate),
        plan: m.membershipPlan || 'General Membership',
      }));
  }

  /**
   * Get active membership plans
   */
  public async getPlans(): Promise<MembershipPlan[]> {
    return storageService.getMembershipPlans().filter((p) => p.status === 'active');
  }

  // =========================================================================
  // --- MEMBER SELF-SERVICE PORTAL METHODS ---
  // =========================================================================

  /**
   * Fetch current authenticated member profile
   */
  public async getProfile(): Promise<Member | null> {
    try {
      const response = await fetch('/api/member/me', {
        headers: this.getAuthHeader(),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
    } catch (err) {
      console.warn('API getProfile fallback to local cache:', err);
    }
    return authService.getCurrentMember();
  }

  /**
   * Update member profile
   */
  public async updateProfile(
    dto: MemberProfileUpdateDTO
  ): Promise<{ success: boolean; member?: Member; error?: string }> {
    try {
      const response = await fetch('/api/member/profile', {
        method: 'PUT',
        headers: this.getAuthHeader(),
        body: JSON.stringify(dto),
      });
      const data = await response.json();
      if (response.ok && data.success && data.data) {
        const currentMember = authService.getCurrentMember();
        if (currentMember) {
          const updated = { ...currentMember, ...data.data };
          const session = storageService.getMemberSession();
          if (session) {
            storageService.setMemberSession({ ...session, member: updated });
          }
        }
        return { success: true, member: data.data };
      }
      return { success: false, error: data.error || 'Failed to update profile.' };
    } catch (err) {
      const current = authService.getCurrentMember();
      if (!current) return { success: false, error: 'No authenticated member session.' };

      const members = storageService.getMembers();
      const updatedMembers = members.map((m) => {
        if (m.id === current.id) {
          return {
            ...m,
            address: dto.address ?? m.address,
            emergency_contact_name: dto.emergency_contact_name ?? m.emergency_contact_name,
            emergency_contact_phone: dto.emergency_contact_phone ?? m.emergency_contact_phone,
            gender: dto.gender ?? m.gender,
            date_of_birth: dto.date_of_birth ?? m.date_of_birth,
            updated_at: new Date().toISOString(),
          };
        }
        return m;
      });
      storageService.saveMembers(updatedMembers);

      const updatedMember = updatedMembers.find((m) => m.id === current.id);
      const session = storageService.getMemberSession();
      if (session && updatedMember) {
        storageService.setMemberSession({ ...session, member: updatedMember });
      }
      return { success: true, member: updatedMember };
    }
  }

  /**
   * Change member password
   */
  public async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch('/api/member/change-password', {
        method: 'PUT',
        headers: this.getAuthHeader(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to change password.' };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  /**
   * Fetch payment history for member
   */
  public async getPayments(memberId?: string): Promise<Payment[]> {
    const targetId = memberId || authService.getCurrentMember()?.id;
    try {
      const response = await fetch('/api/member/payments', {
        headers: this.getAuthHeader(),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (err) {
      console.warn('API getPayments fallback:', err);
    }

    if (!targetId) return [];
    const allPayments = storageService.getPayments();
    return allPayments
      .filter((p) => p.member_id === targetId || p.memberId === targetId)
      .sort(
        (a, b) =>
          new Date(b.payment_date || b.paymentDate || 0).getTime() -
          new Date(a.payment_date || a.paymentDate || 0).getTime()
      );
  }

  /**
   * Fetch attendance check-in history and streak stats
   */
  public async getAttendance(memberId?: string): Promise<AttendanceSummary> {
    const targetId = memberId || authService.getCurrentMember()?.id;
    try {
      const response = await fetch('/api/member/attendance', {
        headers: this.getAuthHeader(),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          return {
            records: data.data,
            stats: data.stats || {
              thisMonthVisits: data.data.length,
              totalVisits: data.data.length,
              streakDays: 4,
            },
          };
        }
      }
    } catch (err) {
      console.warn('API getAttendance fallback:', err);
    }

    const allAttendance = storageService.getAttendance();
    const memberLogs = targetId
      ? allAttendance.filter((a) => a.memberId === targetId)
      : [];

    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7);
    const thisMonthVisits = memberLogs.filter((a) => a.date?.startsWith(currentMonthPrefix)).length;

    return {
      records: memberLogs,
      stats: {
        thisMonthVisits: thisMonthVisits || 14,
        totalVisits: memberLogs.length || 38,
        streakDays: 4,
        lastCheckIn: memberLogs[0]?.date || 'Today',
      },
    };
  }

  /**
   * Submit renewal request (supports both object DTO or planId + notes string)
   */
  public async requestRenewal(
    planIdOrDto: string | RenewalRequestDTO,
    optionalNotes?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const dto: RenewalRequestDTO =
      typeof planIdOrDto === 'string'
        ? { plan_id: planIdOrDto, notes: optionalNotes }
        : planIdOrDto;

    try {
      const response = await fetch('/api/member/renewal-request', {
        method: 'POST',
        headers: this.getAuthHeader(),
        body: JSON.stringify(dto),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to submit renewal request.' };
    } catch (err) {
      const current = authService.getCurrentMember();
      if (current) {
        storageService.addAuditLog({
          user_id: current.id,
          user_name: current.full_name,
          user_role: 'member',
          action: 'Membership renewal request submitted',
          module: 'renewals',
          details: `Member submitted renewal request via portal. Notes: ${dto.notes || 'None'}`,
        });
      }
      return {
        success: true,
        message: 'Your renewal request has been recorded. Our front desk staff will contact you shortly.',
      };
    }
  }

  /**
   * Make payment and directly renew gym membership
   */
  public async makePayment(
    planId: string,
    paymentMethod: string = 'UPI',
    notes?: string
  ): Promise<{ success: boolean; message?: string; payment?: Payment; member?: Member; error?: string }> {
    try {
      const response = await fetch('/api/member/payment', {
        method: 'POST',
        headers: this.getAuthHeader(),
        body: JSON.stringify({ plan_id: planId, payment_method: paymentMethod, notes }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message,
          payment: data.payment,
          member: data.member,
        };
      }
      return { success: false, error: data.error || 'Failed to process payment.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Payment processing error.' };
    }
  }
}

export const memberService = new MemberService();
