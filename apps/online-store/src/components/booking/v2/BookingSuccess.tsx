import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Share2,
  Download,
  Star,
  MessageCircle,
  Gift,
  ArrowRight,
  Home,
  BookOpen
} from 'lucide-react';
import { Assignment, CartItem } from './types';
import { cn } from '@/lib/utils';

interface BookingSuccessProps {
  bookingId: string;
  assignments: Assignment[];
  cartItems: CartItem[];
  bookingData: any;
  onGoHome: () => void;
  onBookAgain: () => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  bookingId,
  assignments,
  cartItems,
  bookingData,
  onGoHome,
  onBookAgain,
}) => {
  // Trigger confetti animation on mount
  useEffect(() => {
    // Add haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Simple confetti effect using CSS animations
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'fixed inset-0 pointer-events-none z-50';
    confettiContainer.innerHTML = Array.from({ length: 50 }, (_, i) => 
      `<div class="confetti-piece" style="
        position: absolute;
        width: 8px;
        height: 8px;
        background: ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'][i % 6]};
        left: ${Math.random() * 100}%;
        animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
        animation-delay: ${Math.random() * 2}s;
      "></div>`
    ).join('');
    
    document.body.appendChild(confettiContainer);
    
    // Clean up after animation
    setTimeout(() => {
      document.body.removeChild(confettiContainer);
    }, 5000);
  }, []);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.service.price, 0);
  const tax = totalPrice * 0.1;
  const finalTotal = totalPrice + tax;

  // Create timeline from assignments
  const timeline = assignments.map(assignment => {
    const cartItem = cartItems.find(item => item.id === assignment.cartItemId);
    return {
      ...assignment,
      service: cartItem?.service,
      person: cartItem?.assignedTo,
    };
  }).sort((a, b) => a.time.localeCompare(b.time));

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Salon Appointment',
        text: `I just booked my salon appointment for ${new Date(timeline[0]?.date).toLocaleDateString()}!`,
        url: window.location.href,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownload = () => {
    // Create a simple text summary
    const summary = `
BOOKING CONFIRMATION
Booking ID: ${bookingId}
Date: ${new Date(timeline[0]?.date).toLocaleDateString()}

APPOINTMENTS:
${timeline.map(item => 
  `${item.time} - ${item.service?.name} (${item.person})`
).join('\n')}

TOTAL: $${finalTotal.toFixed(2)}

Thank you for choosing our salon!
    `;
    
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${bookingId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Booking Confirmed! 🎉</h1>
          <p className="text-xl opacity-90 mb-6">
            Your appointment has been successfully booked
          </p>
          <Badge variant="secondary" className="bg-white text-green-600 px-4 py-2">
            Booking ID: {bookingId}
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Appointment Details */}
          <div className="space-y-6">
            {/* Appointment Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Your Appointment Details
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

            {/* Salon Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Salon Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Mango Salon & Spa</h4>
                    <p className="text-sm text-muted-foreground">
                      123 Beauty Street<br />
                      Downtown, CA 90210
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">(555) 123-4567</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">hello@mangosalon.com</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What to Expect */}
            <Card>
              <CardHeader>
                <CardTitle>What to Expect</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-medium">Arrival</h4>
                      <p className="text-sm text-muted-foreground">
                        Please arrive 10 minutes early for check-in
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-medium">What to Bring</h4>
                      <p className="text-sm text-muted-foreground">
                        Just bring yourself! We provide all tools and products
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-medium">Cancellation</h4>
                      <p className="text-sm text-muted-foreground">
                        Cancel up to 24 hours in advance for a full refund
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Summary */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={handleShare} className="h-12">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" onClick={handleDownload} className="h-12">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Services</span>
                    <span>{cartItems.length} service{cartItems.length !== 1 ? 's' : ''}</span>
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

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={onBookAgain} className="w-full h-12">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Book Another Appointment
                  </Button>
                  
                  <Button onClick={onGoHome} variant="outline" className="w-full h-12">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Promotional Offers */}
            <Card className="border-dashed border-2 border-primary/20">
              <CardContent className="p-6 text-center">
                <Gift className="h-8 w-8 text-primary mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Special Offer!</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Book your next appointment within 7 days and get 15% off!
                </p>
                <Button variant="outline" size="sm">
                  View Offers
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
