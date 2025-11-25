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

  const activeIndex = modules.findIndex(m => m.id === activeModule);

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="relative bg-white/95 backdrop-blur-xl border-t border-gray-200/60 h-[72px] flex items-center justify-around px-3 shadow-[0_-8px_32px_rgba(0,0,0,0.08),0_-2px_8px_rgba(0,0,0,0.04)] fixed bottom-0 left-0 right-0 z-50"
    >
      {/* Animated background glow for active tab */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-out pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${activeIndex * (100 / modules.length) + (50 / modules.length)}% 50%, rgba(249, 115, 22, 0.08) 0%, transparent 60%)`,
        }}
      />

      {/* Modern floating pill indicator with gradient and glow */}
      <div
        className="absolute bottom-1.5 h-1 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5),0_0_40px_rgba(236,72,153,0.3)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          width: `calc((100% / ${modules.length}) - 24px)`,
          left: `calc(${activeIndex * (100 / modules.length)}% + 12px)`,
        }}
      />

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
              flex-1 h-full min-h-[44px] rounded-2xl
              transition-all duration-300 ease-out
              ${isActive
                ? 'scale-105 -translate-y-0.5'
                : 'hover:scale-105 hover:-translate-y-1 active:scale-95 active:translate-y-0.5 hover:bg-gray-50/60 active:bg-gray-100/60'
              }
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2
            `}
          >
            {/* Active state elevated background with soft glow - no border */}
            {isActive && (
              <div className="absolute inset-0 z-0 rounded-2xl bg-gradient-to-br from-orange-50/60 via-pink-50/30 to-orange-50/10 shadow-[0_2px_16px_rgba(249,115,22,0.15),0_1px_4px_rgba(236,72,153,0.1)] opacity-0 animate-[fadeIn_300ms_ease-out_forwards]" />
            )}

            {/* Ripple effect container */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
              <div className="absolute inset-0 scale-0 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-full origin-center transition-transform duration-400 group-active:scale-150" />
            </div>

            {/* Premium badge with gradient, ring, and conditional pulsing animation */}
            {hasBadge && (
              <div className="absolute top-0 right-[calc(50%-24px)] z-30">
                {/* Pulsing glow background - only pulse when count > 0, subtle when 0 */}
                <div className={`absolute inset-0 bg-gradient-to-br from-red-500 to-pink-600 rounded-full blur-lg ${module.badge! > 0 ? 'opacity-60 animate-pulse' : 'opacity-20'}`}></div>
                {/* Main badge with conditional scale pulse and opacity */}
                <div
                  role="status"
                  aria-live="polite"
                  className={`relative min-w-[28px] h-[28px] px-2 bg-gradient-to-br from-red-500 via-pink-600 to-red-500 text-white text-sm font-black rounded-full flex items-center justify-center ring-2 ring-white transition-all duration-300 ${
                    module.badge! > 0
                      ? 'opacity-100 shadow-[0_0_16px_rgba(239,68,68,0.6),0_4px_12px_rgba(0,0,0,0.4)] animate-[pulse_1.5s_ease-in-out_infinite]'
                      : 'opacity-50 shadow-[0_0_8px_rgba(239,68,68,0.2),0_2px_6px_rgba(0,0,0,0.2)]'
                  }`}
                >
                  <span className="tabular-nums leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {module.badge! > 99 ? '99+' : module.badge}
                  </span>
                </div>
              </div>
            )}

            {/* Icon container with glow effect when active */}
            <div className="relative z-20">
              {/* Glow background for active icon */}
              {isActive && (
                <div className="absolute inset-0 scale-150 bg-gradient-to-br from-orange-400/30 to-pink-400/30 rounded-full blur-xl animate-pulse" />
              )}

              {/* Icon - keep outlined, don't fill */}
              <div className={`relative transition-all duration-300 ${isActive ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-700'}`}>
                <Icon
                  className={`w-7 h-7 transition-all duration-300 ${
                    isActive
                      ? 'scale-110 drop-shadow-[0_2px_8px_rgba(249,115,22,0.5)]'
                      : 'scale-100 group-hover:scale-105'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill="none"
                />
              </div>
            </div>

            {/* Label with better styling */}
            <span
              className={`text-[11px] transition-all duration-300 relative z-20 ${
                isActive
                  ? 'font-extrabold tracking-tight text-orange-600 scale-105'
                  : 'font-semibold tracking-normal text-gray-600 group-hover:text-gray-800 group-hover:scale-105'
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
