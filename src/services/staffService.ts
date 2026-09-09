import { User, CreateStaffDTO, UpdateStaffDTO, AuditLog, StaffPermissions } from '../types';
import { storageService } from './storageService';
import { authService } from './authService';
import { DEFAULT_STAFF_PERMISSIONS, OWNER_PERMISSIONS } from '../data/seedData';

class StaffService {
  /**
   * Get all staff and admin users
   */
  public async getStaffUsers(): Promise<User[]> {
    try {
      const token = authService.getSessionToken();
      const res = await fetch('/api/staff', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          // Sync with local storage
          storageService.saveStaffUsers(data.data);
          return data.data;
        }
      }
    } catch (err) {
      console.warn('Backend API /api/staff unavailable, using local persistence:', err);
    }
    return storageService.getStaffUsers();
  }

  /**
   * Get staff user by ID
   */
  public async getStaffById(id: string): Promise<User | null> {
    const staffList = await this.getStaffUsers();
    return staffList.find((s) => s.id === id) || null;
  }

  /**
   * Create a new staff account
   */
  public async createStaff(dto: CreateStaffDTO): Promise<{ success: boolean; staff?: User; error?: string }> {
    const currentAdmin = authService.getCurrentAdmin();
    if (!currentAdmin) {
      return { success: false, error: 'Authentication required.' };
    }

    // Permission check: only owner/admin or staff with staff.access can create staff
    if (currentAdmin.role === 'staff' && !authService.hasPermission('staff', 'access')) {
      return { success: false, error: 'Permission denied: You cannot create staff accounts.' };
    }

    // Staff cannot create an admin/owner
    if (currentAdmin.role === 'staff' && dto.role && dto.role !== 'staff') {
      return { success: false, error: 'Staff users cannot create admin or owner accounts.' };
    }

    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone ? dto.phone.trim() : '';
    const password = dto.password;
    const role = dto.role || 'staff';
    const status = dto.status || 'active';

    if (!name) {
      return { success: false, error: 'Staff full name is required.' };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'A valid email address is required.' };
    }
    if (phone && phone.length < 7) {
      return { success: false, error: 'Please enter a valid contact phone number.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // Check duplicate email in storage
    const staffList = storageService.getStaffUsers();
    const emailExists = staffList.some((s) => s.email.toLowerCase() === email);
    if (emailExists) {
      return { success: false, error: `An account with email "${email}" already exists.` };
    }

    // Try API first
    try {
      const token = authService.getSessionToken();
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role,
          status,
          permissions: dto.permissions || (role === 'owner' ? OWNER_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const freshList = storageService.getStaffUsers();
          freshList.unshift(data.data);
          storageService.saveStaffUsers(freshList);
          this.logAction({
            action: `Created new staff account for ${name} (${role.toUpperCase()})`,
            module: 'staff',
            details: `Assigned email: ${email}`,
          });
          return { success: true, staff: data.data };
        }
      }
    } catch (apiErr) {
      console.warn('API POST /api/staff failed, creating locally:', apiErr);
    }

    // Local fallback creation
    const avatarColors = [
      'bg-indigo-600 text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-purple-600 text-white',
      'bg-teal-600 text-white',
      'bg-rose-600 text-white',
    ];
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    const nowIso = new Date().toISOString();

    const newStaff: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      gym_id: 'gym-01',
      name,
      full_name: name,
      email,
      phone,
      password_hash: password,
      passwordHash: password,
      role,
      status,
      permissions: (dto.permissions as StaffPermissions) || (role === 'owner' ? OWNER_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS),
      created_at: nowIso,
      updated_at: nowIso,
      createdAt: nowIso,
      avatarColor,
    };

    staffList.unshift(newStaff);
    storageService.saveStaffUsers(staffList);

    this.logAction({
      action: `Created new staff account for ${name} (${role.toUpperCase()})`,
      module: 'staff',
      details: `Assigned email: ${email}`,
    });

    return { success: true, staff: newStaff };
  }

  /**
   * Update staff account details & permissions
   */
  public async updateStaff(id: string, dto: UpdateStaffDTO): Promise<{ success: boolean; staff?: User; error?: string }> {
    const currentAdmin = authService.getCurrentAdmin();
    if (!currentAdmin) {
      return { success: false, error: 'Authentication required.' };
    }

    const staffList = storageService.getStaffUsers();
    const targetStaff = staffList.find((s) => s.id === id);
    if (!targetStaff) {
      return { success: false, error: 'Staff member not found.' };
    }

    // Security Check: Staff cannot edit Owner or change roles to Owner/Admin
    if (currentAdmin.role === 'staff') {
      if (targetStaff.role === 'owner' || targetStaff.role === 'admin') {
        return { success: false, error: 'Staff users cannot modify Owner or Admin accounts.' };
      }
      if (dto.role && dto.role !== 'staff') {
        return { success: false, error: 'Staff users cannot escalate roles to Admin or Owner.' };
      }
      if (dto.permissions && !authService.hasPermission('staff', 'access')) {
        return { success: false, error: 'Permission denied: Cannot edit staff permissions.' };
      }
    }

    // Owner account cannot be demoted or changed to staff
    if (targetStaff.role === 'owner' && dto.role && dto.role !== 'owner') {
      return { success: false, error: 'The Gym Owner role cannot be changed.' };
    }

    // Check duplicate email
    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const conflict = staffList.find((s) => s.email.toLowerCase() === email && s.id !== id);
      if (conflict) {
        return { success: false, error: `Email "${email}" is already used by another account.` };
      }
    }

    // Try API
    try {
      const token = authService.getSessionToken();
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(dto),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const updatedList = staffList.map((s) => (s.id === id ? data.data : s));
          storageService.saveStaffUsers(updatedList);
          this.logAction({
            action: `Updated details for staff ${targetStaff.name}`,
            module: 'staff',
            details: `Modified staff account attributes/permissions.`,
          });
          return { success: true, staff: data.data };
        }
      }
    } catch (apiErr) {
      console.warn(`API PUT /api/staff/${id} failed, updating locally:`, apiErr);
    }

    // Local update fallback
    const nowIso = new Date().toISOString();
    const updatedStaff: User = {
      ...targetStaff,
      name: dto.name ? dto.name.trim() : targetStaff.name,
      full_name: dto.name ? dto.name.trim() : targetStaff.name,
      email: dto.email ? dto.email.trim().toLowerCase() : targetStaff.email,
      phone: dto.phone !== undefined ? dto.phone.trim() : targetStaff.phone,
      role: dto.role || targetStaff.role,
      status: dto.status || targetStaff.status,
      permissions: dto.permissions || targetStaff.permissions,
      updated_at: nowIso,
    };

    if (dto.password && dto.password.length >= 6) {
      updatedStaff.password_hash = dto.password;
      updatedStaff.passwordHash = dto.password;
    }

    const updatedList = staffList.map((s) => (s.id === id ? updatedStaff : s));
    storageService.saveStaffUsers(updatedList);

    this.logAction({
      action: `Updated details for staff ${targetStaff.name}`,
      module: 'staff',
      details: `Modified staff profile/permissions.`,
    });

    return { success: true, staff: updatedStaff };
  }

  /**
   * Toggle staff active/inactive status
   */
  public async toggleStaffStatus(id: string): Promise<{ success: boolean; staff?: User; error?: string }> {
    const currentAdmin = authService.getCurrentAdmin();
    if (!currentAdmin) {
      return { success: false, error: 'Authentication required.' };
    }

    const staffList = storageService.getStaffUsers();
    const target = staffList.find((s) => s.id === id);
    if (!target) {
      return { success: false, error: 'Staff account not found.' };
    }

    if (target.role === 'owner') {
      return { success: false, error: 'The Gym Owner account cannot be deactivated.' };
    }

    if (currentAdmin.role === 'staff' && !authService.hasPermission('staff', 'access')) {
      return { success: false, error: 'Permission denied: Cannot change staff status.' };
    }

    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    return this.updateStaff(id, { status: newStatus });
  }

  /**
   * Reset staff password
   */
  public async resetStaffPassword(id: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const currentAdmin = authService.getCurrentAdmin();
    if (!currentAdmin) {
      return { success: false, error: 'Authentication required.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const staffList = storageService.getStaffUsers();
    const target = staffList.find((s) => s.id === id);
    if (!target) {
      return { success: false, error: 'Staff account not found.' };
    }

    if (currentAdmin.role === 'staff' && currentAdmin.id !== id && !authService.hasPermission('staff', 'access')) {
      return { success: false, error: 'Permission denied: Cannot reset password for this user.' };
    }

    // Try API
    try {
      const token = authService.getSessionToken();
      const res = await fetch(`/api/staff/${id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.logAction({
            action: `Reset password for staff ${target.name}`,
            module: 'staff',
            details: `Password securely reset by ${currentAdmin.name}`,
          });
          return { success: true };
        }
      }
    } catch (err) {
      console.warn('API reset-password failed, executing locally:', err);
    }

    const nowIso = new Date().toISOString();
    const updatedList = staffList.map((s) =>
      s.id === id
        ? { ...s, password_hash: newPassword, passwordHash: newPassword, updated_at: nowIso }
        : s
    );
    storageService.saveStaffUsers(updatedList);

    this.logAction({
      action: `Reset password for staff ${target.name}`,
      module: 'staff',
      details: `Password securely reset by ${currentAdmin.name}`,
    });

    return { success: true };
  }

  /**
   * Delete staff user
   */
  public async deleteStaff(id: string): Promise<{ success: boolean; error?: string }> {
    const currentAdmin = authService.getCurrentAdmin();
    if (!currentAdmin) {
      return { success: false, error: 'Authentication required.' };
    }

    const staffList = storageService.getStaffUsers();
    const target = staffList.find((s) => s.id === id);
    if (!target) {
      return { success: false, error: 'Staff account not found.' };
    }

    if (target.role === 'owner') {
      return { success: false, error: 'The Gym Owner account cannot be deleted.' };
    }

    if (currentAdmin.id === id) {
      return { success: false, error: 'You cannot delete your own logged-in account.' };
    }

    if (currentAdmin.role === 'staff' && !authService.hasPermission('staff', 'access')) {
      return { success: false, error: 'Permission denied: Cannot delete staff.' };
    }

    // Try API
    try {
      const token = authService.getSessionToken();
      const res = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const filtered = staffList.filter((s) => s.id !== id);
          storageService.saveStaffUsers(filtered);
          this.logAction({
            action: `Deleted staff account for ${target.name}`,
            module: 'staff',
            details: `Account ${target.email} permanently removed.`,
          });
          return { success: true };
        }
      }
    } catch (err) {
      console.warn('API DELETE /api/staff failed, executing locally:', err);
    }

    const filtered = staffList.filter((s) => s.id !== id);
    storageService.saveStaffUsers(filtered);

    this.logAction({
      action: `Deleted staff account for ${target.name}`,
      module: 'staff',
      details: `Account ${target.email} permanently removed.`,
    });

    return { success: true };
  }

  /**
   * Retrieve system audit logs
   */
  public async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const token = authService.getSessionToken();
      const res = await fetch('/api/audit-logs', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          storageService.saveAuditLogs(data.data);
          return data.data;
        }
      }
    } catch (err) {
      console.warn('API /api/audit-logs unavailable, using local logs:', err);
    }
    return storageService.getAuditLogs();
  }

  /**
   * Log an action to audit log
   */
  public logAction(log: {
    action: string;
    module: 'auth' | 'members' | 'payments' | 'attendance' | 'renewals' | 'plans' | 'staff' | 'settings' | 'system';
    details?: string;
  }): void {
    const current = authService.getCurrentAdmin();
    if (!current) return;

    storageService.addAuditLog({
      user_id: current.id,
      user_name: current.name,
      user_role: current.role,
      action: log.action,
      module: log.module,
      details: log.details || '',
      ip_address: '127.0.0.1 (Local)',
    });
  }
}

export const staffService = new StaffService();
