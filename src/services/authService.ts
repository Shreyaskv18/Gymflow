import { Admin, User, Member, StaffPermissions, NavigationItem, MemberLoginCredentials, MemberAuthResult } from '../types';
import { storageService } from './storageService';
import { OWNER_PERMISSIONS, DEFAULT_STAFF_PERMISSIONS } from '../data/seedData';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  admin?: Admin;
  user?: User;
  errorMessage?: string;
}

class AuthService {
  /**
   * Authenticate credentials against staff and owner accounts
   */
  public async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Artificial slight async latency for realistic UX & loading state
    await new Promise((resolve) => setTimeout(resolve, 350));

    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    if (!email || !password) {
      return {
        success: false,
        errorMessage: 'Please provide both email and password.',
      };
    }

    const staffUsers = storageService.getStaffUsers();
    const matchedUser = staffUsers.find(
      (u) => u.email.toLowerCase() === email
    );

    if (matchedUser) {
      // Check status
      if (matchedUser.status === 'inactive') {
        return {
          success: false,
          errorMessage: 'This account has been deactivated. Please contact the gym owner.',
        };
      }

      // Check password (supports hashed/plain for demo accounts like 'admin123' / 'staff123')
      const isPasswordValid =
        matchedUser.password_hash === password ||
        matchedUser.passwordHash === password ||
        (matchedUser.role === 'owner' && password === 'admin123') ||
        (matchedUser.role === 'staff' && password === 'staff123');

      if (isPasswordValid) {
        // Update last login
        const nowIso = new Date().toISOString();
        const updatedUsers = staffUsers.map((u) =>
          u.id === matchedUser.id ? { ...u, last_login: nowIso, updated_at: nowIso } : u
        );
        storageService.saveStaffUsers(updatedUsers);

        // Effective permissions
        const effectivePermissions: StaffPermissions =
          matchedUser.role === 'owner' || matchedUser.role === 'admin'
            ? OWNER_PERMISSIONS
            : matchedUser.permissions || DEFAULT_STAFF_PERMISSIONS;

        // Create session (valid for 24 hours)
        const session = {
          userId: matchedUser.id,
          adminId: matchedUser.id,
          role: matchedUser.role,
          token: `jwt_session_${matchedUser.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          permissions: effectivePermissions,
        };
        storageService.setAuthSession(session);

        // Add audit log
        storageService.addAuditLog({
          user_id: matchedUser.id,
          user_name: matchedUser.name,
          user_role: matchedUser.role,
          action: `Logged into GymFlow Workspace`,
          module: 'auth',
          details: `Successful sign-in as ${matchedUser.role.toUpperCase()} (${matchedUser.email})`,
          ip_address: '127.0.0.1 (Local)',
        });

        const activeUser: User = {
          ...matchedUser,
          permissions: effectivePermissions,
          last_login: nowIso,
        };

        const adminObj: Admin = {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          phone: matchedUser.phone,
          role: matchedUser.role,
          status: matchedUser.status,
          permissions: effectivePermissions,
          createdAt: matchedUser.created_at || matchedUser.createdAt || new Date().toISOString(),
          last_login: nowIso,
        };

        return {
          success: true,
          user: activeUser,
          admin: adminObj,
        };
      }
    }

    // Fallback: check legacy single admin object
    const currentAdmin = storageService.getAdmin();
    if (
      currentAdmin.email.toLowerCase() === email &&
      (currentAdmin.passwordHash === password || password === 'admin123')
    ) {
      const session = {
        userId: currentAdmin.id,
        adminId: currentAdmin.id,
        role: currentAdmin.role || 'owner',
        token: `jwt_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        permissions: OWNER_PERMISSIONS,
      };
      storageService.setAuthSession(session);

      return {
        success: true,
        admin: {
          id: currentAdmin.id,
          name: currentAdmin.name,
          email: currentAdmin.email,
          phone: currentAdmin.phone,
          role: currentAdmin.role || 'owner',
          status: 'active',
          permissions: OWNER_PERMISSIONS,
          createdAt: currentAdmin.createdAt,
          last_login: new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      errorMessage: 'Invalid email or password. Please verify your credentials.',
    };
  }

  /**
   * Check if active session exists
   */
  public isAuthenticated(): boolean {
    const session = storageService.getAuthSession();
    if (!session) return false;
    if (typeof session.expiresAt === 'number' && Date.now() > session.expiresAt) {
      this.logout();
      return false;
    }
    return true;
  }

  /**
   * Get current session token
   */
  public getSessionToken(): string | null {
    const session = storageService.getAuthSession();
    return session?.token || null;
  }

  /**
   * Get current logged-in user / admin details with fresh permissions
   */
  public getCurrentAdmin(): Admin | null {
    const session = storageService.getAuthSession();
    if (!session) return null;

    // Strict Role Separation: Members can NEVER access admin or staff context
    if (session.role === 'member') {
      return null;
    }

    if (typeof session.expiresAt === 'number' && Date.now() > session.expiresAt) {
      this.logout();
      return null;
    }

    const staffUsers = storageService.getStaffUsers();
    const user = staffUsers.find((u) => u.id === session.userId || u.id === session.adminId);

    if (user) {
      if (user.status === 'inactive') {
        this.logout();
        return null;
      }

      const effectivePermissions: StaffPermissions =
        user.role === 'owner' || user.role === 'admin'
          ? OWNER_PERMISSIONS
          : user.permissions || DEFAULT_STAFF_PERMISSIONS;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        permissions: effectivePermissions,
        createdAt: user.created_at || user.createdAt || new Date().toISOString(),
        last_login: user.last_login,
      };
    }

    const admin = storageService.getAdmin();
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role || 'owner',
      status: 'active',
      permissions: OWNER_PERMISSIONS,
      createdAt: admin.createdAt,
      last_login: admin.last_login,
    };
  }

