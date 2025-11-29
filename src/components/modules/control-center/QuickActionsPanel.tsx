import {
  Download,
  Upload,
  Trash2,
  Database,
  Settings,
  Users,
  Calendar,
  DollarSign,
  FileText,
  RotateCcw,
  Archive,
  Shield
} from 'lucide-react';

export function QuickActionsPanel() {
  const quickActions = [
    {
      id: 'export-data',
      label: 'Export Data',
      description: 'Download database backup',
      icon: Download,
      color: 'blue',
      action: () => console.log('Export data')
    },
    {
      id: 'import-data',
      label: 'Import Data',
      description: 'Restore from backup',
      icon: Upload,
      color: 'green',
      action: () => console.log('Import data')
    },
    {
      id: 'manage-staff',
      label: 'Manage Staff',
      description: 'Add or edit team members',
      icon: Users,
      color: 'purple',
      action: () => console.log('Manage staff')
    },
    {
      id: 'manage-services',
      label: 'Manage Services',
      description: 'Update service catalog',
      icon: Settings,
      color: 'indigo',
      action: () => console.log('Manage services')
    },
    {
      id: 'view-reports',
      label: 'View Reports',
      description: 'Generate business reports',
      icon: FileText,
      color: 'orange',
      action: () => console.log('View reports')
    },
    {
      id: 'end-of-day',
      label: 'End of Day',
      description: 'Close out daily operations',
      icon: Calendar,
      color: 'red',
      action: () => console.log('End of day')
    },
    {
      id: 'cleanup-data',
      label: 'Cleanup Data',
      description: 'Archive old records',
      icon: Archive,
      color: 'yellow',
      action: () => console.log('Cleanup data')
    },
    {
      id: 'security',
      label: 'Security',
      description: 'Manage permissions',
      icon: Shield,
      color: 'slate',
      action: () => console.log('Security settings')
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; hover: string }> = {
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600', hover: 'hover:bg-blue-100' },
      green: { bg: 'bg-green-50', icon: 'text-green-600', hover: 'hover:bg-green-100' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600', hover: 'hover:bg-purple-100' },
      indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', hover: 'hover:bg-indigo-100' },
      orange: { bg: 'bg-orange-50', icon: 'text-orange-600', hover: 'hover:bg-orange-100' },
      red: { bg: 'bg-red-50', icon: 'text-red-600', hover: 'hover:bg-red-100' },
      yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', hover: 'hover:bg-yellow-100' },
      slate: { bg: 'bg-slate-50', icon: 'text-slate-600', hover: 'hover:bg-slate-100' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-gray-600" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const colors = getColorClasses(action.color);
          return (
            <button
              key={action.id}
              onClick={action.action}
              className={`p-4 rounded-lg border border-gray-200 ${colors.hover} transition-all hover:shadow-md group text-left`}
            >
              <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {action.label}
              </h4>
              <p className="text-xs text-gray-600">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
