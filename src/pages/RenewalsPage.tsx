import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Search,
  Filter,
  UserPlus,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  History,
  Phone,
  MessageCircle,
  Plus,
  ArrowUpDown,
  X,
  Users,
  ChevronDown,
} from 'lucide-react';
import {
  RenewalStats,
  RenewalItem,
  RenewalTab,
  Member,
  MembershipPlan,
} from '../types';
import { renewalService } from '../services/renewalService';
import { storageService } from '../services/storageService';
import { RenewalStatsCards } from '../components/renewals/RenewalStatsCards';
import { RenewalTable } from '../components/renewals/RenewalTable';
import { RenewMembershipModal } from '../components/renewals/RenewMembershipModal';
import { RenewalHistoryModal } from '../components/renewals/RenewalHistoryModal';
import { WhatsAppReminderModal } from '../components/members/WhatsAppReminderModal';
import { MemberProfileDrawer } from '../components/members/MemberProfileDrawer';

interface RenewalsPageProps {
  showToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const RenewalsPage: React.FC<RenewalsPageProps> = ({ showToast, onNavigateToTab }) => {
  const [stats, setStats] = useState<RenewalStats>({
    expiringIn7Days: 0,
    expiringIn3Days: 0,
    expired: 0,
    renewedThisMonth: 0,
    renewedRevenueThisMonth: 0,
    totalRenewableMembers: 0,
  });

  const [items, setItems] = useState<RenewalItem[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  const [activeTab, setActiveTab] = useState<RenewalTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'expiry_asc' | 'expiry_desc' | 'name_asc' | 'name_desc'>('urgency');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [renewingMember, setRenewingMember] = useState<Member | null>(null);
  const [whatsAppMember, setWhatsAppMember] = useState<Member | null>(null);
  const [inspectingMember, setInspectingMember] = useState<Member | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isQuickMemberPickerOpen, setIsQuickMemberPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  // Load all renewal data
  const loadData = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // 1. Calculate live statistics
      const computedStats = renewalService.computeRenewalStats();
      setStats(computedStats);

      // 2. Load plans and members
      const loadedPlans = storageService.getMembershipPlans();
      const loadedMembers = storageService.getMembers();
      setPlans(loadedPlans);
      setAllMembers(loadedMembers);

      // 3. Load filtered items
      const loadedItems = await renewalService.getRenewalItems(
        activeTab,
        searchQuery,
        selectedPlanFilter,
        sortBy
      );
      setItems(loadedItems);
    } catch (err: any) {
      console.error('Failed to load renewal data:', err);
      showToast?.('error', 'Error Loading Renewals', err.message || 'Could not fetch renewals.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, searchQuery, selectedPlanFilter, sortBy, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab change handler
  const handleTabChange = (tab: RenewalTab) => {
    setActiveTab(tab);
  };

  // Tab counts helper for badge pills
  const tabCounts = {
    all: stats.totalRenewableMembers,
    due_7_days: stats.expiringIn7Days,
    due_3_days: stats.expiringIn3Days,
    expired: stats.expired,
    renewed: stats.renewedThisMonth,
  };

  // Handle successful renewal
  const handleRenewalSuccess = (updatedMember: Member) => {
    loadData(true);
  };

  // Filtered members for quick member picker modal
  const filteredPickerMembers = allMembers.filter((m) => {
    if (!pickerSearch.trim()) return true;
    const q = pickerSearch.trim().toLowerCase();
    const name = (m.full_name || m.name || '').toLowerCase();
    const phone = (m.phone || '').toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  return (
    <div id="renewals-page-container" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              Renewals
            </h1>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Revenue Recovery
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Keep memberships active and recover expiring revenue.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* History Log Button */}
          <button
            type="button"
            id="btn-view-renewal-history"
            onClick={() => setIsHistoryOpen(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]"
            title="View renewal history log"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Renewal History</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            id="btn-refresh-renewals"
            onClick={() => loadData(true)}
            disabled={isRefreshing || isLoading}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
            title="Refresh renewal data"
            aria-label="Refresh renewals"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Quick Renew Button */}
          <button
            type="button"
            id="btn-quick-renew-member"
            onClick={() => {
              setPickerSearch('');
              setIsQuickMemberPickerOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Quick Renew</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <RenewalStatsCards
        stats={stats}
        activeTab={activeTab}
        onSelectTab={handleTabChange}
      />

      {/* 3. Category Tabs & Filters Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 overflow-x-auto gap-2">
          <div id="renewal-category-tabs" className="flex items-center gap-1.5 min-w-max">
            {[
              { id: 'all', label: 'All', count: tabCounts.all },
              { id: 'due_7_days', label: 'Due in 7 Days', count: tabCounts.due_7_days },
              { id: 'due_3_days', label: 'Due in 3 Days', count: tabCounts.due_3_days },
              { id: 'expired', label: 'Expired', count: tabCounts.expired },
              { id: 'renewed', label: 'Renewed', count: tabCounts.renewed },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-renewal-${tab.id}`}
                  type="button"
                  onClick={() => handleTabChange(tab.id as RenewalTab)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/80 text-slate-700 font-semibold'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="renewals-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, phone, plan..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Plan filter */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                id="renewals-plan-filter"
                value={selectedPlanFilter}
                onChange={(e) => setSelectedPlanFilter(e.target.value)}
                className="w-full sm:w-44 pl-3 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Plans</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort filter */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                id="renewals-sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-48 pl-3 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all appearance-none cursor-pointer"
              >
                <option value="urgency">Sort by Urgency</option>
                <option value="expiry_asc">Expiry (Earliest First)</option>
                <option value="expiry_desc">Expiry (Latest First)</option>
                <option value="name_asc">Member Name (A-Z)</option>
                <option value="name_desc">Member Name (Z-A)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 4. Renewal Items Table & Mobile Cards */}
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">Loading renewal records...</p>
          </div>
        ) : items.length === 0 ? (
          <div
            id="renewals-empty-state"
            className="py-14 px-4 text-center rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {searchQuery || selectedPlanFilter !== 'all'
                  ? 'No matching members found'
                  : activeTab === 'due_3_days'
                  ? 'No memberships expiring in the next 3 days'
                  : activeTab === 'due_7_days'
                  ? 'No memberships expiring in the next 7 days'
                  : activeTab === 'expired'
                  ? 'No expired memberships'
                  : activeTab === 'renewed'
                  ? 'No members renewed this month yet'
                  : 'No renewal records found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {searchQuery || selectedPlanFilter !== 'all'
                  ? 'Try clearing or changing your search filters to view more records.'
                  : 'All active members are currently in good standing.'}
              </p>
            </div>

            {(searchQuery || selectedPlanFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedPlanFilter('all');
                }}
                className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <RenewalTable
            items={items}
            onRenewMember={(m) => setRenewingMember(m)}
            onWhatsAppReminder={(m) => setWhatsAppMember(m)}
            onViewMember={(m) => setInspectingMember(m)}
          />
        )}
      </div>

      {/* 5. Modals & Drawers */}

      {/* Renew Membership Modal */}
      <RenewMembershipModal
        isOpen={Boolean(renewingMember)}
        member={renewingMember}
        onClose={() => setRenewingMember(null)}
        onSuccess={handleRenewalSuccess}
        showToast={showToast}
      />

      {/* WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={Boolean(whatsAppMember)}
        member={whatsAppMember}
        onClose={() => setWhatsAppMember(null)}
      />

      {/* Member Profile Drawer */}
      <MemberProfileDrawer
        isOpen={Boolean(inspectingMember)}
        member={inspectingMember}
        onClose={() => setInspectingMember(null)}
        showToast={showToast}
        onMemberUpdated={() => loadData(true)}
      />

      {/* Renewal History Modal */}
      <RenewalHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        showToast={showToast}
      />

      {/* Quick Member Picker Modal for "+ Quick Renew" button */}
      {isQuickMemberPickerOpen && (
        <div
          id="quick-member-picker-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsQuickMemberPickerOpen(false);
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Select Member to Renew</h3>
                  <p className="text-[11px] text-slate-300">Choose any registered gym member</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickMemberPickerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search member name or phone..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="p-3 overflow-y-auto divide-y divide-slate-100 flex-1 space-y-1">
              {filteredPickerMembers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No members found matching "{pickerSearch}".
                </div>
              ) : (
                filteredPickerMembers.map((m) => {
                  const fullName = m.full_name || m.name || 'Member';
                  const initials = fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setIsQuickMemberPickerOpen(false);
                        setRenewingMember(m);
                      }}
                      className="p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs truncate block group-hover:text-indigo-600 transition-colors">
                            {fullName}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {m.phone} • {m.membership_plan?.name || m.membershipPlan || 'Plan'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1 bg-slate-900 group-hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                      >
                        Select
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
