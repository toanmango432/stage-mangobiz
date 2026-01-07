import { AppleIcon, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AlternativePaymentsProps {
  onPaymentSelect: (method: 'apple-pay' | 'google-pay' | 'paypal') => void;
}

export const AlternativePayments = ({ onPaymentSelect }: AlternativePaymentsProps) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Separator />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
          Or pay with
        </span>
      </div>

      <div className="grid gap-3">
        <Button
          variant="outline"
          className="w-full gap-2 h-12"
          onClick={() => onPaymentSelect('apple-pay')}
        >
          <AppleIcon className="h-5 w-5" />
          <span className="font-semibold">Apple Pay</span>
        </Button>

        <Button
          variant="outline"
          className="w-full gap-2 h-12"
          onClick={() => onPaymentSelect('google-pay')}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
          </svg>
          <span className="font-semibold">Google Pay</span>
        </Button>

        <Button
          variant="outline"
          className="w-full gap-2 h-12 text-[#0070ba] border-[#0070ba] hover:bg-[#0070ba]/10"
          onClick={() => onPaymentSelect('paypal')}
        >
          <CreditCard className="h-5 w-5" />
          <span className="font-semibold">PayPal</span>
        </Button>
      </div>
    </div>
  );
};
