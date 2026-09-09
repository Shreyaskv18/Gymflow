import {
  Attendance,
  AttendanceSummary,
  CreateAttendanceDTO,
  CheckOutAttendanceDTO,
  MemberAttendanceStats,
  Member,
} from '../types';
import { storageService } from './storageService';
import { memberService } from './memberService';
import { authService } from './authService';
import {
  getCurrentTime12Hour,
  formatTime12Hour,
  calculateVisitDuration,
  timeStringToMinutes,
  formatMinutesToDuration,
  formatDateIndian,
  getDaysRemaining,
} from '../utils/formatters';

class AttendanceService {
  /**
   * Returns today's ISO date string (YYYY-MM-DD) in local time
   */
  public getTodayDateString(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Retrieves all attendance records with member and membership_plan joined
   */
  public async getAllAttendance(): Promise<Attendance[]> {
    try {
      const response = await fetch('/api/attendance', {
        headers: authService.getAuthHeader(),
      });
      if (response.ok) {
        const res = await response.json();
        if (res.success && Array.isArray(res.data)) {
          const serverAttendance = res.data as Attendance[];
          storageService.saveAttendance(serverAttendance);
          return serverAttendance.map((record) => ({
            ...record,
            checkInTime: formatTime12Hour(record.checkInTime),
            checkOutTime: record.checkOutTime ? formatTime12Hour(record.checkOutTime) : undefined,
            status: record.status || (record.checkOutTime ? 'checked_out' : 'checked_in'),
          }));
        }
      }
    } catch (apiErr) {
      console.warn('API getAllAttendance fallback to storageService:', apiErr);
    }

    const rawAttendance = storageService.getAttendance();
    const members = await memberService.getAllMembers();
    const membersMap = new Map<string, Member>(members.map((m) => [m.id, m]));

    return rawAttendance.map((record) => {
      const member = membersMap.get(record.memberId);
      return {
        ...record,
        memberName: record.memberName || member?.full_name || member?.name || 'Member',
        phone: record.phone || member?.phone || '',
        planName: record.planName || member?.membershipPlan || member?.membership_plan?.name || 'Plan',
        member,
        membership_plan: member?.membership_plan,
        checkInTime: formatTime12Hour(record.checkInTime),
        checkOutTime: record.checkOutTime ? formatTime12Hour(record.checkOutTime) : undefined,
        status: record.status || (record.checkOutTime ? 'checked_out' : 'checked_in'),
      };
    });
  }

  /**
   * Retrieves attendance records for a specific date (YYYY-MM-DD), ordered by check-in time descending
   */
  public async getAttendanceForDate(dateStr: string): Promise<Attendance[]> {
    const targetDate = dateStr || this.getTodayDateString();
    const all = await this.getAllAttendance();
    
    return all
      .filter((record) => record.date === targetDate)
      .sort((a, b) => {
        // Sort by check-in time descending (latest check-ins on top)
        const minA = timeStringToMinutes(a.checkInTime);
        const minB = timeStringToMinutes(b.checkInTime);
        return minB - minA;
      });
  }

  /**
   * Retrieves today's attendance records
   */
  public async getTodayAttendance(): Promise<Attendance[]> {
    return this.getAttendanceForDate(this.getTodayDateString());
  }

  /**
   * Computes high-level Attendance statistics for a given date
   */
  public async getAttendanceStats(dateStr?: string): Promise<AttendanceSummary> {
    const targetDate = dateStr || this.getTodayDateString();

    try {
      const response = await fetch(`/api/attendance/stats?date=${encodeURIComponent(targetDate)}`, {
        headers: authService.getAuthHeader(),
      });
      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          return res.data as AttendanceSummary;
        }
      }
    } catch (apiErr) {
      console.warn('API getAttendanceStats fallback to local calculation:', apiErr);
    }

    const allMembers = await memberService.getAllMembers();
    const dayAttendance = await this.getAttendanceForDate(targetDate);

    // Active members count (status === 'active' or 'expiring')
    const activeMembers = allMembers.filter((m) => {
      if (m.status === 'inactive') return false;
      const days = getDaysRemaining(m.membership_end_date || m.membershipEndDate || '');
      return days >= 0;
    });

    const totalActiveMembers = activeMembers.length;
    const uniqueMemberIds = new Set(dayAttendance.map((a) => a.memberId));
    const presentToday = uniqueMemberIds.size;
    const absentToday = Math.max(0, totalActiveMembers - presentToday);

    const currentlyCheckedIn = dayAttendance.filter((a) => a.status === 'checked_in').length;
    const checkedOutCount = dayAttendance.filter((a) => a.status === 'checked_out').length;

    // Calculate average duration for checked-out visits on this date
    let totalDurationMinutes = 0;
    let validDurationCount = 0;

    dayAttendance.forEach((a) => {
      if (a.status === 'checked_out' && a.checkInTime && a.checkOutTime) {
        const inM = timeStringToMinutes(a.checkInTime);
        const outM = timeStringToMinutes(a.checkOutTime);
        let diff = outM - inM;
        if (diff < 0) diff += 24 * 60;
        if (diff > 0 && diff < 12 * 60) {
          totalDurationMinutes += diff;
          validDurationCount++;
        }
      }
    });

