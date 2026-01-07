import { Share2, Copy, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState } from "react";

interface ShareOrderProps {
  orderNumber: string;
  orderUrl?: string;
}

export const ShareOrder = ({ orderNumber, orderUrl }: ShareOrderProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const link = orderUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Order link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleEmailReceipt = () => {
    const subject = `Order Confirmation - ${orderNumber}`;
    const body = `View your order: ${orderUrl || window.location.href}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Order ${orderNumber}`,
          text: `Check out my order from Mango Bloom`,
          url: orderUrl || window.location.href,
        });
        toast.success("Shared successfully!");
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEmailReceipt}>
          <Mail className="h-4 w-4 mr-2" />
          Email Receipt
        </DropdownMenuItem>
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
