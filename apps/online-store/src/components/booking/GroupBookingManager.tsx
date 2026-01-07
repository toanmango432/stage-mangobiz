import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ServiceCard } from './ServiceCard';
import { ServiceDetailModal } from './ServiceDetailModal';
import { ServiceMenuGrid } from './ServiceMenuGrid';
import { PriceTag } from './design-system/PriceTag';
import { DurationBadge } from './design-system/DurationBadge';
import { Service } from '@/types/catalog';
import { bookingDataService } from '@/lib/services/bookingDataService';
import { cn } from '@/lib/utils';
import { Users, Plus, Minus, User, Settings, CheckCircle } from 'lucide-react';

interface GroupMember {
  id: string;
  name: string;
  service?: Service;
  staffPreference?: string;
  answers?: Record<string, any>;
}

interface GroupBookingManagerProps {
  formData: any;
  updateFormData: (data: any) => void;
}

export const GroupBookingManager = ({
  formData,
  updateFormData,
}: GroupBookingManagerProps) => {
  const [groupSize, setGroupSize] = useState(2);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [autoAssignStaff, setAutoAssignStaff] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize members when group size changes
  useEffect(() => {
    const newMembers: GroupMember[] = [];
    for (let i = 0; i < groupSize; i++) {
      newMembers.push({
        id: `member-${i + 1}`,
        name: `Guest ${i + 1}`,
      });
    }
    setMembers(newMembers);
  }, [groupSize]);

  // Load services
  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const allServices = await bookingDataService.getServices();
        setServices(allServices);
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []);

  const handleGroupSizeChange = (newSize: number) => {
    if (newSize >= 2 && newSize <= 10) {
      setGroupSize(newSize);
    }
  };

  const handleMemberNameChange = (memberId: string, name: string) => {
    setMembers(prev => 
      prev.map(member => 
        member.id === memberId ? { ...member, name } : member
      )
    );
  };

  const handleServiceSelect = (memberId: string, service: Service) => {
    setMembers(prev => 
      prev.map(member => 
        member.id === memberId ? { ...member, service } : member
      )
    );
    setShowServiceModal(false);
  };

  const handleRemoveService = (memberId: string) => {
    setMembers(prev => 
      prev.map(member => 
        member.id === memberId ? { ...member, service: undefined } : member
      )
    );
  };

  const handleCompleteGroupSetup = () => {
    const allMembersHaveServices = members.every(member => member.service);
    
    if (allMembersHaveServices) {
      updateFormData({
        isGroup: true,
        groupSize,
        members: members.map(member => ({
          id: member.id,
          name: member.name,
          service: member.service,
          staffPreference: member.staffPreference,
          answers: member.answers,
        })),
        groupSetupComplete: true,
      });
    }
  };

  const calculateTotalPrice = () => {
    return members.reduce((total, member) => 
      total + (member.service?.price || 0), 0
    );
  };

  const calculateTotalDuration = () => {
    return members.reduce((total, member) => 
      total + (member.service?.duration || 0), 0
    );
  };

  const getCompletionStatus = () => {
    const completedMembers = members.filter(member => member.service).length;
    return {
      completed: completedMembers,
      total: members.length,
      percentage: Math.round((completedMembers / members.length) * 100),
    };
  };

  const status = getCompletionStatus();

  return (
    <div className="space-y-6">
      {/* Group Size Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Size
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGroupSizeChange(groupSize - 1)}
              disabled={groupSize <= 2}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              {[...Array(9)].map((_, i) => (
                <Button
                  key={i + 2}
                  variant={groupSize === i + 2 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleGroupSizeChange(i + 2)}
                  className="w-10 h-10"
                >
                  {i + 2}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGroupSizeChange(groupSize + 1)}
              disabled={groupSize >= 10}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">
                {status.completed} of {status.total} members have selected services
              </span>
            </div>
            <Badge variant="outline">
              {status.percentage}% Complete
            </Badge>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member, index) => (
          <Card key={member.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {member.name}
                </CardTitle>
                <Badge variant={member.service ? "default" : "outline"}>
                  {member.service ? "Service Selected" : "No Service"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Name Input */}
              <div>
                <Label htmlFor={`name-${member.id}`}>Name (Optional)</Label>
                <Input
                  id={`name-${member.id}`}
                  value={member.name}
                  onChange={(e) => handleMemberNameChange(member.id, e.target.value)}
                  placeholder={`Guest ${index + 1}`}
                />
              </div>

              {/* Service Selection */}
              <div>
                <Label>Service</Label>
                {member.service ? (
                  <div className="mt-2">
                    <ServiceCard
                      service={member.service}
                      layout="list"
                      onSelect={() => setSelectedMember(member.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveService(member.id)}
                      className="mt-2 text-red-600 hover:text-red-700"
                    >
                      Remove Service
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedMember(member.id);
                      setShowServiceModal(true);
                    }}
                  >
                    Select Service
                  </Button>
                )}
              </div>

              {/* Staff Preference */}
              {member.service && !autoAssignStaff && (
                <div>
                  <Label>Staff Preference (Optional)</Label>
                  <Input
                    placeholder="Any available technician"
                    value={member.staffPreference || ''}
                    onChange={(e) => setMembers(prev => 
                      prev.map(m => 
                        m.id === member.id 
                          ? { ...m, staffPreference: e.target.value }
                          : m
                      )
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Auto-assign Staff Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Auto-assign Technicians</Label>
              <p className="text-sm text-muted-foreground">
                Let us automatically assign the best available technicians for each service
              </p>
            </div>
            <Switch
              checked={autoAssignStaff}
              onCheckedChange={setAutoAssignStaff}
            />
          </div>
        </CardContent>
      </Card>

      {/* Group Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Group Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Price</div>
              <PriceTag price={calculateTotalPrice()} size="lg" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Duration</div>
              <DurationBadge duration={calculateTotalDuration()} size="lg" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Services Selected:</div>
            {members.map((member, index) => (
              <div key={member.id} className="flex items-center justify-between text-sm">
                <span>{member.name}</span>
                <span className="text-muted-foreground">
                  {member.service ? member.service.name : 'No service selected'}
                </span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleCompleteGroupSetup}
            disabled={status.completed !== status.total}
          >
            Complete Group Setup ({status.completed}/{status.total})
          </Button>
        </CardContent>
      </Card>

      {/* Service Selection Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showServiceSheet}
        onClose={() => {
          setShowServiceSheet(false);
          setSelectedMember(null);
        }}
        title="Select Service"
        initialHeight="lg"
      >
        <ServiceQuickPreview
          selectedService={selectedMember ? formData.members?.find((m: any) => m.id === selectedMember)?.service : undefined}
          onServiceSelect={(service) => {
            if (selectedMember) {
              handleServiceSelect(selectedMember, service);
            }
          }}
        />
      </MobileBottomSheet>
    </div>
  );
};
