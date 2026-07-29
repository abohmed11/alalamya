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
  const [editingItem, setEditingItem] = useState<MattressItem | null>(null);

  // Form Fields
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
            <span>إضافة مرتبة جديدة للمخزن</span>
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
    </div>
  );
};
