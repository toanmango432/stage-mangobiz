import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Scissors, ShoppingBag, CreditCard, Gift } from "lucide-react";
import { useNavigate } from "@/lib/navigation";

const Catalog = () => {
  const navigate = useNavigate();
  
  const catalogSections = [
    {
      icon: Scissors,
      title: "Services",
      description: "Manage your salon services",
      count: 24,
      color: "text-primary",
      path: "/admin/catalog/services",
    },
    {
      icon: Package,
      title: "Packages",
      description: "Service bundles and prepaid options",
      count: 6,
      color: "text-accent",
      path: null,
    },
    {
      icon: ShoppingBag,
      title: "Products",
      description: "Retail items for sale",
      count: 42,
      color: "text-primary",
      path: "/admin/catalog/products",
    },
    {
      icon: CreditCard,
      title: "Memberships",
      description: "Subscription plans",
      count: 3,
      color: "text-accent",
      path: "/admin/catalog/memberships",
    },
    {
      icon: Gift,
      title: "Gift Cards",
      description: "Gift card configurations",
      count: 1,
      color: "text-primary",
      path: "/admin/catalog/giftcards",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Catalog</h1>
        <p className="text-muted-foreground">
          Manage services, products, memberships, and gift cards
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {catalogSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className={`h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center ${section.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-2xl font-bold text-muted-foreground">{section.count}</span>
                </div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-primary hover:bg-primary-dark"
                  onClick={() => section.path && navigate(section.path)}
                  disabled={!section.path}
                >
                  Manage
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Catalog;
