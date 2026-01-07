import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface StockAlertProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StockAlert = ({ productId, productName, open, onOpenChange }: StockAlertProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Save to localStorage
    const alerts = JSON.parse(localStorage.getItem('mango-stock-alerts') || '[]');
    alerts.push({ productId, productName, email, date: new Date().toISOString() });
    localStorage.setItem('mango-stock-alerts', JSON.stringify(alerts));

    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("We'll notify you when this item is back in stock!");
      onOpenChange(false);
      setEmail('');
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get Notified</DialogTitle>
          <DialogDescription>
            Enter your email to be notified when "{productName}" is back in stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Notify Me'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
