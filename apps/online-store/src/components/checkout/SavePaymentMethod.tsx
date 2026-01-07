import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";

interface SavePaymentMethodProps {
  onSaveChange: (save: boolean, nickname?: string) => void;
}

export const SavePaymentMethod = ({ onSaveChange }: SavePaymentMethodProps) => {
  const [shouldSave, setShouldSave] = useState(false);
  const [nickname, setNickname] = useState("");

  const handleSaveChange = (checked: boolean) => {
    setShouldSave(checked);
    onSaveChange(checked, nickname);
  };

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (shouldSave) {
      onSaveChange(true, value);
    }
  };

  return (
    <Card className="p-4 bg-muted/30">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="save-payment"
            checked={shouldSave}
            onCheckedChange={handleSaveChange}
          />
          <div className="space-y-1">
            <Label 
              htmlFor="save-payment" 
              className="text-sm font-medium cursor-pointer"
            >
              Save this payment method for future purchases
            </Label>
            <p className="text-xs text-muted-foreground">
              Your payment information is encrypted and secure
            </p>
          </div>
        </div>

        {shouldSave && (
          <div className="ml-7 space-y-2">
            <Label htmlFor="payment-nickname" className="text-sm">
              Card Nickname (Optional)
            </Label>
            <Input
              id="payment-nickname"
              placeholder="e.g., Personal Card, Work Card"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              className="max-w-xs"
            />
          </div>
        )}

        <div className="ml-7 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>PCI Compliant</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
