import { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Store,
  UserCog,
  ToggleLeft,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  Rocket,
  FileText,
  Smartphone,
  ShieldCheck,
  Megaphone,
  ClipboardList
} from 'lucide-react';
import { useState } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  activeSection?: string;
  onNavigate?: (section: string) => void;
  onLogout?: () => void;
  onQuickOnboard?: () => void;
  adminUser?: { email: string; name?: string; role?: string } | null;
}

export function AdminLayout({ children, activeSection = 'dashboard', onNavigate, onLogout, onQuickOnboard, adminUser }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Tenants', icon: Users },
    { id: 'licenses', label: 'Licenses', icon: Shield },
    { id: 'stores', label: 'Stores', icon: Store },
    { id: 'members', label: 'Members', icon: UserCog },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'features', label: 'Feature Flags', icon: ToggleLeft },
    { id: 'auditLogs', label: 'Audit Logs', icon: FileText },
    { id: 'adminUsers', label: 'Admin Users', icon: ShieldCheck },
    { id: 'system', label: 'System Config', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'surveys', label: 'Surveys', icon: ClipboardList }
  ];

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className={`bg-gray-900 text-white transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <div>
                  <h1 className="text-xl font-bold text-orange-400">Mango POS</h1>
                  <p className="text-xs text-gray-400">Provider Portal</p>
                </div>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Quick Onboard Button */}
          {onQuickOnboard && (
            <div className="px-4 pt-4">
              <button
                onClick={onQuickOnboard}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg ${
                  !sidebarOpen ? 'justify-center' : ''
                }`}
              >
                <Rocket className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">Quick Onboard</span>}
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            {sidebarOpen && adminUser && (
              <div className="mb-3 px-3">
                <p className="text-sm text-gray-200 font-medium truncate">{adminUser.name || adminUser.email}</p>
                <p className="text-xs text-gray-400 truncate">{adminUser.role || 'Admin'}</p>
              </div>
            )}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
