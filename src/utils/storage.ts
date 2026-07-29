import { SystemData, Invoice } from '../types';
import { INITIAL_DATA } from '../data/initialData';

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

export async function saveToLocalFileHandle(data: SystemData): Promise<boolean> {
  if (!fileHandle) return false;
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return true;
  } catch (err) {
    console.warn('Auto save to local file handle failed:', err);
    return false;
  }
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
