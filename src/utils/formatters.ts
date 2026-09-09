// Currency formatter for Indian Rupees (INR)
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Aliases for clear descriptive naming
export const formatCurrencyINR = formatINR;

// Format date in clean readable style: e.g. "31 Aug 2026"
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateIndian = formatDate;

// Format date in long readable style: e.g. "15 September 2026"
export const formatDateLongIndian = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Relative time formatter: e.g. "18 mins ago", "2 hours ago"
export const formatRelativeTime = (isoString: string): string => {
  if (!isoString) return '';
  const past = new Date(isoString).getTime();
  const now = Date.now();
  const diffSecs = Math.floor((now - past) / 1000);

  if (diffSecs < 60) return 'Just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// Formats phone numbers cleanly for Indian numbers
export const formatPhone = (phone: string): string => {
  return phone || 'Not provided';
};

/**
 * Returns current local time formatted in 12-hour format: e.g. "06:42 PM"
 */
export const getCurrentTime12Hour = (): string => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const strHours = String(hours).padStart(2, '0');
  const strMins = String(minutes).padStart(2, '0');
  return `${strHours}:${strMins} ${ampm}`;
};

/**
 * Normalizes any time representation (e.g. "06:42", "18:42", "18:42:00", "6:42 PM", ISO timestamp) into "06:42 PM"
 */
export const formatTime12Hour = (timeStr?: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();

  // If already in 12-hour format with AM/PM
  if (trimmed.toLowerCase().includes('am') || trimmed.toLowerCase().includes('pm')) {
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)$/i);
    if (match) {
      const h = String(parseInt(match[1], 10)).padStart(2, '0');
      const m = match[2];
      const p = match[3].toUpperCase();
      return `${h}:${m} ${p}`;
    }
    return trimmed;
  }

  // If ISO string
  if (trimmed.includes('T') || trimmed.includes('-')) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }
  }

  // 24-hour format: "HH:mm" or "HH:mm:ss"
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }
  }

  return trimmed;
};

/**
 * Parses time string (12h or 24h) to total minutes from midnight
 */
export const timeStringToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 0;
  const trimmed = timeStr.trim();

  // Check 12-hour with AM/PM
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toLowerCase();
    if (period === 'pm' && h < 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    return h * 60 + m;
  }

  // 24-hour HH:mm
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  }

  return 0;
};

/**
 * Calculates readable duration between check-in time and check-out time.
 * Returns e.g. "1h 23m", "45m", "2h 00m", or "—"
 */
export const calculateVisitDuration = (checkInTime: string, checkOutTime?: string): string => {
  if (!checkInTime || !checkOutTime) return '—';

  const inMins = timeStringToMinutes(checkInTime);
  const outMins = timeStringToMinutes(checkOutTime);

  let diff = outMins - inMins;
  // Handle cross-midnight workout edge case
  if (diff < 0) {
    diff += 24 * 60;
  }

  return formatMinutesToDuration(diff);
};

/**
 * Formats minutes into "1h 23m" or "45m"
 */
export const formatMinutesToDuration = (totalMinutes: number): string => {
  if (totalMinutes <= 0 || isNaN(totalMinutes)) return '0m';

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};

/**
 * Returns consistent styling for attendance status
 */
export const getAttendanceStatusStyle = (
  status?: string
): { bg: string; text: string; border: string; label: string; dot: string } => {
  if (status === 'checked_in') {
    return {
      bg: 'bg-emerald-50 text-emerald-700',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      label: 'Checked In',
      dot: 'bg-emerald-500',
    };
  }
  return {
    bg: 'bg-slate-100 text-slate-700',
    text: 'text-slate-700',
    border: 'border-slate-200',
    label: 'Checked Out',
    dot: 'bg-slate-400',
  };
};

/**
 * Calculates membership end date automatically using start date (YYYY-MM-DD) and duration in months.
 * Safe for month-end dates and leap years.
 * Example: 2026-09-01 + 1 month -> 2026-09-30 (last day of 1-month period)
 */
export const calculateMembershipEndDate = (startDateStr: string, durationMonths: number): string => {
  if (!startDateStr || !durationMonths || durationMonths <= 0) return startDateStr;
  
  const parts = startDateStr.split('-');
  if (parts.length !== 3) return startDateStr;
  
  const startYear = parseInt(parts[0], 10);
  const startMonth = parseInt(parts[1], 10); // 1-indexed
  const startDay = parseInt(parts[2], 10);

  // Target month calculation
  const totalMonths = (startMonth - 1) + durationMonths;
  const targetYear = startYear + Math.floor(totalMonths / 12);
  const targetMonthIndex = totalMonths % 12; // 0-indexed

  // Days in target month
  const daysInTargetMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
  const adjustedDay = Math.min(startDay, daysInTargetMonth);

  // Target date
  const targetDate = new Date(targetYear, targetMonthIndex, adjustedDay);
  // Subtract 1 day so that start to end is an inclusive exact duration period
  targetDate.setDate(targetDate.getDate() - 1);

  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
};

