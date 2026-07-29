import { SystemData, Invoice } from '../types';
import { INITIAL_DATA } from '../data/initialData';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'EL_ALAMIA_MATTRESSES_DATA_V2';
const IDB_NAME = 'ElAlamiaStoreDB';
const IDB_STORE = 'system_store';
const IDB_KEY = 'latest_system_data';

// --- IndexedDB Helper Functions ---
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToIndexedDB(data: SystemData): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(data, IDB_KEY);
  } catch (err) {
    console.warn('IndexedDB save warning:', err);
  }
}

export async function loadFromIndexedDB(): Promise<SystemData | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('IndexedDB load warning:', err);
    return null;
  }
}

export function loadSystemData(): SystemData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveSystemData(INITIAL_DATA);
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw) as SystemData;
    // Fallback integrity checks
    if (!parsed.items || !parsed.invoices || !parsed.employees) {
      return INITIAL_DATA;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading data from localStorage', err);
    return INITIAL_DATA;
  }
}

// --- Local File Handle Auto-Sync (File System Access API) ---
let fileHandle: any = null;
let excelFileHandle: any = null;

export async function selectAutoSaveFile(): Promise<string | null> {
  try {
    if ('showSaveFilePicker' in window) {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'elalamia_database_autosave.json',
        types: [{
          description: 'JSON Database File',
          accept: { 'application/json': ['.json'] }
        }]
      });
      fileHandle = handle;
      return handle.name;
    } else {
      throw new Error('متصفحك لا يدعم وصول الملفات المباشر (File System Access API). يمكنك استخدام متصفح Chrome أو Edge.');
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('File picker error:', err);
    }
    return null;
  }
}

export async function selectAutoSaveExcelFile(currentData?: SystemData): Promise<string | null> {
  try {
    if ('showSaveFilePicker' in window) {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `قاعدة_بيانات_المحل_على_سطح_المكتب.xlsx`,
        types: [{
          description: 'جدول إكسيل Microsoft Excel (.xlsx)',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
        }]
      });
      excelFileHandle = handle;
      
      // Write initial state immediately to the created Excel file on Desktop
      if (currentData) {
        try {
          const wb = buildExcelWorkbook(currentData);
          const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const writable = await handle.createWritable();
          await writable.write(arrayBuffer);
          await writable.close();
        } catch (e) {
          console.warn('Failed to write initial Excel content:', e);
        }
      }

      return handle.name;
    } else {
      throw new Error('متصفحك لا يدعم وصول الملفات المباشر (File System Access API). استخدم متصفح Chrome أو Edge.');
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('Excel File picker error:', err);
    }
    return null;
  }
}

export function getConnectedExcelFileName(): string | null {
  return excelFileHandle?.name || null;
}

export async function saveToLocalFileHandle(data: SystemData): Promise<boolean> {
  let success = false;
  
  // 1. Sync JSON database file handle if connected
  if (fileHandle) {
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      success = true;
    } catch (err) {
      console.warn('Auto save to JSON file handle failed:', err);
    }
  }

  // 2. Sync Excel (.xlsx) file handle if connected
  if (excelFileHandle) {
    try {
      const wb = buildExcelWorkbook(data);
      const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const writable = await excelFileHandle.createWritable();
      await writable.write(arrayBuffer);
      await writable.close();
      success = true;
    } catch (err) {
      console.warn('Auto save to Excel file handle failed:', err);
    }
  }

  return success;
}

export function saveSystemData(data: SystemData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Save to IndexedDB for permanent 100% offline desktop browser storage
    saveToIndexedDB(data);
    // Auto sync to selected local file handle if connected
    saveToLocalFileHandle(data);
  } catch (err) {
    console.error('Error saving data to storage', err);
  }
}

export function resetSystemData(): SystemData {
  saveSystemData(INITIAL_DATA);
  return INITIAL_DATA;
}

export function generateNextInvoiceNumber(invoices: Invoice[]): string {
  if (!invoices || invoices.length === 0) return 'INV-1001';
  
  const numbers = invoices
    .map((inv) => {
      const parts = inv.invoiceNumber.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      return isNaN(num) ? 0 : num;
    })
    .filter((n) => n > 0);

  const maxNum = numbers.length > 0 ? Math.max(...numbers) : 1000;
  const nextNum = maxNum + 1;
  return `INV-${nextNum}`;
}

export function formatCurrency(amount: number, symbol: string = 'ج.م'): string {
  const formatted = new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: 0,
  }).format(amount || 0);
  return `${formatted} ${symbol}`;
}

