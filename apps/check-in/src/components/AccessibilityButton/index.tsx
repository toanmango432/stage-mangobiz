import { useState } from 'react';
import { Accessibility } from 'lucide-react';
import { AccessibilityMenu } from '../AccessibilityMenu';

export function AccessibilityButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsMenuOpen(true)}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 bg-white border-2 border-[#e5e7eb] rounded-full shadow-lg flex items-center justify-center hover:bg-[#faf9f7] hover:border-[#1a5f4a]/30 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a5f4a] active:scale-95"
        aria-label="Open accessibility options"
        aria-haspopup="dialog"
      >
        <Accessibility className="w-6 h-6 text-[#1a5f4a]" aria-hidden="true" />
      </button>
      <AccessibilityMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}

export default AccessibilityButton;
