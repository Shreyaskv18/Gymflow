import { Admin, Gym, Member, Payment, Attendance, Activity, MembershipPlan, User, AuditLog, Lead, AIReceptionistSettings } from '../types';
import {
  INITIAL_ADMIN,
  INITIAL_GYM,
  INITIAL_MEMBERS,
  INITIAL_PAYMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_ACTIVITIES,
  INITIAL_MEMBERSHIP_PLANS,
  INITIAL_STAFF_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_LEADS,
  DEFAULT_AI_RECEPTIONIST_SETTINGS,
} from '../data/seedData';

const STORAGE_KEYS = {
  GYM: 'gymflow_gym',
  ADMIN: 'gymflow_admin',
  MEMBERS: 'gymflow_members',
  PAYMENTS: 'gymflow_payments',
  ATTENDANCE: 'gymflow_attendance',
  ACTIVITIES: 'gymflow_activities',
  MEMBERSHIP_PLANS: 'gymflow_membership_plans',
  STAFF: 'gymflow_staff',
  AUDIT_LOGS: 'gymflow_audit_logs',
  LEADS: 'gymflow_leads',
  RECEPTIONIST_SETTINGS: 'gymflow_receptionist_settings',
  AUTH_SESSION: 'gymflow_auth_session',
  MEMBER_SESSION: 'gymflow_member_session',
  INITIALIZED_FLAG: 'gymflow_v5_leads_initialized',
};

class StorageService {
  constructor() {
    this.ensureInitialized();
  }

