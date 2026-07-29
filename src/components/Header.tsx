import React from 'react';
import {
  ShoppingCart,
  FileText,
  Package,
  BarChart3,
  Users,
  ShieldCheck,
  UserCheck,
  LogOut,
  Store,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Employee, StoreSettings, ShiftLog } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeEmployee: Employee;
  activeShift: ShiftLog | null;
  settings: StoreSettings;
  onSwitchUserClick: () => void;
  onHandoverShiftClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeEmployee,
  activeShift,
  settings,
  onSwitchUserClick,
  onHandoverShiftClick,
}) => {
  const hasPermission = (key: string) => {
    if (activeEmployee.role === 'admin') return true;
    return activeEmployee.permissions.includes(key as any);
  };

  const navItems = [
    {
      id: 'invoicing',
      label: 'إصدار الفواتير',
      icon: ShoppingCart,
      perm: 'create_invoices',
    },
    {
      id: 'archive',
      label: 'أرشيف الفواتير',
      icon: FileText,
      perm: 'view_archive',
    },
    {
      id: 'warehouse',
      label: 'المخزن والمخزون',
      icon: Package,
      perm: 'manage_warehouse',
    },
    {
      id: 'reports',
      label: 'التقارير والشيفتات',
      icon: BarChart3,
      perm: 'view_reports',
    },
    {
      id: 'employees',
      label: 'الموظفين والصلاحيات',
      icon: Users,
      perm: 'access_admin',
    },
    {
      id: 'admin',
      label: 'صفحة الأدمن والمدير',
      icon: ShieldCheck,
      perm: 'access_admin',
    },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-4 border-b border-slate-800">
          {/* Store Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-sm">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {settings.storeName}
                </h1>
                <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-0.5 rounded-full border border-blue-500/30 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" /> إدارة إسلام شومان
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                المدير المسؤول: <span className="text-slate-200 font-semibold">{settings.managerName}</span> | 📞 {settings.phone1}
              </p>
            </div>
          </div>

          {/* User & Active Shift Info Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950 p-2 sm:p-2.5 rounded-xl border border-slate-800">
            {/* Active User Avatar */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-800">
              <div className={`w-8 h-8 rounded-lg ${activeEmployee.avatarColor || 'bg-blue-600'} flex items-center justify-center text-white font-bold text-xs shadow-xs`}>
                {activeEmployee.name.charAt(0)}
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">المستخدم الحالي</div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  {activeEmployee.name}
                  {activeEmployee.role === 'admin' && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                      مدير
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Shift Status */}
            <div className="flex items-center gap-2 px-2 sm:px-3 text-xs">
              <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
              <div>
                <div className="text-slate-400">الشيفت النشط:</div>
                <div className="text-blue-400 font-bold">
                  {activeShift ? `شفت ${activeShift.employeeName}` : 'لا يوجد شيفت'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 mr-auto sm:mr-0">
              <button
                onClick={onSwitchUserClick}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center gap-1.5 font-medium cursor-pointer"
                title="تغيير المستخدم بكود PIN"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>تبديل الموظف</span>
              </button>

              <button
                onClick={onHandoverShiftClick}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 font-semibold cursor-pointer shadow-xs"
                title="تسليم الشيفت وإغلاق الخزينة"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسليم الشيفت</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const allowed = hasPermission(item.perm);
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (allowed) {
                    setActiveTab(item.id);
                  } else {
                    alert(`عذراً، الموظف (${activeEmployee.name}) لا يملك صلاحية الوصول لـ (${item.label}). يمكن للمدير إسلام شومان إعطائك هذه الصلاحية.`);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : allowed
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 opacity-60 cursor-not-allowed'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {!allowed && <Lock className="w-3 h-3 text-slate-500" />}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
