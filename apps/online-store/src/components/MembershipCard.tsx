import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface MembershipCardProps {
  title: string;
  description: string;
  price: number;
  billingPeriod: string;
  benefits: string[];
  featured?: boolean;
  imageUrl?: string;
  onJoin: () => void;
}

export const MembershipCard = ({ 
  title, 
  description, 
  price, 
  billingPeriod, 
  benefits, 
  featured,
  imageUrl,
  onJoin 
}: MembershipCardProps) => {
  return (
    <Card className={`shadow-card hover:shadow-elevated transition-all overflow-hidden ${
      featured ? "border-primary border-2" : ""
    }`}>
      {imageUrl && (
        <div className="aspect-[2/1] overflow-hidden">
          <img
            src={imageUrl}
            alt={`${title} Membership`}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        {featured && (
          <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
            Most Popular
          </div>
        )}
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">${price}</span>
            <span className="text-muted-foreground">/ {billingPeriod}</span>
          </div>
        </div>
        
        <ul className="space-y-3">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{benefit}</span>
            </li>
          ))}
        </ul>

        <Button 
          onClick={onJoin} 
          className={`w-full ${
            featured 
              ? "bg-primary hover:bg-primary-dark" 
              : "bg-accent hover:bg-accent-light"
          }`}
        >
          Join Now
        </Button>
      </CardContent>
    </Card>
  );
};
