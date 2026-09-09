export type MembershipStatus = 'active' | 'expiring' | 'expiring_soon' | 'expired' | 'inactive';

export type ActivityType = 'member_joined' | 'payment_received' | 'check_in' | 'renewal';

export type UserRole = 'owner' | 'admin' | 'staff' | 'member';
export type UserStatus = 'active' | 'inactive';

export interface ModulePermissions {
  view: boolean;
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
  mark?: boolean;
  sendReminder?: boolean;
  renew?: boolean;
  create?: boolean;
  access?: boolean;
  managePermissions?: boolean;
}

export interface StaffPermissions {
  dashboard: {
    view: boolean;
  };
  members: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
  payments: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
  attendance: {
    view: boolean;
    mark: boolean;
    delete?: boolean;
  };
  renewals: {
    view: boolean;
    sendReminder: boolean;
    renew: boolean;
  };
  plans: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  leads?: {
    view: boolean;
    edit?: boolean;
    delete?: boolean;
  };
  settings: {
    access: boolean;
  };
  staff: {
    access: boolean;
    managePermissions?: boolean;
  };
  auditLog: {
    view: boolean;
  };
}

export interface User {
  id: string;
  gym_id?: string;
  name: string;
  full_name?: string;
  email: string;
  phone?: string;
  password_hash?: string;
  passwordHash?: string;
  role: UserRole;
  status: UserStatus;
  permissions: StaffPermissions;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  last_login?: string;
  avatarColor?: string;
}

// Staff user interface (can be used interchangeably with User)
export type Staff = User;

export interface CreateStaffDTO {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: UserRole;
  status?: UserStatus;
  permissions?: Partial<StaffPermissions>;
}

export interface UpdateStaffDTO {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  permissions?: StaffPermissions;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  module: 'auth' | 'members' | 'payments' | 'attendance' | 'renewals' | 'plans' | 'staff' | 'settings' | 'system';
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  status?: UserStatus;
  permissions?: StaffPermissions;
  createdAt: string;
  last_login?: string;
}

export interface Gym {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  foundedYear?: string;
  createdAt: string;
}

export type MemberAccountStatus = 'ACTIVE' | 'SUSPENDED';

export interface Member {
  id: string;
  full_name: string;
  name?: string; // alias for full_name
  phone: string;
  email?: string;
  gender?: 'male' | 'female' | 'other' | '';
  date_of_birth?: string; // YYYY-MM-DD
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  membership_plan_id: string; // Foreign key referencing membership_plans.id
  membership_start_date: string; // YYYY-MM-DD
  membership_end_date: string; // YYYY-MM-DD
  status: MembershipStatus;
  
  // Member Portal & Authentication Account
  portal_enabled?: boolean; // true if member has a login account enabled
  account_status?: MemberAccountStatus; // 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  portal_last_login?: string;

  created_at: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
  password_hash?: string; // Hashed password for member portal
  role?: 'member';
  daysRemaining?: number;
  // Joined relational data & aliases for view compatibility
  membership_plan?: MembershipPlan;
  membershipPlan?: string; // Plan name alias for legacy components
  membershipStartDate?: string; // alias for membership_start_date
  membershipEndDate?: string; // alias for membership_end_date
  createdAt?: string; // alias for created_at
  avatarColor?: string;
}

export interface CreateMemberDTO {
  full_name: string;
  phone: string;
  email?: string;
  gender?: 'male' | 'female' | 'other' | '';
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  membership_plan_id: string;
  membership_start_date: string;
  membership_end_date?: string; // auto calculated if omitted
  status?: MembershipStatus;
  portal_enabled?: boolean;
  account_status?: MemberAccountStatus;
  initial_password?: string;
}

export interface UpdateMemberDTO {
  full_name?: string;
  phone?: string;
  email?: string;
  gender?: 'male' | 'female' | 'other' | '';
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  membership_plan_id?: string;
  membership_start_date?: string;
  membership_end_date?: string;
  status?: MembershipStatus;
  portal_enabled?: boolean;
  account_status?: MemberAccountStatus;
  password?: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other';

export type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';

export interface Payment {
  id: string;
  member_id: string; // Foreign key referencing members.id
  membership_plan_id: string; // Foreign key referencing membership_plans.id
  amount: number; // Integer/decimal-safe amount in INR
  payment_date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_reference?: string;
  notes?: string;
  created_at: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
  // Relational populated objects
  member?: Member;
  membership_plan?: MembershipPlan;
  // Legacy aliases for backward compatibility
  memberId?: string;
  memberName?: string;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  status?: string;
  planName?: string;
  invoiceNumber?: string;
}

export interface CreatePaymentDTO {
  member_id: string;
  membership_plan_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  payment_status?: PaymentStatus;
  transaction_reference?: string;
  notes?: string;
}

export interface UpdatePaymentDTO {
  member_id?: string;
  membership_plan_id?: string;
  amount?: number;
  payment_date?: string;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  transaction_reference?: string;
  notes?: string;
}

export interface PaymentStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  totalCount: number;
}

