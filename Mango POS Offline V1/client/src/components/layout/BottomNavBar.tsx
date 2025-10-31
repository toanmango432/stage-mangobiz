import { useState, useEffect } from 'react';
import { Calendar, LayoutGrid, Receipt, CreditCard, FileText, MoreHorizontal, Users } from 'lucide-react';

interface BottomNavBarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  pendingCount?: number;
}

export function BottomNavBar({ activeModule, onModuleChange, pendingCount = 0 }: BottomNavBarProps) {
  // Desktop: Show Front Desk (combined view)
  // Mobile: Show Tickets and Team separately
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const modules = isMobile ? [
    { id: 'book', label: 'Book', icon: Calendar },
    { id: 'tickets', label: 'Tickets', icon: Receipt },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'pending', label: 'Pending', icon: LayoutGrid, badge: pendingCount },
    { id: 'checkout', label: 'Checkout', icon: CreditCard },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ] : [
    { id: 'book', label: 'Book', icon: Calendar },
    { id: 'frontdesk', label: 'Front Desk', icon: LayoutGrid },
    { id: 'pending', label: 'Pending', icon: Receipt, badge: pendingCount },
    { id: 'checkout', label: 'Checkout', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: FileText },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="relative bg-white border-t border-gray-200 h-[70px] flex items-center justify-around px-1 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] sticky bottom-0 z-50">
      {/* Active indicator - top bar */}
      <div 
        className="absolute top-0 h-[3px] bg-gradient-to-r from-orange-500 to-pink-500 rounded-b-full transition-all duration-300 ease-out shadow-sm"
        style={{
          width: `${100 / modules.length - 4}%`,
          left: `calc(${(modules.findIndex(m => m.id === activeModule) * (100 / modules.length))}% + ${(100 / modules.length) / 2}% - ${(100 / modules.length - 4) / 2}%)`,
        }}
      />
      
      {modules.map((module) => {
        const Icon = module.icon;
        const isActive = activeModule === module.id;
        const hasBadge = module.badge && module.badge > 0;

        return (
          <button
            key={module.id}
            onClick={() => onModuleChange(module.id)}
            className={`
              relative flex flex-col items-center justify-center gap-1
              flex-1 h-full
              transition-all duration-200 ease-out
              active:scale-95
              ${isActive
                ? 'text-orange-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }
            `}
          >
            {/* Badge for notifications - redesigned to sit better */}
            {hasBadge && (
              <div className="absolute top-2 right-[calc(50%-8px)] min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-md">
                {module.badge! > 99 ? '99+' : module.badge}
              </div>
            )}

            {/* Icon container */}
            <div className="relative mt-1">
              <Icon 
                className={`
                  w-6 h-6 transition-all duration-200
                  ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}
                `} 
              />
            </div>
            
            {/* Label */}
            <span 
              className={`
                text-[11px] transition-all duration-200
                ${isActive ? 'font-semibold' : 'font-medium'}
              `}
            >
              {module.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
