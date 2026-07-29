import React, { useState, useMemo } from 'react';
import {
  Search,
  FileText,
  Printer,
  FileSpreadsheet,
  Calendar,
  User,
  XCircle,
  Eye,
  CheckCircle2,
  Clock,
  Filter,
  DollarSign,
  Phone,
  Tag,
} from 'lucide-react';
import { Invoice, StoreSettings, Employee } from '../types';
import { formatCurrency, formatArabicDateTime } from '../utils/storage';
import { printInvoiceHTML } from '../utils/pdfExport';
import { exportInvoicesToExcel } from '../utils/excelExport';

interface InvoiceArchiveViewProps {
  invoices: Invoice[];
  settings: StoreSettings;
  activeEmployee: Employee;
  onCancelInvoice: (invoiceId: string, reason: string) => void;
}

export const InvoiceArchiveView: React.FC<InvoiceArchiveViewProps> = ({
  invoices,
  settings,
  activeEmployee,
  onCancelInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'cancelled'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filter logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerPhone.includes(q) ||
        inv.employeeName.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchPayment = paymentFilter === 'ALL' || inv.paymentMethod === paymentFilter;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [invoices, searchQuery, statusFilter, paymentFilter]);

  // Financial Stats of current filter
  const totalSalesVolume = useMemo(() => {
    return filteredInvoices
      .filter((i) => i.status === 'completed')
      .reduce((acc, i) => acc + i.netTotal, 0);
  }, [filteredInvoices]);

  const totalCollected = useMemo(() => {
    return filteredInvoices
      .filter((i) => i.status === 'completed')
      .reduce((acc, i) => acc + i.paidAmount, 0);
  }, [filteredInvoices]);

  const totalRemaining = useMemo(() => {
    return filteredInvoices
      .filter((i) => i.status === 'completed')
      .reduce((acc, i) => acc + i.remainingAmount, 0);
  }, [filteredInvoices]);

  const canCancel = activeEmployee.role === 'admin' || activeEmployee.permissions.includes('cancel_invoices');

  const handleCancelClick = (inv: Invoice) => {
    if (!canCancel) {
      alert('ليس لديك صلاحية إلغاء الفواتير. يرجى مراجعة المدير إسلام شومان.');
      return;
    }

    const reason = prompt(`الرجاء إدخال سبب إلغاء الفاتورة رقم (${inv.invoiceNumber}):`);
    if (reason && reason.trim()) {
      if (
        confirm(
          `هل أنت متأكد من إلغاء الفاتورة (${inv.invoiceNumber})؟ سيتم إعادة جميع المراتب المذكورة بالفاتورة للمخزون تلقائياً!`
        )
      ) {
        onCancelInvoice(inv.id, reason.trim());
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">أرشيف الفواتير والمبيعات السابقة</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            سجل كلي بجميع الفواتير الصادرة لمحل العالمية للمراتب مع إمكانية طباعتها وحفظها
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportInvoicesToExcel(filteredInvoices, settings)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسيل (Excel)</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-500 font-medium">إجمالي حجم المبيعات (النشطة):</div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {formatCurrency(totalSalesVolume)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-500 font-medium">المبالغ المحصلة الفعلية:</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalCollected)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-500 font-medium">المبالغ المتبقية لدى العملاء (آجل):</div>
          <div className="text-xl font-bold text-amber-600 mt-1">
            {formatCurrency(totalRemaining)}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الفاتورة، اسم العميل، الهاتف، أو اسم الموظف..."
            className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغاة</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="ALL">جميع طرق الدفع</option>
            <option value="cash">كاش</option>
            <option value="visa">فيزا</option>
            <option value="partial">دفعة + آجل</option>
            <option value="installment">آجل / تقسيط</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">رقم الفاتورة</th>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5">اسم العميل</th>
                <th className="p-3.5">الهاتف</th>
                <th className="p-3.5">الصافي</th>
                <th className="p-3.5">المدفوع</th>
                <th className="p-3.5">طريقة الدفع</th>
                <th className="p-3.5">الموظف</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">خيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-bold text-blue-600">{inv.invoiceNumber}</td>
                  <td className="p-3.5 text-slate-500">{formatArabicDateTime(inv.date)}</td>
                  <td className="p-3.5 font-bold text-slate-900">{inv.customerName}</td>
                  <td className="p-3.5 text-slate-500 dir-ltr text-right">{inv.customerPhone}</td>
                  <td className="p-3.5 font-bold text-slate-900">{formatCurrency(inv.netTotal)}</td>
                  <td className="p-3.5 font-bold text-emerald-600">{formatCurrency(inv.paidAmount)}</td>
                  <td className="p-3.5">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] border border-slate-200 font-medium">
                      {inv.paymentMethod === 'cash'
                        ? 'كاش'
                        : inv.paymentMethod === 'visa'
                        ? 'فيزا'
                        : inv.paymentMethod === 'partial'
                        ? 'دفعة + آجل'
                        : 'تقسيط'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 font-medium">{inv.employeeName}</td>
                  <td className="p-3.5">
                    {inv.status === 'completed' ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">
                        مكتملة
                      </span>
                    ) : (
                      <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[11px] font-bold">
                        ملغاة
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg border border-slate-200 transition cursor-pointer"
                        title="معاينة التفاصيل"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>

                      <button
                        onClick={() => printInvoiceHTML(inv, settings)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg border border-slate-200 transition cursor-pointer"
                        title="طباعة وحفظ كـ PDF"
                      >
                        <Printer className="w-4 h-4 text-slate-700" />
                      </button>

                      {inv.status === 'completed' && (
                        <button
                          onClick={() => handleCancelClick(inv)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 p-2 rounded-lg border border-red-200 transition cursor-pointer"
                          title="إلغاء الفاتورة واسترجاع المخزون"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    لا توجد فواتير مطابقة للبحث المطلوب.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Details View */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-900 space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تفاصيل الفاتورة ({selectedInvoice.invoiceNumber})
                </h3>
                <p className="text-xs text-slate-500">
                  بتاريخ: {formatArabicDateTime(selectedInvoice.date)}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-medium">اسم العميل:</span>
                <div className="font-bold text-slate-900">{selectedInvoice.customerName}</div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">رقم الهاتف:</span>
                <div className="font-bold text-slate-900 dir-ltr text-right">{selectedInvoice.customerPhone}</div>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 font-medium">العنوان:</span>
                <div className="text-slate-700">{selectedInvoice.customerAddress || 'استلام من المعرض'}</div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-2.5">المرتبة الموديل</th>
                    <th className="p-2.5">المقاس والارتفاع</th>
                    <th className="p-2.5">الكمية</th>
                    <th className="p-2.5">السعر</th>
                    <th className="p-2.5">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-slate-900">
                        {it.brand} - {it.modelName}
                      </td>
                      <td className="p-2.5 text-slate-600">{it.dimensionsText}</td>
                      <td className="p-2.5 font-bold text-blue-600">{it.quantity}</td>
                      <td className="p-2.5 text-slate-600">{formatCurrency(it.unitPrice)}</td>
                      <td className="p-2.5 font-bold text-slate-900">{formatCurrency(it.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">الصافي المطلوب:</span>
                <span className="font-bold text-blue-700 text-sm">{formatCurrency(selectedInvoice.netTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المدفوع:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedInvoice.paidAmount)}</span>
              </div>
              {selectedInvoice.remainingAmount > 0 && (
                <div className="flex justify-between text-amber-600 font-bold">
                  <span>المتبقي آجل:</span>
                  <span>{formatCurrency(selectedInvoice.remainingAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => printInvoiceHTML(selectedInvoice, settings)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" /> طباعة الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
