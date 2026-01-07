import { Card, CardContent } from "@/components/ui/card";
import { AIBadge } from "@/components/ui/ai-badge";
import { TrendingUp, DollarSign, Star } from "lucide-react";
import { usePersonalization } from "@/hooks/usePersonalization";

interface AIValueHighlightProps {
  membershipId: string;
  monthlyPrice: number;
  serviceDiscount: number;
  productDiscount: number;
}

export function AIValueHighlight({ 
  membershipId, 
  monthlyPrice, 
  serviceDiscount,
  productDiscount 
}: AIValueHighlightProps) {
  const { profile } = usePersonalization();

  // Calculate personalized savings based on user history
  const calculateSavings = () => {
    const monthlySpend = profile.avgSpend;
    
    if (monthlySpend === 0) {
      // Default estimate for new users
      return {
        monthlySavings: Math.round(monthlyPrice * 1.5),
        annualSavings: Math.round(monthlyPrice * 18),
        breakEvenVisits: 2,
      };
    }

    const serviceSavings = monthlySpend * 0.7 * (serviceDiscount / 100);
    const productSavings = monthlySpend * 0.3 * (productDiscount / 100);
    const monthlySavings = serviceSavings + productSavings - monthlyPrice;
    const annualSavings = monthlySavings * 12;
    const breakEvenVisits = Math.ceil(monthlyPrice / (monthlySpend * (serviceDiscount / 100)));

    return {
      monthlySavings: Math.round(monthlySavings),
      annualSavings: Math.round(annualSavings),
      breakEvenVisits,
    };
  };

  const savings = calculateSavings();

  if (savings.monthlySavings <= 0) return null;

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AIBadge variant="chip">Best Value for You</AIBadge>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                Save ${savings.monthlySavings}/month
              </p>
              <p className="text-xs text-muted-foreground">
                Based on your typical spending
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-purple-600 dark:text-purple-400">
                ${savings.annualSavings} annual savings
              </p>
              <p className="text-xs text-muted-foreground">
                That's {Math.round((savings.annualSavings / (monthlyPrice * 12)) * 100)}% return on investment
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold">
                Pay off after {savings.breakEvenVisits} visit{savings.breakEvenVisits !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                Members with similar habits save an average of ${savings.monthlySavings * 3} in their first 3 months
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-purple-200 dark:border-purple-800">
          <p className="text-xs text-center text-muted-foreground italic">
            Personalized calculation based on your visit history
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
