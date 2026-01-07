import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Staff } from './types';

interface StaffSelectorProps {
  staff: Staff[];
  selectedStaff: string;
  onStaffSelect: (staffId: string) => void;
  serviceCategory?: string;
  isMultipleServices?: boolean;
  className?: string;
}

export const StaffSelector: React.FC<StaffSelectorProps> = ({
  staff,
  selectedStaff,
  onStaffSelect,
  serviceCategory,
  isMultipleServices = false,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter staff based on search query and service category
  const filteredStaff = useMemo(() => {
    let filtered = staff;

    // Filter by service category if provided
    if (serviceCategory) {
      filtered = filtered.filter(member => 
        member.specialties.some(specialty => 
          specialty.toLowerCase().includes(serviceCategory.toLowerCase()) ||
          serviceCategory.toLowerCase().includes(specialty.toLowerCase())
        )
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(query) ||
        member.title.toLowerCase().includes(query) ||
        member.specialties.some(specialty => 
          specialty.toLowerCase().includes(query)
        )
      );
    }

    return filtered;
  }, [staff, serviceCategory, searchQuery]);

  if (isMultipleServices) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="space-y-2">
          <Label>Search Staff</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={selectedStaff} onValueChange={onStaffSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select staff member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Available Staff</SelectItem>
            {filteredStaff.map(member => (
              <SelectItem key={member.id} value={member.id}>
                <div className="flex items-center gap-2">
                  <span>{member.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {member.title}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Optional Search - Collapsed by default */}
      {searchQuery && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      <RadioGroup value={selectedStaff} onValueChange={onStaffSelect}>
        <div className="space-y-3">
          {/* Any Available Staff Option */}
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="any" id="any" />
            <Label htmlFor="any" className="cursor-pointer flex-1">
              <Card className={cn(
                "p-4 transition-all duration-300 cursor-pointer rounded-xl border-2",
                "hover:shadow-lg hover:scale-[1.02] hover:border-orange-400 hover:bg-orange-50/30",
                "active:scale-[0.98]",
                selectedStaff === "any" && "border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-500/20"
              )}>
                <CardContent className="p-0">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
                      <Users className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-base">Any Available Staff</div>
                      <div className="text-sm text-muted-foreground">Get the first available time slot</div>
                      <Badge variant="secondary" className="text-xs mt-2">Fastest Booking</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Label>
          </div>
          
          {filteredStaff.map(member => (
            <div key={member.id} className="flex items-center space-x-3">
              <RadioGroupItem value={member.id} id={member.id} />
              <Label htmlFor={member.id} className="cursor-pointer flex-1">
                <Card className={cn(
                  "p-4 transition-all duration-300 cursor-pointer rounded-xl border-2",
                  "hover:shadow-lg hover:scale-[1.02] hover:border-orange-400 hover:bg-orange-50/30",
                  "active:scale-[0.98]",
                  selectedStaff === member.id && "border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-500/20"
                )}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4">
                      {/* Staff Photo */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-semibold text-primary">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {member.rating >= 4.5 && (
                          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                            <Star className="h-3 w-3 fill-white text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Staff Info */}
                      <div className="flex-1">
                        <div className="font-semibold text-base">{member.name}</div>
                        <div className="text-sm text-muted-foreground mb-2">{member.title}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {member.specialties.slice(0, 3).map((specialty, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {member.specialties.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{member.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Rating */}
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">{member.rating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.floor(Math.random() * 200 + 50)} reviews
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};


