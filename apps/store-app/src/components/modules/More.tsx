import {
  Lock,
  Calendar,
  Settings,
  ChevronRight,
  Shield,
  LogOut,
  Sparkles,
  UserCog,
  LayoutGrid,
  Users,
  Heart,
  FileText,
  TrendingUp,
  CheckCircle,
  Store,
  ClipboardList,
  type LucideIcon
} from 'lucide-react';
import { storeAuthManager } from '../../services/storeAuthManager';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  destructive?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MoreProps {
  onNavigate?: (module: string) => void;
}

export function More({ onNavigate }: MoreProps = {}) {
  const handleMenuClick = async (itemId: string) => {
    // Handle provider control center navigation to /admin
    if (itemId === 'provider-control-center') {
      window.location.href = '/admin';
      return;
    }
    // Handle logout
    if (itemId === 'logout') {
      if (confirm('Are you sure you want to logout?')) {
        await storeAuthManager.logoutStore();
        // Force page reload to reset app state
        window.location.reload();
      }
      return;
    }
    // Handle regular navigation
    onNavigate?.(itemId);
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Daily Operations',
      items: [
        { id: 'closed', label: 'Closed Tickets', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'todays-sales', label: "Today's Sales", icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'transaction-records', label: 'Transaction Records', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'closeout', label: 'End of Day Close Out', icon: Lock, color: 'text-red-600', bg: 'bg-red-50' },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'clients', label: 'Clients', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
        { id: 'team-settings', label: 'Team', icon: UserCog, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'schedule', label: 'Schedule', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'category', label: 'Services & Categories', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { id: 'settings', label: 'Settings', icon: Store, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        { id: 'frontdesk-settings', label: 'Front Desk Layout', icon: LayoutGrid, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'role-settings', label: 'Roles & Permissions', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
      ]
    },
    {
      title: 'Administration',
      items: [
        { id: 'activity-log', label: 'Activity Log', icon: ClipboardList, color: 'text-teal-600', bg: 'bg-teal-50' },
        { id: 'admin', label: 'Admin Back Office', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100' },
        { id: 'provider-control-center', label: '🔐 Provider Control Center (DEV)', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
      ]
    },
    {
      title: 'Account',
      items: [
        { id: 'logout', label: 'Logout', icon: LogOut, color: 'text-red-600', bg: 'bg-red-50', destructive: true },
      ]
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">More</h1>

        {/* Menu Sections */}
        <div className="space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className={`flex items-center gap-4 p-4 bg-white rounded-xl hover:shadow-md transition-all border group ${
                        item.destructive 
                          ? 'border-red-200 hover:border-red-300' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleMenuClick(item.id)}
                    >
                      <div className={`w-11 h-11 ${item.bg} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className={`flex-1 text-left font-medium text-base ${
                        item.destructive ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {item.label}
                      </span>
                      <ChevronRight className={`w-5 h-5 transition-colors ${
                        item.destructive 
                          ? 'text-red-300 group-hover:text-red-500' 
                          : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
