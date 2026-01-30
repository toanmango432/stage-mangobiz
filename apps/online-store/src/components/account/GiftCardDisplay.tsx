import { useState } from 'react';
import { GiftCard } from '@/types/giftcard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Gift, Copy, ShoppingBag, CheckCircle2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import QRCode from 'react-qr-code';

interface GiftCardDisplayProps {
  giftCard: GiftCard;
  onApplyToCart: (code: string) => void;
}

export const GiftCardDisplay = ({ giftCard, onApplyToCart }: GiftCardDisplayProps) => {
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(giftCard.code);
    setCodeCopied(true);
    toast({
      title: 'Code copied!',
      description: 'Gift card code copied to clipboard',
    });
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const balancePercentage = (giftCard.currentBalance / giftCard.originalAmount) * 100;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6" />
            <h3 className="text-xl font-bold">Gift Card</h3>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">
            {giftCard.status === 'active' ? 'Active' : giftCard.status === 'redeemed' ? 'Redeemed' : 'Expired'}
          </Badge>
        </div>
        
        <div className="mb-4">
          <p className="text-white/80 text-sm mb-1">Current Balance</p>
          <p className="text-4xl font-bold">${giftCard.currentBalance.toFixed(2)}</p>
          <p className="text-white/70 text-sm mt-1">
            of ${giftCard.originalAmount.toFixed(2)} original value
          </p>
        </div>

        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${balancePercentage}%` }}
          />
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Gift Card Code */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Gift Card Code</p>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-lg font-semibold tracking-wider">
              {giftCard.code}
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleCopyCode}
              className="shrink-0"
            >
              {codeCopied ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* QR Code for In-Store */}
        <div className="flex flex-col items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="bg-white p-3 rounded-lg">
            <QRCode value={giftCard.code} size={128} />
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Scan this QR code for in-store redemption
          </p>
        </div>

        {/* Card Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Issued</span>
            <span className="font-medium">{format(new Date(giftCard.issuedDate), 'MMM d, yyyy')}</span>
          </div>
          {giftCard.expiryDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires</span>
              <span className="font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(giftCard.expiryDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          {giftCard.senderName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">From</span>
              <span className="font-medium">{giftCard.senderName}</span>
            </div>
          )}
        </div>

        {giftCard.message && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm italic text-muted-foreground">"{giftCard.message}"</p>
          </div>
        )}

        {/* Transaction History */}
        {giftCard.transactions.length > 0 && (
          <Accordion type="single" collapsible className="border rounded-lg">
            <AccordionItem value="transactions" className="border-0">
              <AccordionTrigger className="px-4 hover:no-underline">
                <span className="text-sm font-medium">Transaction History ({giftCard.transactions.length})</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {giftCard.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-start text-sm border-b last:border-0 pb-2 last:pb-0">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Order #{transaction.orderNumber} • {format(new Date(transaction.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className="font-semibold text-red-600">-${transaction.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Actions */}
        {giftCard.status === 'active' && giftCard.currentBalance > 0 && (
          <Button 
            className="w-full"
            onClick={() => onApplyToCart(giftCard.code)}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Apply to Next Purchase
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
