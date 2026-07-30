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
  FileSpreadsheet,
  Building,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Info,
  Laptop,
} from 'lucide-react';
import { SystemData, StoreSettings } from '../types';
import { exportBackupJSON, importBackupJSON, exportSystemDataToExcel, formatCurrency, selectAutoSaveFile, selectAutoSaveExcelFile } from '../utils/storage';
import { InstallAppModal } from './InstallAppModal';

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
  const [autoSaveExcelName, setAutoSaveExcelName] = useState<string | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const handleSelectAutoSaveFile = async () => {
    try {
      const fileName = await selectAutoSaveFile();
      if (fileName) {
        setAutoSaveFileName(fileName);
        setToastMsg(`تم ربط الحفظ التلقائي بملف JSON: ${fileName}`);
        setTimeout(() => setToastMsg(''), 5000);
      }
    } catch (err: any) {
      alert(err?.message || 'تعذر تحديد ملف الحفظ التلقائي.');
    }
  };

  const handleSelectAutoSaveExcelFile = async () => {
    try {
      const fileName = await selectAutoSaveExcelFile(systemData);
      if (fileName) {
        setAutoSaveExcelName(fileName);
        setToastMsg(`تم إنشاء وربط ملف إكسيل (.xlsx) على سطح المكتب بنجاح: ${fileName}`);
        setTimeout(() => setToastMsg(''), 6000);
      }
    } catch (err: any) {
      alert(err?.message || 'تعذر تحديد ملف الإكسيل للحفظ التلقائي.');
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
            {/* Desktop App Install Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-xl border-2 border-emerald-500/50 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-600 rounded-lg text-white">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">تثبيت البرنامج على كمبيوتر المحل (Desktop App)</h4>
                    <p className="text-[11px] text-slate-300">تشغيل سلس وسريع بنوافذ مستقلة على ويندوز 7 و10 و11</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInstallModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Laptop className="w-4 h-4" />
                  <span>تثبيت الآن 💻</span>
                </button>
              </div>
            </div>

            {/* Primary Backup & Restore Actions Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 p-4 rounded-xl space-y-3 shadow-sm">
              <div className="text-xs font-black text-blue-900 border-b border-blue-200 pb-2 flex items-center justify-between">
                <span>🔄 النسخ الاحتياطي والاستعادة الفورية</span>
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">بضغطة واحدة</span>
              </div>

              {/* Download Backup Button */}
              <button
                type="button"
                onClick={() => exportBackupJSON(systemData)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black p-3.5 rounded-xl border-2 border-blue-700 transition flex items-center justify-between cursor-pointer shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white text-blue-700 p-2 rounded-lg shadow-sm">
                    <Download className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black tracking-wide">نسخ احتياطي للبيانات - Backup</div>
                    <div className="text-[11px] text-blue-100 font-bold">تنزيل ملف شامل بكل الفواتير والمنتجات وداتا المحل للحفظ على جهازك</div>
                  </div>
                </div>
                <span className="bg-white text-blue-900 text-xs px-3 py-1.5 rounded-lg font-black shrink-0 shadow-sm">تنزيل Backup ⬇️</span>
              </button>

              {/* Restore Backup Button */}
              <label className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black p-3.5 rounded-xl border-2 border-emerald-700 transition flex items-center justify-between cursor-pointer shadow-md active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <div className="bg-white text-emerald-700 p-2 rounded-lg shadow-sm">
                    <Upload className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black tracking-wide">استعادة البيانات - Restore</div>
                    <div className="text-[11px] text-emerald-100 font-bold">استرجاع داتا المحل بالكامل بضغطة زر عند تغيّر الجهاز أو الصيانة</div>
                  </div>
                </div>
                <span className="bg-white text-emerald-900 text-xs px-3 py-1.5 rounded-lg font-black shrink-0 shadow-sm">استعادة Restore ⬆️</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Auto Save Excel File Connection */}
            <button
              type="button"
              onClick={handleSelectAutoSaveExcelFile}
              className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold p-3.5 rounded-xl border-2 border-emerald-600 transition flex items-center justify-between cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-6 h-6 text-emerald-800" />
                <div className="text-right">
                  <div className="text-sm font-black text-emerald-950">
                    {autoSaveExcelName ? `مُتصل بملف إكسيل: ${autoSaveExcelName}` : 'ربط ملف إكسيل للحفظ التلقائي المباشر (.xlsx)'}
                  </div>
                  <div className="text-[11px] text-emerald-900 font-bold">
                    {autoSaveExcelName ? 'يتم كتابة وتعديل أوراق الإكسيل تلقائياً وفورياً مع كل عملية جديدة 🟢' : 'حدد ملف إكسيل على جهازك ليقوم النظام بتحديثه وتنسيقه تلقائياً مع كل فاتورة أو تغيير!'}
                  </div>
                </div>
              </div>
              <span className="text-xs bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold">
                {autoSaveExcelName ? 'مُتصل 🟢' : 'ربط إكسيل 📂'}
              </span>
            </button>

            {/* Auto Save JSON File Connection */}
            <button
              type="button"
              onClick={handleSelectAutoSaveFile}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold p-3.5 rounded-xl border border-blue-200 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileJson className="w-5 h-5 text-blue-600" />
                <div className="text-right">
                  <div className="text-xs font-bold">
                    {autoSaveFileName ? `متصل بملف JSON: ${autoSaveFileName}` : 'ربط ملف JSON للحفظ التلقائي على الجهاز'}
                  </div>
                  <div className="text-[10px] text-blue-700">
                    {autoSaveFileName ? 'يتم حفظ كل عملية تلقائياً داخل هذا الملف بفرمت JSON' : 'اختر ملف .json على الفلاشة أو الهارد ليتم كتابة أي عملية جديدة فيه تلقائياً'}
                  </div>
                </div>
              </div>
              <span className="text-xs text-blue-600 font-bold">{autoSaveFileName ? 'مُتصل 🟢' : 'تحديد 📂'}</span>
            </button>

            {/* Download Excel Sheet Instant Export */}
            <button
              type="button"
              onClick={() => exportSystemDataToExcel(systemData)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold p-3.5 rounded-xl border border-slate-300 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-5 h-5 text-emerald-700" />
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">تنزيل وتصدير ملف إكسيل حالي (.xlsx Excel)</div>
                  <div className="text-[10px] text-slate-600">تحميل نسخة فوريّة بجميع الشيتات (المنتجات، المبيعات، تفاصيل الأصناف، الموظفين)</div>
                </div>
              </div>
              <span className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold">تحميل إكسيل 📊</span>
            </button>

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

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
