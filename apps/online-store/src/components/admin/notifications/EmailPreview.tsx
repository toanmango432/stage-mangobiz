import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Eye } from "lucide-react";
import * as emailTemplates from "@/lib/emailTemplates";

export const EmailPreview = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("orderConfirmation");
  const [testEmail, setTestEmail] = useState("");

  const mockData = {
    orderConfirmation: {
      customerName: "Sarah Johnson",
      orderNumber: "ORD-2024-001",
      orderTotal: "189.99",
      orderDate: "March 15, 2024",
      items: [
        { name: "Luxury Manicure", quantity: 1, price: "45.00" },
        { name: "Gel Polish - Sunset Pink", quantity: 2, price: "24.99" },
        { name: "Nail Care Kit", quantity: 1, price: "95.00" }
      ]
    },
    bookingConfirmation: {
      customerName: "Sarah Johnson",
      bookingDate: "March 20, 2024",
      bookingTime: "2:00 PM",
      serviceName: "Luxury Spa Pedicure",
      staffName: "Emily Chen",
      duration: "60 minutes"
    },
    giftCard: {
      customerName: "Sarah Johnson",
      giftCardCode: "MANGO-GIFT-2024",
      amount: "100.00",
      senderName: "Michael Smith",
      message: "Happy Birthday! Enjoy a relaxing spa day!"
    },
    membershipWelcome: {
      customerName: "Sarah Johnson",
      membershipTier: "Gold Membership",
      activationDate: "March 15, 2024",
      benefits: [
        "20% off all services",
        "Priority booking",
        "Free product samples",
        "Birthday month special gift"
      ]
    },
    appointmentReminder: {
      customerName: "Sarah Johnson",
      bookingDate: "Tomorrow, March 16, 2024",
      bookingTime: "2:00 PM",
      serviceName: "Luxury Manicure"
    }
  };

  const getTemplateHTML = (template: string) => {
    const data = mockData[template as keyof typeof mockData];
    
    switch (template) {
      case "orderConfirmation":
        return emailTemplates.orderConfirmationEmail(data as any);
      case "bookingConfirmation":
        return emailTemplates.bookingConfirmationEmail(data as any);
      case "giftCard":
        return emailTemplates.giftCardEmail(data as any);
      case "membershipWelcome":
        return emailTemplates.membershipWelcomeEmail(data as any);
      case "appointmentReminder":
        return emailTemplates.appointmentReminderEmail(data as any);
      default:
        return "";
    }
  };

  const handleSendTest = () => {
    if (!testEmail) {
      toast.error("Please enter an email address");
      return;
    }
    toast.success(`Test email sent to ${testEmail}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Template Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Select Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orderConfirmation">Order Confirmation</SelectItem>
                  <SelectItem value="bookingConfirmation">Booking Confirmation</SelectItem>
                  <SelectItem value="giftCard">Gift Card Delivery</SelectItem>
                  <SelectItem value="membershipWelcome">Membership Welcome</SelectItem>
                  <SelectItem value="appointmentReminder">Appointment Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="test-email">Test Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="test-email"
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button onClick={handleSendTest}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Preview</CardTitle>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Full Screen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-lg bg-white p-4 min-h-[600px] overflow-auto"
            dangerouslySetInnerHTML={{ __html: getTemplateHTML(selectedTemplate) }}
          />
        </CardContent>
      </Card>
    </div>
  );
};
