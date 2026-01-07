import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MapPin, Users } from 'lucide-react';

interface StudioGroupSelectorProps {
  groupSize: number;
  onGroupSizeChange: (size: number) => void;
}

export const StudioGroupSelector = ({ groupSize, onGroupSizeChange }: StudioGroupSelectorProps) => {
  return (
    <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
      <div className="container max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Studio Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <div className="flex items-center flex-wrap gap-1 sm:gap-0">
              <span className="font-semibold text-sm sm:text-base text-foreground">BEVERLY HILLS</span>
              <Button variant="link" className="p-0 h-auto text-primary text-xs sm:text-sm ml-1 sm:ml-2">
                Change
              </Button>
            </div>
          </div>

          {/* Group Size Selector */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            <span className="hidden sm:inline text-sm text-muted-foreground">
              I would like to book an appointment for:
            </span>
            <span className="sm:hidden text-xs text-muted-foreground">
              Book for:
            </span>
            <Select value={groupSize.toString()} onValueChange={(val) => onGroupSizeChange(parseInt(val))}>
              <SelectTrigger className="w-[140px] sm:w-[160px] h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">just me</SelectItem>
                <SelectItem value="2">2 people</SelectItem>
                <SelectItem value="3">3 people</SelectItem>
                <SelectItem value="4">4 people</SelectItem>
                <SelectItem value="5">5 people</SelectItem>
                <SelectItem value="6">6 people</SelectItem>
                <SelectItem value="7">7 people</SelectItem>
                <SelectItem value="8">8 people</SelectItem>
                <SelectItem value="9">9 people</SelectItem>
                <SelectItem value="10">10 people</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};
