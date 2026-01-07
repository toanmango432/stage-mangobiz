import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { BookingFormData } from '@/types/booking';

interface ClientDetailsFormProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
}

export const ClientDetailsForm = ({ formData, updateFormData, onNext }: ClientDetailsFormProps) => {
  const [name, setName] = useState(formData.client?.name || '');
  const [email, setEmail] = useState(formData.client?.email || '');
  const [phone, setPhone] = useState(formData.client?.phone || '');
  const [specialRequests, setSpecialRequests] = useState(formData.specialRequests || '');
  const [createAccount, setCreateAccount] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      updateFormData({
        client: { name, email, phone },
        specialRequests: specialRequests || undefined,
      });
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Your Details</h3>
        <p className="text-sm text-muted-foreground">
          We'll use this information to confirm your appointment
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="requests">Special Requests (Optional)</Label>
          <Textarea
            id="requests"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Any specific preferences or requirements..."
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="create-account"
            checked={createAccount}
            onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
          />
          <Label
            htmlFor="create-account"
            className="text-sm font-normal cursor-pointer"
          >
            Create an account to save my details for future bookings
          </Label>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleContinue} size="lg">
          Continue to Review
        </Button>
      </div>
    </div>
  );
};