  public ensureInitialized(forceReset = false): void {
    try {
      const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED_FLAG);
      if (!isInitialized || forceReset) {
        localStorage.setItem(STORAGE_KEYS.GYM, JSON.stringify(INITIAL_GYM));
        localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(INITIAL_ADMIN));
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
        localStorage.setItem(STORAGE_KEYS.MEMBERSHIP_PLANS, JSON.stringify(INITIAL_MEMBERSHIP_PLANS));
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF_USERS));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
        localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(INITIAL_LEADS));
        localStorage.setItem(STORAGE_KEYS.RECEPTIONIST_SETTINGS, JSON.stringify(DEFAULT_AI_RECEPTIONIST_SETTINGS));
        localStorage.setItem(STORAGE_KEYS.INITIALIZED_FLAG, 'true');
      } else {
        // Ensure leads key exists
        if (!localStorage.getItem(STORAGE_KEYS.LEADS)) {
          localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(INITIAL_LEADS));
        }

        // Ensure receptionist settings key exists
        if (!localStorage.getItem(STORAGE_KEYS.RECEPTIONIST_SETTINGS)) {
          localStorage.setItem(STORAGE_KEYS.RECEPTIONIST_SETTINGS, JSON.stringify(DEFAULT_AI_RECEPTIONIST_SETTINGS));
        }

        // Ensure staff key exists even if older initialized flag was set
        if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
          localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF_USERS));
        }

        // Ensure audit logs key exists
        if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
          localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
        }

        // Ensure membership plans key exists even if older v1 initialized flag was set
        if (!localStorage.getItem(STORAGE_KEYS.MEMBERSHIP_PLANS)) {
          localStorage.setItem(STORAGE_KEYS.MEMBERSHIP_PLANS, JSON.stringify(INITIAL_MEMBERSHIP_PLANS));
        }

        // Ensure payments key exists and has modern schema
        try {
          const paymentsStr = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
          if (!paymentsStr || JSON.parse(paymentsStr).length < 10) {
            localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
          } else {
            const payments = JSON.parse(paymentsStr) as Payment[];
            const updatedPayments = payments.map((p, idx) => {
              if (!p.member_id || !p.payment_status) {
                const seedMatch = INITIAL_PAYMENTS.find((sp) => sp.id === p.id) || INITIAL_PAYMENTS[idx % INITIAL_PAYMENTS.length];
                return {
                  ...seedMatch,
                  ...p,
                  member_id: p.member_id || p.memberId || seedMatch.member_id,
                  membership_plan_id: p.membership_plan_id || seedMatch.membership_plan_id,
                  payment_status: p.payment_status || (p.status === 'completed' ? 'Paid' : 'Paid'),
                  payment_date: p.payment_date || p.paymentDate || seedMatch.payment_date,
                  payment_method: p.payment_method || (p.paymentMethod as any) || seedMatch.payment_method,
                };
              }
              return p;
            });
            localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updatedPayments));
          }
        } catch (paymentErr) {
          console.warn('Payment migration skipped:', paymentErr);
        }

        // Ensure attendance key exists and has modern schema
        try {
          const attendanceStr = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
          if (!attendanceStr || JSON.parse(attendanceStr).length === 0) {
            localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
          } else {
            const rawAtt = JSON.parse(attendanceStr) as Attendance[];
            let needsAttUpdate = false;
            const updatedAtt = rawAtt.map((a) => {
              if (!a.status) {
                needsAttUpdate = true;
                const status = a.checkOutTime ? 'checked_out' : 'checked_in';
                return {
                  ...a,
                  status,
                  createdAt: a.createdAt || `${a.date}T08:00:00.000Z`,
                  updatedAt: a.updatedAt || `${a.date}T08:00:00.000Z`,
                };
              }
              return a;
            });
            if (needsAttUpdate) {
              localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updatedAtt));
            }
          }
        } catch (attErr) {
          console.warn('Attendance migration check skipped:', attErr);
        }

        // Migrate members if legacy members missing membership_plan_id
        try {
          const membersStr = localStorage.getItem(STORAGE_KEYS.MEMBERS);
          if (membersStr) {
            const members = JSON.parse(membersStr) as Member[];
            let needsUpdate = false;
            const updated = members.map((m, idx) => {
              let updatedMember = { ...m };
              if (!m.membership_plan_id || !m.full_name) {
                needsUpdate = true;
                const seedMatch = INITIAL_MEMBERS.find((sm) => sm.id === m.id) || INITIAL_MEMBERS[idx % INITIAL_MEMBERS.length];
                updatedMember = {
                  ...updatedMember,
                  full_name: m.full_name || m.name || seedMatch.full_name,
                  name: m.name || m.full_name || seedMatch.full_name,
                  membership_plan_id: m.membership_plan_id || seedMatch.membership_plan_id || 'plan-01',
                  membership_start_date: m.membership_start_date || m.membershipStartDate || seedMatch.membership_start_date,
                  membership_end_date: m.membership_end_date || m.membershipEndDate || seedMatch.membership_end_date,
                  created_at: m.created_at || m.createdAt || seedMatch.created_at,
                  status: m.status || seedMatch.status,
                  gender: m.gender || seedMatch.gender,
                  date_of_birth: m.date_of_birth || seedMatch.date_of_birth,
                  address: m.address || seedMatch.address,
                  emergency_contact_name: m.emergency_contact_name || seedMatch.emergency_contact_name,
                  emergency_contact_phone: m.emergency_contact_phone || seedMatch.emergency_contact_phone,
                };
              }

              // Ensure portal access fields are populated
              if (updatedMember.portal_enabled === undefined) {
                needsUpdate = true;
                updatedMember.portal_enabled = true;
              }
              if (!updatedMember.account_status) {
                needsUpdate = true;
                updatedMember.account_status = 'ACTIVE';
              }

              return updatedMember;
            });

            if (needsUpdate) {
              localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
            }
          }
        } catch (memberMigrateErr) {
          console.warn('Member migration check skipped:', memberMigrateErr);
        }

        // Migrate gym identity if previous seed contained old FitPulse / Gold Gym references
        try {
          const gymStr = localStorage.getItem(STORAGE_KEYS.GYM);
          if (gymStr) {
            const currentGym = JSON.parse(gymStr) as Gym;
            if (
              !currentGym.name ||
              currentGym.name.includes('FitPulse') ||
              currentGym.name === 'Gold Gym Mumbai'
            ) {
              const updatedGym: Gym = {
                ...currentGym,
                name: INITIAL_GYM.name,
                address: INITIAL_GYM.address,
                phone: INITIAL_GYM.phone,
                email: INITIAL_GYM.email,
              };
              localStorage.setItem(STORAGE_KEYS.GYM, JSON.stringify(updatedGym));
            }
          }

          const adminStr = localStorage.getItem(STORAGE_KEYS.ADMIN);
          if (adminStr) {
            const currentAdmin = JSON.parse(adminStr) as Admin;
            if (
              currentAdmin.email === 'admin@gymflow.io' ||
              currentAdmin.email === 'admin@fitpulse.in' ||
              currentAdmin.name === 'Vikram Malhotra' ||
              currentAdmin.name === 'Amit Singh'
            ) {
              const updatedAdmin: Admin = {
                ...currentAdmin,
                name: INITIAL_ADMIN.name,
                email: INITIAL_ADMIN.email,
              };
              localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(updatedAdmin));
            }
          }
        } catch (migrationErr) {
          console.warn('Gym identity migration check skipped:', migrationErr);
        }
      }
    } catch (e) {
      console.warn('StorageService: Failed to access localStorage, falling back to memory state', e);
    }
  }

  // Generic getter
  public getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (e) {
      console.error(`Error reading key ${key} from storage:`, e);
      return defaultValue;
    }
  }

  // Generic setter
  public setItem<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error saving key ${key} to storage:`, e);
      return false;
    }
  }

  // Specific entity accessors
  public getGym(): Gym {
    return this.getItem<Gym>(STORAGE_KEYS.GYM, INITIAL_GYM);
  }

  public saveGym(gym: Gym): boolean {
    return this.setItem<Gym>(STORAGE_KEYS.GYM, gym);
  }

  public getAdmin(): Admin {
    return this.getItem<Admin>(STORAGE_KEYS.ADMIN, INITIAL_ADMIN);
  }

  public saveAdmin(admin: Admin): boolean {
    return this.setItem<Admin>(STORAGE_KEYS.ADMIN, admin);
  }

  public getMembers(): Member[] {
    return this.getItem<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  }

  public saveMembers(members: Member[]): boolean {
    return this.setItem<Member[]>(STORAGE_KEYS.MEMBERS, members);
  }

  public getPayments(): Payment[] {
    return this.getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  }

  public savePayments(payments: Payment[]): boolean {
    return this.setItem<Payment[]>(STORAGE_KEYS.PAYMENTS, payments);
  }

  public getAttendance(): Attendance[] {
    return this.getItem<Attendance[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }

  public saveAttendance(attendance: Attendance[]): boolean {
    return this.setItem<Attendance[]>(STORAGE_KEYS.ATTENDANCE, attendance);
  }

  public getActivities(): Activity[] {
    return this.getItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
  }

  public saveActivities(activities: Activity[]): boolean {
    return this.setItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, activities);
  }

  public getMembershipPlans(): MembershipPlan[] {
    return this.getItem<MembershipPlan[]>(STORAGE_KEYS.MEMBERSHIP_PLANS, INITIAL_MEMBERSHIP_PLANS);
  }

  public getPlans(): MembershipPlan[] {
    return this.getMembershipPlans();
  }

  public saveMembershipPlans(plans: MembershipPlan[]): boolean {
    return this.setItem<MembershipPlan[]>(STORAGE_KEYS.MEMBERSHIP_PLANS, plans);
  }

  public savePlans(plans: MembershipPlan[]): boolean {
    return this.saveMembershipPlans(plans);
  }

  // Staff Management
  public getStaffUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF_USERS);
  }

  public saveStaffUsers(staff: User[]): boolean {
    return this.setItem<User[]>(STORAGE_KEYS.STAFF, staff);
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  public saveAuditLogs(logs: AuditLog[]): boolean {
    return this.setItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'> & { created_at?: string }): AuditLog {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: log.user_id,
      user_name: log.user_name,
      user_role: log.user_role,
      action: log.action,
      module: log.module,
      details: log.details || '',
      ip_address: log.ip_address || '127.0.0.1 (Local)',
      created_at: log.created_at || new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.saveAuditLogs(logs);
    return newLog;
  }

  // Staff / Admin Session
  public getAuthSession(): { userId: string; adminId?: string; role: string; token: string; expiresAt: number; permissions?: any } | null {
    return this.getItem(STORAGE_KEYS.AUTH_SESSION, null);
  }

  public setAuthSession(session: { userId: string; adminId?: string; role: string; token: string; expiresAt: number; permissions?: any } | null): void {
    if (session) {
      this.setItem(STORAGE_KEYS.AUTH_SESSION, session);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  }

  // Member Portal Session
  public getMemberSession(): { memberId: string; role: 'member'; token: string; expiresAt: number; member?: Member } | null {
    return this.getItem(STORAGE_KEYS.MEMBER_SESSION, null);
  }

  public setMemberSession(session: { memberId: string; role: 'member'; token: string; expiresAt: number; member?: Member } | null): void {
    if (session) {
      this.setItem(STORAGE_KEYS.MEMBER_SESSION, session);
    } else {
      localStorage.removeItem(STORAGE_KEYS.MEMBER_SESSION);
    }
  }

  // Leads Management (Stage 10)
  public getLeads(): Lead[] {
    return this.getItem<Lead[]>(STORAGE_KEYS.LEADS, INITIAL_LEADS);
  }

  public saveLeads(leads: Lead[]): boolean {
    return this.setItem<Lead[]>(STORAGE_KEYS.LEADS, leads);
  }

  public addLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }): Lead {
    const leads = this.getLeads();
    const now = new Date().toISOString();
    const newLead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      gym_id: lead.gym_id || 'gym-01',
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      interested_plan_id: lead.interested_plan_id,
      interested_plan_name: lead.interested_plan_name,
      source: lead.source || 'AI_RECEPTIONIST',
      message: lead.message || '',
      status: lead.status || 'NEW',
      trial_date: lead.trial_date,
      trial_time: lead.trial_time,
      notes: lead.notes || '',
      created_at: lead.created_at || now,
      updated_at: lead.updated_at || now,
    };
    leads.unshift(newLead);
    this.saveLeads(leads);
    return newLead;
  }

  public updateLead(id: string, updates: Partial<Lead>): Lead | null {
    const leads = this.getLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const updated: Lead = {
      ...leads[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    leads[index] = updated;
    this.saveLeads(leads);
    return updated;
  }

  public deleteLead(id: string): boolean {
    const leads = this.getLeads();
    const filtered = leads.filter((l) => l.id !== id);
    if (filtered.length === leads.length) return false;
    return this.saveLeads(filtered);
  }

  // AI Receptionist Settings (Stage 10)
  public getReceptionistSettings(): AIReceptionistSettings {
    return this.getItem<AIReceptionistSettings>(STORAGE_KEYS.RECEPTIONIST_SETTINGS, DEFAULT_AI_RECEPTIONIST_SETTINGS);
  }

  public saveReceptionistSettings(settings: AIReceptionistSettings): boolean {
    return this.setItem<AIReceptionistSettings>(STORAGE_KEYS.RECEPTIONIST_SETTINGS, settings);
  }

  public resetToSeedData(): void {
    this.ensureInitialized(true);
  }
}

export const storageService = new StorageService();

