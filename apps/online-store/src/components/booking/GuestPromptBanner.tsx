import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const GuestPromptBanner = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (user || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-200/50">
      <div className="container max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0">
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-700 font-bold text-sm">👋</span>
              </div>
            </div>
            <p className="text-sm text-amber-900 min-w-0">
              <strong className="font-semibold">Welcome, Guest!</strong>
              <span className="ml-2 hidden sm:inline">Sign in to manage appointments and access your history</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => router.push('/login')}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Sign In
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-amber-200/50"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4 text-amber-700" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
