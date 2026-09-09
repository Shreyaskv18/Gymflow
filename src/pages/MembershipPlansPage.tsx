import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  IndianRupee,
  Edit2,
  Trash2,
  Clock,
  X,
  Sparkles,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import { MembershipPlan, CreateMembershipPlanDTO, UpdateMembershipPlanDTO, PlanStatus } from '../types';
import { membershipPlanService } from '../services/membershipPlanService';

interface MembershipPlansPageProps {
  showToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

interface FormErrors {
  name?: string;
  duration_months?: string;
  price?: string;
  general?: string;
}

export const MembershipPlansPage: React.FC<MembershipPlansPageProps> = ({ showToast }) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<MembershipPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Form input states
  const [formData, setFormData] = useState<{
    name: string;
    duration_months: string;
    price: string;
    description: string;
    status: PlanStatus;
  }>({
    name: '',
    duration_months: '1',
    price: '',
    description: '',
    status: 'active',
  });

  // Load plans from API / data layer
  const loadPlans = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await membershipPlanService.getAllPlans();
      if (response.success && response.data) {
        setPlans(response.data);
      } else {
        showToast?.('error', 'Error loading plans', response.error || 'Could not load membership plans.');
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
      showToast?.('error', 'Network Error', 'Failed to retrieve plans from the server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPlans(true);
    showToast?.('info', 'Refreshed', 'Membership plans updated.');
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      duration_months: '1',
      price: '',
      description: '',
      status: 'active',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      duration_months: String(plan.duration_months),
      price: String(plan.price),
      description: plan.description || '',
      status: plan.status,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Validate form inputs
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Plan name is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Plan name must be at least 2 characters.';
    }

    const duration = Number(formData.duration_months);
    if (!formData.duration_months || isNaN(duration)) {
      errors.duration_months = 'Duration must be a valid number.';
    } else if (duration <= 0) {
      errors.duration_months = 'Duration must be greater than 0 months.';
    } else if (!Number.isInteger(duration)) {
      errors.duration_months = 'Duration must be a whole number of months.';
    }

    const price = Number(formData.price);
    if (formData.price === '' || isNaN(price)) {
      errors.price = 'Price is required and must be a number.';
    } else if (price < 0) {
      errors.price = 'Price must be 0 or greater (₹).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Safely remove focus from active input to prevent mobile keyboard viewport jumping
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormErrors({});

    try {
      if (editingPlan) {
        // Edit existing plan via PUT /api/membership-plans/:id
        const updatePayload: UpdateMembershipPlanDTO = {
          name: formData.name.trim(),
          duration_months: Number(formData.duration_months),
          price: Number(formData.price),
          description: formData.description.trim(),
          status: formData.status,
        };

        const result = await membershipPlanService.updatePlan(editingPlan.id, updatePayload);

        if (result.success && result.data) {
          showToast?.('success', 'Plan Updated', `Successfully updated "${result.data.name}".`);
          setIsFormModalOpen(false);
          await loadPlans(true);
        } else {
          setFormErrors({ general: result.error || 'Failed to update plan.' });
          showToast?.('error', 'Update Failed', result.error || 'Please check the form values.');
        }
      } else {
        // Create new plan via POST /api/membership-plans
        const createPayload: CreateMembershipPlanDTO = {
          name: formData.name.trim(),
          duration_months: Number(formData.duration_months),
          price: Number(formData.price),
          description: formData.description.trim(),
          status: formData.status,
        };

        const result = await membershipPlanService.createPlan(createPayload);

        if (result.success && result.data) {
          showToast?.('success', 'Plan Created', `Membership plan "${result.data.name}" added.`);
          setIsFormModalOpen(false);
          await loadPlans(true);
        } else {
          setFormErrors({ general: result.error || 'Failed to create plan.' });
          showToast?.('error', 'Creation Failed', result.error || 'Please check the form values.');
        }
      }
    } catch (err: any) {
      setFormErrors({ general: err.message || 'An unexpected error occurred.' });
      showToast?.('error', 'Error', 'Could not save membership plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick toggle status
  const handleToggleStatus = async (plan: MembershipPlan) => {
    const nextStatus = plan.status === 'active' ? 'inactive' : 'active';
    const result = await membershipPlanService.updatePlan(plan.id, { status: nextStatus });
    if (result.success) {
      showToast?.(
        'info',
        `Plan ${nextStatus === 'active' ? 'Activated' : 'Deactivated'}`,
        `"${plan.name}" is now marked as ${nextStatus}.`
      );
      await loadPlans(true);
    } else {
      showToast?.('error', 'Status Update Failed', result.error || 'Could not change plan status.');
    }
  };

  // Safe delete or deactivate
  const handleConfirmDelete = async () => {
    if (!deletingPlan) return;

    setIsSubmitting(true);
    try {
      const result = await membershipPlanService.deletePlan(deletingPlan.id);

      if (result.success) {
        showToast?.('success', 'Plan Deleted', `Membership plan "${deletingPlan.name}" was removed.`);
        setDeletingPlan(null);
        await loadPlans(true);
      } else if (result.code === 'PLAN_IN_USE') {
        // Safe rejection when plan has records
        showToast?.(
          'error',
          'Cannot Delete Plan',
          'This plan is being used by existing records. Deactivate it instead.'
        );
      } else {
        showToast?.('error', 'Deletion Failed', result.error || 'Could not delete plan.');
      }
    } catch (err: any) {
      showToast?.('error', 'Error', 'Failed to delete membership plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // Status filter
      if (statusFilter !== 'all' && plan.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = plan.name.toLowerCase().includes(q);
        const matchesDesc = (plan.description || '').toLowerCase().includes(q);
        const matchesPrice = String(plan.price).includes(q);
        const matchesDuration = `${plan.duration_months} month`.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesPrice || matchesDuration;
      }
      return true;
    });
  }, [plans, statusFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((p) => p.status === 'active').length;
    const inactive = plans.filter((p) => p.status === 'inactive').length;
    const prices = plans.map((p) => p.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    return { total, active, inactive, minPrice, maxPrice };
  }, [plans]);

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="membership-plans-page" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Membership Plans
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {stats.active} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure gym membership tiers, pricing in Indian Rupees (₹), and durations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="refresh-plans-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title="Refresh plans list"
            aria-label="Refresh plans"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            id="add-membership-plan-button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Membership Plan</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Plans</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Configured tiers</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Plans</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.active}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Available for sign-up</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Inactive Plans</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-700 mt-2">{stats.inactive}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Archived / Paused</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pricing Range</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 truncate">
            {stats.total > 0
              ? `${membershipPlanService.formatINR(stats.minPrice)} - ${membershipPlanService.formatINR(stats.maxPrice)}`
              : '₹0'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across all durations</p>
        </div>
      </div>

      {/* 3. Search, Filter & View Controls */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-plans-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plans by name, duration, price..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills & View Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              id="filter-status-all"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({plans.length})
            </button>
            <button
              id="filter-status-active"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              id="filter-status-inactive"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-white text-slate-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive ({stats.inactive})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Plans List / Grid View */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Loading Membership Plans...
          </p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery || statusFilter !== 'all' ? 'No matching plans found' : 'No membership plans yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search criteria or status filter.'
              : 'Create your first gym subscription plan to start enrolling members.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPlans.map((plan) => {
            const isReferenced = membershipPlanService.isPlanReferenced(plan.name, plan.id);
            const monthlyAvg =
              plan.duration_months > 0 ? Math.round(plan.price / plan.duration_months) : plan.price;

            return (
              <div
                key={plan.id}
                id={`plan-card-${plan.id}`}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  plan.status === 'active'
                    ? 'border-slate-200/90 hover:border-indigo-200'
                    : 'border-slate-200 bg-slate-50/50 opacity-85'
                }`}
              >
                {/* Card Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                          {plan.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            plan.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              plan.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {plan.status === 'active' ? 'Active' : 'Inactive'}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          {plan.duration_months} {plan.duration_months === 1 ? 'Month' : 'Months'}
                        </span>
                      </div>
                    </div>

                    {/* Quick status toggle button */}
                    <button
                      onClick={() => handleToggleStatus(plan)}
                      title={`Click to mark as ${plan.status === 'active' ? 'inactive' : 'active'}`}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
                    >
                      {plan.status === 'active' ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Pricing Display */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {membershipPlanService.formatINR(plan.price)}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        / {plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}
                      </span>
                    </div>

                    {plan.duration_months > 1 && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ≈ {membershipPlanService.formatINR(monthlyAvg)} per month
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-2 min-h-[2rem]">
                    {plan.description || 'Standard gym access plan with equipment floor and facilities.'}
                  </p>

                  {/* Safety In-Use indicator */}
                  {isReferenced && (
                    <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">In use by active gym records</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Metadata & Actions */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400">
                    <span>Created: </span>
                    <span className="font-medium text-slate-600">{formatDate(plan.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`edit-plan-${plan.id}`}
                      onClick={() => handleOpenEditModal(plan)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      id={`delete-plan-${plan.id}`}
                      onClick={() => setDeletingPlan(plan)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DENSE TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Plan Name</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                      <div>{plan.name}</div>
                      {plan.description && (
                        <div className="text-[11px] font-normal text-slate-500 truncate max-w-xs">
                          {plan.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {membershipPlanService.formatINR(plan.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          plan.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            plan.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {plan.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {formatDate(plan.created_at)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(plan)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit plan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingPlan(plan)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ADD / EDIT PLAN MODAL */}
      {isFormModalOpen && (
        <div
          id="plan-form-modal"
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setIsFormModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col h-[calc(100dvh-1.5rem)] sm:h-auto sm:max-h-[calc(100vh-3.5rem)]">
            {/* Modal Header */}
            <div className="shrink-0 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingPlan ? 'Edit Membership Plan' : 'Add Membership Plan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingPlan ? 'Update subscription tier properties' : 'Create a new subscription plan'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="close-plan-form-modal"
                onClick={() => setIsFormModalOpen(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain pb-8 sm:pb-5">
                {formErrors.general && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{formErrors.general}</span>
                  </div>
                )}

                {/* Field 1: Plan Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="plan-name-input">
                    Plan Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="plan-name-input"
                    type="text"
                    required
                    placeholder="e.g. Basic Monthly, Premium Annual, Student Pass"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white outline-none transition-all min-h-[48px] ${
                      formErrors.name
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-100'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.name}</p>
                  )}
                </div>

                {/* Fields 2 & 3: Duration & Price (2-column layout) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Duration (Months) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="plan-duration-input">
                      Duration (Months) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="plan-duration-input"
                        type="number"
                        min="1"
                        step="1"
                        required
                        placeholder="1, 3, 6, 12"
                        value={formData.duration_months}
                        onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                        className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white outline-none transition-all min-h-[48px] ${
                          formErrors.duration_months
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-100'
                            : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                    </div>
                    {formErrors.duration_months && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">
                        {formErrors.duration_months}
                      </p>
                    )}
                  </div>

                  {/* Price (INR ₹) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="plan-price-input">
                      Price (₹ INR) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                        ₹
                      </span>
                      <input
                        id="plan-price-input"
                        type="number"
                        min="0"
                        step="1"
                        required
                        placeholder="999, 4999, 9999"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className={`w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:bg-white outline-none transition-all min-h-[48px] ${
                          formErrors.price
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-100'
                            : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        }`}
                      />
                    </div>
                    {formErrors.price && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.price}</p>
                    )}
                  </div>
                </div>

                {/* Field 4: Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Plan Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'active' })}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px] ${
                        formData.status === 'active'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          formData.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <span>Active</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'inactive' })}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px] ${
                        formData.status === 'inactive'
                          ? 'bg-slate-200 border-slate-400 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          formData.status === 'inactive' ? 'bg-slate-600' : 'bg-slate-300'
                        }`}
                      />
                      <span>Inactive</span>
                    </button>
                  </div>
                </div>

                {/* Field 5: Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="plan-description-input">
                    Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="plan-description-input"
                    rows={3}
                    placeholder="Describe inclusions (cardio floor, strength equipment, locker, sauna access)..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none min-h-[48px]"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="shrink-0 px-4 sm:px-5 py-3.5 sm:py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/90 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
                >
                  Cancel
                </button>

                <button
                  id="submit-plan-form-button"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingPlan ? 'Save Changes' : 'Create Plan'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deletingPlan && (
        <div
          id="delete-plan-modal"
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setDeletingPlan(null);
          }}
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
            {membershipPlanService.isPlanReferenced(deletingPlan.name, deletingPlan.id) ? (
              /* SAFETY IN-USE DIALOG */
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 text-center">
                  Cannot Delete Plan
                </h3>
                <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <p className="font-semibold mb-1">
                    "This plan is being used by existing records. Deactivate it instead."
                  </p>
                  <p className="text-amber-700">
                    Plan <span className="font-bold">"{deletingPlan.name}"</span> is currently linked to gym members or billing invoices. To preserve audit history, active plans cannot be hard-deleted.
                  </p>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                  <button
                    onClick={() => setDeletingPlan(null)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px]"
                  >
                    Close
                  </button>

                  <button
                    onClick={async () => {
                      await handleToggleStatus(deletingPlan);
                      setDeletingPlan(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer min-h-[44px]"
                  >
                    Deactivate Plan Instead
                  </button>
                </div>
              </div>
            ) : (
              /* SAFE DELETION DIALOG */
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 text-center">
                  Delete this membership plan?
                </h3>
                <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-slate-800">"{deletingPlan.name}"</span> ({membershipPlanService.formatINR(deletingPlan.price)} for {deletingPlan.duration_months} {deletingPlan.duration_months === 1 ? 'month' : 'months'})? This action cannot be undone.
                </p>

                <div className="mt-6 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => setDeletingPlan(null)}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px]"
                  >
                    Cancel
                  </button>

                  <button
                    id="confirm-delete-plan-button"
                    onClick={handleConfirmDelete}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-rose-600/20 cursor-pointer disabled:opacity-50 min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <span>Delete Plan</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
