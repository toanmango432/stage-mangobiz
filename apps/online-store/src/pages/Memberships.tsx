import { useState, useEffect } from "react";
import { MembershipCard } from "@/components/MembershipCard";
import { MembershipComparisonTable } from "@/components/memberships/MembershipComparisonTable";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getMembershipPlans } from "@/lib/api/store";

const Memberships = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [viewMode, setViewMode] = useState<'cards' | 'comparison'>('cards');
  const [memberships, setMemberships] = useState<Array<any>>([]);

  useEffect(() => {
    const loadMemberships = async () => {
      const plans = await getMembershipPlans();
      setMemberships(plans);
    };
    loadMemberships();
  }, []);

  const handleJoin = (membershipTitle: string) => {
    const membership = memberships.find(m => m.name === membershipTitle);
    if (!membership) return;

    addToCart({
      id: `membership-${membership.id}`,
      type: 'membership',
      name: `${membership.name} Membership`,
      price: membership.priceMonthly,
      membershipDetails: {
        billingCycle: 'monthly',
        startDate: new Date().toISOString()
      }
    });

    toast.success(`${membershipTitle} membership added to cart!`);
    navigate('/cart');
  };

  const handleSelectTier = (tierId: string) => {
    const membership = memberships.find(m => m.name.toLowerCase() === tierId);
    if (membership) {
      handleJoin(membership.name);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Membership Plans</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Unlock exclusive benefits and savings with a Mango membership. 
            Enjoy priority booking, discounts, and special perks all year long.
          </p>
          
          <div className="flex justify-center gap-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              onClick={() => setViewMode('cards')}
            >
              Card View
            </Button>
            <Button
              variant={viewMode === 'comparison' ? 'default' : 'outline'}
              onClick={() => setViewMode('comparison')}
            >
              Compare Plans
            </Button>
          </div>
        </div>

        {/* Membership Cards or Comparison */}
        <div className="max-w-7xl mx-auto mb-16">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {memberships.map((membership) => (
                <MembershipCard
                  key={membership.id}
                  title={membership.name}
                  description={membership.description || ''}
                  price={membership.priceMonthly}
                  billingPeriod="month"
                  benefits={membership.perks || membership.benefits}
                  featured={membership.popular}
                  imageUrl={membership.imageUrl}
                  onJoin={() => handleJoin(membership.name)}
                />
              ))}
            </div>
          ) : (
            <MembershipComparisonTable 
              onSelectTier={handleSelectTier}
              plans={memberships}
            />
          )}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Membership FAQs</h2>
          <div className="space-y-4">
            <div className="bg-card p-6 rounded-lg shadow-card">
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your membership at any time. Your benefits will continue until the end of your current billing period.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-card">
              <h3 className="font-semibold mb-2">Do unused benefits roll over?</h3>
              <p className="text-muted-foreground">
                Discount percentages are active throughout your membership. Complimentary services expire at the end of each billing cycle.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-card">
              <h3 className="font-semibold mb-2">Can I share my membership?</h3>
              <p className="text-muted-foreground">
                Memberships are personal and non-transferable. However, VIP members can gift one complimentary service per quarter to a friend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Memberships;
