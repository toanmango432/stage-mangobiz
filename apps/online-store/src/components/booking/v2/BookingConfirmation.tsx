import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CreditCard,
  CheckCircle,
  ArrowLeft,
  Star,
  Users,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Assignment, CartItem } from './types';

interface BookingConfirmationProps {
  assignments: Assignment[];
  cartItems: CartItem[];
  specialRequests?: string;
  onSpecialRequestsChange?: (value: string) => void;
  onBack: () => void;
  onBook: (bookingData: BookingData) => void;
}

interface BookingData {
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  policies: {
    cancellation: boolean;
    privacy: boolean;
    marketing: boolean;
  };
  specialRequests?: string;
  cartItems?: CartItem[];
  assignments?: Assignment[];
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  assignments,
  cartItems,
  specialRequests = '',
  onSpecialRequestsChange,
  onBack,
  onBook,
}) => {
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [policies, setPolicies] = useState({
    cancellation: false,
    privacy: false,
    marketing: false,
  });
  const [isBooking, setIsBooking] = useState(false);

  // Calculate totals including add-ons
  const totalPrice = cartItems.reduce((sum, item) => {
    const servicePrice = item.service.price;
    const addOnsPrice = (item.addOns || []).reduce((addOnSum, addOn) => addOnSum + addOn.price, 0);
    return sum + servicePrice + addOnsPrice;
  }, 0);
  
  const totalDuration = cartItems.reduce((sum, item) => {
    const serviceDuration = item.service.duration;
    const addOnsDuration = (item.addOns || []).reduce((addOnSum, addOn) => addOnSum + addOn.duration, 0);
    return sum + serviceDuration + addOnsDuration;
  }, 0);
  const tax = totalPrice * 0.1; // 10% tax
  const finalTotal = totalPrice + tax;

  // Get unique people
  const people = Array.from(new Set(cartItems.map(item => item.assignedTo)));

  // Create timeline from assignments
  const timeline = assignments.map(assignment => {
    const cartItem = cartItems.find(item => item.id === assignment.cartItemId);
    return {
      ...assignment,
      service: cartItem?.service,
      person: cartItem?.assignedTo,
    };
  }).sort((a, b) => a.time.localeCompare(b.time));

  const isFormValid = contactInfo.name && contactInfo.email && contactInfo.phone && 
                     policies.cancellation && policies.privacy;

  const handleBook = async () => {
    if (!isFormValid) return;

    setIsBooking(true);
    
    // Simulate booking process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onBook({
      contactInfo,
      policies,
      specialRequests,
      cartItems,
      assignments,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Confirm Your Booking</h1>
              <p className="text-muted-foreground">
                Review your appointment details and complete your booking
              </p>
            </div>
            <Button onClick={onBack} variant="outline" size="sm">
              Edit Details
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Timeline & Details */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Your Appointment Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-px h-8 bg-border ml-5" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">{item.service?.name}</h4>
                          <Badge variant="outline">${item.service?.price}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {item.person}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {item.time} • {item.duration} minutes
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Special Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Special Requests (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => onSpecialRequestsChange?.(e.target.value)}
                  placeholder="Any special requests or notes for your appointment? (e.g., allergies, preferences, accessibility needs)"
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Let us know if you have any specific requirements or preferences for your visit.
                </p>
              </CardContent>
            </Card>

            {/* Policies */}
            <Card>
              <CardHeader>
                <CardTitle>Policies & Agreements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="cancellation"
                    checked={policies.cancellation}
                    onCheckedChange={(checked) => 
                      setPolicies(prev => ({ ...prev, cancellation: !!checked }))
                    }
                  />
                  <Label htmlFor="cancellation" className="text-sm leading-relaxed">
                    I agree to the <a href="#" className="text-primary underline">cancellation policy</a>. 
                    Appointments can be cancelled up to 24 hours in advance for a full refund.
                  </Label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy"
                    checked={policies.privacy}
                    onCheckedChange={(checked) => 
                      setPolicies(prev => ({ ...prev, privacy: !!checked }))
                    }
                  />
                  <Label htmlFor="privacy" className="text-sm leading-relaxed">
                    I agree to the <a href="#" className="text-primary underline">privacy policy</a> 
                    and consent to the processing of my personal data for booking purposes.
                  </Label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketing"
                    checked={policies.marketing}
                    onCheckedChange={(checked) => 
                      setPolicies(prev => ({ ...prev, marketing: !!checked }))
                    }
                  />
                  <Label htmlFor="marketing" className="text-sm leading-relaxed">
                    I would like to receive promotional emails and updates about new services.
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary & Payment */}
          <div className="space-y-6">
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Services</span>
                    <span>{cartItems.length} service{cartItems.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">People</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{people.length} person{people.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Duration</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{totalDuration} minutes</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.service.name} ({item.assignedTo})
                        </span>
                        <span>${item.service.price}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Pay at Salon</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You'll pay when you arrive for your appointment. We accept cash, credit cards, and digital payments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Book Now Button */}
            <Button
              onClick={handleBook}
              disabled={!isFormValid || isBooking}
              className="w-full h-14 text-lg"
              size="lg"
            >
              {isBooking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Booking Your Appointment...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Confirm & Book Now
                </>
              )}
            </Button>

            {!isFormValid && (
              <p className="text-sm text-muted-foreground text-center">
                Please fill in all required fields and accept the policies to continue.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



