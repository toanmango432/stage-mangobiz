import { ArrowLeft, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GiftCardsPageProps {
  onBack: () => void;
}

export default function GiftCardsPage({ onBack }: GiftCardsPageProps) {
  return (
    <div className="flex flex-col h-full bg-[#faf9f7]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">Gift Cards</h1>
      </div>

      {/* Content - Placeholder */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 rounded-full bg-mango-primary/10 flex items-center justify-center mb-4">
          <Gift className="w-10 h-10 text-mango-primary" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Gift Card Management</h2>
        <p className="text-gray-500 text-center max-w-md">
          View and manage all issued gift cards, check balances, reload cards, and view transaction history.
        </p>
        <p className="text-sm text-gray-400 mt-4">Coming soon...</p>
      </div>
    </div>
  );
}
