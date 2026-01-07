import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserMembership } from '@/types/user';
import { Crown, TrendingUp, Calendar, DollarSign, Check } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface MembershipCardProps {
  membership: UserMembership;
  onUpgrade: () => void;
  onCancel: () => void;
  onViewDetails: () => void;
}

const membershipConfig = {
  basic: {
    name: 'Basic',
    color: 'bg-gradient-to-br from-slate-500 to-slate-700',
    icon: Crown,
    benefits: ['10% off all services', 'Priority booking', 'Birthday gift'],
    monthlyValue: 25,
  },
  premium: {
    name: 'Premium',
    color: 'bg-gradient-to-br from-purple-500 to-purple-700',
    icon: Crown,
    benefits: ['20% off all services', 'Priority booking', 'Free add-ons', 'Birthday gift', 'Exclusive events'],
    monthlyValue: 50,
  },
  vip: {
    name: 'VIP',
    color: 'bg-gradient-to-br from-amber-500 to-amber-700',
    icon: Crown,
    benefits: ['30% off all services', 'Priority booking', 'Free add-ons', 'Birthday gift', 'Exclusive events', 'Personal stylist', 'Free products'],
    monthlyValue: 100,
  },
};

export const MembershipCard = ({ membership, onUpgrade, onCancel, onViewDetails }: MembershipCardProps) => {
  const config = membershipConfig[membership.plan];
  const Icon = config.icon;
  const daysUntilRenewal = differenceInDays(new Date(membership.renewalDate), new Date());
  const isExpiringSoon = daysUntilRenewal <= 7 && membership.status === 'active';
  
  // Mock usage data - in real app, this would come from membership object
  const usagePercentage = 65;
  const savingsThisMonth = 87;

  return (
    <Card className="overflow-hidden">
      <div className={`${config.color} p-6 text-white`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-6 w-6" />
              <h3 className="text-2xl font-bold">{config.name} Member</h3>
            </div>
            <p className="text-white/80">Member since {format(new Date(membership.startDate), 'MMM yyyy')}</p>
          </div>
          <Badge 
            variant={membership.status === 'active' ? 'default' : 'secondary'}
            className="bg-white/20 text-white border-white/30"
          >
            {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
          </Badge>
        </div>
        
        {membership.status === 'active' && (
          <div className="flex items-center gap-2 text-sm text-white/90">
            <Calendar className="h-4 w-4" />
            <span>Renews {format(new Date(membership.renewalDate), 'MMM d, yyyy')}</span>
            {isExpiringSoon && <span className="ml-2 text-yellow-300">(Expiring soon!)</span>}
          </div>
        )}
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Usage Stats */}
        {membership.status === 'active' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly Usage</span>
              <span className="font-medium">{usagePercentage}%</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  You've saved ${savingsThisMonth} this month
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  ${config.monthlyValue} average monthly value
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div>
          <h4 className="font-semibold mb-3">Your Benefits</h4>
          <ul className="space-y-2">
            {config.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {membership.status === 'active' && membership.plan !== 'vip' && (
            <Button onClick={onUpgrade} className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={onViewDetails}
            className={membership.status === 'active' && membership.plan !== 'vip' ? 'flex-1' : 'w-full'}
          >
            View Details
          </Button>
        </div>
        
        {membership.status === 'active' && (
          <Button 
            variant="ghost" 
            onClick={onCancel}
            className="w-full text-destructive hover:text-destructive"
          >
            Cancel Membership
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
