'use client';

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Mail, Phone, Star, Calendar as CalendarIcon } from "lucide-react";
import { getStaff, initializeMockData } from "@/lib/mockData";
import { StaffScheduleCalendar } from "@/components/admin/staff/StaffScheduleCalendar";
import { StaffFormDialog } from "@/components/admin/staff/StaffFormDialog";
import { StaffDetailModal } from "@/components/admin/staff/StaffDetailModal";

const Staff = () => {
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  useMemo(() => initializeMockData(), []);
  
  const staff = useMemo(() => getStaff(), []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage your team members and their schedules</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowSchedule(!showSchedule)}
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            {showSchedule ? "Hide Schedule" : "View Schedule"}
          </Button>
          <Button onClick={() => {
            setSelectedStaff(null);
            setFormOpen(true);
          }} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {showSchedule && <StaffScheduleCalendar staff={staff} />}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => {
          const initials = member.name.split(' ').map(n => n[0]).join('');
          
          return (
            <Card 
              key={member.id} 
              className="hover-scale cursor-pointer"
              onClick={() => {
                setSelectedStaff(member);
                setDetailsOpen(true);
              }}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{member.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({member.bookingsCompleted} bookings)
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Services:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.services.map((service) => (
                      <Badge key={service} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedStaff(member);
                      setFormOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setShowSchedule(true)}
                  >
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <StaffFormDialog 
        staff={selectedStaff}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={(staffData) => {
          console.log("Save staff:", staffData);
          // In real app, save to backend/localStorage
        }}
      />

      <StaffDetailModal 
        staff={selectedStaff}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={(staff) => {
          setDetailsOpen(false);
          setSelectedStaff(staff);
          setFormOpen(true);
        }}
      />
    </div>
  );
};

export default Staff;
