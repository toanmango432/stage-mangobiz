import { useEffect, useState } from "react";
import { MembershipCard } from "@/components/MembershipCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMembershipPlans } from "@/lib/api/store";

interface MembershipRailProps {
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
}

export function MembershipRail({ 
  title = "Membership Plans",
  subtitle = "Join our exclusive membership program and save on every visit",
  showViewAll = true 
}: MembershipRailProps) {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const fetchMemberships = async () => {
      const plans = await getMembershipPlans();
      setMemberships(plans.slice(0, 3));
    };
    fetchMemberships();
  }, []);

  const scrollLeft = () => {
    const container = document.getElementById('membership-rail');
    if (container) {
      container.scrollBy({ left: -400, behavior: 'smooth' });
      setScrollPosition(container.scrollLeft - 400);
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('membership-rail');
    if (container) {
      container.scrollBy({ left: 400, behavior: 'smooth' });
      setScrollPosition(container.scrollLeft + 400);
    }
  };

  if (memberships.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-3">{title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="relative">
          {/* Scroll Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex bg-background/80 backdrop-blur"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex bg-background/80 backdrop-blur"
            onClick={scrollRight}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Scrollable Rail */}
          <div
            id="membership-rail"
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 md:px-12"
            style={{ scrollbarWidth: 'none' }}
          >
            {memberships.map((membership) => (
              <div key={membership.id} className="flex-none w-full md:w-[400px] snap-center">
                <MembershipCard
                  title={membership.displayName || membership.name}
                  description={membership.tagline || membership.description}
                  price={membership.priceMonthly}
                  billingPeriod="month"
                  benefits={membership.perks || []}
                  featured={false}
                  imageUrl={membership.imageUrl}
                  onJoin={() => {}}
                />
              </div>
            ))}
          </div>
        </div>

        {showViewAll && (
          <div className="text-center mt-8">
            <Link href="/memberships">
              <Button size="lg" variant="outline">
                View All Membership Plans
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
