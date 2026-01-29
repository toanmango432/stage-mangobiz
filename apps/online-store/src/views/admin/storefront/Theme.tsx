import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/admin/ColorPicker";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { Save, RotateCcw, Palette, Type, Building2, Layout } from "lucide-react";

const Theme = () => {
  const { theme, updateTheme, resetTheme, isDraft, publishTheme } = useTheme();

  const handlePublish = () => {
    publishTheme();
    toast.success("Theme published successfully!");
  };

  const handleReset = () => {
    resetTheme();
    toast.info("Theme reset to default");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Theme & Brand</h1>
          <p className="text-muted-foreground">
            Customize your store's appearance and brand identity
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              Unsaved Changes
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            <Button onClick={handlePublish} disabled={!isDraft}>
              <Save className="h-4 w-4 mr-2" />
              Publish Theme
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Building2 className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="h-4 w-4 mr-2" />
            Layout
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Brand Colors</CardTitle>
                <CardDescription>Define your primary brand identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ColorPicker
                  label="Primary Color"
                  value={theme.colors.primary}
                  onChange={(value) => updateTheme({ colors: { ...theme.colors, primary: value } })}
                  description="Main brand color used for buttons and accents"
                />
                <ColorPicker
                  label="Secondary Color"
                  value={theme.colors.secondary}
                  onChange={(value) => updateTheme({ colors: { ...theme.colors, secondary: value } })}
                  description="Supporting color for backgrounds"
                />
                <ColorPicker
                  label="Accent Color"
                  value={theme.colors.accent}
                  onChange={(value) => updateTheme({ colors: { ...theme.colors, accent: value } })}
                  description="Highlight color for special elements"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Surface Colors</CardTitle>
                <CardDescription>Background and surface colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ColorPicker
                  label="Background"
                  value={theme.colors.background}
                  onChange={(value) => updateTheme({ colors: { ...theme.colors, background: value } })}
                />
                <ColorPicker
                  label="Card Background"
                  value={theme.colors.card}
                  onChange={(value) => updateTheme({ colors: { ...theme.colors, card: value } })}
                />
                <ColorPicker
                  label="Muted"
                  value={theme.colors.muted}
                  onChange={(value) => updateTheme({ colors: { ...theme.colors, muted: value } })}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography">
          <Card>
            <CardHeader>
              <CardTitle>Typography Settings</CardTitle>
              <CardDescription>Configure fonts and text sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select
                  value={theme.typography.fontFamily}
                  onValueChange={(value) =>
                    updateTheme({ typography: { ...theme.typography, fontFamily: value } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter, system-ui, sans-serif">Inter (Modern)</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia (Classic)</SelectItem>
                    <SelectItem value="Playfair Display, serif">Playfair Display (Elegant)</SelectItem>
                    <SelectItem value="Roboto, sans-serif">Roboto (Clean)</SelectItem>
                    <SelectItem value="Poppins, sans-serif">Poppins (Friendly)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>H1 Size</Label>
                  <Input
                    value={theme.typography.headingSizes.h1}
                    onChange={(e) =>
                      updateTheme({
                        typography: {
                          ...theme.typography,
                          headingSizes: { ...theme.typography.headingSizes, h1: e.target.value },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>H2 Size</Label>
                  <Input
                    value={theme.typography.headingSizes.h2}
                    onChange={(e) =>
                      updateTheme({
                        typography: {
                          ...theme.typography,
                          headingSizes: { ...theme.typography.headingSizes, h2: e.target.value },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body Size</Label>
                  <Input
                    value={theme.typography.bodySize}
                    onChange={(e) =>
                      updateTheme({ typography: { ...theme.typography, bodySize: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Line Height</Label>
                  <Input
                    value={theme.typography.lineHeight}
                    onChange={(e) =>
                      updateTheme({ typography: { ...theme.typography, lineHeight: e.target.value } })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
              <CardDescription>Your business details and contact info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={theme.branding.businessName}
                  onChange={(e) =>
                    updateTheme({ branding: { ...theme.branding, businessName: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input
                  value={theme.branding.tagline}
                  onChange={(e) =>
                    updateTheme({ branding: { ...theme.branding, tagline: e.target.value } })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={theme.branding.contactEmail}
                    onChange={(e) =>
                      updateTheme({ branding: { ...theme.branding, contactEmail: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={theme.branding.contactPhone}
                    onChange={(e) =>
                      updateTheme({ branding: { ...theme.branding, contactPhone: e.target.value } })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={theme.branding.address}
                  onChange={(e) =>
                    updateTheme({ branding: { ...theme.branding, address: e.target.value } })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle>Layout Settings</CardTitle>
              <CardDescription>Configure spacing and visual style</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <Select
                  value={theme.layout.borderRadius}
                  onValueChange={(value: "sharp" | "rounded" | "very-rounded") =>
                    updateTheme({ layout: { ...theme.layout, borderRadius: value } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sharp">Sharp (0px)</SelectItem>
                    <SelectItem value="rounded">Rounded (8px)</SelectItem>
                    <SelectItem value="very-rounded">Very Rounded (16px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Shadow Intensity</Label>
                <Select
                  value={theme.layout.shadowIntensity}
                  onValueChange={(value: "none" | "subtle" | "medium" | "strong") =>
                    updateTheme({ layout: { ...theme.layout, shadowIntensity: value } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="subtle">Subtle</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Container Width</Label>
                <Input
                  value={theme.layout.maxWidth}
                  onChange={(e) =>
                    updateTheme({ layout: { ...theme.layout, maxWidth: e.target.value } })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Theme;