export interface PaymentFilterState {
  search?: string;
  status?: PaymentStatus | 'all';
  dateRange?: 'all_time' | 'today' | 'this_week' | 'this_month';
  memberId?: string;
}

export type AttendanceStatus = 'checked_in' | 'checked_out';

export interface Attendance {
  id: string;
  memberId: string; // Foreign key referencing members.id
  memberName?: string;
  phone?: string;
  planName?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  checkInTime: string; // e.g. "06:42 PM" or "06:42"
  checkOutTime?: string; // e.g. "08:05 PM"
  status: AttendanceStatus;
  duration?: string; // e.g. "1h 23m" or "45m"
  notes?: string;
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
  created_at?: string; // alias
  updated_at?: string; // alias
  // Relational populated objects
  member?: Member;
  membership_plan?: MembershipPlan;
}

export interface CreateAttendanceDTO {
  memberId: string;
  date?: string; // Defaults to today (YYYY-MM-DD)
  checkInTime?: string; // Defaults to current 12hr time
  notes?: string;
  bypassExpiryWarning?: boolean;
}

export interface CheckOutAttendanceDTO {
  id: string;
  checkOutTime?: string; // Defaults to current 12hr time
  notes?: string;
}

export interface AttendanceSummary {
  date: string;
  todayAttendance: number; // Total check-ins on this date
  presentToday: number; // Unique members checked in
  absentToday: number; // Total active members not checked in
  currentlyCheckedIn: number; // Members with status === 'checked_in'
  checkedOutCount: number;
  totalActiveMembers: number;
  avgDurationMinutes?: number;
  avgDurationFormatted?: string;
}

export interface MemberAttendanceStats {
  memberId: string;
  totalVisits: number;
  lastVisit?: Attendance;
  currentMonthVisits: number;
  avgDurationFormatted?: string;
  recentHistory: Attendance[];
  isCheckedInToday: boolean;
  todayRecord?: Attendance;
}

export interface AttendanceFilterState {
  search?: string;
  status?: AttendanceStatus | 'all';
  date?: string; // YYYY-MM-DD
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  createdAt: string; // ISO timestamp
  memberName?: string;
  amount?: number;
  highlight?: string;
}

export interface DashboardStats {
  activeMembers: number;
  expiringSoon: number;
  expiredMembers: number;
  totalMembers: number;
  todayAttendance: number;
  monthlyRevenue: number;
  activeRatePercentage: number;
  revenueComparisonNote: string;
}

export interface DashboardSummaryCardsData {
  totalMembers: number;
  activeMembers: number;
  inactiveExpiredMembers: number;
  newMembers: number;
  totalRevenue: number | null;
  todayRevenue: number | null;
  todayAttendance: number;
  expiringWithin7Days: number;
  canViewFinancials: boolean;
}

export interface RevenueTrendItem {
  key: string;
  label: string;
  amount: number;
  count?: number;
}

export interface RevenueOverviewData {
  todayRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  previousMonthRevenue: number;
  dailyTrend: RevenueTrendItem[];
  weeklyTrend: RevenueTrendItem[];
  monthlyTrend: RevenueTrendItem[];
  canViewFinancials: boolean;
}

export interface MemberGrowthTrendItem {
  period: string;
  label: string;
  newMembers: number;
  totalMembers: number;
}

export interface MemberGrowthData {
  newMembersThisMonth: number;
  totalMembers: number;
  activeMembers: number;
  expiredInactiveMembers: number;
  growthTrend: MemberGrowthTrendItem[];
}

export interface AttendanceOverviewData {
  todayCheckIns: number;
  thisWeekAttendance: number;
  thisMonthAttendance: number;
  averageDailyAttendance: number;
  highestAttendanceDay: {
    date: string;
    formattedDate: string;
    count: number;
  } | null;
  dailyTrend: Array<{ date: string; label: string; count: number }>;
}

export interface PlanPerformanceItem {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  activeMembersCount: number;
  totalRevenue: number;
  renewalsCount: number;
  sharePercentage: number;
}

export interface DashboardNotificationItem {
  id: string;
  type: 'expiring' | 'expired' | 'payment' | 'renewal' | 'new_member' | 'lead';
  title: string;
  description: string;
  timestamp: string;
  severity: 'urgent' | 'warning' | 'info' | 'success';
  actionTab?: NavigationItem;
  meta?: any;
}

