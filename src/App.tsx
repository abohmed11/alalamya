import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { InvoicingView } from './components/InvoicingView';
import { InvoiceArchiveView } from './components/InvoiceArchiveView';
import { WarehouseView } from './components/WarehouseView';
import { ReportsView } from './components/ReportsView';
import { EmployeesView } from './components/EmployeesView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { LoginModal } from './components/LoginModal';
import { ShiftHandoverModal } from './components/ShiftHandoverModal';
import { SystemData, MattressItem, Invoice, Employee, ShiftLog, StoreSettings } from './types';
import { loadSystemData, saveSystemData, resetSystemData, loadFromIndexedDB } from './utils/storage';

export default function App() {
  const [data, setData] = useState<SystemData>(() => loadSystemData());
  const [activeTab, setActiveTab] = useState<string>('invoicing');

  // Modal Dialogs State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  // Load IndexedDB local database on startup
  useEffect(() => {
    async function initLocalData() {
      const idbData = await loadFromIndexedDB();
      if (idbData && idbData.items && idbData.invoices) {
        setData(idbData);
      }
    }
    initLocalData();
  }, []);

  // Sync state changes to localStorage & Cloud SQL
  useEffect(() => {
    saveSystemData(data);
  }, [data]);

  // Active Employee
  const activeEmployee = useMemo(() => {
    return (
      data.employees.find((e) => e.id === data.activeEmployeeId) ||
      data.employees[0]
    );
  }, [data.employees, data.activeEmployeeId]);

  // Active Shift
  const activeShift = useMemo(() => {
    return (
      data.shifts.find(
        (s) => s.id === data.activeShiftId || (s.employeeId === activeEmployee.id && s.status === 'active')
      ) || null
    );
  }, [data.shifts, data.activeShiftId, activeEmployee]);

  // Ensure active employee has an open shift or auto-create one
  useEffect(() => {
    if (!activeShift && activeEmployee) {
      const newShift: ShiftLog = {
        id: `shift-${Date.now()}`,
        employeeId: activeEmployee.id,
        employeeName: activeEmployee.name,
        startTime: new Date().toISOString(),
        status: 'active',
        startingCash: 1000,
        expectedEndingCash: 1000,
        totalSales: 0,
        totalCashSales: 0,
        totalVisaSales: 0,
        totalCreditSales: 0,
        invoicesCount: 0,
      };

      setData((prev) => ({
        ...prev,
        shifts: [newShift, ...prev.shifts],
        activeShiftId: newShift.id,
      }));
    }
  }, [activeEmployee, activeShift]);

  // Handle Switch User / Login
  const handleSelectEmployee = (emp: Employee) => {
    setData((prev) => ({
      ...prev,
      activeEmployeeId: emp.id,
    }));
  };

  // Handle Create Invoice & Stock Deduction
  const handleCreateInvoice = (newInvoice: Invoice) => {
    setData((prev) => {
      // 1. Deduct Mattress Stock
      const updatedItems = prev.items.map((item) => {
        const cartMatch = newInvoice.items.find((ci) => ci.mattressId === item.id);
        if (cartMatch) {
          const newQty = item.stockQuantity - cartMatch.quantity;
          return {
            ...item,
            stockQuantity: newQty < 0 ? 0 : newQty,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      });

      // 2. Update Active Shift Sales
      const updatedShifts = prev.shifts.map((shift) => {
        if (shift.id === newInvoice.shiftId || (shift.employeeId === newInvoice.employeeId && shift.status === 'active')) {
          const isCash = newInvoice.paymentMethod === 'cash';
          const isVisa = newInvoice.paymentMethod === 'visa';
          
          return {
            ...shift,
            totalSales: shift.totalSales + newInvoice.netTotal,
            totalCashSales: shift.totalCashSales + (isCash ? newInvoice.paidAmount : 0),
            totalVisaSales: shift.totalVisaSales + (isVisa ? newInvoice.paidAmount : 0),
            totalCreditSales: shift.totalCreditSales + newInvoice.remainingAmount,
            invoicesCount: shift.invoicesCount + 1,
            expectedEndingCash: shift.startingCash + shift.totalCashSales + (isCash ? newInvoice.paidAmount : 0),
          };
        }
        return shift;
      });

      return {
        ...prev,
        items: updatedItems,
        invoices: [newInvoice, ...prev.invoices],
        shifts: updatedShifts,
      };
    });
  };

  // Handle Cancel Invoice & Restore Stock
  const handleCancelInvoice = (invoiceId: string, reason: string) => {
    setData((prev) => {
      const targetInvoice = prev.invoices.find((i) => i.id === invoiceId);
      if (!targetInvoice || targetInvoice.status === 'cancelled') return prev;

      // Restore items to warehouse stock
      const restoredItems = prev.items.map((item) => {
        const invMatch = targetInvoice.items.find((ci) => ci.mattressId === item.id);
        if (invMatch) {
          return {
            ...item,
            stockQuantity: item.stockQuantity + invMatch.quantity,
          };
        }
        return item;
      });

      // Update invoice status
      const updatedInvoices = prev.invoices.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            status: 'cancelled' as const,
            cancelledBy: activeEmployee.name,
            cancelReason: reason,
          };
        }
        return inv;
      });

      return {
        ...prev,
        items: restoredItems,
        invoices: updatedInvoices,
      };
    });
  };

  // Warehouse CRUD
  const handleAddItem = (newItem: MattressItem) => {
    setData((prev) => ({
      ...prev,
      items: [newItem, ...prev.items],
    }));
  };

  const handleUpdateItem = (updatedItem: MattressItem) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
    }));
  };

  const handleDeleteItem = (itemId: string) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
    }));
  };

  // Employee CRUD
  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setData((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)),
    }));
  };

  const handleAddEmployee = (newEmp: Employee) => {
    setData((prev) => ({
      ...prev,
      employees: [...prev.employees, newEmp],
    }));
  };

  // Confirm Shift Handover
  const handleConfirmHandover = (
    shiftId: string,
    actualEndingCash: number,
    notes: string
  ) => {
    setData((prev) => {
      const updatedShifts = prev.shifts.map((s) => {
        if (s.id === shiftId) {
          return {
            ...s,
            status: 'closed' as const,
            endTime: new Date().toISOString(),
            actualEndingCash,
            notes,
          };
        }
        return s;
      });

      return {
        ...prev,
        shifts: updatedShifts,
        activeShiftId: null,
      };
    });

    alert('تم إغلاق الشيفت وتسليم العهدة بنجاح! يمكنك الآن اختيار الموظف التالي للشيفت الجديد.');
    setIsLoginModalOpen(true);
  };

  // Admin Settings Update & Restore
  const handleUpdateSettings = (newSettings: StoreSettings) => {
    setData((prev) => ({
      ...prev,
      settings: newSettings,
    }));
  };

  const handleRestoreSystemData = (newData: SystemData) => {
    setData(newData);
  };

  const handleResetData = () => {
    const res = resetSystemData();
    setData(res);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans dir-rtl text-right antialiased selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeEmployee={activeEmployee}
        activeShift={activeShift}
        settings={data.settings}
        onSwitchUserClick={() => setIsLoginModalOpen(true)}
        onHandoverShiftClick={() => setIsHandoverModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="pb-16">
        {activeTab === 'invoicing' && (
          <InvoicingView
            items={data.items}
            invoices={data.invoices}
            activeEmployee={activeEmployee}
            activeShift={activeShift}
            settings={data.settings}
            onCreateInvoice={handleCreateInvoice}
          />
        )}

        {activeTab === 'archive' && (
          <InvoiceArchiveView
            invoices={data.invoices}
            settings={data.settings}
            activeEmployee={activeEmployee}
            onCancelInvoice={handleCancelInvoice}
          />
        )}

        {activeTab === 'warehouse' && (
          <WarehouseView
            items={data.items}
            activeEmployee={activeEmployee}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            invoices={data.invoices}
            shifts={data.shifts}
            settings={data.settings}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeesView
            employees={data.employees}
            activeEmployee={activeEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onAddEmployee={handleAddEmployee}
          />
        )}

        {activeTab === 'admin' && (
          <AdminSettingsView
            systemData={data}
            onUpdateSettings={handleUpdateSettings}
            onRestoreSystemData={handleRestoreSystemData}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Login & Switch User Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        employees={data.employees}
        currentActiveEmployeeId={data.activeEmployeeId}
        onSelectEmployee={handleSelectEmployee}
      />

      {/* Shift Handover Modal */}
      <ShiftHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        activeShift={activeShift}
        invoices={data.invoices}
        settings={data.settings}
        onConfirmHandover={handleConfirmHandover}
      />
    </div>
  );
}
