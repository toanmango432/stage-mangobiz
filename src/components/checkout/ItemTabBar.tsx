import { cn } from '@/lib/utils';

export type ItemTabType = 'services' | 'products' | 'packages' | 'giftcards';

interface ItemTabBarProps {
  activeTab: ItemTabType;
  onTabChange: (tab: ItemTabType) => void;
  className?: string;
}

const TABS: { id: ItemTabType; label: string }[] = [
  { id: 'services', label: 'Services' },
  { id: 'products', label: 'Products' },
  { id: 'packages', label: 'Packages' },
  { id: 'giftcards', label: 'Gift Cards' },
];

export function ItemTabBar({ activeTab, onTabChange, className }: ItemTabBarProps) {
  return (
    <div className={cn('flex items-center gap-1 bg-gray-100 p-1.5 rounded-xl', className)}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-150',
            activeTab === tab.id
              ? 'bg-white text-primary shadow-md ring-1 ring-gray-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default ItemTabBar;
