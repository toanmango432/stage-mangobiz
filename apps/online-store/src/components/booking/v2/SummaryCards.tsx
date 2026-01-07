import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Edit2, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CartItem, Staff } from './types';

// Services Summary Card
interface ServicesSummaryCardProps {
  services: CartItem[];
  onEdit: () => void;
  className?: string;
}

export const ServicesSummaryCard: React.FC<ServicesSummaryCardProps> = ({
  services,
  onEdit,
  className,
}) => {
  const totalPrice = services.reduce((sum, item) => sum + item.service.price, 0);
  const totalDuration = services.reduce((sum, item) => sum + item.service.duration, 0);

  return (
    <Card className={cn(
      "border-2 border-green-200 bg-green-50/30 animate-in fade-in slide-in-from-top duration-500",
      className
    )}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <h3 className="font-semibold text-lg">Your Services</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 -mt-1"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        
        <div className="space-y-2">
          {services.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start text-sm">
              <div className="flex-1">
                <p className="font-medium">{item.service.name}</p>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.service.duration} min
                </p>
              </div>
              <p className="font-semibold text-orange-600">${item.service.price}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-green-200 flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">
            {services.length} {services.length === 1 ? 'service' : 'services'} • {totalDuration} min
          </span>
          <span className="text-lg font-bold text-orange-600">${totalPrice}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Staff Summary Card
interface StaffSummaryCardProps {
  staff: Staff;
  onEdit: () => void;
  className?: string;
}

export const StaffSummaryCard: React.FC<StaffSummaryCardProps> = ({
  staff,
  onEdit,
  className,
}) => {
  return (
    <Card className={cn(
      "border-2 border-green-200 bg-green-50/30 animate-in fade-in slide-in-from-top duration-500",
      className
    )}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <h3 className="font-semibold text-lg">Your Specialist</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 -mt-1"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
            {staff.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{staff.name}</p>
            <p className="text-sm text-muted-foreground truncate">{staff.title}</p>
            {staff.rating >= 4.5 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{staff.rating}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Date & Time Summary Card
interface DateTimeSummaryCardProps {
  date: string;
  time: string;
  onEdit: () => void;
  className?: string;
}

export const DateTimeSummaryCard: React.FC<DateTimeSummaryCardProps> = ({
  date,
  time,
  onEdit,
  className,
}) => {
  return (
    <Card className={cn(
      "border-2 border-green-200 bg-green-50/30 animate-in fade-in slide-in-from-top duration-500",
      className
    )}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <h3 className="font-semibold text-lg">Date & Time</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 -mt-1"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">
            {date}
          </Badge>
          <span className="text-muted-foreground">•</span>
          <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">
            {time}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
