import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Wrench,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SyncStatus } from './SyncStatus';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/services', icon: Wrench, label: 'Services' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  pendingReminders: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, pendingReminders }) => {
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-30 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-56'
      }`}
      style={{ backgroundColor: '#1a2742' }}
    >
      {/* Logo */}
      <div className="flex items-center px-4 h-16 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm">SSI Billing</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mx-auto">
            <FileText size={18} className="text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium relative ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white/90'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {item.to === '/reminders' && pendingReminders > 0 && (
                <span
                  className={`absolute ${collapsed ? 'top-0 right-0' : 'right-3'} bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center`}
                >
                  {pendingReminders}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Cloud Sync Status */}
      <SyncStatus collapsed={collapsed} />

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t border-white/10 text-white/50 hover:text-white/90 hover:bg-white/5 transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
};
