import { 
  DollarSign, 
  Smartphone, 
  User, 
  Lock, 
  Users, 
  Calendar, 
  Settings,
  ChevronRight 
} from 'lucide-react';

export function More() {
  const menuItems = [
    { id: 'sales', label: "Today's Sales", icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'devices', label: 'Device Manager', icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'account', label: 'Account', icon: User, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'closeout', label: 'End of Day Close Out', icon: Lock, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'team', label: 'Team', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'admin', label: 'Admin Back Office', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-50' },
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
