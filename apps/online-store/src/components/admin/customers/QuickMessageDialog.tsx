'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Customer } from "@/lib/mockData";

interface QuickMessageDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const messageTemplates = {
  reminder: "Hi {name}, this is a friendly reminder about your upcoming appointment. We look forward to seeing you!",
  thankyou: "Thank you for choosing Mango Salon, {name}! We hope you enjoyed your experience with us.",
  promotion: "Hi {name}, we have a special offer just for you! Get 20% off your next service. Book now!",
  custom: "",
};

export function QuickMessageDialog({ customer, open, onOpenChange }: QuickMessageDialogProps) {
  const [template, setTemplate] = useState<keyof typeof messageTemplates>("reminder");
  const [message, setMessage] = useState(messageTemplates.reminder);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);

  if (!customer) return null;

  const handleTemplateChange = (value: string) => {
    const templateKey = value as keyof typeof messageTemplates;
    setTemplate(templateKey);
    const templateText = messageTemplates[templateKey];
    setMessage(templateText.replace("{name}", customer.firstName));
  };

  const handleSend = () => {
    if (!sendEmail && !sendSMS) {
      toast.error("Please select at least one delivery method");
      return;
    }

    const methods = [];
    if (sendEmail) methods.push("email");
    if (sendSMS) methods.push("SMS");

    toast.success(`Message sent via ${methods.join(" and ")}!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Send Message to {customer.firstName} {customer.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Message Template</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reminder">Appointment Reminder</SelectItem>
                <SelectItem value="thankyou">Thank You</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
                <SelectItem value="custom">Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Type your message here..."
            />
          </div>

          <div className="space-y-2">
            <Label>Send Via</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                />
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Email ({customer.email})
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms"
                  checked={sendSMS}
                  onCheckedChange={(checked) => setSendSMS(checked as boolean)}
                />
                <label
                  htmlFor="sms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  SMS ({customer.phone})
                </label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend}>Send Message</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
