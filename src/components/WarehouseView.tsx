import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  DollarSign,
  TrendingUp,
  X,
  CheckCircle2,
  Tag,
  Maximize2,
} from 'lucide-react';
import { MattressItem, Employee } from '../types';
import { formatCurrency } from '../utils/storage';
import { exportInventoryToExcel } from '../utils/excelExport';

interface WarehouseViewProps {
  items: MattressItem[];
  activeEmployee: Employee;
  onAddItem: (newItem: MattressItem) => void;
  onUpdateItem: (updatedItem: MattressItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({
  items,
  activeEmployee,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MattressItem | null>(null);

  // Form Fields Single Item
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('العالمية (El-Alamia Special)');
  const [modelName, setModelName] = useState('');
  const [type, setType] = useState('سوست منفصلة');
  const [width, setWidth] = useState<number>(160);
  const [length, setLength] = useState<number>(195);
  const [height, setHeight] = useState<number>(25);
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [costPrice, setCostPrice] = useState<number>(3000);
  const [sellingPrice, setSellingPrice] = useState<number>(4500);
  const [minStockAlert, setMinStockAlert] = useState<number>(2);
  const [notes, setNotes] = useState('');

  // Batch Sizes Form Fields
  const [batchBrand, setBatchBrand] = useState('يانسن');
  const [batchModelName, setBatchModelName] = useState('');
  const [batchType, setBatchType] = useState('سوست منفصلة');
  const [batchLength, setBatchLength] = useState<number>(195);
  const [batchHeight, setBatchHeight] = useState<number>(25);
  const [baseCost160, setBaseCost160] = useState<number>(3000);
  const [basePrice160, setBasePrice160] = useState<number>(4500);
  const [defaultStockPerSize, setDefaultStockPerSize] = useState<number>(5);

  // Available width presets (widths in cm)
  const STANDARD_WIDTHS = [90, 100, 110, 120, 140, 150, 160, 170, 180, 200];
  const [activeBatchWidths, setActiveBatchWidths] = useState<number[]>([90, 100, 120, 150, 160, 180, 200]);

  const toggleBatchWidth = (w: number) => {
    if (activeBatchWidths.includes(w)) {
      if (activeBatchWidths.length === 1) {
        alert('يرجى اختيار مقاس واحد على الأقل');
        return;
      }
      setActiveBatchWidths(activeBatchWidths.filter((item) => item !== w));
    } else {
      setActiveBatchWidths([...activeBatchWidths, w].sort((a, b) => a - b));
    }
  };

  const openBatchModal = () => {
    setBatchBrand(uniqueBrands[0] || 'يانسن');
    setBatchModelName('');
    setBatchType('سوست منفصلة');
    setBatchLength(195);
    setBatchHeight(25);
    setBaseCost160(3000);
    setBasePrice160(4500);
    setDefaultStockPerSize(5);
    setActiveBatchWidths([90, 100, 120, 140, 150, 160, 180, 200]);
    setIsBatchModalOpen(true);
  };

  const handleSaveBatchItems = (e: React.FormEvent) => {
    e.preventDefault();

    if (!batchModelName.trim()) {
      alert('يرجى إدخال اسم الموديل للمرتبة (مثلاً: ماريوت، كتارا، ميديكال)');
      return;
    }

    if (activeBatchWidths.length === 0) {
      alert('يرجى تحديد المقاسات المراد إضافتها للمخزن');
      return;
    }

    // Calculate prices proportional to width based on base price for 160cm
    const now = Date.now();
    activeBatchWidths.forEach((w, idx) => {
      const ratio = w / 160;
      const calculatedSellingPrice = Math.round((basePrice160 * ratio) / 50) * 50; // rounded to nearest 50
      const calculatedCostPrice = Math.round((baseCost160 * ratio) / 50) * 50;

      const brandCode = batchBrand.substring(0, 3).toUpperCase();
      const modelCode = batchModelName.substring(0, 3).toUpperCase();

      const itemData: MattressItem = {
        id: `mat-${now}-${w}-${idx}`,
        sku: `${brandCode}-${modelCode}-${w}-${batchHeight}`,
        brand: batchBrand.trim(),
        modelName: batchModelName.trim(),
        type: batchType.trim(),
        width: w,
        length: Number(batchLength),
        height: Number(batchHeight),
        stockQuantity: Number(defaultStockPerSize),
        costPrice: calculatedCostPrice,
        sellingPrice: calculatedSellingPrice,
        minStockAlert: 2,
        notes: `تمت الإضافة التلقائية ضمن تشكيلة مقاسات موديل (${batchModelName})`,
        updatedAt: new Date().toISOString(),
      };

      onAddItem(itemData);
    });

    setIsBatchModalOpen(false);
    alert(`تمت إضافة عدد (${activeBatchWidths.length}) مقاساً بنجاح لموديل (${batchModelName}) في المخزن!`);
  };

  const canEditPrices = activeEmployee.role === 'admin' || activeEmployee.permissions.includes('edit_prices');

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.brand.toLowerCase().includes(q) ||
        item.modelName.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        `${item.width}`.includes(q) ||
        `${item.length}`.includes(q) ||
        item.sku.toLowerCase().includes(q);

      const matchBrand = brandFilter === 'ALL' || item.brand === brandFilter;
      const matchLowStock = !lowStockOnly || item.stockQuantity <= item.minStockAlert;

      return matchSearch && matchBrand && matchLowStock;
    });
  }, [items, searchQuery, brandFilter, lowStockOnly]);

  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.brand)));
  }, [items]);

  // Inventory Valuation
  const totalCostValuation = useMemo(() => {
    return items.reduce((acc, i) => acc + i.costPrice * i.stockQuantity, 0);
  }, [items]);

  const totalSellingValuation = useMemo(() => {
    return items.reduce((acc, i) => acc + i.sellingPrice * i.stockQuantity, 0);
  }, [items]);

  const totalMattressesCount = useMemo(() => {
    return items.reduce((acc, i) => acc + i.stockQuantity, 0);
  }, [items]);

  const openCreateModal = () => {
    setEditingItem(null);
    setSku(`MAT-${Math.floor(1000 + Math.random() * 9000)}`);
    setBrand('العالمية (El-Alamia Special)');
    setModelName('');
    setType('سوست منفصلة');
    setWidth(160);
    setLength(195);
    setHeight(25);
    setStockQuantity(10);
    setCostPrice(3000);
    setSellingPrice(4500);
    setMinStockAlert(2);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MattressItem) => {
    setEditingItem(item);
    setSku(item.sku);
    setBrand(item.brand);
    setModelName(item.modelName);
    setType(item.type);
    setWidth(item.width);
    setLength(item.length);
    setHeight(item.height);
    setStockQuantity(item.stockQuantity);
    setCostPrice(item.costPrice);
    setSellingPrice(item.sellingPrice);
    setMinStockAlert(item.minStockAlert);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!modelName.trim()) {
      alert('يرجى إدخال اسم الموديل للمرتبة');
      return;
    }

    const itemData: MattressItem = {
      id: editingItem ? editingItem.id : `mat-${Date.now()}`,
      sku: sku.trim() || `MAT-${Date.now()}`,
      brand: brand.trim(),
      modelName: modelName.trim(),
      type: type.trim(),
      width: Number(width),
      length: Number(length),
      height: Number(height),
      stockQuantity: Number(stockQuantity),
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      minStockAlert: Number(minStockAlert),
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    if (editingItem) {
      onUpdateItem(itemData);
    } else {
      onAddItem(itemData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (item: MattressItem) => {
    if (confirm(`هل أنت متأكد من حذف المرتبة (${item.brand} - ${item.modelName}) نهائياً من المخزن؟`)) {
      onDeleteItem(item.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">إدارة مخزن العالمية للمراتب والموجودات</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            إضافة وتعديل مقاسات المراتب بالسم وارتفاعاتها والتحكم بالكميات والأسعار
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openBatchModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
            title="إضافة جميع مقاسات المرتبة (من 90سم إلى 200سم) دفعة واحدة للمخزن"
          >
            <Maximize2 className="w-4 h-4" />
            <span>إضافة مقاسات متعددة (دفعة واحدة) 📐</span>
          </button>

          <button
            onClick={() => exportInventoryToExcel(filteredItems)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير جرد المخزن (Excel)</span>
          </button>

          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مرتبة فردية للمخزن</span>
          </button>
        </div>
      </div>

      {/* Valuation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">إجمالي المراتب المتوفرة بالمخزن:</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalMattressesCount} مرتبة</div>
          </div>
          <Layers className="w-8 h-8 text-slate-300" />
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">إجمالي قيمة التكلفة الشرائية:</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalCostValuation)}</div>
          </div>
          <DollarSign className="w-8 h-8 text-blue-200" />
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">إجمالي القيمة البيعية المتوقعة:</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalSellingValuation)}</div>
          </div>
          <TrendingUp className="w-8 h-8 text-emerald-200" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بكود SKU، الشركة، الموديل، النوع أو المقاس (مثل 160x195)..."
            className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 shadow-xs"
          >
            <option value="ALL">جميع الماركات</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              lowStockOnly
                ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>تنبيهات انخفاض المخزون فقط</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">الكود / SKU</th>
                <th className="p-3.5">الماركة / الشركة</th>
                <th className="p-3.5">اسم الموديل</th>
                <th className="p-3.5">نوع المرتبة</th>
                <th className="p-3.5">المقاس والارتفاع</th>
                <th className="p-3.5">الكمية بالمخزن</th>
                <th className="p-3.5">سعر التكلفة</th>
                <th className="p-3.5">سعر البيع</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredItems.map((item) => {
                const isLow = item.stockQuantity <= item.minStockAlert;
                const isZero = item.stockQuantity <= 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-400 dir-ltr text-right">{item.sku}</td>
                    <td className="p-3.5 font-bold text-blue-600">{item.brand}</td>
                    <td className="p-3.5 font-bold text-slate-900">{item.modelName}</td>
                    <td className="p-3.5 text-slate-600">{item.type}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dir-ltr text-right">
                      {item.width} × {item.length} سم (ع {item.height} سم)
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          isZero
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : isLow
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {item.stockQuantity} قطعة
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">{formatCurrency(item.costPrice)}</td>
                    <td className="p-3.5 font-bold text-slate-900">{formatCurrency(item.sellingPrice)}</td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg border border-slate-200 transition cursor-pointer"
                          title="تعديل المرتبة"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 p-2 rounded-lg border border-red-200 transition cursor-pointer"
                          title="حذف من المخزن"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    لا توجد منتجات مراتب مطابقة في المخزن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Mattress Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-900">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem ? 'تعديل بيانات المرتبة' : 'إضافة صنف مرتبة جديد للمخزن'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الشركة / الماركة:
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                    placeholder="مثل: يانسن، فوربد، تاكي، العالمية..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم الموديل:
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    required
                    placeholder="مثل: بوكيت كويل، ميديكال، إكسترا جولد..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نوع المرتبة / المكون الداخلي:
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                  >
                    <option value="سوست منفصلة">سوست منفصلة (Pocket Springs)</option>
                    <option value="سوست متصلة">سوست متصلة (Bonnell Springs)</option>
                    <option value="إسفنج مضغوط (ميديكال)">إسفنج مضغوط (ميديكال)</option>
                    <option value="لاتكس طبي وميموري فوم">لاتكس طبي وميموري فوم</option>
                    <option value="تاكي هاي كلاس">تاكي هاي كلاس</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الكود التسلسلي (SKU):
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-blue-600">📏 مقاس المرتبة بالسم:</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">العرض (سم):</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                      placeholder="160"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">الطول (سم):</label>
                    <input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(parseInt(e.target.value) || 0)}
                      placeholder="195"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">الارتفاع (سم):</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                      placeholder="25"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Quantities & Pricing */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الكمية بالمخزن:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سعر التكلفة (ج.م):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سعر البيع (ج.م):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-blue-600 font-bold text-sm shadow-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                >
                  حفظ في المخزن
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Batch Sizes Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-indigo-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl text-slate-900">
            <div className="flex items-center justify-between p-5 border-b border-indigo-100 bg-gradient-to-r from-indigo-900 to-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <Maximize2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    إضافة مقاسات متعددة لمرتبة دفعة واحدة (Batch Generator)
                    <span className="bg-indigo-500/30 text-indigo-200 text-[10px] px-2 py-0.5 rounded-full border border-indigo-400/30">
                      توليد تلقائي
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    اختر موديل المرتبة، وحدد مقاسات العرض المطلوبة لإضافتها كلها للمخزن بنقرة زر واحدة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchItems} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Basic Model Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الشركة / الماركة:
                  </label>
                  <input
                    type="text"
                    value={batchBrand}
                    onChange={(e) => setBatchBrand(e.target.value)}
                    required
                    placeholder="مثال: يانسن، فوربد، تاكي، العالمية"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم الموديل:
                  </label>
                  <input
                    type="text"
                    value={batchModelName}
                    onChange={(e) => setBatchModelName(e.target.value)}
                    required
                    placeholder="مثال: ماريوت، كتارا، ميديال، اكسترا"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نوع المرتبة / الحشو:
                  </label>
                  <select
                    value={batchType}
                    onChange={(e) => setBatchType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 shadow-xs"
                  >
                    <option value="سوست منفصلة">سوست منفصلة (Pocket Springs)</option>
                    <option value="سوست متصلة">سوست متصلة (Bonnell Springs)</option>
                    <option value="إسفنج مضغوط (ميديكال)">إسفنج مضغوط (ميديكال)</option>
                    <option value="لاتكس طبي وميموري فوم">لاتكس طبي وميموري فوم</option>
                    <option value="تاكي هاي كلاس">تاكي هاي كلاس</option>
                  </select>
                </div>
              </div>

              {/* Standard Dimensions & Base Price Reference */}
              <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                  <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    المواصفات القياسية وحساب الأسعار التلقائي:
                  </span>
                  <span className="text-[11px] text-indigo-700 font-semibold">
                    (تُحسب أسعار المقاسات تلقائياً بناءً على مقاس 160 سم)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold mb-1">الطول الثابت (سم):</label>
                    <input
                      type="number"
                      value={batchLength}
                      onChange={(e) => setBatchLength(parseInt(e.target.value) || 195)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold mb-1">الارتفاع (سم):</label>
                    <input
                      type="number"
                      value={batchHeight}
                      onChange={(e) => setBatchHeight(parseInt(e.target.value) || 25)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold mb-1">الكمية لكل مقاس:</label>
                    <input
                      type="number"
                      min="1"
                      value={defaultStockPerSize}
                      onChange={(e) => setDefaultStockPerSize(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-emerald-700 font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold mb-1">تكلفة مقاس 160سم:</label>
                    <input
                      type="number"
                      value={baseCost160}
                      onChange={(e) => setBaseCost160(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold mb-1">سعر بيع مقاس 160سم:</label>
                    <input
                      type="number"
                      value={basePrice160}
                      onChange={(e) => setBasePrice160(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-blue-700 font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Sizes Checkbox Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800">
                    حدد مقاسات العرض (بالسم) المراد إضافتها للمخزن:
                  </label>
                  <span className="text-xs text-indigo-600 font-bold">
                    تم تحديد ({activeBatchWidths.length}) مقاسات
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {STANDARD_WIDTHS.map((w) => {
                    const isSelected = activeBatchWidths.includes(w);
                    const ratio = w / 160;
                    const approxPrice = Math.round((basePrice160 * ratio) / 50) * 50;

                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => toggleBatchWidth(w)}
                        className={`p-3 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">
                            📏 {w} × {batchLength} سم
                          </span>
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSelected ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                        <div className={`text-[11px] mt-2 font-bold ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                          سعر التقديري: {formatCurrency(approxPrice)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>إضافة ({activeBatchWidths.length}) مقاسات للمخزن دفعة واحدة 🚀</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl transition cursor-pointer text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
