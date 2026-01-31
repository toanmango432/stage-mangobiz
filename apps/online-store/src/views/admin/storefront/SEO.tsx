'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe, Share2, FileText, Settings, Save } from "lucide-react";

export default function SEO() {
  const [seoSettings, setSeoSettings] = useState({
    homePage: {
      title: "Mango Nail Salon - Premium Nail Care & Beauty Services",
      description: "Experience luxury nail care at Mango Nail Salon. Professional manicures, pedicures, and beauty treatments in a relaxing atmosphere.",
      keywords: "nail salon, manicure, pedicure, beauty, spa",
      ogImage: "/hero-salon.jpg"
    },
    shopPage: {
      title: "Shop Premium Nail Care Products | Mango Nail Salon",
      description: "Browse our curated selection of professional nail care products, polishes, and beauty essentials.",
      keywords: "nail products, nail polish, beauty products",
      ogImage: "/products-hero.jpg"
    },
    bookingPage: {
      title: "Book Your Appointment | Mango Nail Salon",
      description: "Schedule your next nail appointment online. Easy booking, flexible times, and expert nail technicians.",
      keywords: "book appointment, nail booking, schedule",
      ogImage: "/hero-salon.jpg"
    },
    general: {
      siteName: "Mango Nail Salon",
      siteUrl: "https://mangonailsalon.com",
      twitterHandle: "@mangonailsalon",
      googleAnalyticsId: "",
      favicon: "/favicon.ico"
    }
  });

  const handleSave = () => {
    toast.success("SEO settings saved successfully!");
  };

  const renderPreview = (page: string) => {
    const pageData = seoSettings[page as keyof typeof seoSettings] as any;
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Search Engine Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-green-600 mt-1" />
              <div>
                <div className="text-sm text-green-700">{seoSettings.general.siteUrl}</div>
                <div className="text-lg text-blue-600 hover:underline cursor-pointer">
                  {pageData.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {pageData.description}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">SEO Settings</h1>
        <p className="text-muted-foreground">
          Optimize your site for search engines and social media
        </p>
      </div>

      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pages">
            <FileText className="h-4 w-4 mr-2" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-2" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Home Page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="home-title">Page Title</Label>
                <Input
                  id="home-title"
                  value={seoSettings.homePage.title}
                  onChange={(e) => setSeoSettings({
                    ...seoSettings,
                    homePage: { ...seoSettings.homePage, title: e.target.value }
                  })}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {seoSettings.homePage.title.length}/60 characters
                </p>
              </div>
              <div>
                <Label htmlFor="home-description">Meta Description</Label>
                <Textarea
                  id="home-description"
                  value={seoSettings.homePage.description}
                  onChange={(e) => setSeoSettings({
                    ...seoSettings,
                    homePage: { ...seoSettings.homePage, description: e.target.value }
                  })}
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {seoSettings.homePage.description.length}/160 characters
                </p>
              </div>
              <div>
                <Label htmlFor="home-keywords">Keywords</Label>
                <Input
                  id="home-keywords"
                  value={seoSettings.homePage.keywords}
                  onChange={(e) => setSeoSettings({
                    ...seoSettings,
                    homePage: { ...seoSettings.homePage, keywords: e.target.value }
                  })}
                  placeholder="comma, separated, keywords"
                />
              </div>
              {renderPreview('homePage')}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shop Page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shop-title">Page Title</Label>
                <Input
                  id="shop-title"
                  value={seoSettings.shopPage.title}
                  onChange={(e) => setSeoSettings({
                    ...seoSettings,
                    shopPage: { ...seoSettings.shopPage, title: e.target.value }
                  })}
                  maxLength={60}
                />
              </div>
              <div>
                <Label htmlFor="shop-description">Meta Description</Label>
                <Textarea
                  id="shop-description"
                  value={seoSettings.shopPage.description}
                  onChange={(e) => setSeoSettings({
                    ...seoSettings,
                    shopPage: { ...seoSettings.shopPage, description: e.target.value }
                  })}
                  maxLength={160}
                  rows={3}
                />
              </div>
              {renderPreview('shopPage')}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="booking-title">Page Title</Label>
                <Input
                  id="booking-title"
                  value={seoSettings.bookingPage.title}
                  onChange={(e) => setSeoSettings({
                    ...seoSettings,
                    bookingPage: { ...seoSettings.bookingPage, title: e.target.value }
                  })}
                  maxLength={60}
                />
              </div>
              <div>
                <Label htmlFor="booking-description">Meta Description</Label>
                <Textarea
                  id="booking-description"
                  value={seoSettings.bookingPage.description}
                  onChange={(e) => setSeoSettings({
                    ...seoSettings,
                    bookingPage: { ...seoSettings.bookingPage, description: e.target.value }
                  })}
                  maxLength={160}
                  rows={3}
                />
              </div>
              {renderPreview('bookingPage')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <img 
                  src={seoSettings.homePage.ogImage} 
                  alt="Open Graph preview"
                  className="w-full h-48 object-cover rounded mb-3"
                />
                <h3 className="font-bold">{seoSettings.homePage.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {seoSettings.homePage.description}
                </p>
                <div className="text-xs text-muted-foreground mt-2">
                  {seoSettings.general.siteUrl}
                </div>
              </div>
              <div>
                <Label>Twitter Card</Label>
                <Badge>Summary Card with Large Image</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  value={seoSettings.general.siteName}
                  onChange={(e) => setSeoSettings({
                    ...seoSettings,
                    general: { ...seoSettings.general, siteName: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="site-url">Site URL</Label>
                <Input
                  id="site-url"
                  value={seoSettings.general.siteUrl}
                  onChange={(e) => setSeoSettings({
                    ...seoSettings,
                    general: { ...seoSettings.general, siteUrl: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="twitter">Twitter Handle</Label>
                <Input
                  id="twitter"
                  value={seoSettings.general.twitterHandle}
                  onChange={(e) => setSeoSettings({
                    ...seoSettings,
                    general: { ...seoSettings.general, twitterHandle: e.target.value }
                  })}
                  placeholder="@yourbrand"
                />
              </div>
              <div>
                <Label htmlFor="ga-id">Google Analytics ID</Label>
                <Input
                  id="ga-id"
                  value={seoSettings.general.googleAnalyticsId}
                  onChange={(e) => setSeoSettings({
                    ...seoSettings,
                    general: { ...seoSettings.general, googleAnalyticsId: e.target.value }
                  })}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
