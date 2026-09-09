import { MembershipPlan, CreateMembershipPlanDTO, UpdateMembershipPlanDTO } from '../types';
import { storageService } from './storageService';

export interface PlanServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

class MembershipPlanService {
  private isServerAvailable: boolean | null = null;

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
   * Helper to format Indian currency with standard grouping and ₹ symbol
   */
  public formatINR(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Check if a plan is referenced by members or payments in local storage
   */
  public isPlanReferenced(planName: string, planId: string): boolean {
    const members = storageService.getMembers();
    const payments = storageService.getPayments();

    const usedInMembers = members.some(
      (m) =>
        (m.membershipPlan && m.membershipPlan.toLowerCase() === planName.toLowerCase()) ||
        ((m as any).planId && (m as any).planId === planId)
    );

    const usedInPayments = payments.some(
      (p) => p.planName && p.planName.toLowerCase() === planName.toLowerCase()
    );

    return usedInMembers || usedInPayments;
  }

  /**
   * GET /api/membership-plans
   */
  public async getAllPlans(): Promise<PlanServiceResponse<MembershipPlan[]>> {
    try {
      const response = await fetch('/api/membership-plans', {
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const json = await response.json();
        const plans: MembershipPlan[] = json.data || [];
        // Sync local storage cache
        storageService.saveMembershipPlans(plans);
        this.isServerAvailable = true;
        return { success: true, data: plans };
      }
    } catch (e) {
      console.warn('Backend API /api/membership-plans unreachable, using local persistent storage fallback', e);
      this.isServerAvailable = false;
    }

    // Fallback to client-side persistent storage
    const cachedPlans = storageService.getMembershipPlans();
    return { success: true, data: cachedPlans };
  }

  /**
   * GET /api/membership-plans/:id
   */
  public async getPlanById(id: string): Promise<PlanServiceResponse<MembershipPlan>> {
    try {
      const response = await fetch(`/api/membership-plans/${encodeURIComponent(id)}`, {
        headers: this.getHeaders(),
      });
      if (response.ok) {
        const json = await response.json();
        return { success: true, data: json.data };
      }
      if (response.status === 404) {
        return { success: false, error: 'Membership plan not found.' };
      }
    } catch (e) {
      console.warn('API lookup failed, checking local storage', e);
    }

    const plans = storageService.getMembershipPlans();
    const plan = plans.find((p) => p.id === id);
    if (plan) {
      return { success: true, data: plan };
    }
    return { success: false, error: 'Membership plan not found.' };
  }

  /**
   * POST /api/membership-plans
   */
  public async createPlan(dto: CreateMembershipPlanDTO): Promise<PlanServiceResponse<MembershipPlan>> {
    // Client-side pre-validation
    const name = dto.name ? dto.name.trim() : '';
    if (!name) {
      return { success: false, error: 'Plan name is required and cannot be empty.' };
    }

    const duration = Number(dto.duration_months);
    if (isNaN(duration) || duration <= 0 || !Number.isInteger(duration)) {
      return { success: false, error: 'Duration in months must be a positive integer greater than 0.' };
    }

    const price = Number(dto.price);
    if (isNaN(price) || price < 0) {
      return { success: false, error: 'Price must be 0 or greater.' };
    }

    const payload = {
      name,
      duration_months: duration,
      price,
      description: dto.description ? dto.description.trim() : '',
      status: dto.status || 'active',
    };

    // Try backend API first
    try {
      const response = await fetch('/api/membership-plans', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        const createdPlan: MembershipPlan = json.data;
        // Update local storage
        const currentPlans = storageService.getMembershipPlans();
        const updatedPlans = [createdPlan, ...currentPlans.filter((p) => p.id !== createdPlan.id)];
        storageService.saveMembershipPlans(updatedPlans);
        return {
          success: true,
          data: createdPlan,
          message: json.message || `Membership plan "${createdPlan.name}" created successfully.`,
        };
      } else {
        return {
          success: false,
          error: json.error || 'Failed to create membership plan.',
        };
      }
    } catch (e) {
      console.warn('API call failed, saving to local storage directly', e);
    }

    // Fallback: local storage creation
    const currentPlans = storageService.getMembershipPlans();
    if (currentPlans.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: `A membership plan named "${name}" already exists.` };
    }

    const now = new Date().toISOString();
    const fallbackPlan: MembershipPlan = {
      id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      duration_months: duration,
      price,
      description: payload.description,
      status: payload.status,
      created_at: now,
      updated_at: now,
    };

    const updated = [fallbackPlan, ...currentPlans];
    storageService.saveMembershipPlans(updated);

    return {
      success: true,
      data: fallbackPlan,
      message: `Membership plan "${fallbackPlan.name}" created successfully.`,
    };
  }

  /**
   * PUT /api/membership-plans/:id
   */
  public async updatePlan(
    id: string,
    dto: UpdateMembershipPlanDTO
  ): Promise<PlanServiceResponse<MembershipPlan>> {
    if (dto.name !== undefined && dto.name.trim().length === 0) {
      return { success: false, error: 'Plan name cannot be empty.' };
    }
    if (dto.duration_months !== undefined) {
      const d = Number(dto.duration_months);
      if (isNaN(d) || d <= 0 || !Number.isInteger(d)) {
        return { success: false, error: 'Duration in months must be a positive integer greater than 0.' };
      }
    }
    if (dto.price !== undefined) {
      const p = Number(dto.price);
      if (isNaN(p) || p < 0) {
        return { success: false, error: 'Price must be 0 or greater.' };
      }
    }

    try {
      const response = await fetch(`/api/membership-plans/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(dto),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        const updatedPlan: MembershipPlan = json.data;
        const currentPlans = storageService.getMembershipPlans();
        const updatedPlans = currentPlans.map((p) => (p.id === id ? updatedPlan : p));
        storageService.saveMembershipPlans(updatedPlans);
        return {
          success: true,
          data: updatedPlan,
          message: json.message || `Membership plan "${updatedPlan.name}" updated successfully.`,
        };
      } else {
        return {
          success: false,
          error: json.error || 'Failed to update membership plan.',
        };
      }
    } catch (e) {
      console.warn('API call failed, updating local storage directly', e);
    }

    // Fallback: local storage update
    const currentPlans = storageService.getMembershipPlans();
    const existingIndex = currentPlans.findIndex((p) => p.id === id);
    if (existingIndex === -1) {
      return { success: false, error: 'Membership plan not found.' };
    }

    const existing = currentPlans[existingIndex];
    if (dto.name && dto.name.trim() !== existing.name) {
      const dup = currentPlans.find(
        (p) => p.id !== id && p.name.toLowerCase() === dto.name!.trim().toLowerCase()
      );
      if (dup) {
        return { success: false, error: `Another plan named "${dto.name.trim()}" already exists.` };
      }
    }

    const updatedPlan: MembershipPlan = {
      ...existing,
      name: dto.name !== undefined ? dto.name.trim() : existing.name,
      duration_months:
        dto.duration_months !== undefined ? Number(dto.duration_months) : existing.duration_months,
      price: dto.price !== undefined ? Number(dto.price) : existing.price,
      description:
        dto.description !== undefined ? dto.description.trim() : existing.description,
      status: dto.status !== undefined ? dto.status : existing.status,
      updated_at: new Date().toISOString(),
    };

    currentPlans[existingIndex] = updatedPlan;
    storageService.saveMembershipPlans(currentPlans);

    return {
      success: true,
      data: updatedPlan,
      message: `Membership plan "${updatedPlan.name}" updated successfully.`,
    };
  }

  /**
   * DELETE /api/membership-plans/:id
   */
  public async deletePlan(id: string): Promise<PlanServiceResponse<void>> {
    const plans = storageService.getMembershipPlans();
    const plan = plans.find((p) => p.id === id);

    // Client-side referential safety check
    if (plan && this.isPlanReferenced(plan.name, plan.id)) {
      return {
        success: false,
        code: 'PLAN_IN_USE',
        error: 'This plan is being used by existing records. Deactivate it instead.',
      };
    }

    try {
      const response = await fetch(`/api/membership-plans/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        const remaining = plans.filter((p) => p.id !== id);
        storageService.saveMembershipPlans(remaining);
        return {
          success: true,
          message: json.message || 'Membership plan deleted successfully.',
        };
      } else {
        return {
          success: false,
          code: json.code,
          error: json.error || 'Failed to delete membership plan.',
        };
      }
    } catch (e) {
      console.warn('API call failed, deleting from local storage directly', e);
    }

    // Fallback: local storage deletion
    const remaining = plans.filter((p) => p.id !== id);
    storageService.saveMembershipPlans(remaining);
    return {
      success: true,
      message: 'Membership plan deleted successfully.',
    };
  }

  /**
   * Quick toggle active/inactive status
   */
  public async toggleStatus(id: string): Promise<PlanServiceResponse<MembershipPlan>> {
    const plans = storageService.getMembershipPlans();
    const plan = plans.find((p) => p.id === id);
    if (!plan) {
      return { success: false, error: 'Membership plan not found.' };
    }

    const nextStatus = plan.status === 'active' ? 'inactive' : 'active';
    return this.updatePlan(id, { status: nextStatus });
  }
}

export const membershipPlanService = new MembershipPlanService();

