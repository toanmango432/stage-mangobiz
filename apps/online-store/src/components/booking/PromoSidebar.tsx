import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Percent, Clock, Star } from 'lucide-react';

export const PromoSidebar = () => {
  return (
    <div className="lg:sticky lg:top-8 space-y-6">
      {/* First-Time Offer */}
      <Card className="p-6 bg-gradient-to-br from-[hsl(var(--orange))]/10 via-background to-[hsl(var(--orange))]/5 shadow-lg border-2 border-[hsl(var(--orange))]/20">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-[hsl(var(--orange))]/20 flex items-center justify-center shrink-0">
            <Percent className="h-6 w-6 text-[hsl(var(--orange))]" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-foreground mb-1">
              FIRST-TIME CLIENT SPECIAL
            </h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          New to our salon? Enjoy 20% off your first service! Use code <span className="font-bold text-foreground">WELCOME20</span> at checkout.
        </p>
        <Button variant="orange" className="w-full">
          Apply Offer
        </Button>
      </Card>

      {/* Referral Program */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent-light/10 to-background shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-foreground mb-1">
              REFER & EARN
            </h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Share your love for our salon! For every friend who books using your code, you'll both get $20 off.
        </p>
        <Button variant="default" className="w-full">
          Share Your Code
        </Button>
      </Card>

      {/* Why Book With Us */}
      <Card className="p-6 bg-card shadow-lg">
        <h3 className="font-bold text-lg mb-4">Why Book With Us?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Star className="h-5 w-5 text-[hsl(var(--orange))] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Expert Technicians</p>
              <p className="text-xs text-muted-foreground">Certified professionals with years of experience</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-[hsl(var(--orange))] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Flexible Scheduling</p>
              <p className="text-xs text-muted-foreground">Easy online booking & rescheduling</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 text-[hsl(var(--orange))] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Rewards Program</p>
              <p className="text-xs text-muted-foreground">Earn points with every visit</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
