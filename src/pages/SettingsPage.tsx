import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  LogOut, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Database,
  ShieldCheck,
  Building,
  Layers,
  ChevronRight,
  Download
} from 'lucide-react';
import { gymService, UpdateGymPayload } from '../services/gymService';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { Gym, Admin } from '../types';

interface SettingsPageProps {
  onLogout: () => void;
  onGymUpdated: (updatedGym: Gym) => void;
  onAdminUpdated: (updatedAdmin: Admin) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateToPlans?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onLogout,
  onGymUpdated,
  onAdminUpdated,
  showToast,
  onNavigateToPlans,
}) => {
  // Gym State
  const [gymName, setGymName] = useState('');
  const [gymPhone, setGymPhone] = useState('');
  const [gymEmail, setGymEmail] = useState('');
  const [gymAddress, setGymAddress] = useState('');
  const [isSavingGym, setIsSavingGym] = useState(false);
  const [gymErrors, setGymErrors] = useState<Record<string, string>>({});

  // Admin Profile State
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [adminErrors, setAdminErrors] = useState<Record<string, string>>({});

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = () => {
    const gym = storageService.getGym();
    const admin = storageService.getAdmin();

    setGymName(gym.name || '');
    setGymPhone(gym.phone || '');
    setGymEmail(gym.email || '');
    setGymAddress(gym.address || '');

    setAdminName(admin.name || '');
    setAdminEmail(admin.email || '');
  };

  const validateGym = (): boolean => {
    const errors: Record<string, string> = {};
    if (!gymName.trim()) errors.gymName = 'Gym name is required';
    if (!gymPhone.trim()) errors.gymPhone = 'Phone number is required';
    if (!gymEmail.trim()) {
      errors.gymEmail = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gymEmail.trim())) {
      errors.gymEmail = 'Please provide a valid email format';
    }
    if (!gymAddress.trim()) errors.gymAddress = 'Address is required';

    setGymErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (!validateGym()) return;

    setIsSavingGym(true);
    try {
      const payload: UpdateGymPayload = {
        name: gymName,
        phone: gymPhone,
        email: gymEmail,
        address: gymAddress,
      };

      const res = await gymService.updateGymDetails(payload);
      if (res.success && res.gym) {
        onGymUpdated(res.gym);
        showToast('success', 'Gym information updated', 'Changes have been securely saved to the persistent data layer.');
      } else {
        showToast('error', 'Update Failed', res.error || 'Could not save gym settings.');
      }
    } catch (err) {
      console.error('Error saving gym:', err);
      showToast('error', 'Update Failed', 'An unexpected error occurred.');
    } finally {
      setIsSavingGym(false);
    }
  };

  const validateAdmin = (): boolean => {
    const errors: Record<string, string> = {};
    if (!adminName.trim()) errors.adminName = 'Name is required';
    if (!adminEmail.trim()) {
      errors.adminEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
      errors.adminEmail = 'Please provide a valid email format';
    }

    setAdminErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (!validateAdmin()) return;

    setIsSavingAdmin(true);
    try {
      const res = await authService.updateAdminProfile(adminName, adminEmail);
      if (res.success && res.admin) {
        onAdminUpdated(res.admin);
        showToast('success', 'Admin profile saved', 'Your profile details have been updated.');
      } else {
        showToast('error', 'Update Failed', res.error || 'Could not save profile.');
      }
    } catch (err) {
      console.error('Error saving admin:', err);
      showToast('error', 'Update Failed', 'An unexpected error occurred.');
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const handleResetData = () => {
    storageService.resetToSeedData();
    loadCurrentSettings();
    const updatedGym = storageService.getGym();
    const updatedAdmin = storageService.getAdmin();
    onGymUpdated(updatedGym);
    onAdminUpdated(updatedAdmin);
    setShowResetConfirm(false);
    showToast('info', 'Data reset to seed foundation', 'Members, payments, attendance and gym data restored.');
  };

  const [isExportingBackup, setIsExportingBackup] = useState(false);

  const handleDownloadBackup = async () => {
    setIsExportingBackup(true);
    try {
      const session = storageService.getAuthSession();
      const token = session?.token;
      const response = await fetch('/api/admin/backup', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      let backupBlob: Blob;
      const todayStr = new Date().toISOString().split('T')[0];
      const filename = `gymflow-backup-${todayStr}.json`;

      if (response.ok) {
        backupBlob = await response.blob();
      } else {
        // Fallback to client data compilation if offline or standalone preview
        const clientData = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          system: 'GymFlow',
          data: {
            gym: storageService.getGym(),
            members: storageService.getMembers(),
            plans: storageService.getMembershipPlans(),
            payments: storageService.getPayments(),
            attendance: storageService.getAttendance(),
            staff: storageService.getStaffUsers(),
            leads: storageService.getLeads(),
          },
        };
        backupBlob = new Blob([JSON.stringify(clientData, null, 2)], { type: 'application/json' });
      }

      const downloadUrl = window.URL.createObjectURL(backupBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showToast('success', 'Database Backup Exported', 'Full database snapshot JSON successfully downloaded to your device.');
    } catch (err) {
      console.error('Failed to export backup:', err);
      showToast('error', 'Backup Failed', 'Could not export database backup file.');
    } finally {
      setIsExportingBackup(false);
    }
  };

  return (
    <div id="settings-view" className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Page Title Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Gym & Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your facility details, administrator profile, and persistent data configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Gym Information Form */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Gym Information</h2>
                <p className="text-xs text-slate-500">Public profile and facility details</p>
              </div>
            </div>

            <form onSubmit={handleSaveGym} className="space-y-4" noValidate>
              <div>
                <label htmlFor="gym-name-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Gym / Studio Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    id="gym-name-input"
                    type="text"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    placeholder="e.g. GymFlow Fitness Center"
                    className={`w-full bg-white border text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                      gymErrors.gymName ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {gymErrors.gymName && (
                  <p className="text-xs text-rose-500 mt-1 pl-1">{gymErrors.gymName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gym-phone-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="gym-phone-input"
                      type="text"
                      value={gymPhone}
                      onChange={(e) => setGymPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={`w-full bg-white border text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        gymErrors.gymPhone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {gymErrors.gymPhone && (
                    <p className="text-xs text-rose-500 mt-1 pl-1">{gymErrors.gymPhone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gym-email-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Official Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="gym-email-input"
                      type="email"
                      value={gymEmail}
                      onChange={(e) => setGymEmail(e.target.value)}
                      placeholder="admin@gymflow.demo"
                      className={`w-full bg-white border text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        gymErrors.gymEmail ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {gymErrors.gymEmail && (
                    <p className="text-xs text-rose-500 mt-1 pl-1">{gymErrors.gymEmail}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="gym-address-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Physical Address
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <textarea
                    id="gym-address-input"
                    rows={2}
                    value={gymAddress}
                    onChange={(e) => setGymAddress(e.target.value)}
                    placeholder="e.g. Mysuru, Karnataka, India"
                    className={`w-full bg-white border text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                      gymErrors.gymAddress ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {gymErrors.gymAddress && (
                  <p className="text-xs text-rose-500 mt-1 pl-1">{gymErrors.gymAddress}</p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="save-gym-button"
                  type="submit"
                  disabled={isSavingGym}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingGym ? 'Saving...' : 'Save Gym Info'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Admin Profile Form */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Admin Profile</h2>
                <p className="text-xs text-slate-500">Account details and credentials</p>
              </div>
            </div>

            <form onSubmit={handleSaveAdmin} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-name-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Admin Full Name
                  </label>
                  <input
                    id="admin-name-input"
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Vikram"
                    className={`w-full bg-white border text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                      adminErrors.adminName ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  {adminErrors.adminName && (
                    <p className="text-xs text-rose-500 mt-1 pl-1">{adminErrors.adminName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="admin-email-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Admin Login Email
                  </label>
                  <input
                    id="admin-email-input"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@gymflow.demo"
                    className={`w-full bg-white border text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                      adminErrors.adminEmail ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  {adminErrors.adminEmail && (
                    <p className="text-xs text-rose-500 mt-1 pl-1">{adminErrors.adminEmail}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="save-admin-button"
                  type="submit"
                  disabled={isSavingAdmin}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingAdmin ? 'Saving...' : 'Update Admin Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Column: System Info, Reseed, Logout */}
        <div className="space-y-6">
          {/* Storage & Engine Card */}
          <div className="bg-[#0F172A] text-white rounded-2xl p-6 shadow-sm border border-slate-800">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Database className="w-4 h-4" />
              <span>Data Architecture</span>
            </div>

            <h3 className="text-sm font-bold mb-1.5">Persistent Storage Layer</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              All entities (Gym, Members, Payments, Attendance) operate through the decoupled service layer with relational integrity.
            </p>

            <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-400">
                <span>Version</span>
                <span className="text-slate-200 font-mono">GymFlow V1.0</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Storage Engine</span>
                <span className="text-slate-200 font-mono">Service Repository</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Currency</span>
                <span className="text-emerald-400 font-semibold">INR (₹)</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                id="download-backup-button"
                type="button"
                onClick={handleDownloadBackup}
                disabled={isExportingBackup}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700/80 disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isExportingBackup ? 'Exporting...' : 'Export Database Backup'}</span>
              </button>
            </div>
          </div>

          {/* Membership Plans Quick Access */}
          {onNavigateToPlans && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2">
                <Layers className="w-4 h-4" />
                <span>Subscription Tiers</span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 mb-1">Membership Plans</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Configure gym membership tiers, prices in INR (₹), and durations.
              </p>
              <button
                id="settings-go-to-plans-button"
                onClick={onNavigateToPlans}
                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-between px-4 cursor-pointer border border-indigo-200/60"
              >
                <span>Manage Membership Plans</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Reset Demo Data Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Demo Utilities</span>
            </div>

            <h3 className="text-xs font-bold text-slate-900 mb-1">Reset Seed Data</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Restore default demo members, payments, and attendance check-ins.
            </p>

            {showResetConfirm ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <p className="text-xs font-semibold text-amber-800">Confirm reset to seed dataset?</p>
                <div className="flex gap-2">
                  <button
                    id="confirm-reset-button"
                    onClick={handleResetData}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Yes, Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 bg-white text-slate-700 border border-slate-300 text-xs font-semibold py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="reset-seed-data-button"
                onClick={() => setShowResetConfirm(true)}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Seed Data</span>
              </button>
            )}
          </div>

          {/* Logout Card */}
          <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-rose-950 mb-1">Session Termination</h3>
            <p className="text-xs text-rose-700 leading-relaxed mb-4">
              Log out of your administrative session and return to the login gateway.
            </p>

            <button
              id="settings-logout-button"
              onClick={onLogout}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm shadow-rose-600/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out of Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
