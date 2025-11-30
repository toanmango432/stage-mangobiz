import { useState, useEffect } from 'react';
import {
  Calendar,
  LayoutGrid,
  Receipt,
  CreditCard,
  FileText,
  MoreHorizontal,
  Users
} from 'lucide-react';

interface BottomNavBarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  pendingCount?: number;
}

export function BottomNavBar({ activeModule, onModuleChange, pendingCount = 0 }: BottomNavBarProps) {
  // Desktop: Show Front Desk (combined view)
  // Mobile: Show Team and Tickets separately (no Front Desk)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile: Book, Team, Tickets, Pending, Checkout, More
  // Desktop: Book, Front Desk, Pending, Checkout, Sales, More
  const modules = isMobile ? [
    { id: 'book', label: 'Book', icon: Calendar },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'tickets', label: 'Tickets', icon: Receipt },
    { id: 'pending', label: 'Pending', icon: LayoutGrid, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'checkout', label: 'Checkout', icon: CreditCard },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ] : [
    { id: 'book', label: 'Book', icon: Calendar },
    { id: 'frontdesk', label: 'Front Desk', icon: LayoutGrid },
    { id: 'pending', label: 'Pending', icon: Receipt, badge: pendingCount },
    { id: 'checkout', label: 'Checkout', icon: CreditCard },
    { id: 'sales', label: 'Sales', icon: FileText },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="
        relative h-[72px] flex items-center justify-around px-3
        bg-gradient-to-t from-white/50 via-orange-50/35 to-white/25
        backdrop-blur-xl backdrop-saturate-[1.8]
        border-t border-white/40
        rounded-t-2xl
        shadow-[0_-8px_32px_rgba(251,146,60,0.15),0_-4px_12px_rgba(0,0,0,0.1),inset_0_-2px_0_rgba(255,255,255,1),inset_0_1px_0_rgba(255,255,255,0.4)]
        fixed bottom-0 left-0 right-0 z-50
      "
    >
      {modules.map((module) => {
        const Icon = module.icon;
        const isActive = activeModule === module.id;
        const hasBadge = module.badge !== undefined;

        return (
          <button
            key={module.id}
            onClick={() => {
              // Haptic feedback on mobile devices
              if ('vibrate' in navigator) {
                navigator.vibrate(10);
              }
              onModuleChange(module.id);
            }}
            aria-label={`${module.label} module`}
            aria-current={isActive ? 'page' : undefined}
            className={`
              relative group flex flex-col items-center justify-center gap-1
              flex-1 h-[56px] min-h-[44px] mx-0.5 rounded-xl
              transition-all duration-300 ease-out
              ${isActive
                ? 'bg-orange-500/90 shadow-lg shadow-orange-500/30 ring-1 ring-orange-400/50 scale-105 -translate-y-0.5'
                : 'bg-white/30 ring-1 ring-white/40 hover:bg-white/50 hover:ring-white/60 active:scale-95'
              }
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2
            `}
          >
            {/* Badge */}
            {hasBadge && module.badge! > 0 && (
              <div className="absolute -top-1 -right-1 z-30">
                <div
                  role="status"
                  aria-live="polite"
                  className="min-w-[20px] h-[20px] px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-lg shadow-red-500/50 animate-pulse"
                >
                  {module.badge! > 99 ? '99+' : module.badge}
                </div>
              </div>
            )}

            {/* Icon container */}
            <div className="relative z-20">
              {/* Icon */}
              <div className={`relative transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'}`}>
                <Icon
                  className={`w-6 h-6 transition-all duration-300 ${
                    isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill="none"
                />
              </div>
            </div>

            {/* Label */}
            <span
              className={`text-[10px] transition-all duration-300 relative z-20 ${
                isActive
                  ? 'font-bold text-white'
                  : 'font-medium text-gray-600 group-hover:text-gray-800'
              }`}
            >
              {module.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
