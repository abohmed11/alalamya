import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ShoppingCart,
  User,
  Phone,
  MapPin,
  Tag,
  DollarSign,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Percent,
  CreditCard,
  Building,
} from 'lucide-react';
import {
  MattressItem,
  InvoiceItem,
  Invoice,
  Employee,
  StoreSettings,
  ShiftLog,
  PaymentMethod,
} from '../types';
import { formatCurrency, generateNextInvoiceNumber } from '../utils/storage';
import { printInvoiceHTML } from '../utils/pdfExport';

interface InvoicingViewProps {
  items: MattressItem[];
  invoices: Invoice[];
  activeEmployee: Employee;
  activeShift: ShiftLog | null;
  settings: StoreSettings;
  onCreateInvoice: (newInvoice: Invoice) => void;
}

export const InvoicingView: React.FC<InvoicingViewProps> = ({
  items,
  invoices,
  activeEmployee,
  activeShift,
  settings,
  onCreateInvoice,
}) => {
  // Search & Filter State for Warehouse items
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');

  // Customer Info State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Cart State
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);

  // Financial Adjustments State
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<string>('');

  // Modals & Feedback State
  const [lastCreatedInvoice, setLastCreatedInvoice] = useState<Invoice | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // Filtered Warehouse Mattresses
  const filteredMattresses = useMemo(() => {
    return items.filter((item) => {
      const matchQuery =
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${item.width}`.includes(searchQuery) ||
        `${item.length}`.includes(searchQuery) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchBrand = selectedBrand === 'ALL' || item.brand === selectedBrand;

      return matchQuery && matchBrand;
    });
  }, [items, searchQuery, selectedBrand]);

  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.brand)));
  }, [items]);

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percentage') {
      return (subtotal * (discountValue || 0)) / 100;
    }
    return discountValue || 0;
  }, [subtotal, discountType, discountValue]);

  const netTotal = useMemo(() => {
    const calc = subtotal - discountAmount + (deliveryFee || 0);
    return calc < 0 ? 0 : calc;
  }, [subtotal, discountAmount, deliveryFee]);

  const effectivePaidAmount = useMemo(() => {
    if (paidAmount === '') return netTotal;
    const p = parseFloat(paidAmount);
    return isNaN(p) ? 0 : p;
  }, [paidAmount, netTotal]);

  const remainingAmount = useMemo(() => {
    const rem = netTotal - effectivePaidAmount;
    return rem > 0 ? rem : 0;
  }, [netTotal, effectivePaidAmount]);

  // Cart Operations
  const addToCart = (mattress: MattressItem) => {
    if (mattress.stockQuantity <= 0) {
      alert(`عذراً! مرتبة (${mattress.brand} - ${mattress.modelName}) غير متوفرة حالياً في المخزن.`);
      return;
    }

    const existingIdx = cartItems.findIndex((ci) => ci.mattressId === mattress.id);
    if (existingIdx > -1) {
      const currentQty = cartItems[existingIdx].quantity;
      if (currentQty + 1 > mattress.stockQuantity) {
        alert(`الكمية المتاحة بالمخزن هي (${mattress.stockQuantity}) قطعة فقط.`);
        return;
      }
      const updated = [...cartItems];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].totalPrice = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      setCartItems(updated);
    } else {
      const newItem: InvoiceItem = {
        mattressId: mattress.id,
        brand: mattress.brand,
        modelName: mattress.modelName,
        type: mattress.type,
        dimensionsText: `${mattress.width}×${mattress.length} سم - ارتفاع ${mattress.height} سم`,
        unitPrice: mattress.sellingPrice,
        costPrice: mattress.costPrice,
        quantity: 1,
        totalPrice: mattress.sellingPrice,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateCartQty = (mattressId: string, delta: number) => {
    const mattress = items.find((m) => m.id === mattressId);
    if (!mattress) return;

    setCartItems((prev) =>
      prev
        .map((ci) => {
          if (ci.mattressId === mattressId) {
            const newQty = ci.quantity + delta;
            if (newQty > mattress.stockQuantity) {
              alert(`لا توجد كمية كافية بالمخزن. المتوفر حالياً: ${mattress.stockQuantity}`);
              return ci;
            }
            if (newQty <= 0) return null;
            return {
              ...ci,
              quantity: newQty,
              totalPrice: newQty * ci.unitPrice,
            };
          }
          return ci;
        })
        .filter(Boolean) as InvoiceItem[]
    );
  };

  const removeFromCart = (mattressId: string) => {
    setCartItems(cartItems.filter((ci) => ci.mattressId !== mattressId));
  };

  // Create Invoice Action
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert('يرجى اختيار مرتبة واحدة على الأقل لإضافتها إلى الفاتورة!');
      return;
    }

    const nextInvNumber = generateNextInvoiceNumber(invoices);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: nextInvNumber,
      date: new Date().toISOString(),
      customerName: customerName.trim() || 'عميل نقدي',
      customerPhone: customerPhone.trim() || 'غير مسجل',
      customerAddress: customerAddress.trim(),
      items: cartItems,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      deliveryFee,
      taxAmount: 0,
      netTotal,
      paidAmount: effectivePaidAmount,
      remainingAmount,
      paymentMethod,
      notes: invoiceNotes.trim(),
      employeeId: activeEmployee.id,
      employeeName: activeEmployee.name,
      shiftId: activeShift ? activeShift.id : 'shift-default',
      status: 'completed',
    };

    onCreateInvoice(newInvoice);
    setLastCreatedInvoice(newInvoice);
    setSuccessToast(true);

    // Reset Form
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setInvoiceNotes('');
    setDiscountValue(0);
    setDeliveryFee(0);
    setPaidAmount('');

    setTimeout(() => {
      setSuccessToast(false);
    }, 5000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Toast Alert */}
      {successToast && lastCreatedInvoice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-sm text-slate-900">
                تم حفظ الفاتورة بنجاح رقم ({lastCreatedInvoice.invoiceNumber}) وتخصيم الكميات من المخزن!
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                العميل: {lastCreatedInvoice.customerName} | الإجمالي: {formatCurrency(lastCreatedInvoice.netTotal)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => printInvoiceHTML(lastCreatedInvoice, settings)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> طباعة الفاتورة الآن
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Mattress Stock Selection (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">معرض المراتب والمخزون المتاح</h2>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium border border-slate-200">
              {filteredMattresses.length} صنف متوفر
            </span>
          </div>

          {/* Search & Brand Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالشركة، الموديل، النوع أو المقاس (مثلا: 160)..."
                className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
            </div>

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-xs"
            >
              <option value="ALL">جميع الماركات</option>
              {uniqueBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Mattresses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredMattresses.map((item) => {
              const inCart = cartItems.find((ci) => ci.mattressId === item.id);
              const isLowStock = item.stockQuantity <= item.minStockAlert;
              const isOutStock = item.stockQuantity <= 0;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                    isOutStock
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : inCart
                      ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                        {item.brand}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          isOutStock
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : isLowStock
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}
                      >
                        {isOutStock ? 'نفذت الكمية' : `متبقي: ${item.stockQuantity} قطعة`}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-1">
                      {item.modelName}
                    </h3>

                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2 font-medium">
                      <span>النوع: {item.type}</span>
                      <span className="text-slate-700 font-semibold dir-ltr">
                        📏 {item.width}×{item.length} سم (ع {item.height} سم)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">سعر البيع:</div>
                      <div className="text-base font-bold text-slate-900">
                        {formatCurrency(item.sellingPrice)}
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(item)}
                      disabled={isOutStock}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                        isOutStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : inCart
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{inCart ? `إضافة (${inCart.quantity})` : 'إضافة للفاتورة'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredMattresses.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400 text-xs">
                لا توجد مراتب مطابقة للبحث المحدد في المخزن.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Invoice Summary & Customer Checkout Form (5 cols) */}
        <form
          onSubmit={handleSubmitInvoice}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4"
        >
          {/* Form Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">محتويات الفاتورة الجديدة</h2>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-md font-bold">
              {generateNextInvoiceNumber(invoices)}
            </span>
          </div>

          {/* Cart Items List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {cartItems.map((ci) => (
              <div
                key={ci.mattressId}
                className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {ci.brand} - {ci.modelName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {ci.dimensionsText} | {formatCurrency(ci.unitPrice)}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => updateCartQty(ci.mattressId, -1)}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-blue-600 px-1">
                    {ci.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQty(ci.mattressId, 1)}
                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="text-xs font-bold text-slate-900 w-20 text-left">
                  {formatCurrency(ci.totalPrice)}
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(ci.mattressId)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {cartItems.length === 0 && (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                انقر على المراتب في جهة اليمين لإضافتها إلى هذه الفاتورة.
              </div>
            )}
          </div>

          {/* Customer Details Inputs */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" /> بيانات العميل:
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="اسم العميل..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
              <input
                type="tel"
                placeholder="رقم الموبايل..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <input
              type="text"
              placeholder="العنوان وملاحظات التوصيل..."
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Financial Adjustments & Payment Method */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2">
              {/* Discount */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  الخصم للعميل:
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="0"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setDiscountType(discountType === 'amount' ? 'percentage' : 'amount')}
                    className="bg-slate-100 text-slate-700 px-2 rounded-xl text-xs font-bold border border-slate-200"
                  >
                    {discountType === 'amount' ? 'ج.م' : '%'}
                  </button>
                </div>
              </div>

              {/* Delivery Fee */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  مصاريف التوصيل:
                </label>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee || ''}
                  onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  placeholder="0 ج.م"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                طريقة الدفع:
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-semibold">
                {[
                  { id: 'cash', label: '💵 كاش' },
                  { id: 'visa', label: '💳 فيزا' },
                  { id: 'partial', label: '🤝 دفعة+آجل' },
                  { id: 'installment', label: '📝 تقسيط/آجل' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`py-2 rounded-xl border transition cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Paid Amount Input for Partial or Deferred */}
            {(paymentMethod === 'partial' || paymentMethod === 'installment') && (
              <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs text-blue-900 font-semibold">
                  <span>المبلغ المدفوع الآن:</span>
                  <span>المتبقي آجل: {formatCurrency(remainingAmount)}</span>
                </div>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={`الصافي هو ${netTotal} ج.م`}
                  className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                />
              </div>
            )}
          </div>

          {/* Totals Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>المجموع الفرعي:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>الخصم المطبق:</span>
                <span>- {formatCurrency(discountAmount)}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>مصاريف الشحن والتوصيل:</span>
                <span>+ {formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>الصافي النهائي:</span>
              <span className="text-blue-700">{formatCurrency(netTotal)}</span>
            </div>
          </div>

          {/* Submit Action Buttons */}
          <button
            type="submit"
            disabled={cartItems.length === 0}
            className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              cartItems.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>حفظ الفاتورة وتخصيم من المخزن</span>
          </button>
        </form>
      </div>
    </div>
  );
};
