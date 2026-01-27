import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MembershipPlan } from "@/types/catalog";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import {
  getMembershipPlanById,
  createMembershipPlan,
  updateMembershipPlan,
} from "@/lib/services/catalogSyncService";
import { useStoreContext } from "@/hooks/useStoreContext";

export default function MembershipForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { storeId, tenantId } = useStoreContext();
  const isNew = id === "new";

  const [formData, setFormData] = useState<Partial<MembershipPlan>>({
    name: "",
    displayName: "",
    priceMonthly: 0,
    description: "",
    tagline: "",
    color: "#6366F1",
    badgeIcon: "",
    perks: [],
    isPopular: false,
    isActive: true,
    sortOrder: 0,
  });

  // Comma-separated perks string for the input
  const [perksText, setPerksText] = useState("");
  const [isLoadingPlan, setIsLoadingPlan] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing membership plan when editing
  useEffect(() => {
    if (isNew) return;
    const loadPlan = async () => {
      try {
        const plan = await getMembershipPlanById(id!);
        if (plan) {
          setFormData(plan);
          setPerksText(plan.perks.join(", "));
        } else {
          toast.error("Membership plan not found");
          navigate("/admin/catalog/memberships");
        }
      } catch (error) {
        console.error("Failed to load membership plan:", error);
        toast.error("Failed to load membership plan");
      } finally {
        setIsLoadingPlan(false);
      }
    };
    loadPlan();
  }, [id, isNew, navigate]);

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Please enter a plan name");
      return;
    }
    if (!formData.displayName) {
      toast.error("Please enter a display name");
      return;
    }

    // Parse perks from comma-separated text
    const perks = perksText
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    setIsSaving(true);
    try {
      const payload = { ...formData, perks };
      if (isNew) {
        await createMembershipPlan(
          storeId,
          tenantId,
          payload as Omit<MembershipPlan, "id" | "createdAt" | "updatedAt">
        );
        toast.success("Membership plan created");
      } else {
        await updateMembershipPlan(id!, payload);
        toast.success("Membership plan updated");
      }
      navigate("/admin/catalog/memberships");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save membership plan";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingPlan) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading membership plan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/catalog/memberships")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isNew ? "New Membership Plan" : "Edit Membership Plan"}</h1>
          <p className="text-muted-foreground">Configure membership plan details</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential plan details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name (slug) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., premium"
                />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g., Premium Plan"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g., Best value for regulars"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the membership plan..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Monthly subscription price</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="priceMonthly">Price per Month ($) *</Label>
              <Input
                id="priceMonthly"
                type="number"
                min="0"
                step="0.01"
                value={formData.priceMonthly}
                onChange={(e) =>
                  setFormData({ ...formData, priceMonthly: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Color and badge settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color || "#6366F1"}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="badgeIcon">Badge Icon</Label>
                <Input
                  id="badgeIcon"
                  value={formData.badgeIcon}
                  onChange={(e) => setFormData({ ...formData, badgeIcon: e.target.value })}
                  placeholder="e.g., crown, star, gem"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Perks */}
        <Card>
          <CardHeader>
            <CardTitle>Perks</CardTitle>
            <CardDescription>Benefits included in this plan (comma-separated)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="perks">Perks</Label>
              <Textarea
                id="perks"
                value={perksText}
                onChange={(e) => setPerksText(e.target.value)}
                placeholder="e.g., 10% off all services, Priority booking, Free samples"
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Separate perks with commas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Visibility & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Visibility & Status</CardTitle>
            <CardDescription>Control plan display and popularity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">Make this plan available for purchase</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Most Popular</Label>
                <p className="text-sm text-muted-foreground">Highlight this plan as the most popular option</p>
              </div>
              <Switch
                checked={formData.isPopular}
                onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
              />
            </div>

            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Plan
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => navigate("/admin/catalog/memberships")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
