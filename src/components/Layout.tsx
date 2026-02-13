import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useClientStore } from '../store/clientStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { useSettingsStore } from '../store/settingsStore';
import { useServiceTemplateStore } from '../store/serviceTemplateStore';
import { useReminderStore } from '../store/reminderStore';
import { seedDefaultSettings } from '../store/db';

export const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadClients = useClientStore((s) => s.loadClients);
  const loadInvoices = useInvoiceStore((s) => s.loadInvoices);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const loadTemplates = useServiceTemplateStore((s) => s.loadTemplates);
  const loadReminders = useReminderStore((s) => s.loadReminders);
  const checkOverdue = useInvoiceStore((s) => s.checkOverdueInvoices);
  const pendingReminders = useReminderStore((s) =>
    s.reminders.filter((r) => !r.completed).length
  );

  const initApp = useCallback(async () => {
    await seedDefaultSettings();
    await Promise.all([
      loadClients(),
      loadInvoices(),
      loadSettings(),
      loadTemplates(),
      loadReminders(),
    ]);
    await checkOverdue();
    setInitialized(true);
  }, [loadClients, loadInvoices, loadSettings, loadTemplates, loadReminders, checkOverdue]);

  useEffect(() => {
    initApp();
  }, [initApp]);

  if (!initialized) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading SSI Billing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        pendingReminders={pendingReminders}
      />
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-56'
        }`}
      >
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
