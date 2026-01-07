import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface GroupToggleSectionProps {
  groupSize: number;
  onGroupSizeChange: (size: number) => void;
}

export const GroupToggleSection = ({ groupSize, onGroupSizeChange }: GroupToggleSectionProps) => {
  return (
    <div className="py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <h3 className="text-2xl font-bold mb-6 text-foreground">Group Booking</h3>
        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-base text-foreground font-medium">I would like to book for:</span>
            <Select value={groupSize.toString()} onValueChange={(val) => onGroupSizeChange(parseInt(val))}>
              <SelectTrigger className="w-[200px] h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Just Me</SelectItem>
                <SelectItem value="2">2 People</SelectItem>
                <SelectItem value="3">3 People</SelectItem>
                <SelectItem value="4">4 People</SelectItem>
                <SelectItem value="5">5 People</SelectItem>
                <SelectItem value="6">6 People</SelectItem>
                <SelectItem value="7">7 People</SelectItem>
                <SelectItem value="8">8 People</SelectItem>
                <SelectItem value="9">9 People</SelectItem>
                <SelectItem value="10">10 People</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Book multiple appointments at once. We'll help coordinate the perfect time for your group.
          </p>
        </Card>
      </div>
    </div>
  );
};
