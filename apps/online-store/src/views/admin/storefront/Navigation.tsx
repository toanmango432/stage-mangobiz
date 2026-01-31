'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GripVertical, Plus, Trash2, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  id: string;
  label: string;
  path: string;
  external: boolean;
}

const Navigation = () => {
  const [headerNav, setHeaderNav] = useState<NavItem[]>([
    { id: "1", label: "Home", path: "/", external: false },
    { id: "2", label: "Book", path: "/book", external: false },
    { id: "3", label: "Shop", path: "/shop", external: false },
    { id: "4", label: "Memberships", path: "/memberships", external: false },
    { id: "5", label: "Gift Cards", path: "/gift-cards", external: false },
  ]);

  const [showCart, setShowCart] = useState(true);
  const [showSearch, setShowSearch] = useState(true);
  const [showAccount, setShowAccount] = useState(true);
  const [bottomNavEnabled, setBottomNavEnabled] = useState(true);

  const handleAddItem = () => {
    const newItem: NavItem = {
      id: Date.now().toString(),
      label: "New Link",
      path: "/",
      external: false,
    };
    setHeaderNav([...headerNav, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setHeaderNav(headerNav.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    toast.success("Navigation settings saved!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Navigation & Menus</h1>
          <p className="text-muted-foreground">
            Configure your site navigation and menu structure
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="header" className="space-y-6">
        <TabsList>
          <TabsTrigger value="header">Header Menu</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="mobile">Mobile Bottom Nav</TabsTrigger>
        </TabsList>

        {/* Header Navigation */}
        <TabsContent value="header" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>Drag to reorder menu items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {headerNav.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-4 border rounded-lg group">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input
                      value={item.label}
                      onChange={(e) =>
                        setHeaderNav(
                          headerNav.map((i) =>
                            i.id === item.id ? { ...i, label: e.target.value } : i
                          )
                        )
                      }
                      placeholder="Label"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={item.path}
                        onChange={(e) =>
                          setHeaderNav(
                            headerNav.map((i) =>
                              i.id === item.id ? { ...i, path: e.target.value } : i
                            )
                          )
                        }
                        placeholder="Path"
                        className="flex-1"
                      />
                      {item.external && <ExternalLink className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={handleAddItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Header Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Cart Icon</Label>
                  <p className="text-sm text-muted-foreground">Display shopping cart in header</p>
                </div>
                <Switch checked={showCart} onCheckedChange={setShowCart} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Search</Label>
                  <p className="text-sm text-muted-foreground">Display search bar in header</p>
                </div>
                <Switch checked={showSearch} onCheckedChange={setShowSearch} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Account Icon</Label>
                  <p className="text-sm text-muted-foreground">Display user account link</p>
                </div>
                <Switch checked={showAccount} onCheckedChange={setShowAccount} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer */}
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle>Footer Configuration</CardTitle>
              <CardDescription>Coming soon - footer customization options</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Footer editor with multi-column layout, quick links, and social media integration
                will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mobile Bottom Nav */}
        <TabsContent value="mobile">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Bottom Navigation</CardTitle>
              <CardDescription>Configure the mobile navigation bar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Bottom Nav</Label>
                  <p className="text-sm text-muted-foreground">Show navigation bar on mobile</p>
                </div>
                <Switch checked={bottomNavEnabled} onCheckedChange={setBottomNavEnabled} />
              </div>
              {bottomNavEnabled && (
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Bottom navigation automatically displays Home, Book, Shop, and Account links on
                    mobile devices.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Navigation;