export function formatArabicDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('ar-EG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatArabicDateShort(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function buildExcelWorkbook(data: SystemData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. المنتجات والمخزون
  const productsData = (data.items || []).map((item, idx) => ({
    'م': idx + 1,
    'الكود / SKU': item.sku || '',
    'الماركة / الشركة': item.brand || '',
    'اسم موديل المرتبة': item.modelName || '',
    'نوع المرتبة': item.type || '',
    'المقاس (العرض×الطول)': `${item.width}×${item.length} سم`,
    'الارتفاع (سم)': item.height || 0,
    'سعر التكلفة (ج.م)': item.costPrice || 0,
    'سعر البيع (ج.م)': item.sellingPrice || 0,
    'الكمية الحالية بالمخزن': item.stockQuantity || 0,
    'حد التنبيه': item.minStockAlert || 0,
    'إجمالي التكلفة (ج.م)': (item.costPrice || 0) * (item.stockQuantity || 0),
    'إجمالي البيع (ج.م)': (item.sellingPrice || 0) * (item.stockQuantity || 0),
    'حالة المخزون': (item.stockQuantity || 0) <= (item.minStockAlert || 0) ? 'نقص بالمخزن ⚠️' : 'متوفر ✅'
  }));
  const wsProducts = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'المنتجات والمخزون');

  // 2. المبيعات والفواتير
  const invoicesData = (data.invoices || []).map((inv, idx) => ({
    'م': idx + 1,
    'رقم الفاتورة': inv.invoiceNumber || '',
    'التاريخ والوقت': formatArabicDateTime(inv.date),
    'اسم العميل': inv.customerName || '',
    'رقم هاتف العميل': inv.customerPhone || '',
    'إجمالي الفاتورة (ج.م)': inv.subtotal || 0,
    'الخصم (ج.م)': inv.discountAmount || 0,
    'مصاريف التوصيل (ج.م)': inv.deliveryFee || 0,
    'الصافي النهائي (ج.م)': inv.netTotal || 0,
    'المدفوع (ج.م)': inv.paidAmount || 0,
    'المتبقي / المتبقي آجل (ج.م)': inv.remainingAmount || 0,
    'طريقة الدفع': inv.paymentMethod === 'cash' ? 'نقداً (كاش)' : inv.paymentMethod === 'visa' ? 'فيزا / كارت' : inv.paymentMethod === 'partial' ? 'دفعة + آجل' : 'تقسيط / آجل',
    'الموظف البائع': inv.employeeName || '',
    'حالة الفاتورة': inv.status === 'completed' ? 'مكتملة ✅' : 'ملغاة ❌',
    'ملاحظات': inv.notes || ''
  }));
  const wsInvoices = XLSX.utils.json_to_sheet(invoicesData);
  XLSX.utils.book_append_sheet(wb, wsInvoices, 'المبيعات والفواتير');

  // 3. تفاصيل أصناف الفواتير
  const invoiceItemsData: any[] = [];
  (data.invoices || []).forEach((inv) => {
    (inv.items || []).forEach((item) => {
      invoiceItemsData.push({
        'رقم الفاتورة': inv.invoiceNumber,
        'التاريخ': formatArabicDateShort(inv.date),
        'اسم العميل': inv.customerName,
        'الماركة': item.brand,
        'اسم الموديل': item.modelName,
        'النوع': item.type,
        'المقاس والارتفاع': item.dimensionsText,
        'الكمية المباعة': item.quantity,
        'سعر الوحدة (ج.م)': item.unitPrice,
        'الإجمالي (ج.م)': item.totalPrice
      });
    });
  });
  const wsInvoiceItems = XLSX.utils.json_to_sheet(invoiceItemsData);
  XLSX.utils.book_append_sheet(wb, wsInvoiceItems, 'تفاصيل الأصناف المباعة');

  // 4. الموظفين
  const employeesData = (data.employees || []).map((emp, idx) => ({
    'م': idx + 1,
    'اسم الموظف': emp.name || '',
    'الدور / الصلاحية': emp.role === 'admin' ? 'مدير النظام' : emp.role === 'accountant' ? 'محاسب' : 'بائع',
    'رقم الهاتف': emp.phone || '',
    'الحالة': emp.isActive ? 'يعمل 🟢' : 'موقوف 🔴'
  }));
  const wsEmployees = XLSX.utils.json_to_sheet(employeesData);
  XLSX.utils.book_append_sheet(wb, wsEmployees, 'الموظفين والصلاحيات');

  return wb;
}

export function exportSystemDataToExcel(data: SystemData): void {
  try {
    const wb = buildExcelWorkbook(data);
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `مؤسسة_العالمية_تقرير_إكسيل_شامل_${dateStr}.xlsx`);
  } catch (err) {
    console.error('Error exporting excel:', err);
    alert('حدث خطأ أثناء تصدير ملف الإكسيل.');
  }
}

export function exportBackupJSON(data: SystemData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `العالمية_للمراتب_نسخة_احتياطية_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importBackupJSON(file: File): Promise<SystemData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as SystemData;
        if (parsed.items && parsed.invoices && parsed.employees) {
          saveSystemData(parsed);
          resolve(parsed);
        } else {
          reject(new Error('الملف المحدد لا يحتوي على البيانات المطلوبة لنظام العالمية للمراتب.'));
        }
      } catch (err) {
        reject(new Error('حدث خطأ أثناء قراءة الملف. تأكد أنه ملف JSON صحيح.'));
      }
    };
    reader.onerror = () => reject(new Error('تعذر قراءة الملف.'));
    reader.readAsText(file);
  });
}
