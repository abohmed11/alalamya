import { integer, json, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users / Employees table
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(), // Optional Firebase UID or external ID
  name: text('name').notNull(),
  pin: text('pin').notNull(),
  role: text('role').notNull().default('sales'), // 'admin' | 'sales'
  phone: text('phone'),
  avatarColor: text('avatar_color'),
  permissions: json('permissions').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products / Mattresses table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  modelName: text('model_name'),
  dimensions: text('dimensions'), // e.g. "160x200x30"
  costPrice: numeric('cost_price').notNull().default('0'),
  sellingPrice: numeric('selling_price').notNull().default('0'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  category: text('category').default('مراتب'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Shifts table
export const shifts = pgTable('shifts', {
  id: serial('id').primaryKey(),
  employeeName: text('employee_name').notNull(),
  employeeId: integer('employee_id'),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  startingCash: numeric('starting_cash').notNull().default('0'),
  totalSales: numeric('total_sales').notNull().default('0'),
  totalCashSales: numeric('total_cash_sales').notNull().default('0'),
  totalVisaSales: numeric('total_visa_sales').notNull().default('0'),
  invoicesCount: integer('invoices_count').notNull().default(0),
  actualCash: numeric('actual_cash'),
  difference: numeric('difference'),
  status: text('status').notNull().default('active'), // 'active' | 'closed'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Invoices table
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  shiftId: integer('shift_id'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  customerAddress: text('customer_address'),
  date: text('date').notNull(),
  items: json('items').notNull().default([]),
  subtotal: numeric('subtotal').notNull().default('0'),
  discount: numeric('discount').notNull().default('0'),
  netTotal: numeric('net_total').notNull().default('0'),
  paidAmount: numeric('paid_amount').notNull().default('0'),
  remainingAmount: numeric('remaining_amount').notNull().default('0'),
  paymentMethod: text('payment_method').notNull().default('كاش'),
  employeeName: text('employee_name').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('مكتملة'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Store Settings table
export const storeSettings = pgTable('store_settings', {
  id: serial('id').primaryKey(),
  storeName: text('store_name').notNull(),
  managerName: text('manager_name').notNull(),
  phone1: text('phone1').notNull(),
  phone2: text('phone2'),
  address: text('address').notNull(),
  commercialRegistry: text('commercial_registry'),
  taxCard: text('tax_card'),
  receiptFooterText: text('receipt_footer_text'),
  updatedAt: timestamp('updated_at').defaultNow(),
});
