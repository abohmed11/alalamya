import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Plus,
  Edit,
  KeyRound,
  CheckCircle2,
  XCircle,
  X,
  UserCheck,
  Lock,
} from 'lucide-react';
import { Employee, PermissionKey } from '../types';
import { ALL_PERMISSIONS } from '../data/initialData';

interface EmployeesViewProps {
  employees: Employee[];
  activeEmployee: Employee;
  onUpdateEmployee: (updated: Employee) => void;
  onAddEmployee: (newEmp: Employee) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  activeEmployee,
  onUpdateEmployee,
  onAddEmployee,
}) => {
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(
    employees.length > 0 ? employees[0] : null
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'sales' | 'accountant'>('sales');
  const [pin, setPin] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarColor, setAvatarColor] = useState('bg-blue-600');
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);

  const isManager = activeEmployee.role === 'admin';

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmp(emp);
    setName(emp.name);
    setRole(emp.role);
    setPin(emp.pin);
    setPhone(emp.phone || '');
    setAvatarColor(emp.avatarColor || 'bg-blue-600');
    setPermissions([...emp.permissions]);
    setIsEditModalOpen(true);
  };

  const handleOpenAdd = () => {
    setName('');
    setRole('sales');
    setPin('1234');
    setPhone('');
    setAvatarColor('bg-purple-600');
    setPermissions(['create_invoices', 'view_archive']);
    setIsAddModalOpen(true);
  };

  const handleTogglePermission = (permKey: PermissionKey) => {
    if (permissions.includes(permKey)) {
      setPermissions(permissions.filter((p) => p !== permKey));
    } else {
      setPermissions([...permissions, permKey]);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    const updated: Employee = {
      ...selectedEmp,
      name: name.trim(),
      role,
      pin: pin.trim(),
      phone: phone.trim(),
      avatarColor,
      permissions,
    };

    onUpdateEmployee(updated);
    setSelectedEmp(updated);
    setIsEditModalOpen(false);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: name.trim(),
      role,
      pin: pin.trim(),
      phone: phone.trim(),
      avatarColor,
      permissions,
      isActive: true,
    };

    onAddEmployee(newEmp);
    setSelectedEmp(newEmp);
    setIsAddModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">إدارة الموظفين وتحديد صلاحيات السيستم</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            يقوم المدير (إسلام شومان) بتحديد صلاحيات كل موظف (مثل كريم وحفصة) وأكواد الـ PIN الخاصة بكل شفت
          </p>
        </div>

        {isManager && (
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Employee Cards List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-700 mb-2">قائمة الموظفين بالسيستم:</h3>
          {employees.map((emp) => {
            const isSelected = selectedEmp?.id === emp.id;
            return (
              <div
                key={emp.id}
                onClick={() => setSelectedEmp(emp)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-50/60 border-blue-600 text-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${
                      emp.avatarColor || 'bg-blue-600'
                    } flex items-center justify-center text-white font-bold text-sm shadow-xs`}
                  >
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{emp.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {emp.role === 'admin' ? 'مدير النظام الرئيسي' : 'موظف مبيعات وشفت'}
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-bold dir-ltr">
                    PIN: {emp.pin}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Employee Permissions View & Controls (8 cols) */}
        {selectedEmp && (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl ${
                    selectedEmp.avatarColor || 'bg-blue-600'
                  } flex items-center justify-center text-white font-bold text-lg shadow-sm`}
                >
                  {selectedEmp.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {selectedEmp.name}
                    {selectedEmp.role === 'admin' && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-md font-bold">
                        إدارة إسلام شومان
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    رمز PIN الخاص بالشفت: <span className="text-blue-600 font-bold">{selectedEmp.pin}</span> | رقم الهاتف: {selectedEmp.phone || 'غير مسجل'}
                  </p>
                </div>
              </div>

              {isManager && (
                <button
                  onClick={() => handleOpenEdit(selectedEmp)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-4 h-4 text-blue-600" />
                  <span>تعديل الصلاحيات والـ PIN</span>
                </button>
              )}
            </div>

            {/* Granted Permissions List */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                الصلاحيات الممنوحة لهذا الموظف:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_PERMISSIONS.map((perm) => {
                  const hasIt =
                    selectedEmp.role === 'admin' ||
                    selectedEmp.permissions.includes(perm.key);

                  return (
                    <div
                      key={perm.key}
                      className={`p-3 rounded-xl border transition flex items-start gap-2.5 ${
                        hasIt
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      {hasIt ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900">{perm.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{perm.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {isEditModalOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-900">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">تعديل الموظف ({selectedEmp.name})</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم الموظف:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رمز PIN للشفت:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-blue-600 font-bold shadow-xs"
                  />
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-900">
                  اختر الصلاحيات المسموحة للموظف:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = permissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center gap-2 transition ${
                          isChecked
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-blue-600"
                        />
                        <span>{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ الصلاحيات
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-900">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">إضافة موظف جديد للشفتات</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثل: أحمد أو سارة"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">كود PIN:</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="1234"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-blue-600 font-bold shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الدور الوظيفي:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'sales')}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 shadow-xs"
                  >
                    <option value="sales">موظف مبيعات وشيفت</option>
                    <option value="admin">مدير مع صلاحيات كاملة</option>
                  </select>
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-900">
                  حدد صلاحيات الموظف الجديد:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = permissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center gap-2 transition ${
                          isChecked
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-blue-600"
                        />
                        <span>{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-xs"
                >
                  إضافة الموظف الآن
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
