import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface MembershipUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: string;
  newTier: string;
  onConfirm: () => void;
}

const tierInfo: Record<string, { name: string; price: number; benefits: string[] }> = {
  basic: {
    name: "Basic",
    price: 49,
    benefits: ["10% off", "Priority booking"]
  },
  premium: {
    name: "Premium",
    price: 99,
    benefits: ["20% off", "Priority booking", "Free nail art (3)", "Beverages"]
  },
  vip: {
    name: "VIP",
    price: 199,
    benefits: ["30% off", "Priority booking", "Unlimited nail art", "Beverages", "Free home service"]
  }
};

export const MembershipUpgradeModal = ({
  open,
  onOpenChange,
  currentTier,
  newTier,
  onConfirm
}: MembershipUpgradeModalProps) => {
  const current = tierInfo[currentTier];
  const upgraded = tierInfo[newTier];
  const proratedAmount = upgraded.price - current.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upgrade Your Membership</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Card className="p-4 flex-1">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Current</p>
                <p className="font-bold text-lg">{current.name}</p>
                <p className="text-sm text-muted-foreground">${current.price}/mo</p>
              </div>
            </Card>

            <ArrowRight className="h-6 w-6 mx-4 text-primary" />

            <Card className="p-4 flex-1 border-primary border-2">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Upgrade to</p>
                <p className="font-bold text-lg text-primary">{upgraded.name}</p>
                <p className="text-sm text-muted-foreground">${upgraded.price}/mo</p>
              </div>
            </Card>
          </div>

          <div>
            <h4 className="font-semibold mb-3">You'll gain access to:</h4>
            <ul className="space-y-2">
              {upgraded.benefits
                .filter(b => !current.benefits.includes(b))
                .map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
            </ul>
          </div>

          <Separator />

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pro-rated amount (this month)</span>
              <span className="font-medium">${proratedAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">New monthly rate</span>
              <span className="font-bold text-primary">${upgraded.price}/mo</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onConfirm} className="flex-1">
              Confirm Upgrade
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
