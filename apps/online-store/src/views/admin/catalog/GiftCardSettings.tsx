import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Save, Plus, X } from "lucide-react";
import { 
  getGiftCardConfig, 
  updateGiftCardConfig, 
  type GiftCardConfig 
} from "@/lib/storage/giftCardStorage";

export default function GiftCardSettings() {
  const [config, setConfig] = useState<GiftCardConfig | null>(null);
  const [presetAmounts, setPresetAmounts] = useState<number[]>([]);
  const [newAmount, setNewAmount] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  function loadConfig() {
    const giftCardConfig = getGiftCardConfig();
    if (giftCardConfig) {
      setConfig(giftCardConfig);
      setPresetAmounts(giftCardConfig.presetAmounts);
    }
  }

  function handleSave() {
    if (!config) return;

    updateGiftCardConfig({
      ...config,
      presetAmounts,
    });

    toast({
      title: "Success",
      description: "Gift card settings saved to localStorage",
    });
  }

  function handleAddAmount() {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setPresetAmounts([...presetAmounts, amount]);
    setNewAmount("");
  }

  function handleRemoveAmount(index: number) {
    setPresetAmounts(presetAmounts.filter((_, i) => i !== index));
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading gift card configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gift Card Settings</h1>
          <p className="text-muted-foreground">Configure gift card options stored in localStorage</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Enable or disable gift card purchases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled">Enable Gift Cards</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to purchase gift cards
                </p>
              </div>
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, enabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Preset Amounts */}
        <Card>
          <CardHeader>
            <CardTitle>Preset Amounts</CardTitle>
            <CardDescription>Quick select amounts for customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {presetAmounts.map((amount, index) => (
                <Badge key={index} variant="secondary" className="text-base py-2 px-4">
                  ${amount}
                  <button
                    onClick={() => handleRemoveAmount(index)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                min="1"
              />
              <Button onClick={handleAddAmount}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Custom Amount Range */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Amount Range</CardTitle>
            <CardDescription>Set minimum and maximum for custom amounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-amount">Minimum Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="min-amount"
                    type="number"
                    className="pl-6"
                    value={config.customAmountMin}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        customAmountMin: parseInt(e.target.value) || 10,
                      })
                    }
                    min="1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-amount">Maximum Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="max-amount"
                    type="number"
                    className="pl-6"
                    value={config.customAmountMax}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        customAmountMax: parseInt(e.target.value) || 500,
                      })
                    }
                    min="1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiration */}
        <Card>
          <CardHeader>
            <CardTitle>Expiration Settings</CardTitle>
            <CardDescription>Configure gift card expiration policy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expiry-months">Expiration Period (months)</Label>
              <Input
                id="expiry-months"
                type="number"
                value={config.expiryMonths || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    expiryMonths: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Leave empty for no expiration"
                min="1"
              />
              <p className="text-sm text-muted-foreground">
                {config.expiryMonths
                  ? `Gift cards will expire after ${config.expiryMonths} months`
                  : "Gift cards will never expire"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Message Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Message</CardTitle>
            <CardDescription>Allow customers to add personal messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow-message">Enable Personal Messages</Label>
                <p className="text-sm text-muted-foreground">
                  Let customers include a message with their gift card
                </p>
              </div>
              <Switch
                id="allow-message"
                checked={config.allowMessage}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, allowMessage: checked })
                }
              />
            </div>
            {config.allowMessage && (
              <div className="space-y-2">
                <Label htmlFor="max-length">Maximum Message Length</Label>
                <Input
                  id="max-length"
                  type="number"
                  value={config.maxMessageLength}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxMessageLength: parseInt(e.target.value) || 200,
                    })
                  }
                  min="50"
                  max="500"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
