import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, UserPlus, ShoppingCart, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Calendar,
      label: 'New Booking',
      description: 'Schedule appointment',
      onClick: () => navigate('/admin/bookings'),
    },
    {
      icon: UserPlus,
      label: 'Add Customer',
      description: 'Register new customer',
      onClick: () => navigate('/admin/customers'),
    },
    {
      icon: ShoppingCart,
      label: 'View Orders',
      description: 'Manage all orders',
      onClick: () => navigate('/admin/orders'),
    },
    {
      icon: FileText,
      label: 'Reports',
      description: 'View analytics',
      onClick: () => navigate('/admin/reports'),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto flex-col items-start p-4 hover-scale"
              onClick={action.onClick}
            >
              <Icon className="h-5 w-5 mb-2 text-primary" />
              <span className="font-semibold text-sm">{action.label}</span>
              <span className="text-xs text-muted-foreground">{action.description}</span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
