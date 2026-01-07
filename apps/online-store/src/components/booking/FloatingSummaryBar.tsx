import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PriceTag } from './design-system/PriceTag';
import { DurationBadge } from './design-system/DurationBadge';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Calendar, User, CreditCard } from 'lucide-react';

interface FloatingSummaryBarProps {
  formData: any;
  currentSection: string;
  onContinue: () => void;
  onEditSection: (section: string) => void;
  className?: string;
}

export const FloatingSummaryBar = ({
  formData,
  currentSection,
  onContinue,
  onEditSection,
  className,
}: FloatingSummaryBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const calculateTotalPrice = () => {
    if (formData.isGroup && formData.members) {
      return formData.members.reduce((total: number, member: any) => 
        total + (member.service?.price || 0), 0
      );
    }
    return formData.service?.price || 0;
  };

  const calculateTotalDuration = () => {
    if (formData.isGroup && formData.members) {
      return formData.members.reduce((total: number, member: any) => 
        total + (member.service?.duration || 0), 0
      );
    }
    return formData.service?.duration || 0;
  };

  const getNextAction = () => {
    switch (currentSection) {
      case 'groupSelection':
        return 'Select Services';
      case 'serviceSelection':
        return 'Answer Questions';
      case 'questions':
        return 'Choose Technician';
      case 'staffSelection':
        return 'Pick Date & Time';
      case 'dateTime':
        return 'Add Contact Info';
      case 'clientInfo':
        return 'Review Policies';
      case 'agreements':
        return 'Make Payment';
      case 'payment':
        return 'Complete Booking';
      default:
        return 'Continue';
    }
  };

  const canContinue = () => {
    switch (currentSection) {
      case 'groupSelection':
        return formData.groupChoiceMade;
      case 'serviceSelection':
        return formData.isGroup 
          ? formData.members?.every((m: any) => m.service)
          : formData.service;
      case 'questions':
        return formData.questionsAnswered;
      case 'staffSelection':
        return formData.staff;
      case 'dateTime':
        return formData.date && formData.time;
      case 'clientInfo':
        return formData.clientInfo?.firstName && formData.clientInfo?.lastName && formData.clientInfo?.email && formData.clientInfo?.phone;
      case 'agreements':
        return formData.agreements?.agreedToAll;
      case 'payment':
        return formData.payment?.processedAt;
      default:
        return false;
    }
  };

  const totalPrice = calculateTotalPrice();
  const totalDuration = calculateTotalDuration();

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg',
      'lg:hidden', // Only show on mobile
      className
    )}>
      {/* Collapsed State */}
      {!isExpanded && (
        <Card className="rounded-none border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <PriceTag price={totalPrice} size="lg" variant="featured" />
                  <div className="flex items-center gap-2 mt-1">
                    <DurationBadge duration={totalDuration} size="sm" />
                    {formData.isGroup && (
                      <Badge variant="outline" className="text-xs">
                        {formData.groupSize} people
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={onContinue}
                  disabled={!canContinue()}
                  className="px-6"
                >
                  {getNextAction()}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <Card className="rounded-none border-0 shadow-none max-h-96 overflow-y-auto">
          <CardContent className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Booking Summary</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Services
              </h4>
              {formData.isGroup && formData.members ? (
                <div className="space-y-2">
                  {formData.members.map((member: any, index: number) => (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {member.name || `Guest ${index + 1}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {member.service?.name || 'No service'}
                        </span>
                        {member.service && (
                          <PriceTag price={member.service.price} size="sm" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {formData.service?.name || 'No service selected'}
                  </span>
                  {formData.service && (
                    <PriceTag price={formData.service.price} size="sm" />
                  )}
                </div>
              )}
            </div>

            {/* Staff */}
            {formData.staff && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Technician
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{formData.staff.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditSection('staffSelection')}
                    className="text-xs"
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}

            {/* Date & Time */}
            {formData.date && formData.time && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Appointment
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {new Date(formData.date).toLocaleDateString()} at {formData.time}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditSection('dateTime')}
                    className="text-xs"
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <div className="text-right">
                  <PriceTag price={totalPrice} size="lg" variant="featured" />
                  <DurationBadge duration={totalDuration} size="sm" />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              className="w-full"
              onClick={onContinue}
              disabled={!canContinue()}
              size="lg"
            >
              {getNextAction()}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
