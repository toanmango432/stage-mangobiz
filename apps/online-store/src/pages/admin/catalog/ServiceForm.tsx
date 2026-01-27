import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Service } from "@/types/catalog";
import { QuestionBuilder } from "@/components/admin/catalog/QuestionBuilder";
import { AddOnBuilder } from "@/components/admin/catalog/AddOnBuilder";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus } from "lucide-react";

const durationOptions = [15, 30, 45, 60, 90, 120];
const categories = [
  "Classic Manicure",
  "Gel & Shellac",
  "Specialty Manicure",
  "Classic Pedicure",
  "Spa Pedicure",
  "Nail Enhancement",
  "Nail Art",
  "Specialty Service"
];

export default function ServiceForm() {
  const params = useParams();
  const id = params.id as string | undefined;
  const navigate = useNavigate();
  const isNew = id === "new";

  const [formData, setFormData] = useState<Partial<Service>>({
    name: "",
    category: "Classic Manicure",
    description: "",
    duration: 60,
    basePrice: 0,
    showOnline: true,
    addOns: [],
    questions: [],
    tags: [],
    requiresDeposit: false,
    bufferTimeBefore: 0,
    bufferTimeAfter: 15,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      const stored = localStorage.getItem("catalog_services");
      if (stored) {
        const services: Service[] = JSON.parse(stored);
        const service = services.find((s) => s.id === id);
        if (service) setFormData(service);
      }
    }
  }, [id, isNew]);

  const handleSave = async () => {
    if (!formData.name || !formData.basePrice) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

    const stored = localStorage.getItem("catalog_services");
    const services: Service[] = stored ? JSON.parse(stored) : [];

    const serviceData: Service = {
      ...formData,
      id: isNew ? Date.now().toString() : id!,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Service;

    const updatedServices = isNew
      ? [...services, serviceData]
      : services.map((s) => (s.id === id ? serviceData : s));

    localStorage.setItem("catalog_services", JSON.stringify(updatedServices));
    setIsSaving(false);
    toast.success(isNew ? "Service created" : "Service updated");
    navigate("/admin/catalog/services");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/catalog/services")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isNew ? "New Service" : "Edit Service"}</h1>
          <p className="text-muted-foreground">Configure service details</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential service details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Classic Manicure"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the service..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Duration</CardTitle>
            <CardDescription>Set pricing and time requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePrice">Base Price ($) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Select
                  value={formData.duration?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((duration) => (
                      <SelectItem key={duration} value={duration.toString()}>
                        {duration} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Online Booking</CardTitle>
            <CardDescription>Configure online visibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Online</Label>
                <p className="text-sm text-muted-foreground">Make this service bookable online</p>
              </div>
              <Switch
                checked={formData.showOnline}
                onCheckedChange={(checked) => setFormData({ ...formData, showOnline: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Requires Deposit</Label>
                <p className="text-sm text-muted-foreground">Require deposit for booking</p>
              </div>
              <Switch
                checked={formData.requiresDeposit}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresDeposit: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Options</CardTitle>
            <CardDescription>Configure service-specific questions and add-ons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-2 block">Service Questions</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Ask customers questions during booking (e.g., "Do you need gel removal?")
              </p>
              {formData.questions && formData.questions.length > 0 ? (
                formData.questions.map((question, index) => (
                  <QuestionBuilder
                    key={question.id}
                    question={question}
                    onUpdate={(updated) => {
                      const newQuestions = [...(formData.questions || [])];
                      newQuestions[index] = updated;
                      setFormData({ ...formData, questions: newQuestions });
                    }}
                    onRemove={() => {
                      setFormData({
                        ...formData,
                        questions: formData.questions?.filter((_, i) => i !== index),
                      });
                    }}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic mb-4">No questions added yet</p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newQuestion = {
                    id: `q-${Date.now()}`,
                    question: '',
                    type: 'yes_no' as const,
                    required: false,
                    options: [
                      { label: 'Yes', value: 'yes', priceModifier: 0 },
                      { label: 'No', value: 'no', priceModifier: 0 },
                    ],
                  };
                  setFormData({
                    ...formData,
                    questions: [...(formData.questions || []), newQuestion],
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-semibold mb-2 block">Available Add-ons</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Optional enhancements customers can select (e.g., "Paraffin Treatment +$15")
              </p>
              {formData.addOns && formData.addOns.length > 0 ? (
                formData.addOns.map((addon, index) => (
                  <AddOnBuilder
                    key={addon.id}
                    addon={addon}
                    onUpdate={(updated) => {
                      const newAddOns = [...(formData.addOns || [])];
                      newAddOns[index] = updated;
                      setFormData({ ...formData, addOns: newAddOns });
                    }}
                    onRemove={() => {
                      setFormData({
                        ...formData,
                        addOns: formData.addOns?.filter((_, i) => i !== index),
                      });
                    }}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic mb-2">No add-ons added yet</p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newAddOn = {
                    id: `addon-${Date.now()}`,
                    name: '',
                    price: 0,
                  };
                  setFormData({
                    ...formData,
                    addOns: [...(formData.addOns || []), newAddOn],
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Add-on
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Service"}
        </Button>
        <Button variant="outline" onClick={() => navigate("/admin/catalog/services")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
