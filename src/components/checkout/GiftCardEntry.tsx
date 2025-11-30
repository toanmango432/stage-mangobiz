import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, X, Loader2, Check, AlertCircle, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppliedGiftCard {
  code: string;
  balance: number;
  amountUsed: number;
}

interface GiftCardEntryProps {
  remainingTotal: number;
  onApplyGiftCard: (giftCard: AppliedGiftCard) => void;
  onRemoveGiftCard: (code: string) => void;
  appliedGiftCards: AppliedGiftCard[];
  disabled?: boolean;
}

const MOCK_GIFT_CARDS: Record<string, { balance: number; expiresAt: string }> = {
  "GC-1234-5678": { balance: 50.00, expiresAt: "2025-12-31" },
  "GC-8765-4321": { balance: 100.00, expiresAt: "2025-06-30" },
  "GC-1111-2222": { balance: 25.00, expiresAt: "2026-01-15" },
  "GC-9999-0000": { balance: 200.00, expiresAt: "2025-08-20" },
  "GC-5555-6666": { balance: 75.50, expiresAt: "2025-11-30" },
};

export default function GiftCardEntry({
  remainingTotal,
  onApplyGiftCard,
  onRemoveGiftCard,
  appliedGiftCards,
  disabled = false,
}: GiftCardEntryProps) {
  const [giftCardCode, setGiftCardCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [foundCard, setFoundCard] = useState<{
    code: string;
    balance: number;
    expiresAt: string;
  } | null>(null);
  const [amountToUse, setAmountToUse] = useState("");

  const totalApplied = appliedGiftCards.reduce(
    (sum, gc) => sum + gc.amountUsed,
    0
  );

  const handleCheckBalance = async () => {
    if (!giftCardCode.trim()) {
      setError("Please enter a gift card code");
      return;
    }

    setIsValidating(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const normalizedCode = giftCardCode.trim().toUpperCase();
    const cardData = MOCK_GIFT_CARDS[normalizedCode];

    if (cardData) {
      const alreadyApplied = appliedGiftCards.find(
        (gc) => gc.code === normalizedCode
      );
      if (alreadyApplied) {
        setError("This gift card has already been applied");
        setIsValidating(false);
        return;
      }

      const expiryDate = new Date(cardData.expiresAt);
      if (expiryDate < new Date()) {
        setError("This gift card has expired");
        setIsValidating(false);
        return;
      }

      if (cardData.balance <= 0) {
        setError("This gift card has no remaining balance");
        setIsValidating(false);
        return;
      }

      setFoundCard({
        code: normalizedCode,
        balance: cardData.balance,
        expiresAt: cardData.expiresAt,
      });

      const maxUsable = Math.min(cardData.balance, remainingTotal - totalApplied);
      setAmountToUse(maxUsable.toFixed(2));
    } else {
      setError("Invalid gift card code");
    }

    setIsValidating(false);
  };

  const handleApplyGiftCard = () => {
    if (!foundCard) return;

    const amount = parseFloat(amountToUse);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amount > foundCard.balance) {
      setError("Amount exceeds gift card balance");
      return;
    }

    const maxUsable = remainingTotal - totalApplied;
    if (amount > maxUsable) {
      setError(`Maximum usable amount is $${maxUsable.toFixed(2)}`);
      return;
    }

    onApplyGiftCard({
      code: foundCard.code,
      balance: foundCard.balance,
      amountUsed: amount,
    });

    setGiftCardCode("");
    setFoundCard(null);
    setAmountToUse("");
    setShowDialog(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCheckBalance();
    }
  };

  const formatCardCode = (code: string) => {
    const cleaned = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
  };

  return (
    <>
      {appliedGiftCards.length > 0 && (
        <div className="space-y-2" data-testid="container-applied-gift-cards">
          {appliedGiftCards.map((gc) => (
            <div
              key={gc.code}
              className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
              data-testid={`gift-card-applied-${gc.code}`}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-purple-500/20">
                  <Gift className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-purple-700 dark:text-purple-300">
                      {gc.code}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    -${gc.amountUsed.toFixed(2)} applied (${(gc.balance - gc.amountUsed).toFixed(2)} remaining)
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onRemoveGiftCard(gc.code)}
                disabled={disabled}
                data-testid={`button-remove-gift-card-${gc.code}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground hover:text-foreground gap-2 h-9"
        onClick={() => setShowDialog(true)}
        disabled={disabled || remainingTotal - totalApplied <= 0}
        data-testid="button-add-gift-card"
      >
        <Gift className="h-4 w-4" />
        <span className="text-sm">
          {appliedGiftCards.length > 0
            ? "Add another gift card"
            : "Apply gift card"}
        </span>
      </Button>

      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          setGiftCardCode("");
          setFoundCard(null);
          setAmountToUse("");
          setError(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Gift Card
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!foundCard ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter Gift Card Code</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="GC-XXXX-XXXX"
                      value={giftCardCode}
                      onChange={(e) => {
                        setGiftCardCode(formatCardCode(e.target.value));
                        setError(null);
                      }}
                      onKeyDown={handleKeyDown}
                      disabled={isValidating}
                      className={`flex-1 uppercase ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      data-testid="input-gift-card-code"
                      autoFocus
                    />
                    <Button
                      onClick={handleCheckBalance}
                      disabled={!giftCardCode.trim() || isValidating}
                      data-testid="button-check-balance"
                    >
                      {isValidating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Check"
                      )}
                    </Button>
                  </div>
                  {error && (
                    <div className="flex items-center gap-1.5 text-destructive text-xs">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span data-testid="text-gift-card-error">{error}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>Test codes: GC-1234-5678 ($50), GC-8765-4321 ($100)</p>
                </div>
              </>
            ) : (
              <>
                <Card className="border-purple-500/20 bg-purple-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <span className="font-medium">{foundCard.code}</span>
                      </div>
                      <Badge variant="secondary">
                        ${foundCard.balance.toFixed(2)} available
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expires: {new Date(foundCard.expiresAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount to Apply</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={Math.min(
                        foundCard.balance,
                        remainingTotal - totalApplied
                      )}
                      value={amountToUse}
                      onChange={(e) => {
                        setAmountToUse(e.target.value);
                        setError(null);
                      }}
                      className="pl-7"
                      data-testid="input-gift-card-amount"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Card balance: ${foundCard.balance.toFixed(2)}
                    </span>
                    <span>
                      Order remaining: ${(remainingTotal - totalApplied).toFixed(2)}
                    </span>
                  </div>
                  {error && (
                    <div className="flex items-center gap-1.5 text-destructive text-xs">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setFoundCard(null);
                      setAmountToUse("");
                      setError(null);
                    }}
                    data-testid="button-back-gift-card"
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleApplyGiftCard}
                    disabled={!amountToUse || parseFloat(amountToUse) <= 0}
                    data-testid="button-apply-gift-card"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Apply ${parseFloat(amountToUse || "0").toFixed(2)}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
