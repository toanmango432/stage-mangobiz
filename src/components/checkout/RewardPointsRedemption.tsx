import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Award, Gift, Star, Sparkles, Check, X } from "lucide-react";
import { Client } from "./ClientSelector";

interface RewardPointsRedemptionProps {
  client: Client;
  subtotal: number;
  currentDiscount: number;
  onApplyPoints: (pointsToRedeem: number, discountValue: number) => void;
  onRemovePointsRedemption: () => void;
  appliedPointsDiscount: number;
}

// Points conversion rate: 100 points = $1
const POINTS_PER_DOLLAR = 100;

// Loyalty tier benefits
const LOYALTY_TIERS = {
  bronze: { multiplier: 1, minSpend: 0, color: "bg-amber-700 text-amber-50" },
  silver: { multiplier: 1.25, minSpend: 500, color: "bg-slate-400 text-slate-900" },
  gold: { multiplier: 1.5, minSpend: 1500, color: "bg-yellow-500 text-yellow-950" },
};

export default function RewardPointsRedemption({
  client,
  subtotal,
  currentDiscount,
  onApplyPoints,
  onRemovePointsRedemption,
  appliedPointsDiscount,
}: RewardPointsRedemptionProps) {
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [customPoints, setCustomPoints] = useState("");

  const availablePoints = client.rewardPoints || 0;
  const tier = client.loyaltyStatus || "bronze";
  const tierConfig = LOYALTY_TIERS[tier];

  // Calculate max redeemable (can't exceed subtotal minus current discount)
  const maxRedeemableValue = Math.max(0, subtotal - currentDiscount - appliedPointsDiscount);
  const maxRedeemablePoints = Math.min(
    availablePoints,
    Math.floor(maxRedeemableValue * POINTS_PER_DOLLAR)
  );

  // Points earned from this transaction (before redemption)
  const earnablePoints = Math.floor(subtotal * tierConfig.multiplier);

  const discountValue = pointsToRedeem / POINTS_PER_DOLLAR;

  const handleApplyPoints = () => {
    if (pointsToRedeem > 0 && pointsToRedeem <= maxRedeemablePoints) {
      onApplyPoints(pointsToRedeem, discountValue);
      setShowRedeemDialog(false);
      setPointsToRedeem(0);
      setCustomPoints("");
    }
  };

  const handleCustomPointsChange = (value: string) => {
    setCustomPoints(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= maxRedeemablePoints) {
      setPointsToRedeem(parsed);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setPointsToRedeem(value[0]);
    setCustomPoints(value[0].toString());
  };

  const quickRedeemOptions = [
    { points: 500, label: "500 pts = $5" },
    { points: 1000, label: "1000 pts = $10" },
    { points: Math.min(maxRedeemablePoints, availablePoints), label: "Use All" },
  ].filter(opt => opt.points <= maxRedeemablePoints && opt.points > 0);

  return (
    <>
      {/* Points Display Card */}
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Reward Points</span>
                <Badge className={`text-xs ${tierConfig.color}`}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  {availablePoints.toLocaleString()} pts available
                </span>
                {earnablePoints > 0 && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Sparkles className="h-4 w-4" />
                    +{earnablePoints} pts today
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {appliedPointsDiscount > 0 ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-500/20">
                -${appliedPointsDiscount.toFixed(2)}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRemovePointsRedemption}
                data-testid="button-remove-points-redemption"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : availablePoints >= 100 && maxRedeemablePoints >= 100 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRedeemDialog(true)}
              className="gap-1"
              data-testid="button-redeem-points"
            >
              <Gift className="h-4 w-4" />
              Redeem
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Redeem Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Redeem Reward Points
            </DialogTitle>
            <DialogDescription>
              Convert points to discount: 100 points = $1.00
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Available Points Summary */}
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Available Points</span>
                <span className="font-bold text-lg">{availablePoints.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Maximum Redeemable</span>
                <span className="font-medium text-primary">
                  {maxRedeemablePoints.toLocaleString()} pts (${(maxRedeemablePoints / POINTS_PER_DOLLAR).toFixed(2)})
                </span>
              </div>
            </Card>

            {/* Quick Redeem Options */}
            {quickRedeemOptions.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Quick Redeem</label>
                <div className="grid grid-cols-3 gap-2">
                  {quickRedeemOptions.map((opt) => (
                    <Button
                      key={opt.points}
                      variant={pointsToRedeem === opt.points ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setPointsToRedeem(opt.points);
                        setCustomPoints(opt.points.toString());
                      }}
                      data-testid={`button-quick-redeem-${opt.points}`}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Slider Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Points to Redeem</label>
                <span className="text-sm text-muted-foreground">
                  ${discountValue.toFixed(2)} value
                </span>
              </div>
              <Slider
                value={[pointsToRedeem]}
                min={0}
                max={maxRedeemablePoints}
                step={100}
                onValueChange={handleSliderChange}
                className="mb-4"
                data-testid="slider-points"
              />
              <Input
                type="number"
                value={customPoints}
                onChange={(e) => handleCustomPointsChange(e.target.value)}
                placeholder="Enter custom amount"
                min={0}
                max={maxRedeemablePoints}
                step={100}
                data-testid="input-custom-points"
              />
            </div>

            {/* Preview */}
            {pointsToRedeem > 0 && (
              <Card className="p-4 bg-green-500/5 border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Discount Preview
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Points to use</span>
                    <span className="font-medium">{pointsToRedeem.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount amount</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      -${discountValue.toFixed(2)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining points</span>
                    <span className="font-medium">{(availablePoints - pointsToRedeem).toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRedeemDialog(false);
                setPointsToRedeem(0);
                setCustomPoints("");
              }}
              data-testid="button-cancel-redeem"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyPoints}
              disabled={pointsToRedeem < 100}
              className="gap-2"
              data-testid="button-apply-points"
            >
              <Gift className="h-4 w-4" />
              Apply {pointsToRedeem.toLocaleString()} Points
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