  /**
   * Check if current user has permission for a specific module action
   */
  public hasPermission(module: keyof StaffPermissions, action?: string): boolean {
    const current = this.getCurrentAdmin();
    if (!current) return false;

    // Owner and Admin have unconditional full access
    if (current.role === 'owner' || current.role === 'admin') {
      return true;
    }

    const permissions = current.permissions || DEFAULT_STAFF_PERMISSIONS;
    const modulePerms = (permissions as any)[module];

    if (!modulePerms) return false;

    if (!action) {
      // General view/access check
      return Boolean(modulePerms.view || modulePerms.access);
    }

    return Boolean(modulePerms[action]);
  }

  /**
   * Get auth header for API requests
   */
  public getAuthHeader(): Record<string, string> {
    const session = storageService.getAuthSession();
    if (session?.token) {
      return { Authorization: `Bearer ${session.token}` };
    }
    const memberSession = storageService.getMemberSession();
    if (memberSession?.token) {
      return { Authorization: `Bearer ${memberSession.token}` };
    }
    return {};
  }

  /**
   * Check if current user has navigation access to a specific tab
   */
  public hasAccessToTab(tab: NavigationItem, adminUser?: Admin | null): boolean {
    const current = adminUser !== undefined ? adminUser : this.getCurrentAdmin();
    if (!current) return false;
    if (current.role === 'owner' || current.role === 'admin') return true;

    const perms = current.permissions || DEFAULT_STAFF_PERMISSIONS;

    switch (tab) {
      case 'dashboard':
        return perms.dashboard?.view ?? true;
      case 'plans':
        return perms.plans?.view ?? true;
      case 'members':
        return perms.members?.view ?? true;
      case 'payments':
        return perms.payments?.view ?? true;
      case 'attendance':
        return perms.attendance?.view ?? true;
      case 'renewals':
        return perms.renewals?.view ?? true;
      case 'leads':
        return perms.leads?.view ?? true;
      case 'staff':
        return perms.staff?.access ?? false;
      case 'settings':
        return perms.settings?.access ?? false;
      default:
        return false;
    }
  }

