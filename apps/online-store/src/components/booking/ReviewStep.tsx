import { BookingFormData } from '@/types/booking';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, Mail, Phone, Shield, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface ReviewStepProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  goToStep: (step: any) => void;
}

export const ReviewStep = ({ formData, updateFormData, goToStep }: ReviewStepProps) => {
  const navigate = useNavigate();
  const [agreedToPolicies, setAgreedToPolicies] = useState(formData.agreedToPolicies || false);

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

  const handleConfirm = () => {
    if (!agreedToPolicies) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the cancellation policy to continue",
        variant: "destructive",
      });
      return;
    }

    updateFormData({ agreedToPolicies });

    // TODO: Handle booking confirmation API call
    toast({
      title: "Booking Confirmed!",
      description: "You'll receive a confirmation email shortly.",
    });
    
    navigate('/account');
  };

  const { subtotal, tax, total } = calculateTotal();
  const duration = calculateDuration();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Review Your Booking</h3>
        </div>

        {/* Service Details */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-sm text-muted-foreground mb-1">Service</div>
              <div className="font-semibold">{formData.service?.name}</div>
              {formData.addOns && formData.addOns.length > 0 && (
                <div className="text-sm text-muted-foreground mt-1">
                  + {formData.addOns.map(a => a.name).join(', ')}
                </div>
              )}
              {formData.isGroup && formData.groupSize && (
                <Badge variant="secondary" className="mt-2">
                  Group of {formData.groupSize}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep('services')}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Date & Time</div>
              {formData.date && formData.time && (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{format(new Date(formData.date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formData.time} ({duration} min)</span>
                  </div>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep('datetime')}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Specialist */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-sm text-muted-foreground mb-1">Specialist</div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {formData.staff?.name || 'Any Available Specialist'}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep('specialist')}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground">Contact Information</div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formData.client?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formData.client?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formData.client?.phone}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep('details')}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Pricing */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Price Breakdown</h3>
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
      </Card>

      {/* Policies */}
      <Card className="p-6">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="policies"
            checked={agreedToPolicies}
            onCheckedChange={(checked) => setAgreedToPolicies(checked as boolean)}
          />
          <div className="flex-1">
            <Label
              htmlFor="policies"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I agree to the cancellation policy and terms of service
            </Label>
            <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
              <Shield className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Free cancellation up to 24 hours before your appointment
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Button
        size="lg"
        className="w-full"
        onClick={handleConfirm}
        disabled={!agreedToPolicies}
      >
        Confirm Booking
      </Button>
    </div>
  );
};
