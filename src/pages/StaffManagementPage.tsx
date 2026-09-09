import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  Trash2,
  Edit,
  Shield,
  Activity,
  Filter,
  Check,
  AlertTriangle,
  RefreshCw,
  X,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  User as UserIcon,
  Sparkles,
  Info
} from 'lucide-react';
import { User, CreateStaffDTO, UpdateStaffDTO, AuditLog, StaffPermissions, UserRole, UserStatus } from '../types';
import { staffService } from '../services/staffService';
import { authService } from '../services/authService';
import { OWNER_PERMISSIONS, DEFAULT_STAFF_PERMISSIONS } from '../data/seedData';

type ActiveTab = 'staff_list' | 'permissions_matrix' | 'audit_logs';

export const StaffManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('staff_list');
  const [staffList, setStaffList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [auditModuleFilter, setAuditModuleFilter] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('staff');
  const [formStatus, setFormStatus] = useState<UserStatus>('active');
  const [formPermissions, setFormPermissions] = useState<StaffPermissions>(DEFAULT_STAFF_PERMISSIONS);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const currentUser = authService.getCurrentAdmin();
  const isOwnerOrAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  const canManageStaff = isOwnerOrAdmin || authService.hasPermission('staff', 'access');

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffData, logData] = await Promise.all([
        staffService.getStaffUsers(),
        staffService.getAuditLogs(),
      ]);
      setStaffList(staffData);
      setAuditLogs(logData);
    } catch (err) {
      console.error('Error fetching staff data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stats calculation
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.status === 'active').length;
  const inactiveStaff = staffList.filter((s) => s.status === 'inactive').length;
  const staffRoleCount = staffList.filter((s) => s.role === 'staff').length;

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const matchesSearch =
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.phone && staff.phone.includes(searchQuery));
      const matchesRole = roleFilter === 'all' || staff.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchQuery, roleFilter, statusFilter]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesModule = auditModuleFilter === 'all' || log.module === auditModuleFilter;
      const matchesSearch =
        log.user_name.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(auditSearchQuery.toLowerCase()));
      return matchesModule && matchesSearch;
    });
  }, [auditLogs, auditModuleFilter, auditSearchQuery]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormRole('staff');
    setFormStatus('active');
    setFormPermissions(JSON.parse(JSON.stringify(DEFAULT_STAFF_PERMISSIONS)));
    setFormError(null);
    setFormSuccess(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (staff: User) => {
    setSelectedStaff(staff);
    setFormName(staff.name);
    setFormEmail(staff.email);
    setFormPhone(staff.phone || '');
    setFormPassword('');
    setFormRole(staff.role);
    setFormStatus(staff.status);
    setFormPermissions(
      staff.permissions ? JSON.parse(JSON.stringify(staff.permissions)) : JSON.parse(JSON.stringify(DEFAULT_STAFF_PERMISSIONS))
    );
    setFormError(null);
    setFormSuccess(null);
    setIsEditModalOpen(true);
  };

  // Open Password Modal
  const handleOpenPasswordModal = (staff: User) => {
    setSelectedStaff(staff);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setIsPasswordModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (staff: User) => {
    setSelectedStaff(staff);
    setIsDeleteModalOpen(true);
  };

  // Handle Preset Selection
  const applyPreset = (preset: 'owner' | 'default_staff' | 'front_desk' | 'trainer') => {
    if (preset === 'owner') {
      setFormPermissions(JSON.parse(JSON.stringify(OWNER_PERMISSIONS)));
    } else if (preset === 'default_staff') {
      setFormPermissions(JSON.parse(JSON.stringify(DEFAULT_STAFF_PERMISSIONS)));
    } else if (preset === 'front_desk') {
      setFormPermissions({
        dashboard: { view: true },
        members: { view: true, add: true, edit: true, delete: false },
        payments: { view: true, add: true, edit: false, delete: false },
        attendance: { view: true, mark: true, delete: false },
        renewals: { view: true, sendReminder: true, renew: true },
        plans: { view: true, create: false, edit: false, delete: false },
        settings: { access: false },
        staff: { access: false, managePermissions: false },
        auditLog: { view: false },
      });
    } else if (preset === 'trainer') {
      setFormPermissions({
        dashboard: { view: true },
        members: { view: true, add: false, edit: false, delete: false },
        payments: { view: false, add: false, edit: false, delete: false },
        attendance: { view: true, mark: true, delete: false },
        renewals: { view: false, sendReminder: false, renew: false },
        plans: { view: true, create: false, edit: false, delete: false },
        settings: { access: false },
        staff: { access: false, managePermissions: false },
        auditLog: { view: false },
      });
    }
  };

  // Handle Add Submit
  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formName.trim()) {
      setFormError('Please enter the full name.');
      return;
    }
    if (!formEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      setFormError('Please provide a valid email address.');
      return;
    }
    if (!formPassword || formPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dto: CreateStaffDTO = {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        password: formPassword,
        role: formRole,
        status: formStatus,
        permissions: formRole === 'owner' ? OWNER_PERMISSIONS : formPermissions,
      };

      const result = await staffService.createStaff(dto);
      if (result.success && result.staff) {
        setFormSuccess(`Staff account for ${result.staff.name} created!`);
        await loadData();
        setTimeout(() => {
          setIsAddModalOpen(false);
        }, 600);
      } else {
        setFormError(result.error || 'Failed to create staff account.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleUpdateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!formEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      setFormError('Valid email address is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dto: UpdateStaffDTO = {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        role: formRole,
        status: formStatus,
        permissions: formRole === 'owner' ? OWNER_PERMISSIONS : formPermissions,
      };

      if (formPassword && formPassword.length >= 6) {
        dto.password = formPassword;
      }

      const result = await staffService.updateStaff(selectedStaff.id, dto);
      if (result.success && result.staff) {
        setFormSuccess(`Staff member ${result.staff.name} updated!`);
        await loadData();
        setTimeout(() => {
          setIsEditModalOpen(false);
        }, 600);
      } else {
        setFormError(result.error || 'Failed to update staff account.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Toggle
  const handleToggleStatus = async (staff: User) => {
    if (staff.role === 'owner') {
      alert('The Gym Owner account cannot be deactivated.');
      return;
    }
    try {
      const res = await staffService.toggleStaffStatus(staff.id);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || 'Failed to update status.');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  // Handle Password Reset Submit
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setPasswordError(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await staffService.resetStaffPassword(selectedStaff.id, newPassword);
      if (res.success) {
        await loadData();
        setIsPasswordModalOpen(false);
      } else {
        setPasswordError(res.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Password reset failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!selectedStaff) return;
    if (selectedStaff.role === 'owner') {
      alert('The Gym Owner account cannot be deleted.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await staffService.deleteStaff(selectedStaff.id);
      if (res.success) {
        await loadData();
        setIsDeleteModalOpen(false);
      } else {
        alert(res.error || 'Failed to delete staff member.');
      }
    } catch (err) {
      console.error('Error deleting staff:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to toggle a specific nested permission
  const updatePermission = (moduleKey: keyof StaffPermissions, actionKey: string, value: boolean) => {
    setFormPermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] as any),
        [actionKey]: value,
      },
    }));
  };

  return (
    <div id="staff-management-page" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Staff & Role Management
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider">
              RBAC Enabled
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage gym team members, assign granular module permissions, and inspect system audit logs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            id="refresh-staff-btn"
            onClick={loadData}
            title="Refresh Data"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {canManageStaff && (
            <button
              id="add-staff-modal-button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Accounts</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalStaff}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Admin & Staff Users</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Staff</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{activeStaff}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Ready for login</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inactive</span>
            <XCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{inactiveStaff}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Access disabled</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Staff Role</span>
            <Shield className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{staffRoleCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Limited permissions</p>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          id="tab-staff-list"
          onClick={() => setActiveTab('staff_list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'staff_list'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Members ({staffList.length})</span>
        </button>

        <button
          id="tab-permissions-matrix"
          onClick={() => setActiveTab('permissions_matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'permissions_matrix'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Permissions Matrix</span>
        </button>

        <button
          id="tab-audit-logs"
          onClick={() => setActiveTab('audit_logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'audit_logs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: STAFF LIST */}
      {activeTab === 'staff_list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-staff-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, email, or phone..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2.5">
              {/* Role filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 hidden sm:inline">Role:</span>
                <select
                  id="filter-role-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Roles</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 hidden sm:inline">Status:</span>
                <select
                  id="filter-status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Staff Table / Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            {/* Desktop Table (md and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Staff Member</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Key Access</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Last Login</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-semibold">No staff members found.</p>
                        <p className="text-xs text-slate-500 mt-0.5">Try adjusting your search or filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => {
                      const isOwner = staff.role === 'owner';
                      const isCurrentUser = currentUser?.id === staff.id;

                      const roleBadge = isOwner ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 uppercase tracking-wider">
                          <Shield className="w-3 h-3" /> Owner
                        </span>
                      ) : staff.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 uppercase tracking-wider">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 uppercase tracking-wider">
                          <Users className="w-3 h-3" /> Staff
                        </span>
                      );

                      const statusBadge =
                        staff.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                          </span>
                        );

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Name & Avatar */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                                  staff.avatarColor || 'bg-indigo-600 text-white'
                                }`}
                              >
                                {staff.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                                    {staff.name}
                                  </span>
                                  {isCurrentUser && (
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-medium">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{staff.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-4 px-4 text-xs text-slate-600 dark:text-slate-300 font-mono">
                            {staff.phone || '—'}
                          </td>

                          {/* Role */}
                          <td className="py-4 px-4">{roleBadge}</td>

                          {/* Status */}
                          <td className="py-4 px-4">{statusBadge}</td>

                          {/* Key Access Permissions pill overview */}
                          <td className="py-4 px-4 hidden md:table-cell">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {isOwner ? (
                                <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded">
                                  Full Master Access
                                </span>
                              ) : (
                                <>
                                  {staff.permissions?.members?.view && (
                                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                                      Members
                                    </span>
                                  )}
                                  {staff.permissions?.payments?.add && (
                                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                                      Payments
                                    </span>
                                  )}
                                  {staff.permissions?.attendance?.mark && (
                                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                                      Attendance
                                    </span>
                                  )}
                                  {staff.permissions?.renewals?.sendReminder && (
                                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                                      Renewals
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>

                          {/* Last Login */}
                          <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                            {staff.last_login
                              ? new Date(staff.last_login).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Never'}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit details & permissions */}
                              <button
                                id={`edit-staff-${staff.id}`}
                                onClick={() => handleOpenEditModal(staff)}
                                title="Edit profile & permissions"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle active / inactive status (disabled for Owner) */}
                              {!isOwner && (
                                <button
                                  id={`toggle-status-${staff.id}`}
                                  onClick={() => handleToggleStatus(staff)}
                                  title={staff.status === 'active' ? 'Deactivate account' : 'Activate account'}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    staff.status === 'active'
                                      ? 'border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600'
                                      : 'border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600'
                                  }`}
                                >
                                  {staff.status === 'active' ? (
                                    <XCircle className="w-3.5 h-3.5" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}

                              {/* Reset password modal */}
                              <button
                                id={`reset-pwd-${staff.id}`}
                                onClick={() => handleOpenPasswordModal(staff)}
                                title="Reset password"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete staff account (disabled for Owner & self) */}
                              {!isOwner && !isCurrentUser && isOwnerOrAdmin && (
                                <button
                                  id={`delete-staff-${staff.id}`}
                                  onClick={() => handleOpenDeleteModal(staff)}
                                  title="Delete staff account"
                                  className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< md screens) */}
            <div id="staff-mobile-card-list" className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60 p-3 space-y-3">
              {filteredStaff.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-semibold text-sm">No staff members found.</p>
                  <p className="text-xs text-slate-500 mt-0.5">Try adjusting your search or filters.</p>
                </div>
              ) : (
                filteredStaff.map((staff) => {
                  const isOwner = staff.role === 'owner';
                  const isCurrentUser = currentUser?.id === staff.id;

                  return (
                    <div
                      key={staff.id}
                      id={`staff-card-mobile-${staff.id}`}
                      className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3"
                    >
                      {/* Card Header: Avatar, Name, Role Badge, Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              staff.avatarColor || 'bg-indigo-600 text-white'
                            }`}
                          >
                            {staff.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                {staff.name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{staff.email}</p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {staff.status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Row: Contact & Role */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Role</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                            {staff.role}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Phone</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">
                            {staff.phone || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons with minimum 44px touch targets */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          id={`btn-mobile-edit-staff-${staff.id}`}
                          onClick={() => handleOpenEditModal(staff)}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {!isOwner && (
                          <button
                            type="button"
                            id={`btn-mobile-toggle-staff-${staff.id}`}
                            onClick={() => handleToggleStatus(staff)}
                            className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              staff.status === 'active'
                                ? 'border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600'
                                : 'border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600'
                            }`}
                          >
                            {staff.status === 'active' ? (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          id={`btn-mobile-pwd-staff-${staff.id}`}
                          onClick={() => handleOpenPasswordModal(staff)}
                          className="min-h-[40px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {!isOwner && !isCurrentUser && isOwnerOrAdmin && (
                          <button
                            type="button"
                            id={`btn-mobile-del-staff-${staff.id}`}
                            onClick={() => handleOpenDeleteModal(staff)}
                            className="min-h-[40px] p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                            title="Delete Staff Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERMISSIONS MATRIX */}
      {activeTab === 'permissions_matrix' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Role Permission Matrix</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Standard privilege breakdown between Owner/Admin and Staff roles across all modules.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-y border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">System Module & Capability</th>
                  <th className="py-3 px-4 text-center">Owner (Full)</th>
                  <th className="py-3 px-4 text-center">Administrator</th>
                  <th className="py-3 px-4 text-center">Default Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Dashboard */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    Dashboard Overview & Revenue Metrics
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>

                {/* Membership Plans */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    Membership Plans (View / Select)
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 pl-8 text-xs text-slate-600 dark:text-slate-400">
                    Create, Edit, Delete Membership Pricing Plans
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-rose-500"><X className="w-4 h-4 mx-auto stroke-[2.5]" /></td>
                </tr>

                {/* Members */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    Members (View Directory, Profile & History)
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 pl-8 text-xs text-slate-600 dark:text-slate-400">
                    Add New Members & Edit Member Profiles
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 pl-8 text-xs text-slate-600 dark:text-slate-400">
                    Delete Member Records
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-rose-500"><X className="w-4 h-4 mx-auto stroke-[2.5]" /></td>
                </tr>

                {/* Payments */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    Payments (View Ledger & Record Payments)
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>

                {/* Attendance */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    Attendance (Scan & Record Check-in)
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>

                {/* Renewals */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    Renewals (Track Expirations, WhatsApp Reminders, Process Renewal)
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                </tr>

                {/* Staff Management */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    Staff & Role Management (Create/Edit/Delete Staff Accounts)
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-rose-500"><X className="w-4 h-4 mx-auto stroke-[2.5]" /></td>
                </tr>

                {/* Settings */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    Gym Settings & System Configuration
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-emerald-500"><Check className="w-4 h-4 mx-auto stroke-[3]" /></td>
                  <td className="py-3 px-4 text-center text-rose-500"><X className="w-4 h-4 mx-auto stroke-[2.5]" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-4">
          {/* Audit Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-audit-input"
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Search audit actions, staff names, or details..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 hidden sm:inline">Module:</span>
                <select
                  id="filter-audit-module-select"
                  value={auditModuleFilter}
                  onChange={(e) => setAuditModuleFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Modules</option>
                  <option value="auth">Auth / Login</option>
                  <option value="staff">Staff Management</option>
                  <option value="members">Members</option>
                  <option value="payments">Payments</option>
                  <option value="attendance">Attendance</option>
                  <option value="renewals">Renewals</option>
                  <option value="plans">Plans</option>
                  <option value="settings">Settings</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Module</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4 sm:px-6">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Activity className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-semibold">No audit logs matching current filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>

                        {/* User */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {log.user_name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {log.user_role}
                            </span>
                          </div>
                        </td>

                        {/* Module */}
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 uppercase">
                            {log.module}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-900 dark:text-white">
                          {log.action}
                        </td>

                        {/* Details */}
                        <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {log.details || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT STAFF MODAL */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isAddModalOpen ? 'Add New Staff Member' : `Edit Staff: ${selectedStaff?.name}`}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure account credentials, assigned role, and module permissions.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={isAddModalOpen ? handleCreateStaffSubmit : handleUpdateStaffSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Section 1: Basic Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Account Credentials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="staff-form-name"
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="staff-form-email"
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="e.g. rahul@gymflow.demo"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="staff-form-phone"
                        type="tel"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isAddModalOpen ? 'Initial Password *' : 'Change Password (optional)'}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="staff-form-password"
                        type={showPasswordText ? 'text' : 'password'}
                        required={isAddModalOpen}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder={isAddModalOpen ? 'Min 6 characters' : 'Leave empty to keep current'}
                        className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Role and Status */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Role & Account Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Role */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Role
                    </label>
                    <select
                      id="staff-form-role"
                      value={formRole}
                      disabled={selectedStaff?.role === 'owner'}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        setFormRole(newRole);
                        if (newRole === 'owner' || newRole === 'admin') {
                          setFormPermissions(JSON.parse(JSON.stringify(OWNER_PERMISSIONS)));
                        } else {
                          setFormPermissions(JSON.parse(JSON.stringify(DEFAULT_STAFF_PERMISSIONS)));
                        }
                      }}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white disabled:opacity-60"
                    >
                      <option value="staff">Staff (Standard)</option>
                      <option value="admin">Administrator</option>
                      {selectedStaff?.role === 'owner' && <option value="owner">Gym Owner (Primary)</option>}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Account Status
                    </label>
                    <select
                      id="staff-form-status"
                      value={formStatus}
                      disabled={selectedStaff?.role === 'owner'}
                      onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white disabled:opacity-60"
                    >
                      <option value="active">Active (Can log in)</option>
                      <option value="inactive">Inactive (Deactivated)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Granular Permissions (Only for Staff role) */}
              {formRole === 'staff' && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Granular Module Permissions
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Select which actions this staff member is allowed to perform.
                      </p>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyPreset('front_desk')}
                        className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Front Desk Preset
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('trainer')}
                        className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Trainer Preset
                      </button>
                    </div>
                  </div>

                  {/* Permissions Checkbox Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Members Module */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-500" /> Members Module
                      </span>
                      <div className="space-y-1.5 pl-1">
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissions.members?.view ?? true}
                            onChange={(e) => updatePermission('members', 'view', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>View Members Directory</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissions.members?.add ?? true}
                            onChange={(e) => updatePermission('members', 'add', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Add New Members</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissions.members?.edit ?? true}
                            onChange={(e) => updatePermission('members', 'edit', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Edit Member Profiles</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissions.members?.delete ?? false}
                            onChange={(e) => updatePermission('members', 'delete', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Delete Members (Restricted)</span>
                        </label>
                      </div>
                    </div>

                    {/* Payments Module */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Payments Module
                      </span>
                      <div className="space-y-1.5 pl-1">
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissions.payments?.view ?? true}
                            onChange={(e) => updatePermission('payments', 'view', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>View Payments Ledger</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissions.payments?.add ?? true}
                            onChange={(e) => updatePermission('payments', 'add', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Record / Collect Payments</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissions.payments?.edit ?? false}
                            onChange={(e) => updatePermission('payments', 'edit', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Edit Transactions</span>
                        </label>
                      </div>
                    </div>

                    {/* Attendance Module */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-amber-500" /> Attendance Module
                      </span>
                      <div className="space-y-1.5 pl-1">
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissions.attendance?.view ?? true}
                            onChange={(e) => updatePermission('attendance', 'view', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>View Daily Attendance</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissions.attendance?.mark ?? true}
                            onChange={(e) => updatePermission('attendance', 'mark', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Mark Check-in / QR Scan</span>
                        </label>
                      </div>
                    </div>

                    {/* Renewals Module */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-500" /> Renewals Module
                      </span>
                      <div className="space-y-1.5 pl-1">
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissions.renewals?.view ?? true}
                            onChange={(e) => updatePermission('renewals', 'view', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>View Expirations & Renewals</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissions.renewals?.sendReminder ?? true}
                            onChange={(e) => updatePermission('renewals', 'sendReminder', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Send WhatsApp Reminders</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissions.renewals?.renew ?? true}
                            onChange={(e) => updatePermission('renewals', 'renew', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Process Membership Renewals</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="staff-modal-save-button"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isAddModalOpen ? 'Create Staff Account' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {isPasswordModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset Password</h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Set a new secure password for <strong className="text-slate-900 dark:text-white">{selectedStaff.name}</strong> ({selectedStaff.email}).
            </p>

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password *
                </label>
                <input
                  id="reset-new-password-input"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password *
                </label>
                <input
                  id="reset-confirm-password-input"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-password-reset-button"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE STAFF CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Staff Account</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the staff account for{' '}
              <strong className="text-slate-900 dark:text-white">{selectedStaff.name}</strong> ({selectedStaff.email})?
              They will immediately lose all system access.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-staff-button"
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