/**
 * Calculates days remaining from today until the given end date.
 * Returns negative numbers if already expired.
 */
export const getDaysRemaining = (endDateStr: string): number => {
  if (!endDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const parts = endDateStr.split('-');
  if (parts.length !== 3) return 0;
  const end = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Derives current membership status from dates and stored state.
 */
export const deriveMembershipStatus = (
  endDateStr: string,
  storedStatus?: string
): 'active' | 'expiring' | 'expired' | 'inactive' => {
  if (storedStatus === 'inactive') return 'inactive';

  const daysRemaining = getDaysRemaining(endDateStr);
  if (daysRemaining < 0) {
    return 'expired';
  }
  if (daysRemaining <= 7) {
    return 'expiring';
  }
  return 'active';
};

/**
 * Calculates new start and end dates when renewing a membership.
 * - Active / Expiring (daysRemaining >= 0): Extends seamlessly from current expiry date.
 * - Expired (daysRemaining < 0): Restarts from the renewal payment date (defaulting to today).
 */
export const calculateRenewalDates = (
  currentEndDateStr: string,
  durationMonths: number,
  renewalDateStr?: string
): { newStartDate: string; newEndDate: string; isExtendedFromCurrentExpiry: boolean } => {
  const today = new Date().toISOString().split('T')[0];
  const effectiveRenewalDate = renewalDateStr || today;
  const daysRemaining = getDaysRemaining(currentEndDateStr);

  if (daysRemaining >= 0 && currentEndDateStr) {
    // Active / Expiring: Add 1 day to current end date as new period start, extending seamlessly
    const parts = currentEndDateStr.split('-');
    if (parts.length === 3) {
      const curEnd = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      curEnd.setDate(curEnd.getDate() + 1);
      const y = curEnd.getFullYear();
      const m = String(curEnd.getMonth() + 1).padStart(2, '0');
      const d = String(curEnd.getDate()).padStart(2, '0');
      const newStartDate = `${y}-${m}-${d}`;
      const newEndDate = calculateMembershipEndDate(newStartDate, durationMonths);
      return {
        newStartDate,
        newEndDate,
        isExtendedFromCurrentExpiry: true,
      };
    }
  }

  // Already expired or missing end date: Starts from renewal date
  const newStartDate = effectiveRenewalDate;
  const newEndDate = calculateMembershipEndDate(newStartDate, durationMonths);
  return {
    newStartDate,
    newEndDate,
    isExtendedFromCurrentExpiry: false,
  };
};

/**
 * Returns clean Tailwind badge style and label for Renewal urgency categories
 */
export const getRenewalCategoryStyle = (
  daysRemaining: number,
  isRenewedThisMonth?: boolean
): { bg: string; text: string; border: string; label: string; dot: string; urgency: 'critical' | 'high' | 'warning' | 'normal' | 'success' } => {
  if (isRenewedThisMonth) {
    return {
      bg: 'bg-emerald-50 text-emerald-700',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      label: 'Renewed',
      dot: 'bg-emerald-500',
      urgency: 'success',
    };
  }

  if (daysRemaining < 0) {
    const daysAgo = Math.abs(daysRemaining);
    return {
      bg: 'bg-rose-50 text-rose-700',
      text: 'text-rose-700',
      border: 'border-rose-200',
      label: `Expired ${daysAgo}d ago`,
      dot: 'bg-rose-500',
      urgency: 'critical',
    };
  }

  if (daysRemaining === 0) {
    return {
      bg: 'bg-rose-50 text-rose-700',
      text: 'text-rose-700',
      border: 'border-rose-200',
      label: 'Due Today',
      dot: 'bg-rose-600 animate-pulse',
      urgency: 'critical',
    };
  }

  if (daysRemaining <= 3) {
    return {
      bg: 'bg-amber-50 text-amber-800',
      text: 'text-amber-800',
      border: 'border-amber-200',
      label: `Due in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
      dot: 'bg-amber-500',
      urgency: 'high',
    };
  }

  if (daysRemaining <= 7) {
    return {
      bg: 'bg-amber-50/70 text-amber-700',
      text: 'text-amber-700',
      border: 'border-amber-200/70',
      label: `Due in ${daysRemaining} days`,
      dot: 'bg-amber-400',
      urgency: 'warning',
    };
  }

  return {
    bg: 'bg-emerald-50 text-emerald-700',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    label: `Active (${daysRemaining}d left)`,
    dot: 'bg-emerald-500',
    urgency: 'normal',
  };
};

/**
 * Returns consistent Tailwind styling classes and labels for membership status badges.
 */
export const getStatusBadgeStyle = (
  status?: string
): { bg: string; text: string; border: string; dot: string; label: string } => {
  switch (status) {
    case 'active':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Active',
      };
    case 'expiring':
    case 'expiring_soon':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        label: 'Expiring Soon',
      };
    case 'expired':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
        label: 'Expired',
      };
    case 'inactive':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        label: 'Inactive',
      };
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        label: status || 'Unknown',
      };
  }
};

