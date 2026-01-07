import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UserPlus, ShoppingBag } from "lucide-react";

interface GuestCheckoutPromptProps {
  onContinueAsGuest: () => void;
  onCreateAccount: (email: string, password: string) => void;
}

export const GuestCheckoutPrompt = ({ 
  onContinueAsGuest, 
  onCreateAccount 
}: GuestCheckoutPromptProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateAccount(email, password);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">Checkout Options</h3>
          <p className="text-muted-foreground">
            Create an account for faster checkout or continue as guest
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Account */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Create Account</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 mb-4">
              <li>• Save addresses and payment methods</li>
              <li>• Track orders easily</li>
              <li>• Faster checkout next time</li>
              <li>• Exclusive member offers</li>
            </ul>

            {showSignup ? (
              <form onSubmit={handleSignup} className="space-y-3">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create & Continue
                </Button>
              </form>
            ) : (
              <Button 
                onClick={() => setShowSignup(true)} 
                className="w-full"
              >
                Sign Up
              </Button>
            )}
          </div>

          <div className="relative">
            <Separator orientation="vertical" className="absolute left-1/2 top-0 h-full hidden md:block" />
          </div>

          {/* Guest Checkout */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Guest Checkout</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              You can create an account after placing your order. We'll send order updates to your email.
            </p>
            <Button 
              onClick={onContinueAsGuest} 
              variant="outline"
              className="w-full"
            >
              Continue as Guest
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
