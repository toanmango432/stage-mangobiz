import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BookingFormData } from '@/types/booking';
import { Calendar, Clock, User, Plus, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface BookingSidebarProps {
  formData: Partial<BookingFormData>;
}

export const BookingSidebar = ({ formData }: BookingSidebarProps) => {
  const navigate = useNavigate();
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);

  const calculateTotal = () => {
    let subtotal = formData.service?.price || 0;
    
    if (formData.addOns) {
      subtotal += formData.addOns.reduce((sum, addon) => sum + addon.price, 0);
    }

    if (formData.isGroup && formData.groupSize) {
      subtotal *= formData.groupSize;
    }
    
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const calculateDuration = () => {
    let duration = formData.service?.duration || 0;
    
    if (formData.addOns) {
      duration += formData.addOns.reduce((sum, addon) => sum + addon.duration, 0);
    }

    return duration;
  };

  const canConfirm = () => {
    return !!(
      formData.service &&
      formData.date &&
      formData.time &&
      formData.client?.name &&
      formData.client?.email &&
      formData.client?.phone &&
      agreedToPolicies
    );
  };

  const handleConfirm = () => {
    if (!canConfirm()) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    // TODO: Handle booking confirmation
    toast({
      title: "Booking Confirmed!",
      description: "You'll receive a confirmation email shortly.",
    });
    
    navigate('/account');
  };

  const { subtotal, tax, total } = calculateTotal();
  const duration = calculateDuration();

  return (
    <Card className="w-80 sticky top-24 p-6 space-y-4">
      <h3 className="text-lg font-semibold">Your Booking</h3>

      <Separator />

      {/* Service */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm">{formData.service?.name}</h4>
            <p className="text-xs text-muted-foreground">
              {duration} min • ${formData.service?.price.toFixed(2)}
            </p>
          </div>
          {formData.isGroup && (
            <Badge variant="secondary" className="ml-2">
              ×{formData.groupSize}
            </Badge>
          )}
        </div>
      </div>

      {/* Date & Time */}
      {formData.date && formData.time && (
        <div className="flex items-start gap-3 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <div className="font-medium">{format(new Date(formData.date), 'EEEE, MMMM d')}</div>
            <div className="text-muted-foreground">{formData.time}</div>
          </div>
        </div>
      )}

      {/* Duration */}
      <div className="flex items-center gap-3 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{duration} minutes total</span>
      </div>

      {/* Specialist */}
      <div className="flex items-center gap-3 text-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          {formData.staff?.name || 'Any Available Specialist'}
        </span>
      </div>

      {/* Add-ons */}
      {formData.addOns && formData.addOns.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Plus className="h-4 w-4" />
            Add-ons
          </div>
          {formData.addOns.map((addon) => (
            <div key={addon.id} className="flex items-center justify-between text-sm ml-6 mb-1">
              <span className="text-muted-foreground">{addon.name}</span>
              <span className="text-muted-foreground">${addon.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <Separator />

      {/* Pricing */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax (8%)</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <Separator />

      {/* Policies */}
      <div className="flex items-start space-x-2">
        <Checkbox
          id="policies"
          checked={agreedToPolicies}
          onCheckedChange={(checked) => setAgreedToPolicies(checked as boolean)}
        />
        <Label
          htmlFor="policies"
          className="text-xs leading-relaxed cursor-pointer text-muted-foreground"
        >
          I agree to the cancellation policy and terms of service
        </Label>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!canConfirm()}
        onClick={handleConfirm}
      >
        Confirm Booking →
      </Button>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Shield className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Free cancellation up to 24 hours before your appointment
        </span>
      </div>
    </Card>
  );
};
