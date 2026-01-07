import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface SectionSettings {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  visible: boolean;
  layout: {
    columns: 2 | 3 | 4;
    spacing: "compact" | "normal" | "spacious";
  };
  dataBinding?: {
    limit?: number;
    sortBy?: string;
  };
}

interface SectionConfigPanelProps {
  section: SectionSettings | null;
  open: boolean;
  onClose: () => void;
  onSave: (settings: SectionSettings) => void;
}

export const SectionConfigPanel = ({ section, open, onClose, onSave }: SectionConfigPanelProps) => {
  if (!section) return null;

  const handleSave = () => {
    onSave(section);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configure {section.type} Section</SheetTitle>
          <SheetDescription>
            Customize how this section appears and behaves
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="content" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={section.title}
                onChange={(e) => onSave({ ...section, title: e.target.value })}
                placeholder="Enter section title"
              />
            </div>

            <div className="space-y-2">
              <Label>Subtitle (optional)</Label>
              <Input
                value={section.subtitle || ""}
                onChange={(e) => onSave({ ...section, subtitle: e.target.value })}
                placeholder="Add a subtitle"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Visible</Label>
              <Switch
                checked={section.visible}
                onCheckedChange={(visible) => onSave({ ...section, visible })}
              />
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Grid Columns</Label>
              <Select
                value={section.layout.columns.toString()}
                onValueChange={(value) =>
                  onSave({
                    ...section,
                    layout: { ...section.layout, columns: parseInt(value) as 2 | 3 | 4 },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Spacing</Label>
              <Select
                value={section.layout.spacing}
                onValueChange={(spacing: "compact" | "normal" | "spacious") =>
                  onSave({ ...section, layout: { ...section.layout, spacing } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4 mt-4">
            {["Services", "Products", "Memberships"].includes(section.type) && (
              <>
                <div className="space-y-2">
                  <Label>Items to Display</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={section.dataBinding?.limit || 6}
                    onChange={(e) =>
                      onSave({
                        ...section,
                        dataBinding: {
                          ...section.dataBinding,
                          limit: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select
                    value={section.dataBinding?.sortBy || "featured"}
                    onValueChange={(sortBy) =>
                      onSave({
                        ...section,
                        dataBinding: { ...section.dataBinding, sortBy },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {!["Services", "Products", "Memberships"].includes(section.type) && (
              <p className="text-sm text-muted-foreground">
                No data binding options for this section type.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
