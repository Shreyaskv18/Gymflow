import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowUpDown,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  X,
  CreditCard,
  UserX,
  Calendar,
  MessageCircle,
} from 'lucide-react';
import { Member, MembershipPlan, MembershipStatus } from '../types';
import { memberService } from '../services/memberService';
import { membershipPlanService } from '../services/membershipPlanService';
import {
  formatDateIndian,
  formatCurrencyINR,
  getDaysRemaining,
  getStatusBadgeStyle,
} from '../utils/formatters';
import { MemberModal } from '../components/members/MemberModal';
import { MemberProfileDrawer } from '../components/members/MemberProfileDrawer';
import { DeleteMemberModal } from '../components/members/DeleteMemberModal';
import { WhatsAppReminderModal } from '../components/members/WhatsAppReminderModal';

interface MembersPageProps {
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateToPlans?: () => void;
}

type SortOption = 'expiry_asc' | 'expiry_desc' | 'name_asc' | 'name_desc' | 'created_desc';

export const MembersPage: React.FC<MembersPageProps> = ({ showToast, onNavigateToPlans }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'inactive'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('expiry_asc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [inspectingMember, setInspectingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [whatsAppMember, setWhatsAppMember] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [membersData, plansRes] = await Promise.all([
        memberService.getAllMembers(),
        membershipPlanService.getAllPlans(),
      ]);

      setMembers(membersData);
      setPlans(plansRes.data || []);
    } catch (err: any) {
      console.error('Failed to load members:', err);
      showToast('error', 'Failed to load members', err.message || 'Please check your connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle member creation/update success
  const handleMemberSaved = (savedMember: Member, isNew: boolean) => {
    setIsAddModalOpen(false);
    setEditingMember(null);

    setMembers((prev) => {
      const filtered = prev.filter((m) => m.id !== savedMember.id);
      return [savedMember, ...filtered];
    });

    if (inspectingMember && inspectingMember.id === savedMember.id) {
      setInspectingMember(savedMember);
    }
  };

  // Handle member deletion
  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    setIsDeleting(true);

    try {
      await memberService.deleteMember(deletingMember.id);
      setMembers((prev) => prev.filter((m) => m.id !== deletingMember.id));

      if (inspectingMember && inspectingMember.id === deletingMember.id) {
        setInspectingMember(null);
      }

      showToast(
        'success',
        'Member Removed',
        `Successfully deleted ${deletingMember.full_name || deletingMember.name} from the gym records.`
      );
      setDeletingMember(null);
    } catch (err: any) {
      console.error('Failed to delete member:', err);
      showToast('error', 'Deletion Failed', err.message || 'Could not delete member.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed summary statistics
  const stats = useMemo(() => {
    const total = members.length;
    let active = 0;
    let expiring = 0;
    let expired = 0;
    let inactive = 0;

    members.forEach((m) => {
      if (m.status === 'inactive') {
        inactive++;
      } else if (m.status === 'expiring' || m.status === 'expiring_soon') {
        expiring++;
        active++;
      } else if (m.status === 'expired') {
        expired++;
      } else {
        active++;
      }
    });

    return { total, active, expiring, expired, inactive };
  }, [members]);

  // Filtered & Sorted member list
  const filteredMembers = useMemo(() => {
    let result = [...members];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((m) => {
        if (statusFilter === 'expiring') {
          return m.status === 'expiring' || m.status === 'expiring_soon';
        }
        return m.status === statusFilter;
      });
    }

    // Plan filter
    if (planFilter !== 'all') {
      result = result.filter(
        (m) =>
          m.membership_plan_id === planFilter ||
          (m.membershipPlan && m.membershipPlan.toLowerCase() === planFilter.toLowerCase())
      );
    }

    // Search query (name, phone, email, plan)
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((m) => {
        const name = (m.full_name || m.name || '').toLowerCase();
        const phone = (m.phone || '').toLowerCase();
        const email = (m.email || '').toLowerCase();
        const plan = (m.membership_plan?.name || m.membershipPlan || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || email.includes(q) || plan.includes(q);
      });
    }

    // Sorting
    result.sort((a, b) => {
      const aEnd = new Date(a.membership_end_date || a.membershipEndDate || 0).getTime();
      const bEnd = new Date(b.membership_end_date || b.membershipEndDate || 0).getTime();
      const aName = (a.full_name || a.name || '').toLowerCase();
      const bName = (b.full_name || b.name || '').toLowerCase();
      const aCreated = new Date(a.created_at || a.createdAt || 0).getTime();
      const bCreated = new Date(b.created_at || b.createdAt || 0).getTime();

      switch (sortBy) {
        case 'expiry_asc':
          return aEnd - bEnd;
        case 'expiry_desc':
          return bEnd - aEnd;
        case 'name_asc':
          return aName.localeCompare(bName);
        case 'name_desc':
          return bName.localeCompare(aName);
        case 'created_desc':
          return bCreated - aCreated;
        default:
          return 0;
      }
    });

    return result;
  }, [members, statusFilter, planFilter, searchQuery, sortBy]);

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== 'all' || planFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPlanFilter('all');
    setSortBy('expiry_asc');
  };

  return (
    <div id="members-page-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Member Management
            </h1>
            <span className="bg-slate-200/80 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {stats.total} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Enroll, monitor, search, and manage gym memberships linked with verified plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-refresh-members"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-xs transition-colors"
            title="Refresh member records"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
          </button>
          <button
            type="button"
            id="btn-add-member-top"
            onClick={() => {
              setEditingMember(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 sm:px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Member</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Members */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Enrolled</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</h3>
            <p className="text-[11px] text-slate-400">All registered members</p>
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700">Active Members</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600">{stats.active}</h3>
            <p className="text-[11px] text-slate-400">
              {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% of total` : '0%'}
            </p>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700">Expiring Soon</p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-600">{stats.expiring}</h3>
            <p className="text-[11px] text-slate-400">Within next 7 days</p>
          </div>
        </div>

        {/* Expired Members */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-700">Expired</p>
            <h3 className="text-xl sm:text-2xl font-black text-rose-600">{stats.expired}</h3>
            <p className="text-[11px] text-slate-400">Needs renewal</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-member-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone (+91...), email, or plan..."
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                id="btn-clear-search"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter Tabs / Dropdown */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                id="filter-status-all"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                id="filter-status-active"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === 'active'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-50/50'
                }`}
              >
                Active ({stats.active - stats.expiring})
              </button>
              <button
                type="button"
                id="filter-status-expiring"
                onClick={() => setStatusFilter('expiring')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === 'expiring'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-700 hover:bg-amber-50/50'
                }`}
              >
                Expiring ({stats.expiring})
              </button>
              <button
                type="button"
                id="filter-status-expired"
                onClick={() => setStatusFilter('expired')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === 'expired'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-rose-700 hover:bg-rose-50/50'
                }`}
              >
                Expired ({stats.expired})
              </button>
            </div>

            {/* Plan Filter */}
            <select
              id="select-plan-filter"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="all">All Membership Plans</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.duration_months}m)
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <div className="relative">
              <select
                id="select-sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="expiry_asc">Expiry: Soonest First</option>
                <option value="expiry_desc">Expiry: Latest First</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="created_desc">Newest Enrolled</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                id="btn-reset-filters"
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Member Directory Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading GymFlow member directory...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving persistent member records from database</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          {hasActiveFilters ? (
            <>
              <h3 className="text-lg font-bold text-slate-900">No matching members found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                No member records match your active search or filter criteria. Try adjusting your query or resetting filters.
              </p>
              <button
                type="button"
                id="btn-empty-reset"
                onClick={resetFilters}
                className="mt-4 px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Clear All Filters</span>
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-slate-900">No members registered yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                Start by enrolling your first gym member and assigning one of your active membership plans.
              </p>
              <button
                type="button"
                id="btn-empty-add-member"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-5 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-all inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Enroll First Member</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile < 768px) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold">Member</th>
                    <th className="py-3.5 px-4 font-bold">Contact</th>
                    <th className="py-3.5 px-4 font-bold">Membership Plan</th>
                    <th className="py-3.5 px-4 font-bold">Start Date</th>
                    <th className="py-3.5 px-4 font-bold">Expiry Date</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredMembers.map((member) => {
                    const fullName = member.full_name || member.name || 'Unknown';
                    const startDate = member.membership_start_date || member.membershipStartDate;
                    const endDate = member.membership_end_date || member.membershipEndDate;
                    const daysRemaining = getDaysRemaining(endDate);
                    const badgeStyle = getStatusBadgeStyle(member.status);
                    const planName = member.membership_plan?.name || member.membershipPlan || 'Standard Plan';
                    const planDuration = member.membership_plan?.duration_months;
                    const isExpiringOrExpired =
                      daysRemaining <= 7 || member.status === 'expiring' || member.status === 'expired';

                    const initials = fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={member.id}
                        id={`member-row-${member.id}`}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => setInspectingMember(member)}
                      >
                        {/* Member Name & Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight group-hover:text-amber-600 transition-colors">
                                {fullName}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">ID: {member.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-0.5">
                            <a
                              href={`tel:${member.phone}`}
                              className="text-xs font-semibold text-slate-700 hover:text-amber-600 flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{member.phone}</span>
                            </a>
                            {member.email ? (
                              <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate max-w-[180px]">
                                <Mail className="w-3.5 h-3.5 text-slate-300" />
                                <span>{member.email}</span>
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/* Membership Plan */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              <CreditCard className="w-3 h-3 text-slate-500" />
                              {planName}
                            </span>
                            {planDuration && (
                              <p className="text-[11px] text-slate-400 mt-1 pl-1">
                                {planDuration} Month{planDuration > 1 ? 's' : ''} Duration
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Start Date */}
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                          {formatDateIndian(startDate)}
                        </td>

                        {/* Expiry Date */}
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {formatDateIndian(endDate)}
                            </p>
                            {daysRemaining >= 0 && daysRemaining <= 7 && member.status !== 'inactive' ? (
                              <p className="text-[11px] font-bold text-amber-600">
                                {daysRemaining === 0 ? 'Expires today' : `${daysRemaining} days left`}
                              </p>
                            ) : daysRemaining < 0 && member.status !== 'inactive' ? (
                              <p className="text-[11px] font-bold text-rose-600">
                                Expired {Math.abs(daysRemaining)}d ago
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                            {badgeStyle.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Reminder Button - Emphasized for Expiring/Expired */}
                            {isExpiringOrExpired ? (
                              <button
                                type="button"
                                id={`btn-whatsapp-member-${member.id}`}
                                onClick={() => setWhatsAppMember(member)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                title="Send WhatsApp renewal reminder"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp Reminder</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                id={`btn-whatsapp-member-${member.id}`}
                                onClick={() => setWhatsAppMember(member)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Send WhatsApp reminder"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              id={`btn-view-member-${member.id}`}
                              onClick={() => setInspectingMember(member)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="View member details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              id={`btn-edit-member-${member.id}`}
                              onClick={() => {
                                setEditingMember(member);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit profile & plan"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              id={`btn-delete-member-${member.id}`}
                              onClick={() => setDeletingMember(member)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card-Based List View (Shown on < 768px) */}
          <div className="md:hidden space-y-3">
            {filteredMembers.map((member) => {
              const fullName = member.full_name || member.name || 'Unknown';
              const startDate = member.membership_start_date || member.membershipStartDate;
              const endDate = member.membership_end_date || member.membershipEndDate;
              const daysRemaining = getDaysRemaining(endDate);
              const badgeStyle = getStatusBadgeStyle(member.status);
              const planName = member.membership_plan?.name || member.membershipPlan || 'Standard Plan';
              const isExpiringOrExpired =
                daysRemaining <= 7 || member.status === 'expiring' || member.status === 'expired';

              const initials = fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={member.id}
                  id={`mobile-member-card-${member.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                  onClick={() => setInspectingMember(member)}
                >
                  {/* Top Bar: Avatar, Name, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{fullName}</h4>
                        {member.phone ? (
                          <a
                            href={`tel:${member.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-amber-700 font-semibold flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{member.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 mt-0.5 block">No phone number</span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                      {badgeStyle.label}
                    </span>
                  </div>

                  {/* Plan & Expiry Details */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Membership Plan:</span>
                      <span className="font-bold text-slate-900">{planName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Valid Through:</span>
                      <span className="font-bold text-slate-900">{formatDateIndian(endDate)}</span>
                    </div>
                    {daysRemaining >= 0 && daysRemaining <= 7 && member.status !== 'inactive' && (
                      <div className="flex items-center justify-between text-amber-700 font-bold pt-1 border-t border-slate-200/60">
                        <span>Renewal Deadline:</span>
                        <span>{daysRemaining === 0 ? 'Expires today' : `${daysRemaining} days remaining`}</span>
                      </div>
                    )}
                    {daysRemaining < 0 && member.status !== 'inactive' && (
                      <div className="flex items-center justify-between text-rose-700 font-bold pt-1 border-t border-slate-200/60">
                        <span>Expired:</span>
                        <span>{Math.abs(daysRemaining)} days ago</span>
                      </div>
                    )}
                  </div>

                  {/* Primary WhatsApp Action for Expiring/Expired */}
                  {isExpiringOrExpired && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        id={`btn-mobile-whatsapp-primary-${member.id}`}
                        onClick={() => setWhatsAppMember(member)}
                        className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp Reminder</span>
                      </button>
                    </div>
                  )}

                  {/* Secondary Action Buttons (Touch Friendly min 44px) */}
                  <div
                    className="pt-1 flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!isExpiringOrExpired && (
                      <button
                        type="button"
                        id={`btn-mobile-whatsapp-${member.id}`}
                        onClick={() => setWhatsAppMember(member)}
                        className="flex-1 min-h-[44px] py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="WhatsApp Reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>
                    )}
                    <button
                      type="button"
                      id={`btn-mobile-view-${member.id}`}
                      onClick={() => setInspectingMember(member)}
                      className="flex-1 min-h-[44px] py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Details</span>
                    </button>
                    <button
                      type="button"
                      id={`btn-mobile-edit-${member.id}`}
                      onClick={() => {
                        setEditingMember(member);
                        setIsAddModalOpen(true);
                      }}
                      className="flex-1 min-h-[44px] py-2 px-3 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      id={`btn-mobile-delete-${member.id}`}
                      onClick={() => setDeletingMember(member)}
                      className="min-h-[44px] min-w-[44px] p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                      title="Delete member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add / Edit Member Modal */}
      <MemberModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMember(null);
        }}
        onSuccess={handleMemberSaved}
        memberToEdit={editingMember}
        showToast={showToast}
      />

      {/* Member Profile Drawer */}
      <MemberProfileDrawer
        isOpen={Boolean(inspectingMember)}
        onClose={() => setInspectingMember(null)}
        member={inspectingMember}
        onEdit={(m) => {
          setInspectingMember(null);
          setEditingMember(m);
          setIsAddModalOpen(true);
        }}
        onDelete={(m) => {
          setDeletingMember(m);
        }}
        onWhatsAppReminder={(m) => {
          setWhatsAppMember(m);
        }}
        showToast={showToast}
      />

      {/* Delete Member Confirmation Modal */}
      <DeleteMemberModal
        isOpen={Boolean(deletingMember)}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleConfirmDelete}
        member={deletingMember}
        isDeleting={isDeleting}
      />

      {/* WhatsApp Reminder Preview Modal */}
      <WhatsAppReminderModal
        isOpen={Boolean(whatsAppMember)}
        member={whatsAppMember}
        onClose={() => setWhatsAppMember(null)}
      />
    </div>
  );
};
