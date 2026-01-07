import { Link } from "react-router-dom";
import { ShoppingBag, Search, User, LogOut, Shield, ChevronDown, Home, Mail, Image, Star, HelpCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { MiniCartDrawer } from "@/components/cart/MiniCartDrawer";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export const Header = () => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-soft">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Mango
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/book" className="text-sm font-medium hover:text-primary transition-colors">
            Book
          </Link>
          <Link to="/shop" className="text-sm font-medium hover:text-primary transition-colors">
            Shop
          </Link>
          <Link to="/memberships" className="text-sm font-medium hover:text-primary transition-colors">
            Memberships
          </Link>
          <Link to="/gift-cards" className="text-sm font-medium hover:text-primary transition-colors">
            Gift Cards
          </Link>
          
          {/* Info Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger 
              className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
              aria-label="Information menu"
              aria-haspopup="true"
            >
              Info
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 bg-card border-border shadow-elevated z-50">
              <DropdownMenuItem asChild>
                <Link to="/info/about" className="cursor-pointer flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  About
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/info/contact" className="cursor-pointer flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Contact
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/info/gallery" className="cursor-pointer flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  Gallery
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/info/reviews" className="cursor-pointer flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  Reviews
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/info/faq" className="cursor-pointer flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  FAQ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/info/policies" className="cursor-pointer flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Policies
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button>
          
          {/* Notifications */}
          {user && <NotificationBell />}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account" className="cursor-pointer">
                    My Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account?tab=bookings" className="cursor-pointer">
                    My Bookings
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Portal
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
          
          <MiniCartDrawer />
        </div>
      </div>
    </header>
  );
};
