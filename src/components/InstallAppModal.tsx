import React, { useState, useEffect } from 'react';
import { Monitor, Download, X, CheckCircle2, Laptop, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone display mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn dir-rtl">
      <div className="bg-slate-900 border-2 border-blue-500/40 rounded-2xl max-w-xl w-full text-white shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                تثبيت برنامج العالمية للمراتب على الكمبيوتر
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ويندوز 7 / 10 / 11
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">تشغيل فوري بضغطة واحدة من سطح المكتب كبرنامج رئيسي للمحل</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Message */}
          {installSuccess || isInstalled ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-emerald-200">التطبيق مثبت بالفعل على جهازك!</h3>
                <p className="text-xs text-emerald-300/80 mt-1">
                  يمكنك فتح البرنامج مباشرة من أيقونة "العالمية للمراتب" الموجودة على سطح المكتب أو قائمة ابدأ (Start Menu) بدون الحاجة لفتح المتصفح يدوياً.
                </p>
              </div>
            </div>
          ) : deferredPrompt ? (
            <div className="bg-blue-950/50 border border-blue-500/30 p-4 rounded-xl flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-blue-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  جهازك جاهز للتثبيت الفوري بضغطة زر!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  سيتم إنشاء أيقونة واختصار للبرنامج على سطح المكتب تعمل بشكل منفصل عن المتصفح.
                </p>
              </div>
              <button
                onClick={handleInstallClick}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-3 rounded-xl shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                تثبيت الآن 💻
              </button>
            </div>
          ) : null}

          {/* Detailed Instructions for Manual Desktop Installation (Windows 7, 10, 11) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-400" />
              طريقة التثبيت وإضافة اختصار لسطح المكتب (ويندوز 7 و 10 و 11):
            </h3>

            <ol className="space-y-2.5 text-xs text-slate-300 font-medium leading-relaxed">
              <li className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                <div>
                  في متصفحك الحالي (Chrome أو Microsoft Edge)، اضغط على <strong className="text-blue-300">قائمة المتصفح (الثلاث نقاط ⚙️)</strong> الموجودة أعلى الصفحة.
                </div>
              </li>

              <li className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                <div>
                  اختر أمر <strong className="text-emerald-300">"تثبيت برنامج العالمية للمراتب (Install App)"</strong> أو من قائمة <strong className="text-blue-300">"أدوات إضافية (More Tools)" ⬅️ "إنشاء اختصار (Create Shortcut)"</strong>.
                </div>
              </li>

              <li className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                <div>
                  تأكد من وضع خيار صح <strong className="text-amber-300">"فتح كـ نافذة مستقلة (Open as window)"</strong> ثم اضغط على زر <strong className="text-emerald-400">تثبيت (Install)</strong>.
                </div>
              </li>

              <li className="flex items-start gap-2 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30 text-emerald-200">
                <span className="bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">✓</span>
                <div>
                  مبروك! تم إنشاء أيقونة البرنامج على سطح المكتب. عند فتحها ستعمل كبرنامج كمبيوتر مستقل سريع وسلس جداً وبدون شريط عنوان متصفح.
                </div>
              </li>
            </ol>
          </div>

          {/* Advantages List */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
              <span>يعمل بدون انقطاع وبسرعة فائقة</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>مظهر برنامج كمبيوتر احترافي نافذة كاملة</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">متوافق تماماً مع جميع إصدارات Windows</span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
