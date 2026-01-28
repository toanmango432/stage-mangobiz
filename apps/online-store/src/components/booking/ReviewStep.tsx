import { getSupabaseUrl } from '@/lib/env';
import { BookingFormData } from '@/types/booking';
import { Service } from '@/types/catalog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, User, Mail, Phone, Shield, Edit, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { getStoreId } from '@/hooks/useStore';

// Edge Function URL for booking validation
const VALIDATE_BOOKING_ENDPOINT = `${getSupabaseUrl()}/functions/v1/validate-booking`;

interface ValidationResult {
  valid: boolean;
  reason?: 'client_blocked' | 'patch_test_required' | 'patch_test_expired';
  message?: string;
  canOverride?: boolean;
}

interface ReviewStepProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  goToStep: (step: any) => void;
}

export const ReviewStep = ({ formData, updateFormData, goToStep }: ReviewStepProps) => {
  const router = useRouter();
  const [agreedToPolicies, setAgreedToPolicies] = useState(formData.agreedToPolicies || false);
  const [isValidating, setIsValidating] = useState(false);
  const [patchTestError, setPatchTestError] = useState<string | null>(null);
  const [hasValidatedPatchTest, setHasValidatedPatchTest] = useState(false);

  // Check if selected service requires patch test
  const serviceRequiresPatchTest = (formData.service as Service)?.requiresPatchTest === true;

  /**
   * Validate patch test requirement before booking
   * Called when component mounts or client info changes
   */
  const validatePatchTest = useCallback(async () => {
    // Skip validation if service doesn't require patch test
    if (!serviceRequiresPatchTest) {
      setPatchTestError(null);
      setHasValidatedPatchTest(true);
      return;
    }

    // Need client email or phone to validate
    const email = formData.client?.email?.trim();
    const phone = formData.client?.phone?.trim();

    if (!email && !phone) {
      setPatchTestError('Please provide your contact information to verify patch test status.');
      return;
    }

    setIsValidating(true);
    setPatchTestError(null);

    try {
      const storeId = getStoreId();
      const response = await fetch(VALIDATE_BOOKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: undefined, // Online store doesn't have clientId, uses email/phone lookup
          email: email || undefined,
          phone: phone || undefined,
          serviceId: formData.service?.id,
          appointmentDate: formData.date,
          storeId,
        }),
      });

      const result: ValidationResult = await response.json();

      if (!result.valid && (result.reason === 'patch_test_required' || result.reason === 'patch_test_expired')) {
        // For online booking, we can't override - they need to visit the salon
        setPatchTestError(
          'This service requires a patch test. Please visit the salon first for your patch test before booking this service online.'
        );
      } else if (!result.valid && result.reason === 'client_blocked') {
        // Blocked client - generic message
        setPatchTestError('Unable to complete booking. Please call the salon.');
      } else {
        // Valid - client has valid patch test
        setPatchTestError(null);
      }
      setHasValidatedPatchTest(true);
    } catch {
      // On network error, allow booking but show warning
      setPatchTestError(null);
      setHasValidatedPatchTest(true);
    } finally {
      setIsValidating(false);
    }
  }, [serviceRequiresPatchTest, formData.client?.email, formData.client?.phone, formData.service?.id, formData.date]);

  // Validate patch test when component mounts or when client info changes
  useEffect(() => {
    if (serviceRequiresPatchTest) {
      validatePatchTest();
    } else {
      setHasValidatedPatchTest(true);
    }
  }, [validatePatchTest, serviceRequiresPatchTest]);

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
    // Block booking if patch test validation failed
    if (patchTestError) {
      toast({
        title: "Patch Test Required",
        description: "Please visit the salon for a patch test before booking this service online.",
        variant: "destructive",
      });
      return;
    }

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
    
    router.push('/account');
  };

  const { subtotal, tax, total } = calculateTotal();
  const duration = calculateDuration();

  return (
    <div className="space-y-6">
      {/* Patch Test Validation Status */}
      {serviceRequiresPatchTest && isValidating && (
        <Alert className="bg-blue-50 border-blue-200">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            Verifying patch test status...
          </AlertDescription>
        </Alert>
      )}

      {/* Patch Test Error Banner */}
      {patchTestError && !isValidating && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {patchTestError}
          </AlertDescription>
        </Alert>
      )}

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
        disabled={!agreedToPolicies || isValidating || !!patchTestError}
      >
        {isValidating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Validating...
          </>
        ) : (
          'Confirm Booking'
        )}
      </Button>
    </div>
  );
};
