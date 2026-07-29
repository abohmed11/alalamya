import * as XLSX from 'xlsx';
import { Invoice, MattressItem, ShiftLog, StoreSettings } from '../types';
import { formatArabicDateShort } from './storage';

export function exportInvoicesToExcel(invoices: Invoice[], settings: StoreSettings) {
  const data = invoices.map((inv) => ({
    'رقم الفاتورة': inv.invoiceNumber,
    'التاريخ': formatArabicDateShort(inv.date),
    'اسم العميل': inv.customerName,
    'رقم الهاتف': inv.customerPhone,
    'إجمالي الأصناف': inv.items.reduce((acc, i) => acc + i.quantity, 0),
    'المبلغ الإجمالي (ج.م)': inv.subtotal,
    'الخصم (ج.م)': inv.discountAmount,
    'مصاريف التوصيل (ج.م)': inv.deliveryFee,
    'الصافي النهائي (ج.م)': inv.netTotal,
    'المبلغ المدفوع (ج.م)': inv.paidAmount,
    'المبلغ المتبقي (ج.م)': inv.remainingAmount,
    'طريقة الدفع': inv.paymentMethod === 'cash' ? 'نقدًا' : inv.paymentMethod === 'visa' ? 'فيزا' : inv.paymentMethod === 'partial' ? 'دفعة + آجل' : 'تقسيط/آجل',
    'الموظف المسئول': inv.employeeName,
    'الحالة': inv.status === 'completed' ? 'مكتملة' : 'ملغاة',
    'ملاحظات': inv.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الفواتير');

  const fileName = `فواتير_العالمية_للمراتب_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportInventoryToExcel(items: MattressItem[]) {
  const data = items.map((item) => ({
    'الكود / SKU': item.sku,
    'الماركة / الشركة': item.brand,
    'اسم الموديل': item.modelName,
    'نوع المرتبة': item.type,
    'العرض (سم)': item.width,
    'الطول (سم)': item.length,
    'الارتفاع (سم)': item.height,
    'المقاس الكامل': `${item.width}×${item.length} سم (ارتفاع ${item.height} سم)`,
    'الكمية بالمخزن': item.stockQuantity,
    'سعر التكلفة (ج.م)': item.costPrice,
    'سعر البيع (ج.م)': item.sellingPrice,
    'إجمالي قيمة التكلفة (ج.م)': item.costPrice * item.stockQuantity,
    'إجمالي قيمة البيع (ج.م)': item.sellingPrice * item.stockQuantity,
    'ملاحظات': item.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'جرد المخزن');

  const fileName = `تقرير_مخزن_العالمية_للمراتب_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportShiftReportToExcel(shift: ShiftLog, invoices: Invoice[]) {
  const shiftInvoices = invoices.filter((i) => i.shiftId === shift.id);

  const summary = [
    { 'البيان': 'اسم الموظف / صاحب الشيفت', 'القيمة': shift.employeeName },
    { 'البيان': 'وقت بدء الشيفت', 'القيمة': formatArabicDateShort(shift.startTime) },
    { 'البيان': 'حالة الشيفت', 'القيمة': shift.status === 'active' ? 'نشط حالياً' : 'مغلق' },
    { 'البيان': 'المبلغ الافتتاحي بالخزينة', 'القيمة': `${shift.startingCash} ج.م` },
    { 'البيان': 'إجمالي المبيعات', 'القيمة': `${shift.totalSales} ج.م` },
    { 'البيان': 'المبيعات النقدية (كاش)', 'القيمة': `${shift.totalCashSales} ج.م` },
    { 'البيان': 'مبيعات الفيزا (شبكة)', 'القيمة': `${shift.totalVisaSales} ج.م` },
    { 'البيان': 'المبالغ المتبقية / الآجلة', 'القيمة': `${shift.totalCreditSales} ج.م` },
    { 'البيان': 'عدد الفواتير الصادرة', 'القيمة': shift.invoicesCount },
  ];

  const invList = shiftInvoices.map((inv) => ({
    'رقم الفاتورة': inv.invoiceNumber,
    'اسم العميل': inv.customerName,
    'رقم الهاتف': inv.customerPhone,
    'صافي الفاتورة (ج.م)': inv.netTotal,
    'المدفوع (ج.م)': inv.paidAmount,
    'المتبقي (ج.م)': inv.remainingAmount,
    'طريقة الدفع': inv.paymentMethod,
  }));

  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.json_to_sheet(summary);
  const invSheet = XLSX.utils.json_to_sheet(invList);

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص الشيفت');
  XLSX.utils.book_append_sheet(workbook, invSheet, 'فواتير الشيفت');

  const fileName = `تقرير_شيفت_${shift.employeeName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportPeriodReportToExcel(periodTitle: string, stats: any, invoices: Invoice[]) {
  const summary = [
    { 'البيان': 'التقرير المالية للفترة', 'القيمة': periodTitle },
    { 'البيان': 'إجمالي المبيعات (ج.م)', 'القيمة': stats.totalSales },
    { 'البيان': 'تقدير صافي الأرباح (ج.م)', 'القيمة': stats.estimatedProfit },
    { 'البيان': 'عدد الفواتير', 'القيمة': stats.invoicesCount },
    { 'البيان': 'إجمالي عدد المراتب المباعة', 'القيمة': stats.totalMattressesSold },
    { 'البيان': 'المحُصّل كاش (ج.م)', 'القيمة': stats.totalCash },
    { 'البيان': 'المحُصّل فيزا (ج.م)', 'القيمة': stats.totalVisa },
    { 'البيان': 'المبالغ الآجلة/المتبقية (ج.م)', 'القيمة': stats.totalCredit },
  ];

  const details = invoices.map((inv) => ({
    'رقم الفاتورة': inv.invoiceNumber,
    'التاريخ': formatArabicDateShort(inv.date),
    'اسم العميل': inv.customerName,
    'صافي الفاتورة': inv.netTotal,
    'المدفوع': inv.paidAmount,
    'المتبقي': inv.remainingAmount,
    'الموظف': inv.employeeName,
  }));

  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.json_to_sheet(summary);
  const detailsSheet = XLSX.utils.json_to_sheet(details);

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص التقرير');
  XLSX.utils.book_append_sheet(workbook, detailsSheet, 'تفاصيل الفواتير');

  const fileName = `تقرير_${periodTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
