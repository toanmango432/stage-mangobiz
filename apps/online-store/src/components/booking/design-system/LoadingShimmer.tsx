import { cn } from '@/lib/utils';

interface LoadingShimmerProps {
  className?: string;
  lines?: number;
}

export const LoadingShimmer = ({
  className,
  lines = 1,
}: LoadingShimmerProps) => {
  return (
    <div className={cn('animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'bg-muted rounded',
            index === lines - 1 ? 'w-3/4' : 'w-full',
            'h-4 mb-2'
          )}
        />
      ))}
    </div>
  );
};

interface ServiceCardShimmerProps {
  className?: string;
}

export const ServiceCardShimmer = ({ className }: ServiceCardShimmerProps) => {
  return (
    <div className={cn('bg-card rounded-lg border p-4', className)}>
      <div className="animate-pulse">
        {/* Image placeholder */}
        <div className="bg-muted rounded-lg h-32 w-full mb-4" />
        
        {/* Content */}
        <div className="space-y-2">
          <div className="bg-muted rounded h-4 w-3/4" />
          <div className="bg-muted rounded h-3 w-1/2" />
          <div className="flex justify-between items-center mt-3">
            <div className="bg-muted rounded h-4 w-16" />
            <div className="bg-muted rounded h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
};

interface StaffCardShimmerProps {
  className?: string;
}

export const StaffCardShimmer = ({ className }: StaffCardShimmerProps) => {
  return (
    <div className={cn('bg-card rounded-lg border p-4', className)}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-3">
          {/* Avatar placeholder */}
          <div className="bg-muted rounded-full h-12 w-12" />
          
          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="bg-muted rounded h-4 w-1/2" />
            <div className="bg-muted rounded h-3 w-1/3" />
            <div className="bg-muted rounded h-3 w-1/4" />
          </div>
        </div>
      </div>
    </div>
  );
};



