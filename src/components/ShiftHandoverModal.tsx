import React, { useState } from 'react';
import { X, LogOut, DollarSign, Calculator, AlertTriangle, CheckCircle, Printer } from 'lucide-react';
import { ShiftLog, Invoice, StoreSettings } from '../types';
import { formatCurrency } from '../utils/storage';
import { printShiftReportHTML } from '../utils/pdfExport';
import { exportShiftReportToExcel } from '../utils/excelExport';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: ShiftLog | null;
  invoices: Invoice[];
  settings: StoreSettings;
  onConfirmHandover: (shiftId: string, actualEndingCash: number, notes: string) => void;
}

export const ShiftHandoverModal: React.FC<ShiftHandoverModalProps> = ({
  isOpen,
  onClose,
  activeShift,
  invoices,
  settings,
  onConfirmHandover,
}) => {
  const [actualCash, setActualCash] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen || !activeShift) return null;

  const expectedCash = activeShift.startingCash + activeShift.totalCashSales;
  const actualNum = parseFloat(actualCash) || 0;
  const diff = actualNum - expectedCash;

  const handleHandover = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmHandover(activeShift.id, actualNum, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">تسليم الشيفت وإغلاق الخزينة</h3>
              <p className="text-xs text-slate-500">شفت الموظف: {activeShift.employeeName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleHandover} className="p-6 space-y-5">
          {/* Shift Stats Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs text-slate-500">العهدة الافتتاحية:</span>
              <div className="text-base font-bold text-slate-800">{formatCurrency(activeShift.startingCash)}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500">إجمالي مبيعات الشيفت:</span>
              <div className="text-base font-bold text-blue-600">{formatCurrency(activeShift.totalSales)}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500">تحصيل نقدًا (كاش):</span>
              <div className="text-base font-bold text-emerald-600">{formatCurrency(activeShift.totalCashSales)}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500">تحصيل فيزا / شبكة:</span>
              <div className="text-base font-bold text-purple-600">{formatCurrency(activeShift.totalVisaSales)}</div>
            </div>
          </div>

          {/* Expected Ending Cash Banner */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
            <div className="text-xs text-emerald-800 font-medium">المبلغ المتوقع وجوده بالدرج/الخزينة:</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {formatCurrency(expectedCash)}
            </div>
            <div className="text-[11px] text-emerald-700/80 mt-0.5">
              (العهدة الافتتاحية {activeShift.startingCash} + الكاش المحصل {activeShift.totalCashSales})
            </div>
          </div>

          {/* Actual Cash Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              أدخل المبلغ الفعلي الموجود في الدرج الآن (ج.م):
            </label>
            <div className="relative">
              <input
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder={expectedCash.toString()}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-lg font-bold focus:outline-none focus:border-blue-600 shadow-xs"
              />
              <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* Difference indicator */}
            {actualCash !== '' && (
              <div className={`mt-2 p-2.5 rounded-lg text-xs font-bold flex items-center justify-between ${
                diff === 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : diff > 0
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <span>مطابقة العهدة:</span>
                <span>
                  {diff === 0
                    ? '✅ المبلغ مضبوط تماماً بدون أي فرق'
                    : diff > 0
                    ? `📈 يوجد زيادة بالخزينة بقيمة +${diff} ج.م`
                    : `⚠️ يوجد عجز بالخزينة بقيمة ${diff} ج.م`}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات تسليم الشيفت (إن وجدت):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم إيداع 5000 ج.م في الخزينة الرئيسية والباقي عهدة للشفت القادم..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 resize-none shadow-xs"
            />
          </div>

          {/* Export Quick Tools */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => printShiftReportHTML(activeShift, invoices, settings)}
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-xl border border-slate-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>طباعة تقرير الشيفت (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => exportShiftReportToExcel(activeShift, invoices)}
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-xl border border-slate-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>تصدير إكسيل (Excel)</span>
            </button>
          </div>

          {/* Confirm Handover */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            >
              تأكيد إغلاق الشيفت وتسليم العهدة
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
