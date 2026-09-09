import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  ShieldAlert,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  KeyRound,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Member, MembershipPlan, CreateMemberDTO, UpdateMemberDTO, MemberAccountStatus } from '../../types';
import { membershipPlanService } from '../../services/membershipPlanService';
import { calculateMembershipEndDate, formatDateIndian, formatCurrencyINR } from '../../utils/formatters';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (member: Member, isNew: boolean) => void;
  memberToEdit?: Member | null;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  memberToEdit,
  showToast,
}) => {
  const isEditing = Boolean(memberToEdit);

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [membershipPlanId, setMembershipPlanId] = useState('');
  const [membershipStartDate, setMembershipStartDate] = useState('');
  const [customStatus, setCustomStatus] = useState<'active' | 'expiring' | 'expired' | 'inactive' | 'auto'>('auto');

  // Member Portal & Account Access controls
  const [portalEnabled, setPortalEnabled] = useState<boolean>(true);
  const [accountStatus, setAccountStatus] = useState<MemberAccountStatus>('ACTIVE');
  const [portalPassword, setPortalPassword] = useState<string>('');

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Fetch available membership plans on modal open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingPlans(true);

    membershipPlanService
      .getAllPlans()
      .then((res) => {
        if (!isMounted) return;
        const availablePlans = res.data || [];
        setPlans(availablePlans);

        // If creating new member and no plan selected yet, default to first active plan
        if (!memberToEdit && availablePlans.length > 0) {
          const activePlans = availablePlans.filter((p) => p.status === 'active');
          const defaultPlan = activePlans[0] || availablePlans[0];
          setMembershipPlanId(defaultPlan.id);
        }
      })
      .catch((err) => {
        console.error('Failed to load membership plans:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingPlans(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, memberToEdit]);

  // Populate form values when opening or switching memberToEdit
  useEffect(() => {
    if (!isOpen) return;

    setErrors({});
    setTouched({});

    if (memberToEdit) {
      setFullName(memberToEdit.full_name || memberToEdit.name || '');
      setPhone(memberToEdit.phone || '');
      setEmail(memberToEdit.email || '');
      setGender((memberToEdit.gender as any) || '');
      setDateOfBirth(memberToEdit.date_of_birth || '');
      setAddress(memberToEdit.address || '');
      setEmergencyContactName(memberToEdit.emergency_contact_name || '');
      setEmergencyContactPhone(memberToEdit.emergency_contact_phone || '');
      setMembershipPlanId(memberToEdit.membership_plan_id || 'plan-01');
      setMembershipStartDate(memberToEdit.membership_start_date || memberToEdit.membershipStartDate || new Date().toISOString().split('T')[0]);
      setCustomStatus(memberToEdit.status || 'auto');
      setPortalEnabled(memberToEdit.portal_enabled !== undefined ? memberToEdit.portal_enabled : true);
      setAccountStatus(memberToEdit.account_status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE');
      setPortalPassword('');
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      setFullName('');
      setPhone('');
      setEmail('');
      setGender('');
      setDateOfBirth('');
      setAddress('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setMembershipStartDate(todayStr);
      setCustomStatus('auto');
      setPortalEnabled(true);
      setAccountStatus('ACTIVE');
      setPortalPassword('');
    }
  }, [isOpen, memberToEdit]);

  // Selected plan details
  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === membershipPlanId) || null;
  }, [plans, membershipPlanId]);

  // Real-time calculated end date
  const calculatedEndDate = useMemo(() => {
    if (!membershipStartDate || !selectedPlan) return '';
    return calculateMembershipEndDate(membershipStartDate, selectedPlan.duration_months);
  }, [membershipStartDate, selectedPlan]);

  // Field validation
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters.';
        return '';
      case 'phone': {
        if (!value.trim()) return 'Phone number is required.';
        const digits = value.replace(/\D/g, '');
        if (digits.length < 8 || digits.length > 15) {
          return 'Enter a valid phone number (e.g. +91 98765 43210).';
        }
        return '';
      }
      case 'email': {
        if (value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) return 'Please enter a valid email address.';
        }
        return '';
      }
      case 'membershipPlanId':
        if (!value) return 'Please select a membership plan.';
        return '';
      case 'membershipStartDate':
        if (!value) return 'Membership start date is required.';
        if (isNaN(Date.parse(value))) return 'Please provide a valid date.';
        return '';
      case 'dateOfBirth':
        if (value) {
          const dobTime = new Date(value).getTime();
          if (dobTime > Date.now()) return 'Date of birth cannot be in the future.';
        }
        return '';
      case 'emergencyContactPhone': {
        if (value.trim()) {
          const digits = value.replace(/\D/g, '');
          if (digits.length < 8) return 'Enter a valid phone number.';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Safely remove focus from active input to prevent mobile keyboard viewport jumping
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Mark all required fields as touched
    const fieldsToValidate = {
      fullName,
      phone,
      email,
      membershipPlanId,
      membershipStartDate,
      dateOfBirth,
      emergencyContactPhone,
    };

    const newErrors: Record<string, string> = {};
    Object.entries(fieldsToValidate).forEach(([key, val]) => {
      const err = validateField(key, val);
      if (err) newErrors[key] = err;
    });

    setErrors(newErrors);
    setTouched({
      fullName: true,
      phone: true,
      email: true,
      membershipPlanId: true,
      membershipStartDate: true,
      dateOfBirth: true,
      emergencyContactPhone: true,
    });

    if (Object.keys(newErrors).length > 0) {
      showToast('error', 'Validation Error', 'Please correct the highlighted fields before submitting.');
      return;
    }

    if (!selectedPlan) {
      showToast('error', 'Plan Missing', 'Selected membership plan could not be resolved.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && memberToEdit) {
        const updatePayload: UpdateMemberDTO = {
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          gender,
          date_of_birth: dateOfBirth || '',
          address: address.trim(),
          emergency_contact_name: emergencyContactName.trim(),
          emergency_contact_phone: emergencyContactPhone.trim(),
          membership_plan_id: selectedPlan.id,
          membership_start_date: membershipStartDate,
          status: customStatus === 'auto' ? undefined : customStatus,
          portal_enabled: portalEnabled,
          account_status: accountStatus,
          password: portalPassword.trim() ? portalPassword.trim() : undefined,
        };

        const { memberService } = await import('../../services/memberService');
        const updated = await memberService.updateMember(memberToEdit.id, updatePayload);
        showToast('success', 'Member Updated', `Successfully updated profile for ${updated.full_name || updated.name}.`);
        onSuccess(updated, false);
      } else {
        const createPayload: CreateMemberDTO = {
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          gender,
          date_of_birth: dateOfBirth || '',
          address: address.trim(),
          emergency_contact_name: emergencyContactName.trim(),
          emergency_contact_phone: emergencyContactPhone.trim(),
          membership_plan_id: selectedPlan.id,
          membership_start_date: membershipStartDate,
          status: customStatus === 'auto' ? undefined : customStatus,
          portal_enabled: portalEnabled,
          account_status: accountStatus,
          initial_password: portalPassword.trim() ? portalPassword.trim() : 'member123',
        };

        const { memberService } = await import('../../services/memberService');
        const created = await memberService.createMember(createPayload);
        showToast('success', 'Member Added', `Successfully enrolled ${created.full_name || created.name} with ${selectedPlan.name}.`);
        onSuccess(created, true);
      }
    } catch (err: any) {
      console.error('Error saving member:', err);
      showToast('error', isEditing ? 'Failed to Update Member' : 'Failed to Create Member', err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="member-modal-backdrop"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        id="member-modal-dialog"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col h-[calc(100dvh-1.5rem)] sm:h-auto sm:max-h-[calc(100vh-3.5rem)]"
      >
        {/* Header (Sticky / Fixed at top of modal) */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Member Profile' : 'Enroll New Member'}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1 sm:line-clamp-none">
                {isEditing
                  ? 'Update contact details, assigned plan, and membership dates.'
                  : 'Register a gym member and assign a verified membership plan.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-member-modal"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 overscroll-contain pb-8 sm:pb-6">
            {/* Section 1: Personal & Contact Details */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-100">
                <User className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Personal & Contact Info
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-full-name">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (touched.fullName) handleBlur('fullName', e.target.value);
                      }}
                      onBlur={(e) => handleBlur('fullName', e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className={`w-full pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 border rounded-xl bg-white focus:outline-none focus:ring-2 transition-all min-h-[48px] ${
                        errors.fullName && touched.fullName
                          ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.fullName && touched.fullName && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-phone">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (touched.phone) handleBlur('phone', e.target.value);
                      }}
                      onBlur={(e) => handleBlur('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className={`w-full pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 border rounded-xl bg-white focus:outline-none focus:ring-2 transition-all min-h-[48px] ${
                        errors.phone && touched.phone
                          ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.phone && touched.phone && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-email">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (touched.email) handleBlur('email', e.target.value);
                      }}
                      onBlur={(e) => handleBlur('email', e.target.value)}
                      placeholder="rahul@example.com"
                      className={`w-full pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 border rounded-xl bg-white focus:outline-none focus:ring-2 transition-all min-h-[48px] ${
                        errors.email && touched.email
                          ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-gender">
                    Gender
                  </label>
                  <select
                    id="field-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all min-h-[48px]"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-dob">
                    Date of Birth <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-dob"
                      type="date"
                      value={dateOfBirth}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        if (touched.dateOfBirth) handleBlur('dateOfBirth', e.target.value);
                      }}
                      onBlur={(e) => handleBlur('dateOfBirth', e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all min-h-[48px]"
                    />
                  </div>
                  {errors.dateOfBirth && touched.dateOfBirth && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-address">
                    Residential Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    <input
                      id="field-address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 14, Jayalakshmipuram, Mysuru, Karnataka"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all min-h-[48px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Membership Plan & Duration */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Membership Plan & Duration
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Membership Plan Dropdown */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-plan">
                    Membership Plan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      id="field-plan"
                      required
                      value={membershipPlanId}
                      onChange={(e) => {
                        setMembershipPlanId(e.target.value);
                        if (touched.membershipPlanId) handleBlur('membershipPlanId', e.target.value);
                      }}
                      onBlur={(e) => handleBlur('membershipPlanId', e.target.value)}
                      disabled={loadingPlans}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm text-slate-900 border rounded-xl bg-white focus:outline-none focus:ring-2 transition-all font-medium min-h-[48px] ${
                        errors.membershipPlanId && touched.membershipPlanId
                          ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    >
                      {loadingPlans ? (
                        <option value="">Loading active plans from database...</option>
                      ) : plans.length === 0 ? (
                        <option value="">No plans found</option>
                      ) : (
                        plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.duration_months} Month{p.duration_months > 1 ? 's' : ''} ({formatCurrencyINR(p.price)})
                            {p.status === 'inactive' ? ' (Inactive)' : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  {errors.membershipPlanId && touched.membershipPlanId && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.membershipPlanId}
                    </p>
                  )}
                </div>

                {/* Membership Start Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-start-date">
                    Membership Start Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-start-date"
                      type="date"
                      required
                      value={membershipStartDate}
                      onChange={(e) => {
                        setMembershipStartDate(e.target.value);
                        if (touched.membershipStartDate) handleBlur('membershipStartDate', e.target.value);
                      }}
                      onBlur={(e) => handleBlur('membershipStartDate', e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium min-h-[48px]"
                    />
                  </div>
                  {errors.membershipStartDate && touched.membershipStartDate && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.membershipStartDate}
                    </p>
                  )}
                </div>

                {/* Calculated End Date (Read-only Auto-calculated) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-end-date">
                    Calculated Expiry Date <span className="text-emerald-600 font-normal">(Auto-calculated)</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-end-date"
                      type="text"
                      readOnly
                      value={calculatedEndDate ? formatDateIndian(calculatedEndDate) : 'Select plan & start date'}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-emerald-200 rounded-xl bg-emerald-50/50 text-emerald-950 font-bold focus:outline-none cursor-default min-h-[48px]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Derived from {selectedPlan?.duration_months || 0} month{selectedPlan?.duration_months !== 1 ? 's' : ''} duration
                  </p>
                </div>

                {/* Status Override (Optional) */}
                {isEditing && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-status">
                      Membership Status
                    </label>
                    <select
                      id="field-status"
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all min-h-[48px]"
                    >
                      <option value="auto">Auto-derive based on expiry date (Recommended)</option>
                      <option value="active">Active</option>
                      <option value="expiring">Expiring Soon</option>
                      <option value="expired">Expired</option>
                      <option value="inactive">Inactive / Suspended</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Emergency Contact */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-100">
                <ShieldAlert className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Emergency Contact Details
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Emergency Contact Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-em-name">
                    Emergency Contact Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-em-name"
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="e.g. Sunita Sharma"
                      className="w-full pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all min-h-[48px]"
                    />
                  </div>
                </div>

                {/* Emergency Contact Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-em-phone">
                    Emergency Contact Phone <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-em-phone"
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(e) => {
                        setEmergencyContactPhone(e.target.value);
                        if (touched.emergencyContactPhone) handleBlur('emergencyContactPhone', e.target.value);
                      }}
                      onBlur={(e) => handleBlur('emergencyContactPhone', e.target.value)}
                      placeholder="+91 98765 11099"
                      className={`w-full pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 border rounded-xl bg-white focus:outline-none focus:ring-2 transition-all min-h-[48px] ${
                        errors.emergencyContactPhone && touched.emergencyContactPhone
                          ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.emergencyContactPhone && touched.emergencyContactPhone && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.emergencyContactPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Member Portal & Account Access */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Member Portal & Account Access
                </h4>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-3.5 sm:p-4 border border-slate-200/80 space-y-4">
                {/* Portal Access Toggle */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label htmlFor="toggle-portal-access" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Enable Member Portal Login
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Allows member to sign in to the self-service portal using phone/email and password.
                    </p>
                  </div>
                  <input
                    id="toggle-portal-access"
                    type="checkbox"
                    checked={portalEnabled}
                    onChange={(e) => setPortalEnabled(e.target.checked)}
                    className="w-4 h-4 text-amber-500 bg-white border-slate-300 rounded focus:ring-amber-400 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-2 border-t border-slate-200/60">
                  {/* Account Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-account-status">
                      Member Account Status <span className="text-amber-600 font-normal">(Login Permission)</span>
                    </label>
                    <select
                      id="field-account-status"
                      value={accountStatus}
                      onChange={(e) => setAccountStatus(e.target.value as MemberAccountStatus)}
                      className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all min-h-[48px]"
                    >
                      <option value="ACTIVE">ACTIVE (Login Allowed)</option>
                      <option value="SUSPENDED">SUSPENDED (Disciplinary/Security Block)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Independent of gym membership status. Inactive or expired members with ACTIVE accounts can still log in to view history and renew.
                    </p>
                  </div>

                  {/* Password / Reset Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="field-portal-password">
                      {isEditing ? 'Reset Member Password' : 'Set Initial Password'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="field-portal-password"
                        type="text"
                        value={portalPassword}
                        onChange={(e) => setPortalPassword(e.target.value)}
                        placeholder={isEditing ? 'Leave blank to keep unchanged' : 'Default: member123'}
                        className="w-full pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all min-h-[48px]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isEditing
                        ? 'Enter a new password here to reset it for this member.'
                        : 'Default password is "member123" if left blank.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions (Sticky / Fixed at bottom of modal) */}
          <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2.5 sm:gap-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              id="btn-cancel-member-form"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-member-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Enroll Member'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
