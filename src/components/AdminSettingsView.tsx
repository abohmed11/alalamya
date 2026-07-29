import React, { useState } from 'react';
import {
  ShieldCheck,
  Store,
  Download,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  FileJson,
  Building,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Info,
} from 'lucide-react';
import { SystemData, StoreSettings } from '../types';
import { exportBackupJSON, importBackupJSON, formatCurrency, selectAutoSaveFile } from '../utils/storage';

interface AdminSettingsViewProps {
  systemData: SystemData;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onRestoreSystemData: (newData: SystemData) => void;
  onResetData: () => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  systemData,
  onUpdateSettings,
  onRestoreSystemData,
  onResetData,
}) => {
  const [settings, setSettings] = useState<StoreSettings>(systemData.settings);
  const [toastMsg, setToastMsg] = useState('');
  const [autoSaveFileName, setAutoSaveFileName] = useState<string | null>(null);

  const handleSelectAutoSaveFile = async () => {
    try {
      const fileName = await selectAutoSaveFile();
      if (fileName) {
        setAutoSaveFileName(fileName);
        setToastMsg(`تم ربط الحفظ التلقائي المباشر بملف: ${fileName}`);
        setTimeout(() => setToastMsg(''), 5000);
      }
    } catch (err: any) {
      alert(err?.message || 'تعذر تحديد ملف الحفظ التلقائي.');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settings);
    setToastMsg('تم حفظ إعدادات المحل والفواتير بنجاح!');
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const restored = await importBackupJSON(file);
      onRestoreSystemData(restored);
      alert('تم استرجاع النسخة الاحتياطية للسيستم بنجاح!');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء استرجاع الملف.');
    }
  };

  const handleResetConfirm = () => {
    if (
      confirm(
        '⚠️ تحذير: هل أنت متأكد من إعادة ضبط البيانات للوضع الافتراضي؟ يفضل تحميل نسخة احتياطية أولاً.'
      )
    ) {
      onResetData();
      alert('تم إعادة ضبط بيانات المراتب والفواتير للوضع الافتراضي.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-xs">{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">صفحة الأدمن ولوحة تحكم المدير (إسلام شومان)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            إعدادات متجر العالمية للمراتب، وشروط الفواتير، وحفظ واسترجاع النسخ الاحتياطية على جهازك
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings Form (7 cols) */}
        <form
          onSubmit={handleSaveSettings}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">بيانات معرض العالمية للمراتب</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المحل / الشركة:</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المدير المسئول:</label>
              <input
                type="text"
                value={settings.managerName}
                onChange={(e) => setSettings({ ...settings, managerName: e.target.value })}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-blue-600 font-bold shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف الرئيسي:</label>
              <input
                type="text"
                value={settings.phone1}
                onChange={(e) => setSettings({ ...settings, phone1: e.target.value })}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف الإضافي:</label>
              <input
                type="text"
                value={settings.phone2 || ''}
                onChange={(e) => setSettings({ ...settings, phone2: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">عنوان المعرض والمحل:</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">السجل التجاري:</label>
              <input
                type="text"
                value={settings.commercialRegistry || ''}
                onChange={(e) => setSettings({ ...settings, commercialRegistry: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البطاقة الضريبية:</label>
              <input
                type="text"
                value={settings.taxCard || ''}
                onChange={(e) => setSettings({ ...settings, taxCard: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نص تذييل وشروط الفاتورة والضمان:
            </label>
            <textarea
              rows={3}
              value={settings.receiptFooterText}
              onChange={(e) => setSettings({ ...settings, receiptFooterText: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 resize-none shadow-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            <span>حفظ إعدادات المتجر</span>
          </button>
        </form>

        {/* Data Backup & Restore Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileJson className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">حفظ واسترجاع البيانات والأمان</h3>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              قاعدة بيانات محليّة فائقة السرعة (IndexedDB) - بدون إنترنت 100%
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              تتم أرشفة وحفظ الفواتير والتقارير والمنتجات محلياً داخل متصفح الكمبيوتر بشكل دائم ولأشهر وسنوات دون الحاجة لاتصال بالإنترنت.
            </p>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            يمكنك تحميل نسخة احتياطية إضافية ملف (JSON) على هارد الكمبيوتر الخاص بك في أي وقت للسلامة المطلقة.
          </p>

          <div className="space-y-3 pt-2">
            {/* Auto Save File Connection */}
            <button
              type="button"
              onClick={handleSelectAutoSaveFile}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold p-3.5 rounded-xl border border-blue-200 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileJson className="w-5 h-5 text-blue-600" />
                <div className="text-right">
                  <div className="text-xs font-bold">
                    {autoSaveFileName ? `متصل بالملف: ${autoSaveFileName}` : 'تحديد ملف للحفظ التلقائي المباشر على الجهاز'}
                  </div>
                  <div className="text-[10px] text-blue-700">
                    {autoSaveFileName ? 'يتم حفظ كل عملية تلقائياً داخل هذا الملف بفرمت JSON' : 'اختر ملف .json على الفلاشة أو الهارد ليتم كتابة أي عملية جديدة فيه تلقائياً'}
                  </div>
                </div>
              </div>
              <span className="text-xs text-blue-600 font-bold">{autoSaveFileName ? 'مُتصل 🟢' : 'تحديد 📂'}</span>
            </button>

            {/* Download Backup */}
            <button
              type="button"
              onClick={() => exportBackupJSON(systemData)}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold p-3.5 rounded-xl border border-slate-200 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-5 h-5 text-blue-600" />
                <div className="text-right">
                  <div className="text-xs font-bold">تحميل نسخة احتياطية (JSON)</div>
                  <div className="text-[10px] text-slate-500">تنزيل كامل البيانات على جهاز الكمبيوتر</div>
                </div>
              </div>
              <span className="text-xs text-blue-600 font-bold">تحميل ⬇️</span>
            </button>

            {/* Restore Backup */}
            <label className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold p-3.5 rounded-xl border border-slate-200 transition flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-emerald-600" />
                <div className="text-right">
                  <div className="text-xs font-bold">استرجاع نسخة من الكمبيوتر</div>
                  <div className="text-[10px] text-slate-500">رفع ملف JSON سابق لاستعادة بيانات المحل</div>
                </div>
              </div>
              <span className="text-xs text-emerald-600 font-bold">استرجاع ⬆️</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            {/* Reset Defaults */}
            <button
              type="button"
              onClick={handleResetConfirm}
              className="w-full bg-red-50 hover:bg-red-100 text-red-800 font-bold p-3.5 rounded-xl border border-red-200 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-5 h-5 text-red-600" />
                <div className="text-right">
                  <div className="text-xs font-bold">إعادة ضبط المصنع</div>
                  <div className="text-[10px] text-red-600/70">استعادة بيانات المراتب الافتراضية</div>
                </div>
              </div>
              <span className="text-xs text-red-600 font-bold">إعادة ضبط 🔄</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
