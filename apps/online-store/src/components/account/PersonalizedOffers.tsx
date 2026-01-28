import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIBadge } from "@/components/ui/ai-badge";
import { Sparkles, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  validUntil: string;
  actionUrl: string;
  actionLabel: string;
}

export function PersonalizedOffers() {
  const router = useRouter();

  // Mock personalized offers
  const offers: Offer[] = [
    {
      id: 'offer-1',
      title: '20% Off Your Favorite Service',
      description: 'Get 20% off gel manicures this week only. Book now to claim your exclusive discount!',
      discount: 20,
      validUntil: 'Valid until Dec 31',
      actionUrl: '/book',
      actionLabel: 'Book Now',
    },
    {
      id: 'offer-2',
      title: 'Loyalty Reward: Free Top Coat',
      description: "You've been with us for 6 months! Add a free long-lasting top coat to your next manicure.",
      discount: 100,
      validUntil: 'Valid for 30 days',
      actionUrl: '/book',
      actionLabel: 'Claim Reward',
    },
  ];

  if (offers.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold">Just for You</h2>
        <AIBadge variant="chip">Personalized</AIBadge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.map((offer) => (
          <Card 
            key={offer.id} 
            className="overflow-hidden border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20"
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                      {offer.discount}% OFF
                    </Badge>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2">{offer.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {offer.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Clock className="h-3 w-3" />
                    <span>{offer.validUntil}</span>
                  </div>
                  
                  <Button
                    onClick={() => router.push(offer.actionUrl)}
                    className="w-full"
                  >
                    {offer.actionLabel}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
