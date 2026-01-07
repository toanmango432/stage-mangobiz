import { GroupMember } from '@/types/booking';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PersonCardProps {
  member: GroupMember;
  index: number;
  onUpdate: (updates: Partial<GroupMember>) => void;
  onSelectService: () => void;
}

export const PersonCard = ({ member, index, onUpdate, onSelectService }: PersonCardProps) => {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor={`person-${member.id}`} className="text-sm font-medium">
            Person {index + 1}
          </Label>
        </div>
        
        <Input
          id={`person-${member.id}`}
          placeholder={`Name (optional)`}
          value={member.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="text-sm"
        />
        
        {member.service ? (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <Badge variant="secondary" className="text-xs mb-1">
                  {member.service.name}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{member.service.duration} min</span>
                  <span className="font-semibold text-foreground">${member.service.price.toFixed(2)}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onSelectService}
                className="text-xs"
              >
                Change
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSelectService}
            className="w-full"
          >
            Choose Service
          </Button>
        )}
      </div>
    </Card>
  );
};
