import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const tiers = [
  {
    id: "basic",
    name: "Basic",
    price: 49,
    popular: false,
    features: [
      { name: "10% off all services", included: true },
      { name: "Priority booking", included: true },
      { name: "Birthday gift", included: true },
      { name: "Free nail art (1 nail)", included: false },
      { name: "Complimentary beverages", included: false },
      { name: "Free home service", included: false }
    ]
  },
  {
    id: "premium",
    name: "Premium",
    price: 99,
    popular: true,
    features: [
      { name: "20% off all services", included: true },
      { name: "Priority booking", included: true },
      { name: "Birthday gift", included: true },
      { name: "Free nail art (3 nails)", included: true },
      { name: "Complimentary beverages", included: true },
      { name: "Free home service", included: false }
    ]
  },
  {
    id: "vip",
    name: "VIP",
    price: 199,
    popular: false,
    features: [
      { name: "30% off all services", included: true },
      { name: "Priority booking", included: true },
      { name: "Birthday gift", included: true },
      { name: "Unlimited nail art", included: true },
      { name: "Complimentary beverages", included: true },
      { name: "Free home service (2x/month)", included: true }
    ]
  }
];

interface MembershipComparisonTableProps {
  onSelectTier: (tierId: string) => void;
  plans: Array<any>;
}

export const MembershipComparisonTable = ({ onSelectTier, plans }: MembershipComparisonTableProps) => {
  if (!plans || plans.length === 0) {
    return <div className="text-center text-muted-foreground">Loading membership plans...</div>;
  }

  const tiers = plans.map(plan => ({
    id: plan.name.toLowerCase(),
    name: plan.name,
    price: plan.priceMonthly,
    popular: plan.popular || false,
    features: (plan.perks || plan.benefits || []).map((benefit: string) => ({
      name: benefit,
      included: true
    }))
  }));
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {tiers.map((tier) => (
        <Card
          key={tier.id}
          className={cn(
            "relative p-6",
            tier.popular && "border-primary border-2"
          )}
        >
          {tier.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3" />
                Most Popular
              </span>
            </div>
          )}

          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
            <div className="text-4xl font-bold text-primary mb-1">
              ${tier.price}
            </div>
            <p className="text-sm text-muted-foreground">per month</p>
          </div>

          <ul className="space-y-3 mb-6">
            {tier.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                {feature.included ? (
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <span className={cn(
                  "text-sm",
                  !feature.included && "text-muted-foreground"
                )}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>

          <Button
            onClick={() => onSelectTier(tier.id)}
            className="w-full"
            variant={tier.popular ? "default" : "outline"}
          >
            Select {tier.name}
          </Button>
        </Card>
      ))}
    </div>
  );
};
