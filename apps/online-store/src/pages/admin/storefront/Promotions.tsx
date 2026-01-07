import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useMarketingSettings, useUpdateMarketingSettings, useUpdatePromotionPlacement } from '@/hooks/useMarketingSettings';
import { usePromotions } from '@/hooks/usePromotions';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, ExternalLink, Tag, Clock, ShoppingCart, Home, Grid } from 'lucide-react';
import { CountdownTimer } from '@/components/promotions/CountdownTimer';
import { Link } from 'react-router-dom';

const Promotions = () => {
  const { data: settings, isLoading: settingsLoading } = useMarketingSettings();
  const { data: promotions, isLoading: promotionsLoading, refetch } = usePromotions({ status: 'active' });
  const updateSettings = useUpdateMarketingSettings();
  const updatePlacement = useUpdatePromotionPlacement();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast({ title: 'Promotions refreshed' });
  };

  const handleMasterToggle = (enabled: boolean) => {
    updateSettings.mutate(
      { enablePromotions: enabled },
      {
        onSuccess: () => toast({ title: enabled ? 'Promotions enabled' : 'Promotions disabled' }),
        onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
      }
    );
  };

  const handlePlacementToggle = (key: string, value: boolean) => {
    updateSettings.mutate(
      { defaults: { ...settings?.defaults, promotions: { ...settings?.defaults.promotions, [key]: value } } },
      {
        onSuccess: () => toast({ title: 'Settings updated' }),
        onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
      }
    );
  };

  const handlePromoPlacementToggle = (promotionId: string, placement: 'home_banner' | 'home_strip' | 'cart_hint', enabled: boolean) => {
    updatePlacement.mutate(
      { promotionId, update: { placement: enabled ? placement : 'hidden' as any } },
      {
        onSuccess: () => toast({ title: 'Promotion placement updated' }),
        onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
      }
    );
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Marketing Promotions</h1>
          <p className="text-muted-foreground">
            Connect offers from Mango and control display placement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Storefront
            </Link>
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Master Control */}
      <Card>
        <CardHeader>
          <CardTitle>Master Control</CardTitle>
          <CardDescription>Enable or disable all promotions globally</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-promotions" className="text-base">Show Promotions</Label>
            <Switch
              id="enable-promotions"
              checked={settings?.enablePromotions}
              onCheckedChange={handleMasterToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Default Placement Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Default Placement Settings</CardTitle>
          <CardDescription>Control where promotions appear by default</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="home-banner" className="text-base flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home Page Banner
              </Label>
              <p className="text-sm text-muted-foreground">Large banner at top of homepage</p>
            </div>
            <Switch
              id="home-banner"
              checked={settings?.defaults.promotions.homeBannerEnabled}
              onCheckedChange={(v) => handlePlacementToggle('homeBannerEnabled', v)}
              disabled={!settings?.enablePromotions}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="home-strip" className="text-base flex items-center gap-2">
                <Grid className="h-4 w-4" />
                Home Page Offers Strip
              </Label>
              <p className="text-sm text-muted-foreground">Horizontal scrollable offers section</p>
            </div>
            <Switch
              id="home-strip"
              checked={settings?.defaults.promotions.homeStripEnabled}
              onCheckedChange={(v) => handlePlacementToggle('homeStripEnabled', v)}
              disabled={!settings?.enablePromotions}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cart-hint" className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart Hints
              </Label>
              <p className="text-sm text-muted-foreground">Show applicable offers in cart</p>
            </div>
            <Switch
              id="cart-hint"
              checked={settings?.defaults.promotions.cartHintEnabled}
              onCheckedChange={(v) => handlePlacementToggle('cartHintEnabled', v)}
              disabled={!settings?.enablePromotions}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Promotions from Mango */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Offers from Mango</CardTitle>
              <CardDescription>
                {promotions?.length || 0} active promotions
              </CardDescription>
            </div>
            {promotions && promotions.length > 0 && (
              <Badge variant="secondary">{promotions.length} offers</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {promotionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !promotions || promotions.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active promotions in Mango</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create offers in your Mango dashboard
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {promotions.map((promo) => (
                <Card key={promo.id} className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold text-lg">{promo.title}</h3>
                          <p className="text-sm text-muted-foreground">{promo.description}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                            {promo.code && (
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Code: <span className="font-mono font-medium">{promo.code}</span>
                              </span>
                            )}
                            {promo.endDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <CountdownTimer endDate={promo.endDate} compact />
                              </span>
                            )}
                          </div>
                        </div>
                        {promo.badgeText && (
                          <Badge variant="secondary">{promo.badgeText}</Badge>
                        )}
                      </div>

                      <Separator />

                      {/* Placement Controls */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Display on:</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`${promo.id}-banner`}
                              checked={promo.displayConfig.showOnHomepage && settings?.defaults.promotions.homeBannerEnabled}
                              onCheckedChange={(v) => handlePromoPlacementToggle(promo.id, 'home_banner', v)}
                              disabled={!settings?.enablePromotions || !settings?.defaults.promotions.homeBannerEnabled}
                            />
                            <Label htmlFor={`${promo.id}-banner`} className="text-sm cursor-pointer">
                              Home Banner
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`${promo.id}-strip`}
                              checked={promo.displayConfig.showOnHomepage && settings?.defaults.promotions.homeStripEnabled}
                              onCheckedChange={(v) => handlePromoPlacementToggle(promo.id, 'home_strip', v)}
                              disabled={!settings?.enablePromotions || !settings?.defaults.promotions.homeStripEnabled}
                            />
                            <Label htmlFor={`${promo.id}-strip`} className="text-sm cursor-pointer">
                              Offers Strip
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`${promo.id}-cart`}
                              checked={promo.displayConfig.showOnCart && settings?.defaults.promotions.cartHintEnabled}
                              onCheckedChange={(v) => handlePromoPlacementToggle(promo.id, 'cart_hint', v)}
                              disabled={!settings?.enablePromotions || !settings?.defaults.promotions.cartHintEnabled}
                            />
                            <Label htmlFor={`${promo.id}-cart`} className="text-sm cursor-pointer">
                              Cart Hint
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Note:</strong> Promotions are managed in your Mango dashboard. Here you only control WHERE they appear on your storefront.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Promotions;
