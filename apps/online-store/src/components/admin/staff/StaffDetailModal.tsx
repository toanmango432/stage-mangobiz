import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Calendar, DollarSign, TrendingUp } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  services: string[];
  status: string;
  rating: number;
  bookingsCompleted: number;
}

interface StaffDetailModalProps {
  staff: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (staff: StaffMember) => void;
}

export function StaffDetailModal({ staff, open, onOpenChange, onEdit }: StaffDetailModalProps) {
  if (!staff) return null;

  const initials = staff.name.split(' ').map(n => n[0]).join('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{staff.name}</h2>
                <p className="text-sm text-muted-foreground">{staff.role}</p>
              </div>
            </div>
            <Button onClick={() => onEdit(staff)}>Edit Profile</Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staff.bookingsCompleted}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staff.rating.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12.5k</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold mb-2">Contact Information</h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Email:</span> {staff.email}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Phone:</span> {staff.phone}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Status:</span>{" "}
                <Badge variant={staff.status === "active" ? "default" : "secondary"}>
                  {staff.status}
                </Badge>
              </p>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-2">Services</h3>
            <div className="flex flex-wrap gap-2">
              {staff.services.map((service) => (
                <Badge key={service} variant="outline">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div>
            <h3 className="font-semibold mb-2">Upcoming Schedule (Next 7 Days)</h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">No upcoming bookings</p>
            </div>
          </div>

          {/* Recent Bookings */}
          <div>
            <h3 className="font-semibold mb-2">Recent Bookings</h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">No recent bookings</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
