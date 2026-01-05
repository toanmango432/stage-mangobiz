/**
 * Settings Navigation Component
 * Left sidebar navigation for the 7 settings categories
 */

import { Building2, CreditCard, Receipt, User, Monitor, Plug, Palette } from 'lucide-react';
import type { SettingsCategory } from '@/types/settings';
import { cn } from '@/lib/utils';

interface SettingsNavigationProps {
  activeCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
  hasUnsavedChanges?: boolean;
}

interface CategoryItem {
  id: SettingsCategory;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface CategorySection {
  title: string;
  items: CategoryItem[];
}

const CATEGORY_SECTIONS: CategorySection[] = [
  {
    title: 'Core Settings',
    items: [
      { 
        id: 'business', 
        label: 'Business', 
        icon: <Building2 className="w-5 h-5" />,
        description: 'Profile, hours, tax'
      },
      { 
        id: 'checkout', 
        label: 'Checkout & Payments', 
        icon: <CreditCard className="w-5 h-5" />,
        description: 'Tips, discounts, payments'
      },
      { 
        id: 'receipts', 
        label: 'Receipts & Notifications', 
        icon: <Receipt className="w-5 h-5" />,
        description: 'Receipt style, alerts'
      },
      { 
        id: 'system', 
        label: 'Appearance', 
        icon: <Palette className="w-5 h-5" />,
        description: 'Theme, layout, preferences'
      },
    ]
  },
  {
    title: 'Advanced',
    items: [
      { 
        id: 'devices', 
        label: 'Devices', 
        icon: <Monitor className="w-5 h-5" />,
        description: 'POS devices, printers, hardware'
      },
      { 
        id: 'integrations', 
        label: 'Integrations', 
        icon: <Plug className="w-5 h-5" />,
        description: 'Third-party connections'
      },
      { 
        id: 'account', 
        label: 'Account & Billing', 
        icon: <User className="w-5 h-5" />,
        description: 'Security, subscription, license'
      },
    ]
  },
];

export function SettingsNavigation({ 
  activeCategory, 
  onCategoryChange,
  hasUnsavedChanges 
}: SettingsNavigationProps) {
  return (
    <nav className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        {hasUnsavedChanges && (
          <p className="text-xs text-amber-600 mt-1">Unsaved changes</p>
        )}
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-y-auto p-2">
        {CATEGORY_SECTIONS.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? 'mt-4' : ''}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
              {section.title}
            </h3>
            {section.items.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors mb-1',
                  activeCategory === category.id
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <span className={cn(
                  'mt-0.5',
                  activeCategory === category.id ? 'text-amber-600' : 'text-gray-400'
                )}>
                  {category.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium text-sm',
                    activeCategory === category.id ? 'text-amber-900' : 'text-gray-900'
                  )}>
                    {category.label}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {category.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
        <p>Settings sync automatically</p>
      </div>
    </nav>
  );
}

export default SettingsNavigation;
