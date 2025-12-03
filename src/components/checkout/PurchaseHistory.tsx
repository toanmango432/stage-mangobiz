import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { History, Calendar, DollarSign, ChevronDown, ChevronRight, User, Receipt, Repeat } from "lucide-react";

interface PurchaseItem {
  id: string;
  name: string;
  price: number;
  staffName: string;
  type: "service" | "product";
}

interface Purchase {
  id: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

interface PurchaseHistoryProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRepeatPurchase?: (items: PurchaseItem[]) => void;
}

const MOCK_PURCHASES: Purchase[] = [
  {
    id: "pur-1",
    date: "2025-11-25",
    items: [
      { id: "item-1", name: "Women's Haircut & Style", price: 75, staffName: "Sarah", type: "service" },
      { id: "item-2", name: "Deep Conditioning Treatment", price: 45, staffName: "Sarah", type: "service" },
      { id: "item-3", name: "Professional Shampoo 16oz", price: 28, staffName: "", type: "product" },
    ],
    subtotal: 148,
    discount: 0,
    tax: 12.58,
    total: 160.58,
    paymentMethod: "Credit Card",
  },
  {
    id: "pur-2",
    date: "2025-10-18",
    items: [
      { id: "item-4", name: "Classic Manicure", price: 35, staffName: "Emily", type: "service" },
      { id: "item-5", name: "Classic Pedicure", price: 45, staffName: "Emily", type: "service" },
    ],
    subtotal: 80,
    discount: 8,
    tax: 6.12,
    total: 78.12,
    paymentMethod: "Cash",
  },
  {
    id: "pur-3",
    date: "2025-09-05",
    items: [
      { id: "item-6", name: "Full Color", price: 120, staffName: "Mike", type: "service" },
      { id: "item-7", name: "Blow Dry & Style", price: 40, staffName: "Mike", type: "service" },
      { id: "item-8", name: "Hair Oil Treatment", price: 45, staffName: "", type: "product" },
    ],
    subtotal: 205,
    discount: 20.50,
    tax: 15.68,
    total: 200.18,
    paymentMethod: "Gift Card",
  },
  {
    id: "pur-4",
    date: "2025-08-12",
    items: [
      { id: "item-9", name: "Deep Tissue Massage (60 min)", price: 120, staffName: "Alex", type: "service" },
    ],
    subtotal: 120,
    discount: 0,
    tax: 10.20,
    total: 130.20,
    paymentMethod: "Credit Card",
  },
  {
    id: "pur-5",
    date: "2025-07-20",
    items: [
      { id: "item-10", name: "Hydrating Facial", price: 95, staffName: "Sarah", type: "service" },
      { id: "item-11", name: "Eyebrow Shaping", price: 25, staffName: "Sarah", type: "service" },
      { id: "item-12", name: "Facial Moisturizer", price: 48, staffName: "", type: "product" },
    ],
    subtotal: 168,
    discount: 0,
    tax: 14.28,
    total: 182.28,
    paymentMethod: "Credit Card",
  },
];

export default function PurchaseHistory({
  client,
  open,
  onOpenChange,
  onRepeatPurchase,
}: PurchaseHistoryProps) {
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalSpent = MOCK_PURCHASES.reduce((sum, p) => sum + p.total, 0);
  const totalVisits = MOCK_PURCHASES.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Purchase History
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {client.firstName} {client.lastName}
            </span>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Total Visits
                </div>
                <div className="text-2xl font-bold mt-1">{totalVisits}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Total Spent
                </div>
                <div className="text-2xl font-bold mt-1">${totalSpent.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-3">
            {MOCK_PURCHASES.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No purchase history</p>
                <p className="text-sm">Previous transactions will appear here</p>
              </div>
            ) : (
              MOCK_PURCHASES.map((purchase) => {
                const isExpanded = expandedPurchase === purchase.id;

                return (
                  <Collapsible
                    key={purchase.id}
                    open={isExpanded}
                    onOpenChange={(open) =>
                      setExpandedPurchase(open ? purchase.id : null)
                    }
                  >
                    <Card
                      className={`transition-all ${isExpanded ? "border-primary/50" : ""}`}
                      data-testid={`card-purchase-${purchase.id}`}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="p-4 cursor-pointer hover-elevate">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <div className="font-medium text-sm">
                                  {formatDate(purchase.date)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {purchase.items.length} item{purchase.items.length !== 1 ? "s" : ""} •{" "}
                                  {purchase.paymentMethod}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                ${purchase.total.toFixed(2)}
                              </div>
                              {purchase.discount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  ${purchase.discount.toFixed(2)} saved
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="p-4 pt-0 border-t">
                          <div className="space-y-2 mt-3">
                            {purchase.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-sm py-1.5"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-1.5 py-0"
                                  >
                                    {item.type === "service" ? "Svc" : "Prod"}
                                  </Badge>
                                  <span>{item.name}</span>
                                  {item.staffName && (
                                    <span className="text-xs text-muted-foreground">
                                      ({item.staffName})
                                    </span>
                                  )}
                                </div>
                                <span>${item.price.toFixed(2)}</span>
                              </div>
                            ))}

                            <div className="border-t pt-2 mt-2 space-y-1 text-sm">
                              <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>${purchase.subtotal.toFixed(2)}</span>
                              </div>
                              {purchase.discount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                  <span>Discount</span>
                                  <span>-${purchase.discount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-muted-foreground">
                                <span>Tax</span>
                                <span>${purchase.tax.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-semibold pt-1">
                                <span>Total</span>
                                <span>${purchase.total.toFixed(2)}</span>
                              </div>
                            </div>

                            {onRepeatPurchase && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-3"
                                onClick={() => {
                                  onRepeatPurchase(purchase.items);
                                  onOpenChange(false);
                                }}
                                data-testid={`button-repeat-${purchase.id}`}
                              >
                                <Repeat className="h-4 w-4 mr-2" />
                                Repeat This Purchase
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-history"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
