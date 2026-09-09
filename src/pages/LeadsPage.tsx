import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Clock,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Bot,
  Settings,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  Tag,
  Eye,
  Edit2,
  Trash2,
  UserCheck,
  Building,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { Lead, LeadStatus, LeadSource, LeadStats, MembershipPlan } from '../types';
import { leadsService } from '../services/leadsService';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { AddLeadModal } from '../components/leads/AddLeadModal';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';
import { ReceptionistSettingsModal } from '../components/leads/ReceptionistSettingsModal';
import { MemberModal } from '../components/members/MemberModal';

interface LeadsPageProps {
  showToast?: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ showToast, onNavigateToTab }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    newCount: 0,
    contactedCount: 0,
    interestedCount: 0,
    convertedCount: 0,
    lostCount: 0,
    conversionRate: 0,
    trialBookingsCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc'>('date_desc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Convert to Member Modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberPreFill, setMemberPreFill] = useState<any>(null);

  // Delete confirmation
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // RBAC checks
  const canEdit = authService.hasPermission('leads', 'edit');
  const canDelete = authService.hasPermission('leads', 'delete');
  const canManageSettings = authService.hasPermission('settings', 'access');

  const fetchLeadsAndStats = useCallback(async () => {
    try {
      const [leadsData, statsData] = await Promise.all([
        leadsService.getLeads(),
        leadsService.getLeadStats(),
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeadsAndStats();
  }, [fetchLeadsAndStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeadsAndStats();
    showToast?.('info', 'Refreshed leads', 'Synced latest inquiries and conversion metrics.');
  };

  const handleStatusChange = async (lead: Lead, newStatus: LeadStatus) => {
    if (!canEdit) {
      showToast?.('error', 'Permission denied', 'You do not have permission to edit leads.');
      return;
    }
    try {
      const updated = await leadsService.updateLead(lead.id, { status: newStatus });
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      const newStats = await leadsService.getLeadStats();
      setStats(newStats);
      showToast?.('success', 'Status updated', `${lead.name} is now marked as ${newStatus}.`);
    } catch (err: any) {
      showToast?.('error', 'Failed to update', err.message || 'Could not update status');
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete || !canDelete) return;
    setIsDeleting(true);
    try {
      await leadsService.deleteLead(leadToDelete.id);
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      const newStats = await leadsService.getLeadStats();
      setStats(newStats);
      showToast?.('success', 'Lead removed', `Deleted lead record for ${leadToDelete.name}`);
      setLeadToDelete(null);
    } catch (err: any) {
      showToast?.('error', 'Failed to delete', err.message || 'Could not delete lead');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeadSaved = (savedLead: Lead) => {
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === savedLead.id);
      if (exists) {
        return prev.map((l) => (l.id === savedLead.id ? savedLead : l));
      }
      return [savedLead, ...prev];
    });
    leadsService.getLeadStats().then(setStats);
  };

  const handleStartConversion = (lead: Lead) => {
    setMemberPreFill({
      id: '',
      name: lead.name,
      phone: lead.phone,
      email: lead.email || '',
      membership_plan_id: lead.interested_plan_id || '',
      join_date: new Date().toISOString().split('T')[0],
      notes: `Converted from lead (${lead.source}). ${lead.notes || ''}`.trim(),
    });
    setIsMemberModalOpen(true);
  };

  const handleMemberCreated = async (member: any) => {
    if (selectedLead) {
      await leadsService.updateLead(selectedLead.id, { status: 'CONVERTED' });
    }
    fetchLeadsAndStats();
    showToast?.('success', 'Member registered!', `${member.name} has been enrolled.`);
    setIsMemberModalOpen(false);
  };

  // Filter & Search logic
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      result = result.filter((l) => l.source === sourceFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.interested_plan_name && l.interested_plan_name.toLowerCase().includes(q)) ||
          (l.message && l.message.toLowerCase().includes(q)) ||
          (l.notes && l.notes.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [leads, statusFilter, sourceFilter, searchQuery, sortBy]);

  const statusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            NEW
          </span>
        );
      case 'CONTACTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            CONTACTED
          </span>
        );
      case 'INTERESTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            INTERESTED
          </span>
        );
      case 'CONVERTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            CONVERTED
          </span>
        );
      case 'LOST':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            LOST
          </span>
        );
    }
  };

  const sourceBadge = (source: LeadSource) => {
    switch (source) {
      case 'AI_RECEPTIONIST':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Bot className="w-3 h-3 text-indigo-600" />
            AI Receptionist
          </span>
        );
      case 'WEBSITE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/80">
            <Building className="w-3 h-3" />
            Website
          </span>
        );
      case 'WALK_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            Walk-in
          </span>
        );
      case 'PHONE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Phone Call
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
            {source}
          </span>
        );
    }
  };

  return (
    <div id="leads-page" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads & Enquiries</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Stage 10
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Capture visitor inquiries from the website AI Receptionist, schedule trials, and track conversions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {canManageSettings && (
            <button
              type="button"
              id="btn-receptionist-settings"
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>AI Receptionist Setup</span>
            </button>
          )}

          <button
            type="button"
            id="btn-record-new-lead"
            onClick={() => {
              setLeadToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Record Lead</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
            Total Leads
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">All inquiries</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-600 block uppercase tracking-wider">
            New Enquiries
          </span>
          <div className="text-2xl font-bold text-blue-700 mt-1">{stats.newCount}</div>
          <span className="text-[11px] text-blue-500 mt-0.5 block">Awaiting response</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 block uppercase tracking-wider">
            In Follow-up
          </span>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {stats.contactedCount + stats.interestedCount}
          </div>
          <span className="text-[11px] text-amber-500 mt-0.5 block">Active prospects</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-indigo-600 block uppercase tracking-wider">
            Trial Bookings
          </span>
          <div className="text-2xl font-bold text-indigo-700 mt-1">
            {stats.trialBookingsCount}
          </div>
          <span className="text-[11px] text-indigo-500 mt-0.5 block">1-Day passes</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 block uppercase tracking-wider">
            Converted
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.convertedCount}</div>
          <span className="text-[11px] text-emerald-500 mt-0.5 block">Enrolled members</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
            Conversion Rate
          </span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{stats.conversionRate}%</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Lead to member</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by prospect name, phone, email, plan..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Source & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="all">All Sources</option>
                <option value="AI_RECEPTIONIST">AI Receptionist</option>
                <option value="WEBSITE">Website Form</option>
                <option value="WALK_IN">Walk-in</option>
                <option value="PHONE">Phone</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="name_asc">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {[
            { id: 'all', label: 'All Leads', count: leads.length },
            { id: 'NEW', label: 'New', count: leads.filter((l) => l.status === 'NEW').length },
            { id: 'CONTACTED', label: 'Contacted', count: leads.filter((l) => l.status === 'CONTACTED').length },
            { id: 'INTERESTED', label: 'Interested', count: leads.filter((l) => l.status === 'INTERESTED').length },
            { id: 'CONVERTED', label: 'Converted', count: leads.filter((l) => l.status === 'CONVERTED').length },
            { id: 'LOST', label: 'Lost', count: leads.filter((l) => l.status === 'LOST').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No leads found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || sourceFilter !== 'all'
                ? 'Try adjusting your filters or search keywords to locate leads.'
                : 'Visitor inquiries submitted through the website AI Receptionist or recorded manually will appear here.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {(searchQuery || statusFilter !== 'all' || sourceFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setSourceFilter('all');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setLeadToEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
              >
                + Record Lead
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Prospect</th>
                    <th className="py-3 px-4">Interested Plan</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Trial Workout</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Received</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Prospect Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsDetailModalOpen(true);
                              }}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors cursor-pointer"
                            >
                              {lead.name}
                            </button>
                            <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                              <span>{lead.phone}</span>
                              {lead.email && <span className="text-slate-400">• {lead.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Interested Plan */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {lead.interested_plan_name || 'General Inquiry'}
                        </div>
                        {lead.message && (
                          <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                            "{lead.message}"
                          </p>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">{sourceBadge(lead.source)}</td>

                      {/* Trial Workout Booking */}
                      <td className="py-3 px-4">
                        {lead.trial_date ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            <div>
                              <span className="font-bold text-[11px]">{lead.trial_date}</span>
                              {lead.trial_time && (
                                <span className="text-[10px] text-emerald-600 ml-1">
                                  ({lead.trial_time})
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">None scheduled</span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                          disabled={!canEdit}
                          className="px-2 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-75"
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="INTERESTED">INTERESTED</option>
                          <option value="CONVERTED">CONVERTED</option>
                          <option value="LOST">LOST</option>
                        </select>
                      </td>

                      {/* Received Date */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* WhatsApp Quick Chat */}
                          <a
                            href={leadsService.getWhatsAppChatUrl(
                              lead.phone,
                              `Hi ${lead.name}, thank you for reaching out to GymFlow Fitness Center! We would love to assist you with your membership inquiry. Would you like to schedule a free 1-day trial workout?`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Call */}
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Call Lead"
                          >
                            <Phone className="w-4 h-4" />
                          </a>

                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Details & Notes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Convert to Member */}
                          {lead.status !== 'CONVERTED' && (
                            <button
                              type="button"
                              onClick={() => handleStartConversion(lead)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Enroll as Member"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setLeadToEdit(lead);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Lead"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setLeadToDelete(lead)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< md screens) */}
            <div id="leads-mobile-card-list" className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  id={`lead-card-mobile-${lead.id}`}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                >
                  {/* Card Header: Prospect Avatar, Name, Phone & Status Selector */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsDetailModalOpen(true);
                          }}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-left text-sm truncate block cursor-pointer"
                        >
                          {lead.name}
                        </button>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono">{lead.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                        disabled={!canEdit}
                        className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-75"
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="INTERESTED">INTERESTED</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Plan</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {lead.interested_plan_name || 'General Inquiry'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Source: {lead.source}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Trial Workout</span>
                      {lead.trial_date ? (
                        <span className="font-bold text-emerald-700 block truncate">
                          {lead.trial_date} {lead.trial_time ? `(${lead.trial_time})` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">None scheduled</span>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Recv: {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Action Buttons with accessible touch targets */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-100">
                    <a
                      href={leadsService.getWhatsAppChatUrl(
                        lead.phone,
                        `Hi ${lead.name}, thank you for reaching out to GymFlow Fitness Center! We would love to assist you with your membership inquiry.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] flex flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-[10px] font-semibold"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600 mb-0.5" />
                      <span>Chat</span>
                    </a>

                    <a
                      href={`tel:${lead.phone}`}
                      className="min-h-[44px] flex flex-col items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-[10px] font-semibold"
                      title="Call"
                    >
                      <Phone className="w-4 h-4 text-slate-600 mb-0.5" />
                      <span>Call</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsDetailModalOpen(true);
                      }}
                      className="min-h-[44px] flex flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-[10px] font-semibold cursor-pointer"
                      title="Details"
                    >
                      <Eye className="w-4 h-4 text-indigo-600 mb-0.5" />
                      <span>View</span>
                    </button>

                    {lead.status !== 'CONVERTED' ? (
                      <button
                        type="button"
                        onClick={() => handleStartConversion(lead)}
                        className="min-h-[44px] flex flex-col items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-[10px] font-bold cursor-pointer shadow-2xs"
                        title="Enroll as Member"
                      >
                        <UserCheck className="w-4 h-4 mb-0.5" />
                        <span>Enroll</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setLeadToEdit(lead);
                          setIsAddModalOpen(true);
                        }}
                        className="min-h-[44px] flex flex-col items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-[10px] font-semibold cursor-pointer"
                        title="Edit Lead"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600 mb-0.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setLeadToEdit(null);
        }}
        onLeadSaved={handleLeadSaved}
        leadToEdit={leadToEdit}
        showToast={showToast}
      />

      <LeadDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onLeadUpdated={(updated) => {
          handleLeadSaved(updated);
          setSelectedLead(updated);
        }}
        onConvertToMember={handleStartConversion}
        showToast={showToast}
      />

      <ReceptionistSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        showToast={showToast}
      />

      {isMemberModalOpen && (
        <MemberModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          onSuccess={handleMemberCreated}
          showToast={showToast || (() => {})}
        />
      )}

      {/* Delete confirmation dialog */}
      {leadToDelete && (
        <div
          id="modal-delete-lead-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setLeadToDelete(null)}
        >
          <div
            id="modal-delete-lead"
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Lead Record?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to delete the enquiry record for{' '}
              <span className="font-semibold text-slate-800">{leadToDelete.name}</span>? This action
              cannot be undone.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteLead}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
