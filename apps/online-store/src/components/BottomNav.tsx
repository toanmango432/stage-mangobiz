import { Home, Calendar, ShoppingBag, CreditCard, Gift, User, Info, Mail, Image, Star, HelpCircle, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export const BottomNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/book", icon: Calendar, label: "Book" },
    { path: "/shop", icon: ShoppingBag, label: "Shop" },
    { path: "/memberships", icon: CreditCard, label: "Members" },
    { path: "/gift-cards", icon: Gift, label: "Gifts" },
  ];

  const infoItems = [
    { path: "/info/about", label: "About", icon: Home },
    { path: "/info/contact", label: "Contact", icon: Mail },
    { path: "/info/gallery", label: "Gallery", icon: Image },
    { path: "/info/reviews", label: "Reviews", icon: Star },
    { path: "/info/faq", label: "FAQ", icon: HelpCircle },
    { path: "/info/policies", label: "Policies", icon: FileText },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-elevated">
      <div className="grid grid-cols-6 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Info Sheet for Mobile */}
        <Sheet>
          <SheetTrigger className="flex flex-col items-center justify-center gap-1 transition-colors text-muted-foreground hover:text-foreground">
            <Info className="h-5 w-5" />
            <span className="text-[10px] font-medium">Info</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]">
            <div className="py-4">
              <h3 className="text-lg font-semibold mb-4">Information</h3>
              <ScrollArea className="h-[calc(60vh-80px)]">
                <div className="space-y-2">
                  {infoItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-accent transition-colors"
                      >
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
