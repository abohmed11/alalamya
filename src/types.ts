export type PermissionKey =
  | 'create_invoices'
  | 'view_archive'
  | 'manage_warehouse'
  | 'edit_prices'
  | 'view_reports'
  | 'access_admin'
  | 'cancel_invoices'
  | 'apply_discounts';

export interface EmployeePermission {
  key: PermissionKey;
  label: string;
  description: string;
}

export interface Employee {
  id: string;
  name: string;
  role: 'admin' | 'sales' | 'accountant';
  pin: string;
  phone?: string;
  avatarColor?: string;
  permissions: PermissionKey[];
  isActive: boolean;
}

export interface MattressItem {
  id: string;
  sku: string; // e.g. JAN-160-25
  brand: string; // e.g. يانسن, فوربد, تاكي, المأمون, العالمية
  modelName: string; // e.g. ماريوت, اكسترا, كتارا, هاي كلاس, ميديال, بوكيت
  type: string; // e.g. سوست منفصلة, سوست متصلة, إسفنج مضغوط (ميديكال), لاتكس طبي, ميموري فوم
  width: number; // e.g. 100, 120, 150, 160, 180, 200 cm
  length: number; // e.g. 190, 195, 200 cm
  height: number; // e.g. 20, 25, 30, 32 cm
  stockQuantity: number; // الكمية المتوفرة في المخزن
  costPrice: number; // سعر التكلفة/الشراء
  sellingPrice: number; // سعر البيع للمستهلك
  minStockAlert: number; // حد التنبيه بانخفاض المخزون (مثلا 2)
  notes?: string;
  updatedAt: string;
}

export interface InvoiceItem {
  mattressId: string;
  brand: string;
  modelName: string;
  type: string;
  dimensionsText: string; // e.g. 160×195 سم - ارتفاع 25 سم
  unitPrice: number;
  costPrice: number;
  quantity: number;
  totalPrice: number;
}

export type PaymentMethod = 'cash' | 'visa' | 'installment' | 'partial';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-1001
  date: string; // ISO String
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'amount' | 'percentage';
  discountValue: number;
  discountAmount: number; // Value in EGP
  deliveryFee: number;
  taxAmount: number;
  netTotal: number;
  paidAmount: number;
  remainingAmount: number; // For deferred/installment sales
  paymentMethod: PaymentMethod;
  notes?: string;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  status: 'completed' | 'cancelled';
  cancelledBy?: string;
  cancelReason?: string;
}

export interface ShiftLog {
  id: string;
  employeeId: string;
  employeeName: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  status: 'active' | 'closed';
  startingCash: number;
  expectedEndingCash: number;
  actualEndingCash?: number;
  notes?: string;
  totalSales: number;
  totalCashSales: number;
  totalVisaSales: number;
  totalCreditSales: number;
  invoicesCount: number;
}

export interface StoreSettings {
  storeName: string; // العالمية للمراتب
  managerName: string; // إسلام شومان
  phone1: string;
  phone2?: string;
  address: string;
  commercialRegistry?: string; // السجل التجاري
  taxCard?: string; // البطاقة الضريبية
  receiptFooterText: string;
  enableStockDeduction: boolean;
  lowStockAlertThreshold: number;
  currencySymbol: string; // ج.م
}

export interface SystemData {
  items: MattressItem[];
  invoices: Invoice[];
  employees: Employee[];
  shifts: ShiftLog[];
  settings: StoreSettings;
  activeEmployeeId: string;
  activeShiftId: string | null;
}
