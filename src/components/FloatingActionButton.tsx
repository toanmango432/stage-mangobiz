import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

interface FloatingActionButtonProps {
  onCreateTicket: () => void;
}

export function FloatingActionButton({ onCreateTicket }: FloatingActionButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show FAB when scrolling down past 100px
      if (currentScrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <button
      onClick={onCreateTicket}
      className={`fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-out flex items-center justify-center group ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-75 pointer-events-none'
      }`}
      aria-label="Create new ticket"
      title="Create new ticket"
    >
      <Plus 
        size={24} 
        strokeWidth={2.5} 
        className="transition-transform duration-300 group-hover:rotate-90"
      />
      
      {/* Ripple effect on hover */}
      <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20" />
    </button>
  );
}
