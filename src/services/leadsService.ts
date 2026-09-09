import { Lead, CreateLeadDTO, UpdateLeadDTO, LeadStats, LeadFilterState, LeadStatus } from '../types';
import { storageService } from './storageService';
import { authService } from './authService';

class LeadsService {
  /**
   * Fetch all leads with optional filtering and backend sync
   */
  public async getLeads(filters?: LeadFilterState): Promise<Lead[]> {
    try {
      const token = authService.getSessionToken();
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.source && filters.source !== 'all') params.append('source', filters.source);

      const url = `/api/leads${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // If no filters applied, update local storage copy
          if (!filters || (!filters.search && (!filters.status || filters.status === 'all') && (!filters.source || filters.source === 'all'))) {
            storageService.saveLeads(json.data);
          }
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Backend API /api/leads unavailable, using local persistence:', err);
    }

    // Local fallback
    let list = storageService.getLeads();

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((l) => l.status === filters.status);
    }

    if (filters?.source && filters.source !== 'all') {
      list = list.filter((l) => l.source === filters.source);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.interested_plan_name && l.interested_plan_name.toLowerCase().includes(q)) ||
          (l.message && l.message.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Get single lead by ID
   */
  public async getLeadById(id: string): Promise<Lead | null> {
    const all = await this.getLeads();
    return all.find((l) => l.id === id) || null;
  }

  /**
   * Create a new lead (public enquiry or receptionist capture)
   */
  public async createLead(dto: CreateLeadDTO): Promise<Lead> {
    if (!dto.name || !dto.name.trim()) {
      throw new Error('Visitor name is required.');
    }
    if (!dto.phone || !dto.phone.trim()) {
      throw new Error('Phone number is required.');
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          // Sync locally
          const leads = storageService.getLeads();
          leads.unshift(json.data);
          storageService.saveLeads(leads);
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Failed to call /api/leads, using local storage:', err);
    }

    // Local fallback
    const newLead = storageService.addLead({
      name: dto.name.trim(),
      phone: dto.phone.trim(),
      email: dto.email ? dto.email.trim().toLowerCase() : undefined,
      interested_plan_id: dto.interested_plan_id,
      interested_plan_name: dto.interested_plan_name,
      source: dto.source || 'AI_RECEPTIONIST',
      message: dto.message?.trim(),
      status: dto.status || 'NEW',
      trial_date: dto.trial_date,
      trial_time: dto.trial_time,
      notes: dto.notes?.trim(),
    });

    return newLead;
  }

  /**
   * Update lead status or details
   */
  public async updateLead(id: string, updates: UpdateLeadDTO): Promise<Lead> {
    try {
      const token = authService.getSessionToken();
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          storageService.updateLead(id, json.data);
          return json.data;
        }
      }
    } catch (err) {
      console.warn(`Failed to update /api/leads/${id}, using local fallback:`, err);
    }

    const updated = storageService.updateLead(id, updates);
    if (!updated) {
      throw new Error('Lead not found.');
    }
    return updated;
  }

  /**
   * Delete lead
   */
  public async deleteLead(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = authService.getSessionToken();
      const res = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        storageService.deleteLead(id);
        return { success: true };
      }
    } catch (err) {
      console.warn(`Failed to delete /api/leads/${id}, using local fallback:`, err);
    }

    const deleted = storageService.deleteLead(id);
    return { success: deleted, error: deleted ? undefined : 'Lead not found' };
  }

  /**
   * Calculate lead metrics & stats
   */
  public async getLeadStats(): Promise<LeadStats> {
    const leads = await this.getLeads();
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === 'NEW').length;
    const contactedCount = leads.filter((l) => l.status === 'CONTACTED').length;
    const interestedCount = leads.filter((l) => l.status === 'INTERESTED').length;
    const convertedCount = leads.filter((l) => l.status === 'CONVERTED').length;
    const lostCount = leads.filter((l) => l.status === 'LOST').length;
    const trialBookingsCount = leads.filter((l) => Boolean(l.trial_date)).length;

    const conversionRate = total > 0 ? Math.round((convertedCount / total) * 1000) / 10 : 0;

    return {
      total,
      newCount,
      contactedCount,
      interestedCount,
      convertedCount,
      lostCount,
      conversionRate,
      trialBookingsCount,
    };
  }

  /**
   * Generate formatted WhatsApp direct link
   */
  public getWhatsAppLink(phone: string, leadName?: string, planName?: string): string {
    // Strip non-digits except leading +
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const greetingName = leadName ? `Hi ${leadName}` : 'Hello';
    const planText = planName ? ` regarding the ${planName} membership` : '';
    const text = encodeURIComponent(`${greetingName}! This is the front desk at GymFlow Fitness Center${planText}. We would love to help you get started or answer any questions!`);
    return `https://wa.me/${cleanPhone}?text=${text}`;
  }

  public getWhatsAppChatUrl(phone: string, customMessage?: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      customMessage || 'Hi! I am reaching out from GymFlow Fitness Center.'
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  }
}

export const leadsService = new LeadsService();
