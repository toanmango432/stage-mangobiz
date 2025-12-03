import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Mail, Download, Share2, Check } from "lucide-react";

interface ReceiptService {
  id: string;
  name: string;
  price: number;
  staffName?: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface ReceiptPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: ReceiptService[];
  client: Client | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  couponCode?: string;
  couponDiscount?: number;
  giftCardPayments?: { code: string; amount: number }[];
  paymentMethod?: string;
  amountPaid?: number;
  changeDue?: number;
  tipAmount?: number;
  transactionId?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
}

export default function ReceiptPreview({
  open,
  onOpenChange,
  services,
  client,
  subtotal,
  discount,
  tax,
  total,
  pointsRedeemed,
  pointsDiscount,
  couponCode,
  couponDiscount,
  giftCardPayments,
  paymentMethod = "Credit Card",
  amountPaid,
  changeDue,
  tipAmount,
  transactionId,
  businessName = "Mango Spa & Salon",
  businessAddress = "123 Main Street, Suite 100",
  businessPhone = "(555) 123-4567",
}: ReceiptPreviewProps) {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = currentDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const receiptNumber = transactionId || `TXN-${Date.now().toString().slice(-8)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    console.log("Email receipt to:", client?.email);
  };

  const handleDownload = () => {
    console.log("Download receipt as PDF");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            Receipt Preview
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Card className="border shadow-sm">
            <CardContent className="p-6 font-mono text-sm">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold">{businessName}</h2>
                <p className="text-xs text-muted-foreground">{businessAddress}</p>
                <p className="text-xs text-muted-foreground">{businessPhone}</p>
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between text-xs text-muted-foreground mb-3">
                <span>{formattedDate}</span>
                <span>{formattedTime}</span>
              </div>

              <div className="text-xs text-muted-foreground mb-3">
                <div>Receipt #: {receiptNumber}</div>
                {client && (
                  <div>
                    Client: {client.firstName} {client.lastName}
                  </div>
                )}
              </div>

              <Separator className="my-3" />

              <div className="space-y-1.5 mb-3">
                {services.map((service) => (
                  <div key={service.id} className="flex justify-between text-xs">
                    <div className="flex-1 pr-2">
                      <span className="truncate block">{service.name}</span>
                      {service.staffName && (
                        <span className="text-muted-foreground text-[10px]">
                          ({service.staffName})
                        </span>
                      )}
                    </div>
                    <span>${service.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-3" />

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}

                {pointsRedeemed && pointsDiscount && pointsDiscount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Points ({pointsRedeemed.toLocaleString()} pts)</span>
                    <span>-${pointsDiscount.toFixed(2)}</span>
                  </div>
                )}

                {couponCode && couponDiscount && couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon ({couponCode})</span>
                    <span>-${couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                {tipAmount && tipAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tip</span>
                    <span>${tipAmount.toFixed(2)}</span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between font-bold text-sm">
                  <span>Total</span>
                  <span>${(total + (tipAmount || 0)).toFixed(2)}</span>
                </div>
              </div>

              {giftCardPayments && giftCardPayments.length > 0 && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-1 text-xs">
                    <div className="font-medium mb-1">Gift Card Payments</div>
                    {giftCardPayments.map((gc, index) => (
                      <div key={index} className="flex justify-between text-purple-600">
                        <span>{gc.code}</span>
                        <span>-${gc.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Separator className="my-3" />

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span>{paymentMethod}</span>
                </div>
                {amountPaid !== undefined && (
                  <div className="flex justify-between">
                    <span>Amount Paid</span>
                    <span>${amountPaid.toFixed(2)}</span>
                  </div>
                )}
                {changeDue !== undefined && changeDue > 0 && (
                  <div className="flex justify-between font-medium">
                    <span>Change Due</span>
                    <span>${changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-3" />

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-600 mb-2">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">Payment Complete</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Thank you for visiting {businessName}!
                </p>
                <p className="text-[10px] text-muted-foreground">
                  We appreciate your business.
                </p>
              </div>

              {client?.email && (
                <>
                  <Separator className="my-3" />
                  <div className="text-[10px] text-center text-muted-foreground">
                    A copy of this receipt has been sent to
                    <br />
                    {client.email}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="grid grid-cols-4 gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-2 px-1"
              onClick={handlePrint}
              data-testid="button-print-receipt"
            >
              <Printer className="h-4 w-4 mb-1" />
              <span className="text-[10px]">Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-2 px-1"
              onClick={handleEmail}
              disabled={!client?.email}
              data-testid="button-email-receipt"
            >
              <Mail className="h-4 w-4 mb-1" />
              <span className="text-[10px]">Email</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-2 px-1"
              onClick={handleDownload}
              data-testid="button-download-receipt"
            >
              <Download className="h-4 w-4 mb-1" />
              <span className="text-[10px]">Save</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-2 px-1"
              data-testid="button-share-receipt"
            >
              <Share2 className="h-4 w-4 mb-1" />
              <span className="text-[10px]">Share</span>
            </Button>
          </div>

          <Button
            className="w-full"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-receipt"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
