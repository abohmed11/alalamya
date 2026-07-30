import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, X, Check, Tag, Package, Gift } from 'lucide-react';
import { OfferBundle, BundleItem, MattressItem } from '../types';
import { formatCurrency } from '../utils/storage';

interface BundleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundles: OfferBundle[];
  inventoryItems: MattressItem[];
  onSaveBundles: (bundles: OfferBundle[]) => void;
}

export const BundleManagerModal: React.FC<BundleManagerModalProps> = ({
  isOpen,
  onClose,
  bundles,
  inventoryItems,
  onSaveBundles,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for creating/editing a bundle
  const [bundleName, setBundleName] = useState('');
  const [badgeText, setBadgeText] = useState('عرض مخصص 🔥');
  const [description, setDescription] = useState('');
  const [bundlePrice, setBundlePrice] = useState<number>(10000);
  const [selectedItems, setSelectedItems] = useState<BundleItem[]>([]);

  // Temp input to add an item to the bundle being edited
  const [selectedMattressId, setSelectedMattressId] = useState('');
  const [customBrand, setCustomBrand] = useState('يانسن');
  const [customModel, setCustomModel] = useState('ماريوت');
  const [customType, setCustomType] = useState('سوست منفصلة');
  const [customWidth, setCustomWidth] = useState(160);
  const [customLength, setCustomLength] = useState(195);
  const [customHeight, setCustomHeight] = useState(25);
  const [itemQty, setItemQty] = useState(1);
  const [itemUnitPrice, setItemUnitPrice] = useState(4500);

  if (!isOpen) return null;

  const handleOpenNew = () => {
    setIsEditing(true);
    setEditingId(null);
    setBundleName('عرض العريس المخصص 👑');
    setBadgeText('توفير خاص 🔥');
    setDescription('عرض تشكيلة 3 مراتب خاصة للغرفة الرئيسية وغرف الأبناء');
    setBundlePrice(11000);

    // Pre-fill with top 2 items from inventory if available
    if (inventoryItems.length > 0) {
      const item1 = inventoryItems[0];
      const item2 = inventoryItems[1] || inventoryItems[0];
      setSelectedItems([
        {
          mattressId: item1.id,
          brand: item1.brand,
          modelName: item1.modelName,
          type: item1.type,
          dimensionsText: `${item1.width}×${item1.length} سم - ارتفاع ${item1.height} سم`,
          width: item1.width,
          length: item1.length,
          height: item1.height,
          quantity: 1,
          unitPrice: item1.sellingPrice,
        },
        {
          mattressId: item2.id,
          brand: item2.brand,
          modelName: item2.modelName,
          type: item2.type,
          dimensionsText: `${item2.width}×${item2.length} سم - ارتفاع ${item2.height} سم`,
          width: item2.width,
          length: item2.length,
          height: item2.height,
          quantity: 2,
          unitPrice: item2.sellingPrice,
        },
      ]);
    } else {
      setSelectedItems([]);
    }
  };

  const handleAddItemFromWarehouse = () => {
    if (!selectedMattressId) {
      alert('يرجى اختيار مرتبة من المخزن أولاً');
      return;
    }
    const mat = inventoryItems.find((i) => i.id === selectedMattressId);
    if (!mat) return;

    const newItem: BundleItem = {
      mattressId: mat.id,
      brand: mat.brand,
      modelName: mat.modelName,
      type: mat.type,
      dimensionsText: `${mat.width}×${mat.length} سم - ارتفاع ${mat.height} سم`,
      width: mat.width,
      length: mat.length,
      height: mat.height,
      quantity: itemQty || 1,
      unitPrice: mat.sellingPrice,
    };

    setSelectedItems([...selectedItems, newItem]);
  };

  const handleAddCustomItem = () => {
    const newItem: BundleItem = {
      brand: customBrand.trim() || 'مرتبة',
      modelName: customModel.trim() || 'موديل خاص',
      type: customType.trim() || 'سوست منفصلة',
      dimensionsText: `${customWidth}×${customLength} سم - ارتفاع ${customHeight} سم`,
      width: Number(customWidth),
      length: Number(customLength),
      height: Number(customHeight),
      quantity: Number(itemQty) || 1,
      unitPrice: Number(itemUnitPrice) || 0,
    };

    setSelectedItems([...selectedItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, idx) => idx !== index));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundleName.trim()) {
      alert('يرجى كتابة اسم العرض أولاً (مثال: عرض العريس 3 مراتب)');
      return;
    }
    if (selectedItems.length === 0) {
      alert('يرجى إضافة مرتبة واحدة على الأقل داخل هذا العرض');
      return;
    }

    const originalTotal = selectedItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const savings = originalTotal - bundlePrice;

    const newBundleObj: OfferBundle = {
      id: editingId || `bundle-${Date.now()}`,
      name: bundleName.trim(),
      badge: badgeText.trim() || 'عرض خاص 🔥',
      description: description.trim(),
      items: selectedItems,
      originalTotal,
      bundlePrice: Number(bundlePrice),
      savingsAmount: savings > 0 ? savings : 0,
      isActive: true,
    };

    let updatedList: OfferBundle[];
    if (editingId) {
      updatedList = bundles.map((b) => (b.id === editingId ? newBundleObj : b));
    } else {
      updatedList = [newBundleObj, ...bundles];
    }

    onSaveBundles(updatedList);
    setIsEditing(false);
  };

  const handleDeleteBundle = (id: string) => {
    if (confirm('هل أنت تأكد من إزالة هذا العرض من قائمة العروض والباقات؟')) {
      const updated = bundles.filter((b) => b.id !== id);
      onSaveBundles(updated);
    }
  };

  const originalTotalCalc = selectedItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const currentSavings = originalTotalCalc - bundlePrice;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white border border-amber-200 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/30 rounded-xl border border-amber-400/30">
              <Gift className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                إدارة ركن العروض والباقات (عرض العريس والعروسة)
                <span className="bg-amber-400/20 text-amber-200 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-400/30 font-bold">
                  تجهيز الباقات المركبة
                </span>
              </h3>
              <p className="text-xs text-amber-200 mt-0.5">
                يمكنك تجهيز باقات عروض (مثل 3 مراتب بسعر مخفض) لإضافتها بنقرة زر واحدة بالفاتورة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                <div>
                  <h4 className="text-xs font-black text-amber-900">قائمة العروض المجهزة حالياً بالمعرض:</h4>
                  <p className="text-[11px] text-amber-700 font-medium">
                    هذه العروض تظهر للبائع في صفحة الفاتورة لبيع 3 مراتب أو أكثر بلمسة واحدة
                  </p>
                </div>
                <button
                  onClick={handleOpenNew}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء عرض جديد (عرض عريس)</span>
                </button>
              </div>

              {/* Existing Bundles List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="bg-white border-2 border-amber-200 hover:border-amber-400 rounded-2xl p-4 shadow-xs relative flex flex-col justify-between transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                            {bundle.badge}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 mt-1">{bundle.name}</h4>
                        </div>
                        <button
                          onClick={() => handleDeleteBundle(bundle.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition cursor-pointer"
                          title="حذف هذا العرض"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 mb-3">{bundle.description}</p>

                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs mb-3">
                        <div className="font-bold text-slate-700 text-[11px] mb-1">
                          المراتب والمحتويات داخل هذا العرض ({bundle.items.reduce((a, b) => a + b.quantity, 0)} مراتب):
                        </div>
                        {bundle.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] text-slate-800">
                            <span>
                              🔹 {item.quantity}× {item.brand} ({item.modelName}) {item.dimensionsText}
                            </span>
                            <span className="font-bold text-slate-600">{formatCurrency(item.unitPrice * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 line-through ml-2">
                          {formatCurrency(bundle.originalTotal)}
                        </span>
                        <span className="text-sm font-black text-emerald-700">
                          {formatCurrency(bundle.bundlePrice)}
                        </span>
                      </div>
                      {bundle.savingsAmount > 0 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                          وفرت {formatCurrency(bundle.savingsAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {bundles.length === 0 && (
                <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Gift className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-xs">لا توجد عروض مجهزة حالياً.</p>
                  <p className="text-[11px] mt-1">اضغط على "إنشاء عرض جديد" لإضافة باقة عرض العريس.</p>
                </div>
              )}
            </div>
          ) : (
            /* Editing / Creating Form */
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-sm font-black text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  تصميم وتجهيز باقة عرض جديدة (عرض العريس / العروسة)
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  إلغاء والعودة للقائمة
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">عنوان العرض:</label>
                  <input
                    type="text"
                    value={bundleName}
                    onChange={(e) => setBundleName(e.target.value)}
                    required
                    placeholder="مثال: عرض العريس الذهبي 👑 (3 مراتب)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شارة العرض (Badge):</label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="مثال: الأكثر مبيعاً 🔥 - توفير 1,800 ج.م"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-amber-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف العرض والتفاصيل للعميل:</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: يشمل مرتبة ماستر كينج للغرفة الرئيسية (160×195 سم) + 2 مرتبة فردية للأطفال (120×195 سم)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              {/* Items Picker Section */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <label className="block text-xs font-black text-slate-900">
                  إضافة مراتب ومحتويات الباقة:
                </label>

                {/* Pick from Warehouse */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-600 shrink-0">من المخزن:</span>
                  <select
                    value={selectedMattressId}
                    onChange={(e) => setSelectedMattressId(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  >
                    <option value="">-- اختر مرتبة من قائمة المخزن --</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.brand} ({item.modelName}) {item.width}×{item.length} سم - {formatCurrency(item.sellingPrice)} (متاح: {item.stockQuantity})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                    className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-center"
                    placeholder="العدد"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemFromWarehouse}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer"
                  >
                    + إضافة للباقة
                  </button>
                </div>

                {/* Items Added Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="p-2">المرتبة المضافة</th>
                        <th className="p-2 text-center">العدد</th>
                        <th className="p-2 text-center">سعر القطعة</th>
                        <th className="p-2 text-center">الإجمالي</th>
                        <th className="p-2 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-slate-900">
                            {item.brand} - {item.modelName} ({item.dimensionsText})
                          </td>
                          <td className="p-2 text-center font-bold text-amber-800">{item.quantity}</td>
                          <td className="p-2 text-center font-bold text-slate-700">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="p-2 text-center font-bold text-emerald-700">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-red-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {selectedItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-slate-400 text-xs">
                            لم يتم إضافة أي مرتبة إلى هذا العرض حتى الآن.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing calculation */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-600">
                    مجموع أسعار المراتب الفرادية بالأسعار العادية:
                    <span className="font-bold text-slate-900 mr-2">{formatCurrency(originalTotalCalc)}</span>
                  </div>
                  <div className="text-xs text-amber-800 font-bold mt-1">
                    مقدار التوفير للعميل مع هذا العرض:
                    <span className="font-black text-emerald-700 mr-2">
                      {currentSavings > 0 ? formatCurrency(currentSavings) : '0 ج.م'}
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex items-center gap-2">
                  <label className="text-xs font-black text-amber-900 shrink-0">سعر الباقة الخاص (ج.م):</label>
                  <input
                    type="number"
                    value={bundlePrice}
                    onChange={(e) => setBundlePrice(parseFloat(e.target.value) || 0)}
                    required
                    className="w-36 bg-white border-2 border-amber-400 rounded-xl px-3 py-2 text-sm font-black text-emerald-700 text-center shadow-xs"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وإتاحة العرض للبائعين 🚀</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
