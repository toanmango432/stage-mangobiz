import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Share2, 
  Gift,
  ShoppingBag,
  Sparkles,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Assignment, CartItem } from './types';

interface BookingSuccessScreenProps {
  assignments: Assignment[];
  cartItems: CartItem[];
  userInfo?: {
    name: string;
    phone: string;
    email?: string;
  };
  onAddToCalendar?: () => void;
  onBookAnother?: () => void;
  onShareWithFriend?: () => void;
  className?: string;
}

export const BookingSuccessScreen: React.FC<BookingSuccessScreenProps> = ({
  assignments,
  cartItems,
  userInfo,
  onAddToCalendar,
  onBookAnother,
  onShareWithFriend,
  className,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    // Generate confetti pieces
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
    }));
    setConfettiPieces(pieces);

    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const firstAssignment = assignments[0];
  const totalPrice = cartItems.reduce((sum, item) => sum + item.service.price, 0);
  const totalDuration = cartItems.reduce((sum, item) => sum + item.service.duration, 0);

  const handleAddToCalendar = () => {
    if (!firstAssignment) return;
    
    // Create calendar event
    const event = {
      title: `Appointment at Mango - ${cartItems.map(item => item.service.name).join(', ')}`,
      description: `Services: ${cartItems.map(item => item.service.name).join(', ')}\nWith: ${firstAssignment.staffName}`,
      start: new Date(`${firstAssignment.date}T${firstAssignment.time}`),
      duration: totalDuration,
    };

    // Generate ICS file
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.description}
DTSTART:${event.start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DURATION:PT${totalDuration}M
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mango-appointment.ics';
    link.click();
    URL.revokeObjectURL(url);

    if (onAddToCalendar) onAddToCalendar();
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-orange-50/30 to-background pb-20", className)}>
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute w-2 h-2 bg-orange-500 rounded-full animate-confetti"
              style={{
                left: `${piece.left}%`,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Success Header */}
        <div className="text-center mb-8 animate-in fade-in zoom-in duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-6 shadow-lg animate-bounce">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            You're All Set! 💅
          </h1>
          <p className="text-lg text-muted-foreground">
            We can't wait to see you at Mango
          </p>
        </div>

        {/* Appointment Details Card */}
        <Card className="mb-6 animate-in fade-in slide-in-from-bottom duration-500 delay-100 border-2 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Your Appointment Details
            </h2>

            {/* Date & Time */}
            {firstAssignment && (
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{firstAssignment.date}</p>
                    <p className="text-muted-foreground">Date</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{firstAssignment.time}</p>
                    <p className="text-muted-foreground">Time • {totalDuration} minutes</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold">With {firstAssignment.staffName}</p>
                    <p className="text-muted-foreground">Your specialist</p>
                  </div>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Services List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Services</h3>
              {cartItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{item.service.name}</p>
                    <p className="text-sm text-muted-foreground">{item.service.duration} min</p>
                  </div>
                  <p className="font-semibold text-orange-600">${item.service.price}</p>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Total */}
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-2xl text-orange-600">${totalPrice}</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
          <Button
            onClick={handleAddToCalendar}
            size="lg"
            className="h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Download className="h-5 w-5 mr-2" />
            Add to Calendar
          </Button>
          <Button
            onClick={onShareWithFriend}
            size="lg"
            variant="outline"
            className="h-14 border-2 rounded-xl font-semibold hover:bg-orange-50 hover:border-orange-400 transition-all duration-300 hover:scale-105"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share with a Friend
          </Button>
        </div>

        {/* Upsell Banners */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500 delay-300">
          {/* Gift Card Upsell */}
          <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100/50 hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Add a Gift Card</h3>
                  <p className="text-sm text-muted-foreground">Pick up during your visit • Starting at $25</p>
                </div>
                <Badge className="bg-orange-500 hover:bg-orange-600">Popular</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Product Upsell */}
          <Card className="border-2 hover:border-orange-300 hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Shop Our Products</h3>
                  <p className="text-sm text-muted-foreground">Premium hair & nail care • Free samples available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rebook Suggestion */}
          {firstAssignment && (
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50/50 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      Rebook with {firstAssignment.staffName}
                    </h3>
                    <p className="text-sm text-muted-foreground">Same time in 3 weeks • Save 10%</p>
                  </div>
                  <Badge variant="outline" className="border-green-500 text-green-700">Save 10%</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Book Another Button */}
        <div className="mt-8 text-center animate-in fade-in duration-500 delay-500">
          <Button
            onClick={onBookAnother}
            variant="ghost"
            size="lg"
            className="text-muted-foreground hover:text-foreground"
          >
            Book Another Appointment
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground animate-in fade-in duration-500 delay-700">
          <p>Questions? Call us at (555) 123-4567</p>
          <p className="mt-2">Powered by <span className="font-semibold text-orange-600">Mango</span></p>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
};
