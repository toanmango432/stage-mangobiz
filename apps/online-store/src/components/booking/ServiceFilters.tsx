import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Sparkles, Star } from 'lucide-react';

interface ServiceFiltersProps {
  onFilterChange: (filter: string) => void;
  activeFilter?: string;
}

export const ServiceFilters = ({ onFilterChange, activeFilter }: ServiceFiltersProps) => {
  const filters = [
    { id: 'all', label: 'All Services', icon: null },
    { id: 'quick', label: 'Under 30min', icon: Clock },
    { id: 'luxury', label: 'Luxury', icon: Star },
    { id: 'popular', label: 'Most Popular', icon: TrendingUp },
    { id: 'new', label: 'New Services', icon: Sparkles },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              ${isActive 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }
            `}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};

// Import for TrendingUp
import { TrendingUp } from 'lucide-react';
