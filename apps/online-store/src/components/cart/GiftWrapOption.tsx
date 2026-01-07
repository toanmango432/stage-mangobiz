import { Gift } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface GiftWrapOptionProps {
  enabled: boolean;
  message: string;
  onEnabledChange: (enabled: boolean) => void;
  onMessageChange: (message: string) => void;
  price?: number;
}

export const GiftWrapOption = ({
  enabled,
  message,
  onEnabledChange,
  onMessageChange,
  price = 5.99,
}: GiftWrapOptionProps) => {
  return (
    <div className="space-y-4 p-4 rounded-lg border bg-card">
      <div className="flex items-center space-x-3">
        <Checkbox
          id="gift-wrap"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
        <Label
          htmlFor="gift-wrap"
          className="flex items-center gap-2 text-base font-medium cursor-pointer"
        >
          <Gift className="h-5 w-5 text-primary" />
          Add Gift Wrapping
          <span className="text-sm text-muted-foreground ml-auto">
            +${price.toFixed(2)}
          </span>
        </Label>
      </div>

      {enabled && (
        <div className="space-y-2 pl-9">
          <Label htmlFor="gift-message" className="text-sm">
            Gift Message (Optional)
          </Label>
          <Textarea
            id="gift-message"
            placeholder="Write a personal message for the recipient..."
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            maxLength={200}
            className="resize-none"
            rows={3}
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/200 characters
          </p>
        </div>
      )}
    </div>
  );
};
