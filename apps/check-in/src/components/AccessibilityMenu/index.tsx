import { useCallback, useEffect, useRef } from 'react';
import { Accessibility, X, Type, Zap, Eye, RotateCcw } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';

interface AccessibilityMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilityMenu({ isOpen, onClose }: AccessibilityMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    largeTextMode,
    reducedMotionMode,
    highContrastMode,
    toggleLargeText,
    toggleReducedMotion,
    toggleHighContrast,
    resetSettings,
  } = useAccessibility();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      menuRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={menuRef}
        tabIndex={-1}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden focus:outline-none"
      >
        <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#e8f5f0] rounded-2xl flex items-center justify-center">
              <Accessibility className="w-6 h-6 text-[#1a5f4a]" aria-hidden="true" />
            </div>
            <h2 id="accessibility-title" className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1f2937]">
              Accessibility Options
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-xl bg-[#f3f4f6] hover:bg-[#e5e7eb] flex items-center justify-center transition-colors"
            aria-label="Close accessibility menu"
          >
            <X className="w-5 h-5 text-[#6b7280]" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <ToggleOption
            icon={<Type className="w-5 h-5" aria-hidden="true" />}
            title="Large Text"
            description="Increase text size for better readability"
            enabled={largeTextMode}
            onToggle={toggleLargeText}
            id="large-text-toggle"
          />

          <ToggleOption
            icon={<Zap className="w-5 h-5" aria-hidden="true" />}
            title="Reduce Motion"
            description="Minimize animations and transitions"
            enabled={reducedMotionMode}
            onToggle={toggleReducedMotion}
            id="reduced-motion-toggle"
          />

          <ToggleOption
            icon={<Eye className="w-5 h-5" aria-hidden="true" />}
            title="High Contrast"
            description="Increase color contrast for visibility"
            enabled={highContrastMode}
            onToggle={toggleHighContrast}
            id="high-contrast-toggle"
          />
        </div>

        <div className="p-6 border-t border-[#e5e7eb]">
          <button
            onClick={resetSettings}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#4b5563] font-['Plus_Jakarta_Sans'] font-semibold transition-colors min-h-[48px]"
            aria-label="Reset all accessibility settings to defaults"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToggleOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  id: string;
}

function ToggleOption({ icon, title, description, enabled, onToggle, id }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#faf9f7] rounded-2xl min-h-[76px]">
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            enabled ? 'bg-[#e8f5f0] text-[#1a5f4a]' : 'bg-[#f3f4f6] text-[#9ca3af]'
          }`}
        >
          {icon}
        </div>
        <div>
          <label htmlFor={id} className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] cursor-pointer block">
            {title}
          </label>
          <p className="font-['Work_Sans'] text-sm text-[#6b7280]">{description}</p>
        </div>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative w-14 h-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a5f4a] ${
          enabled ? 'bg-[#1a5f4a]' : 'bg-[#d1d5db]'
        }`}
        aria-label={`${title}: ${enabled ? 'On' : 'Off'}`}
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-0'
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export default AccessibilityMenu;