  /**
   * Update admin/user profile
   */
  public async updateAdminProfile(
    name: string,
    email: string,
    phone?: string
  ): Promise<{ success: boolean; admin?: Admin; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!name.trim() || !email.trim()) {
      return { success: false, error: 'Name and email are required.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const current = this.getCurrentAdmin();
    if (!current) {
      return { success: false, error: 'No active session.' };
    }

    const staffUsers = storageService.getStaffUsers();
    // Check if email already used by someone else
    const emailConflict = staffUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== current.id
    );
    if (emailConflict) {
      return { success: false, error: 'Email is already in use by another user.' };
    }

    const updatedUsers = staffUsers.map((u) => {
      if (u.id === current.id) {
        return {
          ...u,
          name: name.trim(),
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : u.phone,
          updated_at: new Date().toISOString(),
        };
      }
      return u;
    });

    storageService.saveStaffUsers(updatedUsers);

    // Also update single admin object for legacy sync
    const currentAdmin = storageService.getAdmin();
    if (currentAdmin.id === current.id) {
      storageService.saveAdmin({
        ...currentAdmin,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : currentAdmin.phone,
      });
    }

    storageService.addAuditLog({
      user_id: current.id,
      user_name: current.name,
      user_role: current.role,
      action: `Updated profile details`,
      module: 'settings',
      details: `Changed profile name/email to ${name.trim()} (${email.trim().toLowerCase()})`,
    });

    return {
      success: true,
      admin: {
        ...current,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : current.phone,
      },
    };
  }

  /**
   * Log out safely without any recursive calls
   */
  public logout(): void {
    const session = storageService.getAuthSession();
    // Critical: remove session first to prevent cyclic calls
    storageService.setAuthSession(null);

    if (session) {
      try {
        const staffUsers = storageService.getStaffUsers();
        const user = staffUsers.find((u) => u.id === session.userId || u.id === session.adminId);
        const adminObj = storageService.getAdmin();

        const userId = user?.id || session.userId || adminObj.id || 'unknown';
        const userName = user?.name || (session.role === 'owner' ? adminObj.name || 'Vikram' : 'Staff Member');
        const userRole = user?.role || session.role || 'staff';

        storageService.addAuditLog({
          user_id: userId,
          user_name: userName,
          user_role: (userRole as any) || 'staff',
          action: `Logged out of GymFlow`,
          module: 'auth',
          details: `User session ended`,
        });
      } catch (err) {
        console.warn('Could not record logout audit log:', err);
      }
    }
  }

  // =========================================================================
  // --- MEMBER PORTAL AUTHENTICATION (STAGE 9) ---
  // =========================================================================

