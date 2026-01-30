import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Mango Nail Salon</h3>
            <p className="text-sm text-muted-foreground">
              Premium nail care and beauty services
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><Link href="/shop" className="text-muted-foreground hover:text-foreground">Shop</Link></li>
              <li><Link href="/book" className="text-muted-foreground hover:text-foreground">Book</Link></li>
              <li><Link href="/memberships" className="text-muted-foreground hover:text-foreground">Memberships</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Info</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/info/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
              <li><Link href="/info/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              <li><Link href="/info/gallery" className="text-muted-foreground hover:text-foreground">Gallery</Link></li>
              <li><Link href="/info/reviews" className="text-muted-foreground hover:text-foreground">Reviews</Link></li>
              <li><Link href="/info/faq" className="text-muted-foreground hover:text-foreground">FAQ</Link></li>
              <li><Link href="/info/policies" className="text-muted-foreground hover:text-foreground">Policies</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Mango Nail Salon. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
