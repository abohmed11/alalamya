import React, { useState } from 'react';
import { X, Lock, KeyRound, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Employee } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  currentActiveEmployeeId: string;
  onSelectEmployee: (employee: Employee) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  employees,
  currentActiveEmployeeId,
  onSelectEmployee,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(currentActiveEmployeeId);
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetEmp = employees.find((e) => e.id === selectedEmpId);
    if (!targetEmp) {
      setErrorMsg('يرجى اختيار الموظف أولاً');
      return;
    }

    if (targetEmp.pin && pin !== targetEmp.pin) {
      setErrorMsg('رمز PIN غير صحيح! حاول مرة أخرى.');
      return;
    }

    onSelectEmployee(targetEmp);
    setPin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">تبديل الموظف / تسجيل الدخول</h3>
              <p className="text-xs text-slate-500">اختر حسابك وادخل رمز PIN لتسجيل الشيفت</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Employee Selection Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              اختر الموظف:
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {employees
                .filter((e) => e.isActive)
                .map((emp) => {
                  const isSelected = selectedEmpId === emp.id;
                  return (
                    <button
                      type="button"
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmpId(emp.id);
                        setErrorMsg('');
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border text-right transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 text-slate-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg ${emp.avatarColor || 'bg-blue-600'} flex items-center justify-center text-white font-bold text-sm shadow-xs`}
                        >
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{emp.name}</div>
                          <div className="text-xs text-slate-500">
                            {emp.role === 'admin' ? 'مدير النظام (إسلام شومان)' : 'موظف مبيعات'}
                          </div>
                        </div>
                      </div>

                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* PIN Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              رمز PIN الخاص بالموظف:
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="أدخل رمز PIN"
                autoFocus
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-center font-bold tracking-widest text-lg focus:outline-none focus:border-blue-600 transition shadow-xs"
              />
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 text-center">
              * الأكواد الافتراضية: مدير (1234) | كريم (1111) | حفصة (2222)
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            >
              تسجيل الدخول والبدء
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
