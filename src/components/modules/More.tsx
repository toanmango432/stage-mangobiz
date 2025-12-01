import {
  DollarSign,
  Smartphone,
  User,
  Lock,
  Calendar,
  Settings,
  ChevronRight,
  Palette,
  Ticket,
  Shield,
  Key,
  LogOut,
  Sparkles,
  UserCog,
  LayoutGrid,
  Users,
  Heart
} from 'lucide-react';
import { storeAuthManager } from '../../services/storeAuthManager';

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

  const menuItems = [
    { id: 'frontdesk-settings', label: 'Front Desk Settings', icon: LayoutGrid, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'category', label: 'Category', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'clients', label: 'Clients', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'provider-control-center', label: '🔐 Provider Control Center (DEV)', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'sales', label: "Today's Sales", icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'license', label: 'License & Activation', icon: Key, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'devices', label: 'Device Manager', icon: Smartphone, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { id: 'account', label: 'Account', icon: User, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'closeout', label: 'End of Day Close Out', icon: Lock, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'team-settings', label: 'Team', icon: UserCog, color: 'text-teal-600', bg: 'bg-teal-50' },
    { id: 'role-settings', label: 'Roles & Permissions', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'admin', label: 'Admin Back Office', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-50' },
    { id: 'header-preview', label: '🎨 Header Color Preview (DEV)', icon: Palette, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'ticket-preview', label: '🎫 Ticket Color Preview (DEV)', icon: Ticket, color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: 'logout', label: 'Logout', icon: LogOut, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="h-full bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">More</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="flex items-center gap-4 p-5 bg-white rounded-xl hover:shadow-md transition-all border border-gray-200 hover:border-gray-300 group"
                onClick={() => handleMenuClick(item.id)}
              >
                <div className={`w-12 h-12 ${item.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <span className="flex-1 text-left font-medium text-gray-900 text-lg">
                  {item.label}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
            <p className="text-2xl font-bold text-gray-900">$2,450</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Clients Served</p>
            <p className="text-2xl font-bold text-gray-900">23</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Active Staff</p>
            <p className="text-2xl font-bold text-gray-900">8</p>
          </div>
        </div>
      </div>
    </div>
  );
}