export interface RenewalAttentionItem {
  member: Member;
  daysRemaining: number;
  plan: string;
}

export type RenewalTab = 'all' | 'due_7_days' | 'due_3_days' | 'expired' | 'renewed';

export type RenewalCategory = 'expired' | 'due_today' | 'due_3_days' | 'due_7_days' | 'active' | 'renewed';

export interface RenewalStats {
  expiringIn7Days: number;
  expiringIn3Days: number;
  expired: number;
  renewedThisMonth: number;
  renewedRevenueThisMonth: number;
  totalRenewableMembers: number;
}

export interface RenewalItem {
  member: Member;
  plan?: MembershipPlan;
  planName: string;
  planPrice: number;
  daysRemaining: number;
  expiryDate: string;
  category: RenewalCategory;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  isRenewedThisMonth?: boolean;
}

export interface RenewMembershipDTO {
  member_id: string;
  membership_plan_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status?: PaymentStatus;
  payment_date: string;
  transaction_reference?: string;
  notes?: string;
}

export type PlanStatus = 'active' | 'inactive';

export interface MembershipPlan {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  description?: string;
  status: PlanStatus;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

export interface CreateMembershipPlanDTO {
  name: string;
  duration_months: number;
  price: number;
  description?: string;
  status?: PlanStatus;
}

export interface UpdateMembershipPlanDTO {
  name?: string;
  duration_months?: number;
  price?: number;
  description?: string;
  status?: PlanStatus;
}

export type NavigationItem = 'dashboard' | 'plans' | 'members' | 'payments' | 'attendance' | 'renewals' | 'leads' | 'staff' | 'settings';

export type MemberNavigationItem = 'overview' | 'pass' | 'payments' | 'attendance' | 'renewals' | 'profile';

export interface MemberLoginCredentials {
  identifier: string; // phone or email
  password: string;
}

export interface MemberAuthResult {
  success: boolean;
  member?: Member;
  token?: string;
  errorMessage?: string;
  alertMessage?: string;
}

export interface MemberProfileUpdateDTO {
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  gender?: 'male' | 'female' | 'other' | '';
  date_of_birth?: string;
}

export interface RenewalRequestDTO {
  plan_id: string;
  notes?: string;
}

// =========================================================================
// --- LEADS & AI RECEPTIONIST TYPES (STAGE 10) ---
// =========================================================================

export type LeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'CONVERTED' | 'LOST';

export type LeadSource = 'AI_RECEPTIONIST' | 'WEBSITE' | 'DIRECT' | 'WALK_IN' | 'PHONE';

export interface Lead {
  id: string;
  gym_id?: string;
  name: string;
  phone: string;
  email?: string;
  interested_plan_id?: string;
  interested_plan_name?: string;
  source: LeadSource;
  message?: string;
  status: LeadStatus;
  trial_date?: string; // YYYY-MM-DD
  trial_time?: string; // e.g. "07:00 AM"
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadDTO {
  name: string;
  phone: string;
  email?: string;
  interested_plan_id?: string;
  interested_plan_name?: string;
  source?: LeadSource;
  status?: LeadStatus;
  message?: string;
  trial_date?: string;
  trial_time?: string;
  notes?: string;
}

export interface UpdateLeadDTO {
  name?: string;
  phone?: string;
  email?: string;
  interested_plan_id?: string;
  interested_plan_name?: string;
  status?: LeadStatus;
  trial_date?: string;
  trial_time?: string;
  notes?: string;
}

export interface LeadStats {
  total: number;
  newCount: number;
  contactedCount: number;
  interestedCount: number;
  convertedCount: number;
  lostCount: number;
  conversionRate: number; // percentage, e.g. 24.5
  trialBookingsCount: number;
}

export interface LeadFilterState {
  search?: string;
  status?: LeadStatus | 'all';
  source?: LeadSource | 'all';
}

export interface AIReceptionistTimings {
  weekdays: string;
  saturday: string;
  sunday: string;
}

export interface AIReceptionistSettings {
  enabled: boolean;
  welcome_message: string;
  receptionist_name: string;
  receptionist_tone: 'friendly' | 'professional' | 'energetic' | 'concise';
  gym_timings: AIReceptionistTimings;
  facilities: string[];
  contact_phone: string;
  whatsapp_phone: string;
  address: string;
  rules_and_faq: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedActions?: Array<{
    label: string;
    action: string;
    payload?: any;
  }>;
  showPlanCards?: boolean;
  showTrialForm?: boolean;
  showMemberLogin?: boolean;
  showContactButtons?: boolean;
}

