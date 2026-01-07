import { useState } from 'react';
import { BookingFormData } from '@/types/booking';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface GuestVsMemberProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  user: any;
}

export const GuestVsMember = ({ formData, updateFormData, user }: GuestVsMemberProps) => {
  const [bookingAs, setBookingAs] = useState<'guest' | 'member'>(user ? 'member' : 'guest');

  const handleClientChange = (field: keyof BookingFormData['client'], value: string) => {
    updateFormData({
      client: {
        ...formData.client,
        [field]: value,
      } as BookingFormData['client'],
    });
  };

  if (user && bookingAs === 'member') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h4 className="font-medium mb-2">Booking as: {user.email}</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Your contact information will be used for this booking
          </p>
          <Button variant="outline" size="sm" onClick={() => setBookingAs('guest')}>
            Book as Guest Instead
          </Button>
        </div>

        <div>
          <Label htmlFor="special-requests">Special Requests (Optional)</Label>
          <Textarea
            id="special-requests"
            placeholder="Any allergies, preferences, or special requests..."
            value={formData.specialRequests || ''}
            onChange={(e) => updateFormData({ specialRequests: e.target.value })}
            className="mt-2"
            rows={3}
          />
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="text-reminders"
            defaultChecked
          />
          <Label htmlFor="text-reminders" className="text-sm font-normal cursor-pointer">
            Send me appointment reminders via text
          </Label>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {user && (
        <RadioGroup value={bookingAs} onValueChange={(v) => setBookingAs(v as 'guest' | 'member')}>
          <div className="flex items-center space-x-3 p-3 rounded-lg border">
            <RadioGroupItem value="guest" id="guest-option" />
            <Label htmlFor="guest-option" className="cursor-pointer">
              Guest (No account needed)
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg border">
            <RadioGroupItem value="member" id="member-option" />
            <Label htmlFor="member-option" className="cursor-pointer">
              I have an account
            </Label>
          </div>
        </RadioGroup>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={formData.client?.name || ''}
            onChange={(e) => handleClientChange('name', e.target.value)}
            className="mt-2"
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={formData.client?.email || ''}
            onChange={(e) => handleClientChange('email', e.target.value)}
            className="mt-2"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            For confirmation and updates
          </p>
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.client?.phone || ''}
            onChange={(e) => handleClientChange('phone', e.target.value)}
            className="mt-2"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            For appointment reminders
          </p>
        </div>

        <div>
          <Label htmlFor="special-requests">Special Requests (Optional)</Label>
          <Textarea
            id="special-requests"
            placeholder="Any allergies, preferences, or special requests..."
            value={formData.specialRequests || ''}
            onChange={(e) => updateFormData({ specialRequests: e.target.value })}
            className="mt-2"
            rows={3}
          />
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox id="text-reminders" defaultChecked />
          <Label htmlFor="text-reminders" className="text-sm font-normal cursor-pointer">
            Send me appointment reminders via text
          </Label>
        </div>
      </div>

      {!user && (
        <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Create an account after booking</p>
              <p className="text-muted-foreground">
                Manage appointments, earn rewards, and get exclusive offers
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
