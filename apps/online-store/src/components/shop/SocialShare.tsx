import { Facebook, Twitter, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SocialShareProps {
  productName: string;
  productUrl?: string;
}

export const SocialShare = ({ productName, productUrl }: SocialShareProps) => {
  const url = productUrl || window.location.href;
  const text = `Check out ${productName} at Mango Salon!`;

  const handleShare = (platform: 'facebook' | 'twitter' | 'copy') => {
    switch (platform) {
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
        break;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Share:</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleShare('facebook')}
        aria-label="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleShare('twitter')}
        aria-label="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleShare('copy')}
        aria-label="Copy link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
