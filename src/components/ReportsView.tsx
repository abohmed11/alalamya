import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  User,
  FileSpreadsheet,
  Printer,
  DollarSign,
  TrendingUp,
  Receipt,
  Download,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { Invoice, ShiftLog, StoreSettings } from '../types';
import { formatCurrency, formatArabicDateTime, formatArabicDateShort } from '../utils/storage';
import { printShiftReportHTML } from '../utils/pdfExport';
import { exportShiftReportToExcel, exportPeriodReportToExcel } from '../utils/excelExport';

interface ReportsViewProps {
  invoices: Invoice[];
  shifts: ShiftLog[];
  settings: StoreSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ invoices, shifts, settings }) => {
  const [reportTab, setReportTab] = useState<'shifts' | 'periods'>('shifts');

  // Shift report selector
  const [selectedShiftId, setSelectedShiftId] = useState<string>(
    shifts.length > 0 ? shifts[0].id : ''
  );

  // Period report selector
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month' | 'year'>('day');

  // Active shift data
  const selectedShift = useMemo(() => {
    return shifts.find((s) => s.id === selectedShiftId) || shifts[0] || null;
  }, [shifts, selectedShiftId]);

  // Invoices for selected shift
  const selectedShiftInvoices = useMemo(() => {
    if (!selectedShift) return [];
    return invoices.filter((inv) => inv.shiftId === selectedShift.id);
  }, [invoices, selectedShift]);

  // Period Calculations
  const periodStats = useMemo(() => {
    const now = new Date();
    const activeInvoices = invoices.filter((inv) => inv.status === 'completed');

    let filtered = activeInvoices;

    if (periodType === 'day') {
      const todayStr = now.toISOString().split('T')[0];
      filtered = activeInvoices.filter((inv) => inv.date.startsWith(todayStr));
    } else if (periodType === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      filtered = activeInvoices.filter((inv) => new Date(inv.date) >= sevenDaysAgo);
    } else if (periodType === 'month') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      filtered = activeInvoices.filter((inv) => new Date(inv.date) >= thirtyDaysAgo);
    } else if (periodType === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filtered = activeInvoices.filter((inv) => new Date(inv.date) >= startOfYear);
    }

    const totalSales = filtered.reduce((acc, inv) => acc + inv.netTotal, 0);
    const totalCash = filtered.reduce((acc, inv) => acc + (inv.paymentMethod === 'cash' ? inv.paidAmount : 0), 0);
    const totalVisa = filtered.reduce((acc, inv) => acc + (inv.paymentMethod === 'visa' ? inv.paidAmount : 0), 0);
    const totalCredit = filtered.reduce((acc, inv) => acc + inv.remainingAmount, 0);

    // Estimate profit
    const totalCost = filtered.reduce(
      (acc, inv) => acc + inv.items.reduce((iAcc, item) => iAcc + item.costPrice * item.quantity, 0),
      0
    );
    const estimatedProfit = totalSales - totalCost;

    const totalMattressesSold = filtered.reduce(
      (acc, inv) => acc + inv.items.reduce((iAcc, item) => iAcc + item.quantity, 0),
      0
    );

    return {
      filteredInvoices: filtered,
      totalSales,
      totalCash,
      totalVisa,
      totalCredit,
      estimatedProfit,
      totalMattressesSold,
      invoicesCount: filtered.length,
    };
  }, [invoices, periodType]);

  const periodTitle = useMemo(() => {
    if (periodType === 'day') return 'تقرير مبيعات اليوم';
    if (periodType === 'week') return 'تقرير مبيعات الأسبوع (7 أيام سابقة)';
    if (periodType === 'month') return 'تقرير مبيعات الشهر (30 يوم سابق)';
    return 'تقرير مبيعات السنة الأخيرة';
  }, [periodType]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header & Report Mode Switches */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">التقارير المالية وشيفتات الموظفين</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            مقارنة تقارير شفتات الموظفين (شفت كريم / شفت حفصة) وتقارير الأيام والأسابيع والشهور والسنوات
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setReportTab('shifts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              reportTab === 'shifts'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 تقارير شفتات الموظفين
          </button>
          <button
            onClick={() => setReportTab('periods')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              reportTab === 'periods'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 تقارير الفترات الزمنية
          </button>
        </div>
      </div>

      {/* SHIFTS TAB CONTENT */}
      {reportTab === 'shifts' && (
        <div className="space-y-6">
          {/* Shifts Selection Strip */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              اختر الشيفت لعرض تقريره بالتفصيل:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {shifts.map((shift) => {
                const isSelected = selectedShift?.id === shift.id;
                return (
                  <button
                    key={shift.id}
                    onClick={() => setSelectedShiftId(shift.id)}
                    className={`p-3.5 rounded-xl border text-right transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-600 text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        شفت {shift.employeeName}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          shift.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {shift.status === 'active' ? 'نشط حالياً' : 'مغلق'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-2">
                      البدء: {formatArabicDateTime(shift.startTime)}
                    </div>
                    <div className="text-xs font-bold text-blue-600 mt-1">
                      المبيعات: {formatCurrency(shift.totalSales)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Shift Detail Panel */}
          {selectedShift && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    تقرير شيفت التفصيلي - {selectedShift.employeeName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تاريخ الإنشاء: {formatArabicDateTime(selectedShift.startTime)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printShiftReportHTML(selectedShift, invoices, settings)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" /> طباعة التقرير (PDF)
                  </button>

                  <button
                    onClick={() => exportShiftReportToExcel(selectedShift, invoices)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> تصدير إكسيل (Excel)
                  </button>
                </div>
              </div>

              {/* Stats Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500">إجمالي مبيعات الشيفت:</div>
                  <div className="text-lg font-bold text-blue-600 mt-1">
                    {formatCurrency(selectedShift.totalSales)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500">كاش محصل بالخزينة:</div>
                  <div className="text-lg font-bold text-emerald-600 mt-1">
                    {formatCurrency(selectedShift.totalCashSales)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500">مدفوعات فيزا:</div>
                  <div className="text-lg font-bold text-purple-600 mt-1">
                    {formatCurrency(selectedShift.totalVisaSales)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500">عدد الفواتير الصادرة:</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {selectedShift.invoicesCount} فاتورة
                  </div>
                </div>
              </div>

              {/* Invoices List Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">فواتير هذا الشيفت:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3">رقم الفاتورة</th>
                        <th className="p-3">اسم العميل</th>
                        <th className="p-3">التاريخ والوقت</th>
                        <th className="p-3">الصافي</th>
                        <th className="p-3">طريقة الدفع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {selectedShiftInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-blue-600">{inv.invoiceNumber}</td>
                          <td className="p-3 font-bold text-slate-900">{inv.customerName}</td>
                          <td className="p-3 text-slate-500">{formatArabicDateTime(inv.date)}</td>
                          <td className="p-3 font-bold text-slate-900">{formatCurrency(inv.netTotal)}</td>
                          <td className="p-3 text-slate-600">{inv.paymentMethod}</td>
                        </tr>
                      ))}

                      {selectedShiftInvoices.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            لا توجد فواتير مبيعات صادرة في هذا الشيفت حتى الآن.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PERIODS TAB CONTENT */}
      {reportTab === 'periods' && (
        <div className="space-y-6">
          {/* Period Selector Strip */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">اختر الفترة الزمنية للتقرير:</span>
            </div>

            <div className="flex gap-2">
              {[
                { id: 'day', label: 'اليوم' },
                { id: 'week', label: 'الأسبوع' },
                { id: 'month', label: 'الشهر' },
                { id: 'year', label: 'السنة' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriodType(p.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    periodType === p.id
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => exportPeriodReportToExcel(periodTitle, periodStats, periodStats.filteredInvoices)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" /> تصدير تقرير (Excel)
            </button>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs text-slate-500 font-medium">إجمالي مبيعات {periodTitle}:</div>
              <div className="text-xl font-bold text-blue-600 mt-1">
                {formatCurrency(periodStats.totalSales)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs text-slate-500 font-medium">تقدير الأرباح الصافية:</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {formatCurrency(periodStats.estimatedProfit)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs text-slate-500 font-medium">عدد المراتب المباعة بالفترة:</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {periodStats.totalMattressesSold} مرتبة
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="text-xs text-slate-500 font-medium">عدد الفواتير المكتملة:</div>
              <div className="text-xl font-bold text-purple-600 mt-1">
                {periodStats.invoicesCount} فاتورة
              </div>
            </div>
          </div>

          {/* Details Invoices Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">{periodTitle} - تفاصيل الفواتير:</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">اسم العميل</th>
                    <th className="p-3">المبيعات الصافية</th>
                    <th className="p-3">المدفوع</th>
                    <th className="p-3">الموظف المسئول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {periodStats.filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-blue-600">{inv.invoiceNumber}</td>
                      <td className="p-3 text-slate-500">{formatArabicDateTime(inv.date)}</td>
                      <td className="p-3 font-bold text-slate-900">{inv.customerName}</td>
                      <td className="p-3 font-bold text-slate-900">{formatCurrency(inv.netTotal)}</td>
                      <td className="p-3 font-bold text-emerald-600">{formatCurrency(inv.paidAmount)}</td>
                      <td className="p-3 text-slate-600">{inv.employeeName}</td>
                    </tr>
                  ))}

                  {periodStats.filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        لا توجد مبيعات في هذه الفترة الزمنية المحددة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
