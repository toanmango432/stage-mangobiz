import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  Clock, 
  Award, 
  Users, 
  Calendar, 
  MessageCircle, 
  Heart,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Staff } from '@/types/catalog';

interface StaffProfileSheetProps {
  staff: Staff;
  onSelect?: (staff: Staff) => void;
  className?: string;
}

interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  serviceName: string;
}

export const StaffProfileSheet: React.FC<StaffProfileSheetProps> = ({
  staff,
  onSelect,
  className,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('about');

  // Mock reviews data
  const reviews: Review[] = [
    {
      id: '1',
      clientName: 'Sarah M.',
      rating: 5,
      comment: 'Amazing work! Sarah is incredibly talented and made me feel so comfortable.',
      date: '2024-01-15',
      serviceName: 'Gel Manicure'
    },
    {
      id: '2',
      clientName: 'Jessica L.',
      rating: 5,
      comment: 'Perfect attention to detail. Will definitely book again!',
      date: '2024-01-10',
      serviceName: 'Hair Color'
    },
    {
      id: '3',
      clientName: 'Maria R.',
      rating: 4,
      comment: 'Great service, very professional and friendly.',
      date: '2024-01-05',
      serviceName: 'Facial Treatment'
    }
  ];

  const nextImage = () => {
    if (staff.portfolio && staff.portfolio.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === staff.portfolio!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (staff.portfolio && staff.portfolio.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? staff.portfolio!.length - 1 : prev - 1
      );
    }
  };

  const getAvailabilityStatus = () => {
    const isAvailableToday = Math.random() > 0.3;
    const isAvailableNow = Math.random() > 0.7;
    
    if (isAvailableNow) {
      return { text: 'Available now', variant: 'default' as const, color: 'text-green-600' };
    } else if (isAvailableToday) {
      return { text: 'Available today', variant: 'secondary' as const, color: 'text-blue-600' };
    } else {
      return { text: 'Book ahead', variant: 'outline' as const, color: 'text-muted-foreground' };
    }
  };

  const availability = getAvailabilityStatus();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <Avatar className="h-24 w-24 mx-auto">
          <AvatarImage src={staff.avatar} alt={staff.name} />
          <AvatarFallback className="text-2xl font-semibold">
            {staff.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h2 className="text-2xl font-bold">{staff.name}</h2>
          <p className="text-muted-foreground">{staff.title}</p>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{staff.rating}</span>
            <span className="text-sm text-muted-foreground">
              ({staff.reviewCount} reviews)
            </span>
          </div>
          <Badge variant={availability.variant} className={availability.color}>
            {availability.text}
          </Badge>
        </div>
      </div>

      {/* Portfolio Gallery */}
      {staff.portfolio && staff.portfolio.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Portfolio</h3>
          <div className="relative">
            <div className="w-full h-48 rounded-lg bg-muted overflow-hidden">
              <img
                src={staff.portfolio[currentImageIndex]}
                alt={`${staff.name} work ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {staff.portfolio.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="flex gap-1">
                    {staff.portfolio.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          index === currentImageIndex ? "bg-white" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="availability">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          {/* Specialties */}
          <div className="space-y-2">
            <h4 className="font-semibold">Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {staff.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <h4 className="font-semibold">About</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {staff.bio || `Meet ${staff.name}, a passionate beauty professional with ${staff.experienceYears} years of experience. Specializing in ${staff.specialties.join(', ')}, ${staff.name} is dedicated to helping clients look and feel their best.`}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{staff.totalBookings}</div>
                <div className="text-sm text-muted-foreground">Bookings</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{staff.experienceYears}</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">{review.clientName}</div>
                      <div className="text-sm text-muted-foreground">{review.serviceName}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                  <div className="text-xs text-muted-foreground">{review.date}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Availability calendar coming soon</p>
            <p className="text-sm">Check back later to see {staff.name}'s schedule</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="space-y-3">
        {onSelect && (
          <Button
            onClick={() => onSelect(staff)}
            className="w-full"
            size="lg"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Book with {staff.name}
          </Button>
        )}
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" className="flex-1">
            <Heart className="h-4 w-4 mr-2" />
            Favorite
          </Button>
        </div>
      </div>
    </div>
  );
};