    const avgDurationMinutes = validDurationCount > 0 ? Math.round(totalDurationMinutes / validDurationCount) : 0;
    const avgDurationFormatted = validDurationCount > 0 ? formatMinutesToDuration(avgDurationMinutes) : '—';

    return {
      date: targetDate,
      todayAttendance: dayAttendance.length,
      presentToday,
      absentToday,
      currentlyCheckedIn,
      checkedOutCount,
      totalActiveMembers,
      avgDurationMinutes,
      avgDurationFormatted,
    };
  }

  /**
   * Retrieves full attendance statistics and history for a specific member
   */
  public async getMemberAttendanceStats(memberId: string): Promise<MemberAttendanceStats> {
    const all = await this.getAllAttendance();
    const memberRecords = all
      .filter((r) => r.memberId === memberId)
      .sort((a, b) => {
        // Sort date descending, then time descending
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return timeStringToMinutes(b.checkInTime) - timeStringToMinutes(a.checkInTime);
      });

    const todayStr = this.getTodayDateString();
    const todayRecord = memberRecords.find((r) => r.date === todayStr);
    const isCheckedInToday = Boolean(todayRecord && todayRecord.status === 'checked_in');

    const totalVisits = memberRecords.length;
    const lastVisit = memberRecords[0];

    // Current month visits
    const now = new Date();
    const curYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthVisits = memberRecords.filter((r) => r.date.startsWith(curYearMonth)).length;

    // Average duration
    let totalDurMins = 0;
    let countWithDur = 0;
    memberRecords.forEach((r) => {
      if (r.checkInTime && r.checkOutTime) {
        const inM = timeStringToMinutes(r.checkInTime);
        const outM = timeStringToMinutes(r.checkOutTime);
        let diff = outM - inM;
        if (diff < 0) diff += 24 * 60;
        if (diff > 0 && diff < 12 * 60) {
          totalDurMins += diff;
          countWithDur++;
        }
      }
    });

    const avgDurationFormatted = countWithDur > 0
      ? formatMinutesToDuration(Math.round(totalDurMins / countWithDur))
      : '—';

    return {
      memberId,
      totalVisits,
      lastVisit,
      currentMonthVisits,
      avgDurationFormatted,
      recentHistory: memberRecords.slice(0, 15),
      isCheckedInToday,
      todayRecord,
    };
  }

  /**
   * Checks if member already has an active check-in or visit on a given date to prevent duplicates
   */
  public async getTodayAttendanceForMember(memberId: string, dateStr?: string): Promise<Attendance | null> {
    const targetDate = dateStr || this.getTodayDateString();
    const dayAttendance = await this.getAttendanceForDate(targetDate);
    return dayAttendance.find((a) => a.memberId === memberId) || null;
  }

  /**
   * Checks in a member for today or a chosen date
   */
  public async checkInMember(
    dto: CreateAttendanceDTO,
    bypassExpiryWarning = false
  ): Promise<{ success: boolean; record?: Attendance; error?: string; isExpiredWarning?: boolean; expiredDate?: string }> {
    try {
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: authService.getAuthHeader(),
        body: JSON.stringify({
          memberId: dto.memberId,
          date: dto.date,
          checkInTime: dto.checkInTime,
          notes: dto.notes,
          bypassExpiryWarning: bypassExpiryWarning || dto.bypassExpiryWarning,
        }),
      });

      const res = await response.json();
      if (response.ok && res.success && res.data) {
        const currentAttendance = storageService.getAttendance();
        storageService.saveAttendance([res.data, ...currentAttendance]);
        return { success: true, record: res.data };
      } else if (res.isExpiredWarning) {
        return {
          success: false,
          isExpiredWarning: true,
          expiredDate: res.expiredDate,
          error: res.error,
        };
      } else if (res.error) {
        return { success: false, error: res.error };
      }
    } catch (apiErr) {
      console.warn('API checkInMember fallback to client processing:', apiErr);
    }

    const member = await memberService.getMemberById(dto.memberId);
    if (!member) {
      return { success: false, error: 'Member not found. Please select a valid member.' };
    }

    const targetDate = dto.date || this.getTodayDateString();
    const checkInTime = formatTime12Hour(dto.checkInTime || getCurrentTime12Hour());

    // 1. Prevent duplicate check-in for the same member on the same date
    const existing = await this.getTodayAttendanceForMember(dto.memberId, targetDate);
    if (existing) {
      const statusText = existing.status === 'checked_in' ? 'currently checked in' : 'already completed a workout';
      return {
        success: false,
        error: `${member.full_name || member.name} is ${statusText} on ${formatDateIndian(targetDate)} (Check-in: ${existing.checkInTime}). Duplicate check-ins for the same day are prevented.`,
      };
    }

    // 2. Check membership expiration
    const endDate = member.membership_end_date || member.membershipEndDate || '';
    const daysRemaining = getDaysRemaining(endDate);
    const isExpired = daysRemaining < 0 || member.status === 'expired';

    if (isExpired && !bypassExpiryWarning && !dto.bypassExpiryWarning) {
      return {
        success: false,
        isExpiredWarning: true,
        expiredDate: endDate ? formatDateIndian(endDate) : 'Expired',
        error: `Membership expired on ${endDate ? formatDateIndian(endDate) : 'a previous date'}.`,
      };
    }

    // 3. Create attendance record
    const id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newRecord: Attendance = {
      id,
      memberId: member.id,
      memberName: member.full_name || member.name || 'Member',
      phone: member.phone,
      planName: member.membershipPlan || member.membership_plan?.name || 'Active Plan',
      date: targetDate,
      checkInTime,
      status: 'checked_in',
      notes: dto.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      member,
      membership_plan: member.membership_plan,
    };

    const currentAttendance = storageService.getAttendance();
    const updated = [newRecord, ...currentAttendance];
    storageService.saveAttendance(updated);

    // 4. Log activity
    const activities = storageService.getActivities();
    const newActivity = {
      id: `act-${Date.now()}`,
      type: 'check_in' as const,
      description: `${member.full_name || member.name} checked in at ${checkInTime}`,
      createdAt: new Date().toISOString(),
      memberName: member.full_name || member.name,
      highlight: `Check-in (${checkInTime})`,
    };
    storageService.saveActivities([newActivity, ...activities]);

    const session = storageService.getAuthSession();
    storageService.addAuditLog({
      user_id: session?.userId || 'unknown',
      user_name: session?.role === 'owner' ? 'Vikram' : 'Staff Member',
      user_role: (session?.role as any) || 'staff',
      action: `Marked attendance for ${member.full_name || member.name}`,
      module: 'attendance',
      details: `Date: ${targetDate}, Check-in time: ${checkInTime}`,
    });

    return {
      success: true,
      record: newRecord,
    };
  }

  /**
   * Checks out a member and calculates visit duration
   */
  public async checkOutMember(
    dto: CheckOutAttendanceDTO
  ): Promise<{ success: boolean; record?: Attendance; error?: string; duration?: string }> {
    try {
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: authService.getAuthHeader(),
        body: JSON.stringify({
          id: dto.id,
          checkOutTime: dto.checkOutTime,
          notes: dto.notes,
        }),
      });

      const res = await response.json();
      if (response.ok && res.success && res.data) {
        const currentAttendance = storageService.getAttendance();
        const index = currentAttendance.findIndex((a) => a.id === dto.id);
        if (index !== -1) {
          currentAttendance[index] = res.data;
          storageService.saveAttendance(currentAttendance);
        }
        return { success: true, record: res.data, duration: res.duration };
      } else if (res.error) {
        return { success: false, error: res.error };
      }
    } catch (apiErr) {
      console.warn('API checkOutMember fallback to client processing:', apiErr);
    }

    const currentAttendance = storageService.getAttendance();
    const index = currentAttendance.findIndex((a) => a.id === dto.id);

    if (index === -1) {
      return { success: false, error: 'Attendance check-in record not found.' };
    }

    const record = currentAttendance[index];
    if (record.status === 'checked_out') {
      return {
        success: false,
        error: `${record.memberName || 'Member'} is already checked out at ${record.checkOutTime || 'earlier'}.`,
      };
    }

    const checkOutTime = formatTime12Hour(dto.checkOutTime || getCurrentTime12Hour());
    const duration = calculateVisitDuration(record.checkInTime, checkOutTime);

    const updatedRecord: Attendance = {
      ...record,
      checkOutTime,
      duration,
      status: 'checked_out',
      notes: dto.notes ? (record.notes ? `${record.notes} | ${dto.notes}` : dto.notes) : record.notes,
      updatedAt: new Date().toISOString(),
    };

    currentAttendance[index] = updatedRecord;
    storageService.saveAttendance(currentAttendance);

    return {
      success: true,
      record: updatedRecord,
      duration,
    };
  }

  /**
   * Deletes / removes an attendance entry (useful for undoing mistaken check-ins)
   */
  public async deleteAttendance(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/attendance/${id}`, {
        method: 'DELETE',
        headers: authService.getAuthHeader(),
      });
      if (response.ok) {
        const currentAttendance = storageService.getAttendance();
        storageService.saveAttendance(currentAttendance.filter((a) => a.id !== id));
        return true;
      }
    } catch (apiErr) {
      console.warn('API deleteAttendance fallback to local deletion:', apiErr);
    }

    const currentAttendance = storageService.getAttendance();
    const filtered = currentAttendance.filter((a) => a.id !== id);
    if (filtered.length !== currentAttendance.length) {
      storageService.saveAttendance(filtered);
      return true;
    }
    return false;
  }

  /**
   * Returns list of unique dates where attendance was recorded, sorted newest first
   */
  public async getAvailableDates(): Promise<string[]> {
    const all = storageService.getAttendance();
    const datesSet = new Set<string>();
    const todayStr = this.getTodayDateString();
    datesSet.add(todayStr); // Always include today

    all.forEach((a) => {
      if (a.date) datesSet.add(a.date);
    });

    return Array.from(datesSet).sort((a, b) => b.localeCompare(a));
  }
}

export const attendanceService = new AttendanceService();
