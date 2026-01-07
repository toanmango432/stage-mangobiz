import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Palette, Layout, Image, Globe, Settings, Tag, Megaphone } from "lucide-react";

const Storefront = () => {
  const sections = [
    {
      icon: Palette,
      title: "Theme & Brand",
      description: "Customize colors, typography, and logo",
      path: "/admin/storefront/theme",
      status: "configured",
    },
    {
      icon: Layout,
      title: "Templates & Layout",
      description: "Build and customize page templates",
      path: "/admin/storefront/templates",
      status: "draft",
      badge: "Has unpublished changes",
    },
    {
      icon: Tag,
      title: "Marketing Promotions",
      description: "Connect offers from Mango and control display",
      path: "/admin/storefront/promotions",
      status: "ready",
    },
    {
      icon: Megaphone,
      title: "Announcements",
      description: "Create and manage store announcements",
      path: "/admin/storefront/announcements",
      status: "ready",
    },
    {
      icon: Image,
      title: "Media Library",
      description: "Manage images and assets",
      path: "/admin/storefront/media",
      status: "ready",
    },
    {
      icon: Globe,
      title: "SEO & Domains",
      description: "Optimize for search and manage domains",
      path: "/admin/storefront/seo",
      status: "ready",
    },
    {
      icon: Settings,
      title: "Navigation & Menus",
      description: "Configure header and footer navigation",
      path: "/admin/storefront/navigation",
      status: "configured",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Storefront</h1>
        <p className="text-muted-foreground">
          Customize your online store's appearance and layout
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.path} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  {section.badge && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent/10 text-accent">
                      {section.badge}
                    </span>
                  )}
                </div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-primary hover:bg-primary-dark">
                  <Link to={section.path}>Configure</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Storefront;
