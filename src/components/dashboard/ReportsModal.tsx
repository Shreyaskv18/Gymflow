import React from 'react';
import {
  X,
  FileBarChart,
  Printer,
  Download,
  IndianRupee,
  Users,
  CalendarCheck,
  Award,
  Layers,
} from 'lucide-react';
import { AdvancedDashboardData } from '../../services/dashboardService';
import { formatCurrencyINR, formatDateIndian } from '../../utils/formatters';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AdvancedDashboardData;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ['GymFlow Comprehensive Management Report'],
      ['Generated On', new Date().toLocaleString('en-IN')],
      ['Gym Name', data.gymName],
      ['Admin', data.adminName],
      [],
      ['--- SUMMARY KPI METRICS ---'],
      ['Total Members', data.summaryCards.totalMembers],
      ['Active Members', data.summaryCards.activeMembers],
      ['Inactive / Expired', data.summaryCards.inactiveExpiredMembers],
      ['New Members (This Month)', data.summaryCards.newMembers],
      ['Total Revenue', data.summaryCards.totalRevenue || 'N/A'],
      ['Today Revenue', data.summaryCards.todayRevenue || 'N/A'],
      ['Today Attendance', data.summaryCards.todayAttendance],
      ['Expiring Within 7 Days', data.summaryCards.expiringWithin7Days],
      [],
      ['--- MEMBERSHIP PLAN PERFORMANCE ---'],
      ['Plan Name', 'Price', 'Duration (Months)', 'Active Members', 'Total Revenue', 'Renewals Count'],
      ...data.popularPlans.map((pl) => [
        pl.name,
        pl.price,
        pl.durationMonths,
        pl.activeMembersCount,
        pl.totalRevenue,
        pl.renewalsCount,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gymflow_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <FileBarChart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Executive Business Report</h2>
              <p className="text-xs text-gray-500">
                {data.gymName} • Verified performance statement as of {formatDateIndian(new Date().toISOString())}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Print report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
              title="Export report to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Revenue section */}
          {data.canViewFinancials && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                Financial Earnings Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500">Today's Revenue</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrencyINR(data.revenueOverview.todayRevenue)}
                  </p>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500">This Week (7d)</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrencyINR(data.revenueOverview.thisWeekRevenue)}
                  </p>
                </div>
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-xs text-emerald-700 font-medium">This Month</span>
                  <p className="text-lg font-bold text-emerald-900 mt-1">
                    {formatCurrencyINR(data.revenueOverview.thisMonthRevenue)}
                  </p>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500">All-Time Revenue</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrencyINR(data.summaryCards.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Membership & Attendance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Enrollment & Health
              </h3>
              <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-600">Total Enrolled Members</span>
                  <span className="font-bold text-gray-900">{data.memberGrowth.totalMembers}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-600">Active (Compliant)</span>
                  <span className="font-bold text-emerald-600">{data.memberGrowth.activeMembers}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-600">New Joinees This Month</span>
                  <span className="font-bold text-blue-600">+{data.memberGrowth.newMembersThisMonth}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Expired / Inactive Members</span>
                  <span className="font-bold text-rose-600">{data.memberGrowth.expiredInactiveMembers}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-amber-600" />
                Facility Utilization
              </h3>
              <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-600">Today's Check-ins</span>
                  <span className="font-bold text-gray-900">{data.attendanceOverview.todayCheckIns}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-600">Weekly Check-ins (7d)</span>
                  <span className="font-bold text-gray-900">{data.attendanceOverview.thisWeekAttendance}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-600">Monthly Check-ins</span>
                  <span className="font-bold text-gray-900">{data.attendanceOverview.thisMonthAttendance}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Average Daily Attendance</span>
                  <span className="font-bold text-amber-600">{data.attendanceOverview.averageDailyAttendance}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Breakdown */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Membership Plan Distribution
            </h3>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="py-2.5 px-4">Plan Name</th>
                    <th className="py-2.5 px-4">Price</th>
                    <th className="py-2.5 px-4">Active Members</th>
                    <th className="py-2.5 px-4">Renewals</th>
                    {data.canViewFinancials && <th className="py-2.5 px-4 text-right">Revenue</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.popularPlans.map((pl) => (
                    <tr key={pl.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-4 font-semibold text-gray-900">{pl.name}</td>
                      <td className="py-2.5 px-4 text-gray-600">{formatCurrencyINR(pl.price)}</td>
                      <td className="py-2.5 px-4 text-gray-800">{pl.activeMembersCount}</td>
                      <td className="py-2.5 px-4 text-gray-600">{pl.renewalsCount}</td>
                      {data.canViewFinancials && (
                        <td className="py-2.5 px-4 font-bold text-emerald-800 text-right">
                          {formatCurrencyINR(pl.totalRevenue)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
