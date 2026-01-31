'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Plus, X, Loader2 } from "lucide-react";
import {
  getGiftCardConfig,
  updateGiftCardConfig,
} from "@/lib/services/catalogSyncService";
import type { GiftCardConfig } from "@/types/catalog";
import { useStoreContext } from "@/hooks/useStoreContext";

export default function GiftCardSettings() {
  const { storeId, tenantId } = useStoreContext();
  const [config, setConfig] = useState<GiftCardConfig | null>(null);
  const [presetAmounts, setPresetAmounts] = useState<number[]>([]);
  const [newAmount, setNewAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setIsLoading(true);
    setError(null);
    try {
      const giftCardConfig = await getGiftCardConfig(storeId);
      if (giftCardConfig) {
        setConfig(giftCardConfig);
        setPresetAmounts(giftCardConfig.presetAmounts);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load gift card settings';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!config) return;

    setIsSaving(true);
    try {
      const updatedConfig = await updateGiftCardConfig(storeId, tenantId, {
        ...config,
        presetAmounts,
      });
      setConfig(updatedConfig);
      toast.success('Gift card settings saved');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save gift card settings'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddAmount() {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setPresetAmounts([...presetAmounts, amount]);
    setNewAmount("");
  }

  function handleRemoveAmount(index: number) {
    setPresetAmounts(presetAmounts.filter((_, i) => i !== index));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gift Card Settings</h1>
            <p className="text-muted-foreground">Configure gift card options for your store</p>
          </div>
        </div>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={loadConfig}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No gift card configuration found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gift Card Settings</h1>
          <p className="text-muted-foreground">Configure gift card options for your store</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
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
                checked={(config.deliveryOptions?.messageCharLimit ?? 0) > 0}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    deliveryOptions: {
                      ...config.deliveryOptions,
                      messageCharLimit: checked ? 200 : 0,
                    },
                  })
                }
              />
            </div>
            {(config.deliveryOptions?.messageCharLimit ?? 0) > 0 && (
              <div className="space-y-2">
                <Label htmlFor="max-length">Maximum Message Length</Label>
                <Input
                  id="max-length"
                  type="number"
                  value={config.deliveryOptions?.messageCharLimit ?? 200}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      deliveryOptions: {
                        ...config.deliveryOptions,
                        messageCharLimit: parseInt(e.target.value) || 200,
                      },
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
