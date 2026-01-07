import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckoutFormData } from "@/types/order";

interface ContactFormProps {
  formData: CheckoutFormData;
  onUpdate: (data: Partial<CheckoutFormData>) => void;
}

export const ContactForm = ({ formData, onUpdate }: ContactFormProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
        <p className="text-muted-foreground mb-6">
          We'll use this to send you order confirmations and updates
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="newsletter"
            checked={formData.newsletter}
            onCheckedChange={(checked) => onUpdate({ newsletter: checked as boolean })}
          />
          <Label htmlFor="newsletter" className="text-sm font-normal cursor-pointer">
            Send me exclusive offers and updates
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="createAccount"
            checked={formData.createAccount}
            onCheckedChange={(checked) => onUpdate({ createAccount: checked as boolean })}
          />
          <Label htmlFor="createAccount" className="text-sm font-normal cursor-pointer">
            Create an account for faster checkout next time
          </Label>
        </div>
      </div>
    </div>
  );
};
