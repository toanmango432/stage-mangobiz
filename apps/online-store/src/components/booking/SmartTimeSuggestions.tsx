import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Star, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bookingDataService } from '@/lib/services/bookingDataService';
import type { Service, Staff } from '@/types/catalog';

interface TimeSuggestion {
  id: string;
  date: string;
  time: string;
  dateTime: Date;
  staff?: Staff;
  isPopular?: boolean;
  isLastAvailable?: boolean;
  isAlmostFull?: boolean;
  price?: number;
  duration?: number;
}

interface SmartTimeSuggestionsProps {
  selectedService?: Service;
  selectedStaff?: Staff;
  onTimeSelect: (suggestion: TimeSuggestion) => void;
  className?: string;
  maxSuggestions?: number;
}

export const SmartTimeSuggestions: React.FC<SmartTimeSuggestionsProps> = ({
  selectedService,
  selectedStaff,
  onTimeSelect,
  className,
  maxSuggestions = 6,
}) => {
  const [suggestions, setSuggestions] = useState<TimeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  // Generate smart time suggestions
  useEffect(() => {
    const generateSuggestions = async () => {
      if (!selectedService) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const now = new Date();
        const suggestions: TimeSuggestion[] = [];
        
        // Generate suggestions for next 7 days
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const date = new Date(now);
          date.setDate(date.getDate() + dayOffset);
          
          // Skip past dates
          if (date < now) continue;
          
          // Generate time slots for this date
          const timeSlots = generateTimeSlots(date, selectedService.duration || 60);
          
          for (const timeSlot of timeSlots) {
            // Add some randomness to simulate availability
            const isAvailable = Math.random() > 0.3;
            if (!isAvailable) continue;
            
            const suggestion: TimeSuggestion = {
              id: `${date.toISOString().split('T')[0]}-${timeSlot}`,
              date: formatDate(date),
              time: timeSlot,
              dateTime: new Date(`${date.toISOString().split('T')[0]}T${timeSlot}`),
              staff: selectedStaff,
              isPopular: Math.random() > 0.7,
              isLastAvailable: Math.random() > 0.9,
              isAlmostFull: Math.random() > 0.8,
              price: selectedService.price,
              duration: selectedService.duration,
            };
            
            suggestions.push(suggestion);
          }
        }
        
        // Sort by priority (today first, then by time)
        suggestions.sort((a, b) => {
          const aIsToday = a.dateTime.toDateString() === now.toDateString();
          const bIsToday = b.dateTime.toDateString() === now.toDateString();
          
          if (aIsToday && !bIsToday) return -1;
          if (!aIsToday && bIsToday) return 1;
          
          return a.dateTime.getTime() - b.dateTime.getTime();
        });
        
        setSuggestions(suggestions.slice(0, maxSuggestions));
      } catch (error) {
        console.error('Failed to generate time suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    generateSuggestions();
  }, [selectedService, selectedStaff, maxSuggestions]);

  const generateTimeSlots = (date: Date, duration: number) => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    const interval = 30; // 30 minutes
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    
    return slots;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (targetDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleSuggestionSelect = (suggestion: TimeSuggestion) => {
    setSelectedSuggestion(suggestion.id);
    onTimeSelect(suggestion);
  };

  const getSuggestionBadge = (suggestion: TimeSuggestion) => {
    if (suggestion.isPopular) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Popular</Badge>;
    }
    if (suggestion.isLastAvailable) {
      return <Badge variant="destructive">Last available</Badge>;
    }
    if (suggestion.isAlmostFull) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Almost full</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Suggested Times</h3>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No available times</h3>
        <p className="text-muted-foreground text-sm">
          Try selecting a different date or service
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Suggested Times</h3>
        <Badge variant="outline" className="ml-auto">
          {suggestions.length} available
        </Badge>
      </div>
      
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <Card
            key={suggestion.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              selectedSuggestion === suggestion.id
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            )}
            onClick={() => handleSuggestionSelect(suggestion)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">{suggestion.time}</span>
                    <span className="text-muted-foreground">{suggestion.date}</span>
                    {getSuggestionBadge(suggestion)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {suggestion.duration}min
                    </div>
                    {suggestion.price && (
                      <div className="flex items-center gap-1">
                        <span>${suggestion.price}</span>
                      </div>
                    )}
                    {suggestion.staff && (
                      <div className="flex items-center gap-1">
                        <span>with {suggestion.staff.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant={selectedSuggestion === suggestion.id ? "default" : "outline"}
                  className="ml-4"
                >
                  {selectedSuggestion === suggestion.id ? "Selected" : "Book"}
                </Button>
              </div>
              
              {suggestion.isAlmostFull && (
                <div className="flex items-center gap-1 mt-2 text-orange-600 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>Only 1-2 spots left</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="pt-2">
        <Button variant="outline" className="w-full" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Browse more times
        </Button>
      </div>
    </div>
  );
};