  /**
   * Member portal login via API with fallback to local database
   */
  public async memberLogin(credentials: MemberLoginCredentials): Promise<MemberAuthResult> {
    const identifier = credentials.identifier.trim();
    const password = credentials.password;

    if (!identifier || !password) {
      return {
        success: false,
        errorMessage: 'Please enter your registered phone or email, and password.',
      };
    }

    try {
      const response = await fetch('/api/member/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.member) {
        const member = data.member as Member;
        const token = data.token as string;

        storageService.setMemberSession({
          memberId: member.id,
          role: 'member',
          token,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          member,
        });

        return {
          success: true,
          member,
          token,
          alertMessage: data.alert_message,
        };
      } else {
        return {
          success: false,
          errorMessage: data.error || 'Authentication failed. Please verify your credentials.',
        };
      }
    } catch (apiErr) {
      console.warn('Backend API unreachable, using local database verification:', apiErr);

      // Offline / Local database fallback
      const cleanInput = identifier.toLowerCase();
      const inputDigits = identifier.replace(/\D/g, '');
      const members = storageService.getMembers();

      const matchedMember = members.find((m) => {
        if (m.email && m.email.toLowerCase() === cleanInput) return true;
        if (m.phone) {
          const memberDigits = m.phone.replace(/\D/g, '');
          if (inputDigits.length >= 10 && memberDigits.endsWith(inputDigits.slice(-10))) return true;
          if (m.phone.toLowerCase() === cleanInput) return true;
        }
        return false;
      });

      if (!matchedMember) {
        return {
          success: false,
          errorMessage: 'No active member account found with this phone number or email.',
        };
      }

      // Check account_status (independent of gym membership expiry)
      // Only an explicitly SUSPENDED login account prevents login
      if (matchedMember.account_status === 'SUSPENDED') {
        return {
          success: false,
          errorMessage: 'Your member account has been suspended by the gym owner. Please contact gym administration.',
        };
      }

      // Allow member123 or stored password
      const isValid =
        password === 'member123' ||
        matchedMember.password_hash === password ||
        (matchedMember as any).password === password;

      if (!isValid) {
        return {
          success: false,
          errorMessage: 'Incorrect password. Default demo password is "member123".',
        };
      }

      const token = `jwt_session_mem_${matchedMember.id}_${Date.now()}`;
      const memberWithDetails: Member = {
        ...matchedMember,
        portal_enabled: true,
        account_status: 'ACTIVE',
        role: 'member',
      };

      storageService.setMemberSession({
        memberId: matchedMember.id,
        role: 'member',
        token,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        member: memberWithDetails,
      });

      let alertMessage: string | undefined;
      if (matchedMember.status === 'expired') {
        alertMessage = 'Your gym membership has expired. Please renew your plan to continue accessing the gym facility.';
      } else if (matchedMember.status === 'expiring') {
        alertMessage = 'Your gym membership is expiring soon. Please renew early to avoid disruption.';
      }

      return {
        success: true,
        member: memberWithDetails,
        token,
        alertMessage,
      };
    }
  }

  /**
   * Request password reset code
   */
  public async memberForgotPassword(identifier: string): Promise<{ success: boolean; message: string; resetCode?: string; error?: string }> {
    try {
      const response = await fetch('/api/member/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message, resetCode: data.resetCode };
      }
      return { success: false, message: data.error || 'Failed to process request.', error: data.error || 'Failed to process request.' };
    } catch (err) {
      return { success: false, message: 'Server is unavailable. Please try again later.', error: 'Server is unavailable. Please try again later.' };
    }
  }

  /**
   * Reset member password using verification code
   */
  public async memberResetPassword(
    identifier: string,
    resetCode: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const response = await fetch('/api/member/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, resetCode, newPassword }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to reset password.', error: data.error || 'Failed to reset password.' };
    } catch (err) {
      return { success: false, message: 'Server is unavailable. Please try again later.', error: 'Server is unavailable. Please try again later.' };
    }
  }

  /**
   * Get current authenticated member from session
   */
  public getCurrentMember(): Member | null {
    const session = storageService.getMemberSession();
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.memberLogout();
      return null;
    }

    if (session.member) {
      return session.member;
    }

    // Refresh from stored members
    const members = storageService.getMembers();
    const found = members.find((m) => m.id === session.memberId);
    return found ? { ...found, role: 'member' } : null;
  }

  /**
   * Check if member is authenticated
   */
  public isMemberAuthenticated(): boolean {
    const session = storageService.getMemberSession();
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      this.memberLogout();
      return false;
    }
    return true;
  }

  /**
   * Get member session token
   */
  public getMemberSessionToken(): string | null {
    const session = storageService.getMemberSession();
    return session?.token || null;
  }

  /**
   * Member logout
   */
  public memberLogout(): void {
    const session = storageService.getMemberSession();
    storageService.setMemberSession(null);

    if (session) {
      try {
        storageService.addAuditLog({
          user_id: session.memberId,
          user_name: session.member?.full_name || 'Member',
          user_role: 'member',
          action: 'Logged out of Member Portal',
          module: 'auth',
          details: 'Member portal session ended',
        });
      } catch (e) {
        console.warn('Failed to record member logout log:', e);
      }
    }
  }
}

export const authService = new AuthService();
