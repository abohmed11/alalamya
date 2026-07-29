import { Invoice, StoreSettings, ShiftLog } from '../types';
import { formatArabicDateTime, formatCurrency } from './storage';

export function printInvoiceHTML(invoice: Invoice, settings: StoreSettings) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للتمكن من طباعة الفاتورة أو حفظها كـ PDF.');
    return;
  }

  const itemsRows = invoice.items
    .map(
      (item, idx) => `
    <tr>
      <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${idx + 1}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">
        ${item.brand} - ${item.modelName}
        <div style="font-size: 11px; color: #475569; font-weight: normal;">${item.type}</div>
      </td>
      <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; direction: ltr;">${item.dimensionsText}</td>
      <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${item.quantity}</td>
      <td style="text-align: left; border: 1px solid #cbd5e1; padding: 8px;">${formatCurrency(item.unitPrice)}</td>
      <td style="text-align: left; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${formatCurrency(item.totalPrice)}</td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة ${invoice.invoiceNumber} - ${settings.storeName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        body {
          font-family: 'Cairo', system-ui, sans-serif;
          direction: rtl;
          color: #0f172a;
          margin: 0;
          padding: 24px;
          background-color: #ffffff;
          -webkit-print-color-adjust: exact;
        }
        .invoice-card {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #1e293b;
          border-radius: 12px;
          padding: 24px;
          position: relative;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .brand-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .sub-title {
          font-size: 14px;
          color: #d97706;
          font-weight: 700;
          margin-top: 4px;
        }
        .inv-badge {
          background-color: #0f172a;
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          background-color: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .meta-item strong {
          color: #334155;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 13px;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          padding: 10px;
          border: 1px solid #0f172a;
        }
        .summary-box {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-top: 20px;
        }
        .totals-table {
          width: 320px;
          border-collapse: collapse;
        }
        .totals-table td {
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
        }
        .final-total {
          background-color: #fef3c7;
          font-weight: bold;
          font-size: 16px;
          color: #92400e;
        }
        .footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px dashed #cbd5e1;
          text-align: center;
          font-size: 12px;
          color: #64748b;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          font-size: 13px;
          font-weight: bold;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
          .invoice-card { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: center;">
        <button onclick="window.print()" style="background-color: #0f172a; color: white; border: none; padding: 10px 24px; font-size: 16px; border-radius: 8px; cursor: pointer; font-family: Cairo, sans-serif; font-weight: bold; margin-left: 10px;">🖨️ طباعة الفاتورة / حفظ كـ PDF</button>
        <button onclick="window.close()" style="background-color: #e2e8f0; color: #1e293b; border: none; padding: 10px 20px; font-size: 15px; border-radius: 8px; cursor: pointer; font-family: Cairo, sans-serif;">إغلاق</button>
      </div>

      <div class="invoice-card">
        <div class="header">
          <div>
            <h1 class="brand-title">👑 ${settings.storeName}</h1>
            <div class="sub-title">تحت إدارة: ${settings.managerName}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 4px;">📍 ${settings.address} | 📞 ${settings.phone1} ${settings.phone2 ? ' - ' + settings.phone2 : ''}</div>
          </div>
          <div class="inv-badge">
            فاتورة مبيعات
            <div style="font-size: 14px; font-weight: normal; margin-top: 4px;">${invoice.invoiceNumber}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <strong>اسم العميل:</strong> ${invoice.customerName || 'عميل نقدي'}
            <br>
            <strong>رقم الهاتف:</strong> ${invoice.customerPhone || 'غير مسجل'}
            <br>
            <strong>العنوان:</strong> ${invoice.customerAddress || 'استلام من المعرض'}
          </div>
          <div class="meta-item">
            <strong>التاريخ والوقت:</strong> ${formatArabicDateTime(invoice.date)}
            <br>
            <strong>الموظف المسئول:</strong> ${invoice.employeeName}
            <br>
            <strong>طريقة الدفع:</strong> ${
              invoice.paymentMethod === 'cash'
                ? 'نقدًا (كاش)'
                : invoice.paymentMethod === 'visa'
                ? 'دفع إلكتروني (فيزا)'
                : invoice.paymentMethod === 'partial'
                ? 'دفعة مقدمة + متبقي'
                : 'آجل / تقسيط'
            }
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>صنف المرتبة / الموديل</th>
              <th style="width: 170px;">المقاس والارتفاع</th>
              <th style="width: 60px;">الكمية</th>
              <th style="width: 100px;">سعر الوحدة</th>
              <th style="width: 110px;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="summary-box">
          <div style="flex: 1; font-size: 12px; color: #334155;">
            <strong>ملاحظات وشروط الفاتورة:</strong>
            <p style="margin: 4px 0; background: #f8fafc; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
              ${invoice.notes || 'لا توجد ملاحظات إضافية.'}
            </p>
            <p style="font-size: 11px; color: #64748b; margin-top: 8px;">
              • ضمان المراتب ساري بموجب هذه الفاتورة الأصلية.
              <br>• يرجى معاينة المراتب والمقاس جيداً قبل استلام الشحنة.
            </p>
          </div>

          <table class="totals-table">
            <tr>
              <td>المجموع الفرعي:</td>
              <td style="text-align: left; font-weight: bold;">${formatCurrency(invoice.subtotal)}</td>
            </tr>
            ${
              invoice.discountAmount > 0
                ? `<tr>
              <td style="color: #dc2626;">خصم خاص:</td>
              <td style="text-align: left; color: #dc2626; font-weight: bold;">- ${formatCurrency(invoice.discountAmount)}</td>
            </tr>`
                : ''
            }
            ${
              invoice.deliveryFee > 0
                ? `<tr>
              <td>مصاريف الشحن والتوصيل:</td>
              <td style="text-align: left;">+ ${formatCurrency(invoice.deliveryFee)}</td>
            </tr>`
                : ''
            }
            <tr class="final-total">
              <td>الصافي المطلوب:</td>
              <td style="text-align: left;">${formatCurrency(invoice.netTotal)}</td>
            </tr>
            <tr>
              <td style="color: #166534; font-weight: bold;">المبلغ المدفوع:</td>
              <td style="text-align: left; color: #166534; font-weight: bold;">${formatCurrency(invoice.paidAmount)}</td>
            </tr>
            ${
              invoice.remainingAmount > 0
                ? `<tr style="background-color: #fef2f2; color: #991b1b; font-weight: bold;">
              <td>المبلغ المتبقي / الآجل:</td>
              <td style="text-align: left;">${formatCurrency(invoice.remainingAmount)}</td>
            </tr>`
                : ''
            }
          </table>
        </div>

        <div class="signatures">
          <div>توقيع العميل بالتسلم: .......................................</div>
          <div>توقيع وتصديق المدير (إسلام شومان): .......................................</div>
        </div>

        <div class="footer">
          ${settings.receiptFooterText}
          <div style="font-size: 10px; margin-top: 4px; color: #94a3b8;">تم إصدار هذا المستند عبر نظام إدارة العالمية للمراتب المطور</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function printShiftReportHTML(shift: ShiftLog, invoices: Invoice[], settings: StoreSettings) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  const shiftInvoices = invoices.filter((i) => i.shiftId === shift.id);

  const invRows = shiftInvoices
    .map(
      (inv) => `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${inv.invoiceNumber}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px;">${inv.customerName}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">${formatCurrency(inv.netTotal)}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: left; color: #166534;">${formatCurrency(inv.paidAmount)}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${inv.paymentMethod}</td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير شيفت ${shift.employeeName} - ${settings.storeName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 24px; color: #0f172a; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .stat-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; }
        .stat-val { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        th { background: #0f172a; color: white; padding: 8px; }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 16px;">
        <button onclick="window.print()" style="background: #0f172a; color: white; padding: 8px 20px; border-radius: 6px; border: none; cursor: pointer;">🖨️ طباعة التقرير / حفظ كـ PDF</button>
      </div>

      <div class="header">
        <h2 style="margin: 0;">👑 ${settings.storeName} - تقرير إغلاق الشيفت</h2>
        <div>تحت إدارة: ${settings.managerName}</div>
        <div style="margin-top: 6px; font-weight: bold; color: #d97706;">الموظف صاحب الشيفت: ${shift.employeeName}</div>
        <div style="font-size: 12px; color: #64748b;">تاريخ الشيفت: ${formatArabicDateTime(shift.startTime)}</div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div style="font-size: 12px; color: #64748b;">إجمالي المبيعات</div>
          <div class="stat-val">${formatCurrency(shift.totalSales)}</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 12px; color: #64748b;">النقدي بالمحفظة (كاش)</div>
          <div class="stat-val" style="color: #166534;">${formatCurrency(shift.totalCashSales)}</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 12px; color: #64748b;">مدفوعات الفيزا</div>
          <div class="stat-val" style="color: #2563eb;">${formatCurrency(shift.totalVisaSales)}</div>
        </div>
      </div>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 20px;">
        <strong>مطابقة النقدية:</strong> العهدة الافتتاحية (${shift.startingCash} ج.م) + المبيعات النقدية (${shift.totalCashSales} ج.م) = 
        <span style="font-weight: bold; color: #92400e; font-size: 15px;">المبلغ المتوقع بالخزينة: ${shift.startingCash + shift.totalCashSales} ج.م</span>
        ${shift.actualEndingCash !== undefined ? `<br>المبلغ الفعلي المستلم: <strong>${shift.actualEndingCash} ج.م</strong>` : ''}
      </div>

      <h3>فواتير الشيفت الصادرة (${shiftInvoices.length} فاتورة)</h3>
      <table>
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>اسم العميل</th>
            <th>الإجمالي</th>
            <th>المدفوع</th>
            <th>طريقة الدفع</th>
          </tr>
        </thead>
        <tbody>
          ${invRows}
        </tbody>
      </table>

      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
        <div>توقيع الموظف (${shift.employeeName}): ..............................</div>
        <div>اعتماد المدير (إسلام شومان): ..............................</div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
