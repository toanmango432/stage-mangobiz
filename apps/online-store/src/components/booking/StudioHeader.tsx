import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

export const StudioHeader = () => {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border shadow-sm">
      <div className="container max-w-6xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Studio</div>
              <div className="font-semibold text-foreground text-lg truncate">Beverly Hills - Main Location</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 shrink-0">
            Change
          </Button>
        </div>
      </div>
    </div>
  );
};
