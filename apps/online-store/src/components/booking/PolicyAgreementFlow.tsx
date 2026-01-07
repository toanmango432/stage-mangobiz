import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  Shield,
  CreditCard,
  Calendar
} from 'lucide-react';

interface PolicyAgreementFlowProps {
  formData: any;
  updateFormData: (data: any) => void;
  onComplete: () => void;
}

export const PolicyAgreementFlow = ({
  formData,
  updateFormData,
  onComplete,
}: PolicyAgreementFlowProps) => {
  const [agreements, setAgreements] = useState({
    cancellationPolicy: false,
    noShowPolicy: false,
    refundPolicy: false,
    termsOfService: false,
    privacyPolicy: false,
    depositPolicy: false,
  });

  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  const policies = [
    {
      id: 'cancellationPolicy',
      title: 'Cancellation Policy',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      required: true,
      summary: 'Free cancellation up to 24 hours before appointment',
      details: [
        'Cancellations made 24+ hours in advance: Full refund',
        'Cancellations made 2-24 hours in advance: 50% refund',
        'Cancellations made less than 2 hours in advance: No refund',
        'Same-day cancellations: No refund, but rescheduling allowed',
        'Emergency cancellations: Case-by-case review'
      ]
    },
    {
      id: 'noShowPolicy',
      title: 'No-Show Policy',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      required: true,
      summary: 'No-show fee applies if you miss your appointment',
      details: [
        'First no-show: 50% of service cost',
        'Second no-show: 75% of service cost',
        'Third no-show: 100% of service cost',
        'Late arrivals (15+ minutes): May be rescheduled or charged no-show fee',
        'Contact us if running late to avoid fees'
      ]
    },
    {
      id: 'refundPolicy',
      title: 'Refund Policy',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      required: true,
      summary: 'Refunds processed within 5-7 business days',
      details: [
        'Refunds processed to original payment method',
        'Processing time: 5-7 business days',
        'Partial refunds available for partial services',
        'Gift card purchases: Refunded as store credit',
        'Disputes: Contact us within 30 days'
      ]
    },
    {
      id: 'depositPolicy',
      title: 'Deposit Policy',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      required: true,
      summary: 'Deposit required to secure your appointment',
      details: [
        'Deposit amount: 20% of total service cost',
        'Deposit is non-refundable but applies to service cost',
        'Remaining balance due at appointment',
        'Deposit forfeited for no-shows or late cancellations',
        'Multiple services: Deposit applies to total cost'
      ]
    },
    {
      id: 'termsOfService',
      title: 'Terms of Service',
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      required: true,
      summary: 'General terms and conditions for our services',
      details: [
        'Services provided by licensed professionals',
        'Client satisfaction is our priority',
        'We reserve the right to refuse service',
        'All services subject to availability',
        'Prices subject to change without notice'
      ]
    },
    {
      id: 'privacyPolicy',
      title: 'Privacy Policy',
      icon: Shield,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      required: true,
      summary: 'How we protect and use your personal information',
      details: [
        'Personal information is kept confidential',
        'Information used only for service delivery',
        'No sharing with third parties without consent',
        'Secure data storage and transmission',
        'Right to request data deletion'
      ]
    }
  ];

  const handleAgreementChange = (policyId: string, checked: boolean) => {
    setAgreements(prev => ({
      ...prev,
      [policyId]: checked,
    }));
  };

  const handleComplete = () => {
    updateFormData({ 
      agreements: {
        ...agreements,
        agreedToAll: Object.values(agreements).every(Boolean),
        agreedAt: new Date().toISOString(),
      }
    });
    onComplete();
  };

  const canProceed = Object.values(agreements).every(Boolean);

  const togglePolicyExpansion = (policyId: string) => {
    setExpandedPolicy(expandedPolicy === policyId ? null : policyId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Policies & Agreements</h2>
        <p className="text-muted-foreground">
          Please review and agree to our policies to complete your booking
        </p>
      </div>

      {/* Policy Cards */}
      <div className="space-y-4">
        {policies.map((policy) => {
          const Icon = policy.icon;
          const isExpanded = expandedPolicy === policy.id;
          const isAgreed = agreements[policy.id as keyof typeof agreements];
          
          return (
            <Card 
              key={policy.id}
              className={cn(
                'transition-all duration-200',
                isAgreed && 'ring-2 ring-primary/20 bg-primary/5',
                policy.required && 'border-l-4 border-l-primary'
              )}
            >
              <CardHeader 
                className="cursor-pointer"
                onClick={() => togglePolicyExpansion(policy.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      policy.bgColor,
                      policy.borderColor,
                      'border'
                    )}>
                      <Icon className={cn('h-5 w-5', policy.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {policy.title}
                        {policy.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {policy.summary}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAgreed}
                      onCheckedChange={(checked) => handleAgreementChange(policy.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePolicyExpansion(policy.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="space-y-2">
                    {policy.details.map((detail, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Your Protection</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            By agreeing to these policies, you're protected by our commitment to fair service, 
            transparent pricing, and your privacy. We're here to ensure you have the best 
            experience possible.
          </p>
        </CardContent>
      </Card>

      {/* Action */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleComplete}
          disabled={!canProceed}
          className="px-8"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Agree & Continue to Payment
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="text-center">
        <div className="text-sm text-muted-foreground">
          {Object.values(agreements).filter(Boolean).length} of {policies.length} policies agreed
        </div>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(Object.values(agreements).filter(Boolean).length / policies.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};



