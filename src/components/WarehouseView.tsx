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
  const [baseCost160, setBaseCost160] = useState<number>(3000);
  const [basePrice160, setBasePrice160] = useState<number>(4500);
  const [defaultStockPerSize, setDefaultStockPerSize] = useState<number>(5);

  // Available Presets
  const DEFAULT_WIDTHS = [80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];
  const DEFAULT_LENGTHS = [190, 195, 200];
  const DEFAULT_HEIGHTS = [15, 20, 24, 25, 27, 30, 32];

  const [activeBatchWidths, setActiveBatchWidths] = useState<number[]>([90, 100, 120, 140, 150, 160, 180, 200]);
  const [activeBatchLengths, setActiveBatchLengths] = useState<number[]>([195]);
  const [activeBatchHeights, setActiveBatchHeights] = useState<number[]>([25]);

  // Dynamic Batch Item List
  interface BatchItemDraft {
    id: string;
    width: number;
    length: number;
    height: number;
    stockQuantity: number;
    costPrice: number;
    sellingPrice: number;
  }

  const [batchRows, setBatchRows] = useState<BatchItemDraft[]>([]);

  // Single Custom Row Adder Input States
  const [customWidthInput, setCustomWidthInput] = useState<number>(160);
  const [customLengthInput, setCustomLengthInput] = useState<number>(195);
  const [customHeightInput, setCustomHeightInput] = useState<number>(25);
  const [customStockInput, setCustomStockInput] = useState<number>(5);
  const [customPriceInput, setCustomPriceInput] = useState<number>(4500);

  // Generate rows from selections
  const regenerateBatchRows = (
    widths: number[],
    lengths: number[],
    heights: number[],
    baseCost: number,
    basePrice: number,
    stockPerSize: number
  ) => {
    const rows: BatchItemDraft[] = [];
    widths.forEach((w) => {
      lengths.forEach((l) => {
        heights.forEach((h) => {
          // Rule: Price varies based on Width (العرض) and Height (الارتفاع), but NOT Length (الطول).
          // Base reference: Width 160 cm, Height 25 cm.
          const widthFactor = w / 160;
          const heightFactor = 1 + (h - 25) * 0.02; // Each 1cm height adds/subtracts ~2%
          const ratio = widthFactor * heightFactor;

          const calculatedSellingPrice = Math.max(500, Math.round((basePrice * ratio) / 50) * 50);
          const calculatedCostPrice = Math.max(300, Math.round((baseCost * ratio) / 50) * 50);

          rows.push({
            id: `draft-${w}-${l}-${h}-${Math.random().toString(36).substr(2, 5)}`,
            width: w,
            length: l,
            height: h,
            stockQuantity: stockPerSize,
            costPrice: calculatedCostPrice,
            sellingPrice: calculatedSellingPrice,
          });
        });
      });
    });
    setBatchRows(rows);
  };

  const toggleBatchWidth = (w: number) => {
    let updated: number[];
    if (activeBatchWidths.includes(w)) {
      if (activeBatchWidths.length === 1 && activeBatchLengths.length === 1 && activeBatchHeights.length === 1) {
        alert('يرجى اختيار مقاس واحد على الأقل');
        return;
      }
      updated = activeBatchWidths.filter((item) => item !== w);
    } else {
      updated = [...activeBatchWidths, w].sort((a, b) => a - b);
    }
    setActiveBatchWidths(updated);
    regenerateBatchRows(updated, activeBatchLengths, activeBatchHeights, baseCost160, basePrice160, defaultStockPerSize);
  };

  const toggleBatchLength = (l: number) => {
    let updated: number[];
    if (activeBatchLengths.includes(l)) {
      if (activeBatchLengths.length === 1) {
        alert('يرجى اختيار طول واحد على الأقل');
        return;
      }
      updated = activeBatchLengths.filter((item) => item !== l);
    } else {
      updated = [...activeBatchLengths, l].sort((a, b) => a - b);
    }
    setActiveBatchLengths(updated);
    regenerateBatchRows(activeBatchWidths, updated, activeBatchHeights, baseCost160, basePrice160, defaultStockPerSize);
  };

  const toggleBatchHeight = (h: number) => {
    let updated: number[];
    if (activeBatchHeights.includes(h)) {
      if (activeBatchHeights.length === 1) {
        alert('يرجى اختيار ارتفاع واحد على الأقل');
        return;
      }
      updated = activeBatchHeights.filter((item) => item !== h);
    } else {
      updated = [...activeBatchHeights, h].sort((a, b) => a - b);
    }
    setActiveBatchHeights(updated);
    regenerateBatchRows(activeBatchWidths, activeBatchLengths, updated, baseCost160, basePrice160, defaultStockPerSize);
  };

  const selectAllWidths = () => {
    setActiveBatchWidths(DEFAULT_WIDTHS);
    regenerateBatchRows(DEFAULT_WIDTHS, activeBatchLengths, activeBatchHeights, baseCost160, basePrice160, defaultStockPerSize);
  };

  const selectPopularWidths = () => {
    const pop = [100, 120, 150, 160, 180];
    setActiveBatchWidths(pop);
    regenerateBatchRows(pop, activeBatchLengths, activeBatchHeights, baseCost160, basePrice160, defaultStockPerSize);
  };

  const clearWidths = () => {
    setActiveBatchWidths([]);
    regenerateBatchRows([], activeBatchLengths, activeBatchHeights, baseCost160, basePrice160, defaultStockPerSize);
  };

  const openBatchModal = () => {
    setBatchBrand(uniqueBrands[0] || 'يانسن');
    setBatchModelName('');
    setBatchType('سوست منفصلة');
    setBaseCost160(3000);
    setBasePrice160(4500);
    setDefaultStockPerSize(5);

    const initWidths = [90, 100, 120, 140, 150, 160, 180, 200];
    const initLengths = [195];
    const initHeights = [25];

    setActiveBatchWidths(initWidths);
    setActiveBatchLengths(initLengths);
    setActiveBatchHeights(initHeights);

    regenerateBatchRows(initWidths, initLengths, initHeights, 3000, 4500, 5);
    setIsBatchModalOpen(true);
  };

  const addCustomSingleRow = () => {
    if (!customWidthInput || !customLengthInput || !customHeightInput) {
      alert('يرجى التأكد من إدخال الطول والعرض والارتفاع بشكل صحيح');
      return;
    }

    const newRow: BatchItemDraft = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      width: Number(customWidthInput),
      length: Number(customLengthInput),
      height: Number(customHeightInput),
      stockQuantity: Number(customStockInput) || 1,
      costPrice: Math.round((Number(customPriceInput) * 0.7) / 50) * 50,
      sellingPrice: Number(customPriceInput) || 0,
    };

    setBatchRows([...batchRows, newRow]);
  };

  const updateRowField = (id: string, field: keyof BatchItemDraft, value: number) => {
    setBatchRows(
      batchRows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeBatchRow = (id: string) => {
    setBatchRows(batchRows.filter((r) => r.id !== id));
  };

  const handleSaveBatchItems = (e: React.FormEvent) => {
    e.preventDefault();

    if (!batchModelName.trim()) {
      alert('يرجى إدخال اسم الموديل للمرتبة (مثلاً: ماريوت، كتارا، ميديكال)');
      return;
    }

    if (batchRows.length === 0) {
      alert('يرجى إدراج مقاس واحد على الأقل في القائمة');
      return;
    }

    const now = Date.now();
    const brandCode = batchBrand.substring(0, 3).toUpperCase();
    const modelCode = batchModelName.substring(0, 3).toUpperCase();

    batchRows.forEach((row, idx) => {
      const itemData: MattressItem = {
        id: `mat-${now}-${row.width}x${row.length}x${row.height}-${idx}`,
        sku: `${brandCode}-${modelCode}-${row.width}x${row.length}-${row.height}`,
        brand: batchBrand.trim(),
        modelName: batchModelName.trim(),
        type: batchType.trim(),
        width: Number(row.width),
        length: Number(row.length),
        height: Number(row.height),
        stockQuantity: Number(row.stockQuantity),
        costPrice: Number(row.costPrice),
        sellingPrice: Number(row.sellingPrice),
        minStockAlert: 2,
        notes: `تمت الإضافة التلقائية ضمن تشكيلة مقاسات موديل (${batchModelName})`,
        updatedAt: new Date().toISOString(),
      };

      onAddItem(itemData);
    });

    setIsBatchModalOpen(false);
    alert(`تمت إضافة عدد (${batchRows.length}) مقاساً بنجاح لموديل (${batchModelName}) في المخزن!`);
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
          <div className="bg-white border border-indigo-200 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl text-slate-900">
            <div className="flex items-center justify-between p-5 border-b border-indigo-100 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <Maximize2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    مولّد المقاسات والأبعاد المتعددة للمرتبة (Multi-Size Generator)
                    <span className="bg-indigo-500/30 text-indigo-200 text-[10px] px-2 py-0.5 rounded-full border border-indigo-400/30">
                      إدارة المقاسات والأبعاد
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    يمكنك تحديد عدة أطوال وأعراض وارتفاعات للموديل الواحد، أو إدراج مقاسات مخصصة بأسعار وكميات مختلفة
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

            <form onSubmit={handleSaveBatchItems} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* Basic Model Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
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
                    {/* Quick Brand Pills */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['يانسن', 'فوربد', 'تاكي', 'العالمية', 'هابيتات', 'إنجلندر'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBatchBrand(b)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                            batchBrand === b
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
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
                      placeholder="مثال: ماريوت، كتارا، ميديكال، اكسترا"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-600 shadow-xs"
                    />
                    {/* Quick Model Suggestions */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['ماريوت', 'كتارا', 'كاتراكت', 'ألماني', 'إكسترا', 'جولد', 'دريم', 'ريبوند'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setBatchModelName(m)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                            batchModelName === m
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
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
              </div>

              {/* Base Reference Pricing & Stock */}
              <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-200/60 pb-2 gap-2">
                  <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    مرجع الأسعار القياسي لتوليد المقاسات التلقائي (مرجع القياس 160×195سم):
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                    💡 السعر يتحدد بـ (العرض + الارتفاع) والطول ثابت لا يغير السعر
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold mb-1">الكمية لكل مقاس:</label>
                    <input
                      type="number"
                      min="1"
                      value={defaultStockPerSize}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setDefaultStockPerSize(val);
                        regenerateBatchRows(
                          activeBatchWidths,
                          activeBatchLengths,
                          activeBatchHeights,
                          baseCost160,
                          basePrice160,
                          val
                        );
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-emerald-700 font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold mb-1">تكلفة مقاس 160سم (ج.م):</label>
                    <input
                      type="number"
                      value={baseCost160}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setBaseCost160(val);
                        regenerateBatchRows(
                          activeBatchWidths,
                          activeBatchLengths,
                          activeBatchHeights,
                          val,
                          basePrice160,
                          defaultStockPerSize
                        );
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 font-bold mb-1">سعر بيع مقاس 160سم (ج.م):</label>
                    <input
                      type="number"
                      value={basePrice160}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setBasePrice160(val);
                        regenerateBatchRows(
                          activeBatchWidths,
                          activeBatchLengths,
                          activeBatchHeights,
                          baseCost160,
                          val,
                          defaultStockPerSize
                        );
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-blue-700 font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Select Dimension Options */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* Widths Multi Selector */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>📐 1. حدد أعراض المرتبة المطلوب إضافتها (العرض بالسم):</span>
                    </label>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={selectPopularWidths}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-md border border-indigo-200 transition cursor-pointer"
                      >
                        الأكثر مبيعاً (100، 120، 150، 160، 180)
                      </button>
                      <button
                        type="button"
                        onClick={selectAllWidths}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-md border border-emerald-200 transition cursor-pointer"
                      >
                        تحديد الكل
                      </button>
                      <button
                        type="button"
                        onClick={clearWidths}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-1 rounded-md transition cursor-pointer"
                      >
                        تفريغ
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_WIDTHS.map((w) => {
                      const isSelected = activeBatchWidths.includes(w);
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => toggleBatchWidth(w)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {w} سم {isSelected ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lengths Multi Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>📏 2. حدد أطوال المرتبة (الطول بالسم):</span>
                    </label>
                    <span className="text-[11px] text-indigo-600 font-bold">
                      تم تحديد ({activeBatchLengths.length}) طول
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_LENGTHS.map((l) => {
                      const isSelected = activeBatchLengths.includes(l);
                      return (
                        <button
                          key={l}
                          type="button"
                          onClick={() => toggleBatchLength(l)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          طول {l} سم {isSelected ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Heights Multi Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>📦 3. حدد ارتفاعات المرتبة (الارتفاع بالسم):</span>
                    </label>
                    <span className="text-[11px] text-indigo-600 font-bold">
                      تم تحديد ({activeBatchHeights.length}) ارتفاع
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_HEIGHTS.map((h) => {
                      const isSelected = activeBatchHeights.includes(h);
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleBatchHeight(h)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          ارتفاع {h} سم {isSelected ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Add Custom Single Combination Row */}
              <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl space-y-2">
                <div className="text-xs font-black text-amber-900 flex items-center justify-between">
                  <span>➕ إضافة مقاس مخصص يدوي (عرض × طول × ارتفاع):</span>
                  <span className="text-[11px] text-amber-700 font-semibold">
                    لإضافة مقاس خاص غير متوفر بالقوائم أعلاه
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
                  <div>
                    <label className="block text-[10px] text-slate-600 font-bold">العرض (سم):</label>
                    <input
                      type="number"
                      value={customWidthInput}
                      onChange={(e) => setCustomWidthInput(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 font-bold">الطول (سم):</label>
                    <input
                      type="number"
                      value={customLengthInput}
                      onChange={(e) => setCustomLengthInput(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 font-bold">الارتفاع (سم):</label>
                    <input
                      type="number"
                      value={customHeightInput}
                      onChange={(e) => setCustomHeightInput(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 font-bold">سعر البيع:</label>
                    <input
                      type="number"
                      value={customPriceInput}
                      onChange={(e) => setCustomPriceInput(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 font-bold">الكمية:</label>
                    <input
                      type="number"
                      min="1"
                      value={customStockInput}
                      onChange={(e) => setCustomStockInput(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-emerald-700"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addCustomSingleRow}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded-lg transition cursor-pointer mt-3 sm:mt-3 shadow-xs flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة المقاس</span>
                  </button>
                </div>
              </div>

              {/* Generated Sizes Preview Table & Editing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800">
                    قائمة المقاسات الجاهزة للإضافة إلى المخزن (إجمالي {batchRows.length} مقاس):
                  </label>
                  <span className="text-xs text-indigo-700 font-bold">
                    يمكنك تعديل الأسعار والكميات لكل مقاس مباشرة قبل الحفظ
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold">
                      <tr>
                        <th className="p-2.5">المقاس (عرض×طول×ارتفاع)</th>
                        <th className="p-2.5 text-center">الكمية بالمخزن</th>
                        <th className="p-2.5 text-center">سعر التكلفة (ج.م)</th>
                        <th className="p-2.5 text-center">سعر البيع (ج.م)</th>
                        <th className="p-2.5 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchRows.map((row) => (
                        <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                          <td className="p-2.5 font-black text-slate-900 dir-ltr text-right">
                            📏 {row.width} × {row.length} سم (ارتفاع {row.height} سم)
                          </td>

                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={row.stockQuantity}
                              onChange={(e) =>
                                updateRowField(row.id, 'stockQuantity', parseInt(e.target.value) || 0)
                              }
                              className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-emerald-800"
                            />
                          </td>

                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={row.costPrice}
                              onChange={(e) =>
                                updateRowField(row.id, 'costPrice', parseFloat(e.target.value) || 0)
                              }
                              className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-slate-700"
                            />
                          </td>

                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={row.sellingPrice}
                              onChange={(e) =>
                                updateRowField(row.id, 'sellingPrice', parseFloat(e.target.value) || 0)
                              }
                              className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center text-blue-700"
                            />
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeBatchRow(row.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                              title="حذف هذا المقاس"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {batchRows.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-slate-400 font-medium text-xs">
                            لا توجد مقاسات محددة حالياً. اختر من الخيارات أعلاه أو أضف مقاساً مخصصاً.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={batchRows.length === 0}
                  className={`flex-1 font-black py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs ${
                    batchRows.length > 0
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>حفظ وإضافة ({batchRows.length}) مقاساً للمخزن دفعة واحدة 🚀</span>
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
