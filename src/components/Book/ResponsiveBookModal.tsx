import React, { ReactNode, useState } from 'react';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useBreakpoint } from '../../hooks/useMobileModal';
import { ModalContainer } from '../common/ModalContainer';

interface Panel {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
  width?: string;
}

interface ResponsiveBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  panels: Panel[];
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl' | 'full';
  defaultPanel?: string;
  className?: string;
}

/**
 * Responsive modal wrapper for Book module
 * Handles multi-panel layouts with mobile tab navigation
 */
export function ResponsiveBookModal({
  isOpen,
  onClose,
  title,
  subtitle,
  panels,
  footer,
  size = 'xl',
  defaultPanel,
  className,
}: ResponsiveBookModalProps) {
  const { isMobile, isTablet } = useBreakpoint();
  const [activePanel, setActivePanel] = useState(defaultPanel || panels[0]?.id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMobileOrTablet = isMobile || isTablet;
  const currentPanel = panels.find(p => p.id === activePanel);
  const currentPanelIndex = panels.findIndex(p => p.id === activePanel);

  // Mobile navigation helpers
  const goToPrevPanel = () => {
    const prevIndex = currentPanelIndex > 0 ? currentPanelIndex - 1 : panels.length - 1;
    setActivePanel(panels[prevIndex].id);
  };

  const goToNextPanel = () => {
    const nextIndex = currentPanelIndex < panels.length - 1 ? currentPanelIndex + 1 : 0;
    setActivePanel(panels[nextIndex].id);
  };

  if (!isOpen) return null;

  // Mobile/Tablet layout - Tab navigation
  if (isMobileOrTablet) {
    return (
      <ModalContainer
        isOpen={isOpen}
        onClose={onClose}
        size={size}
        className={cn('flex flex-col h-[90vh]', className)}
        noPadding
      >
        {/* Mobile Header - Premium glass */}
        <div className="flex flex-col border-b border-gray-200/50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn-icon lg:hidden"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-icon"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          {!mobileMenuOpen && (
            <div className="flex items-center justify-between px-4 pb-3">
              <button
                onClick={goToPrevPanel}
                className="btn-icon"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  {currentPanel?.icon}
                  <span className="text-sm font-medium text-gray-900">
                    {currentPanel?.title}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({currentPanelIndex + 1}/{panels.length})
                  </span>
                </div>
              </div>

              <button
                onClick={goToNextPanel}
                className="btn-icon"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="px-4 pb-3 space-y-1">
              {panels.map((panel, index) => (
                <button
                  key={panel.id}
                  onClick={() => {
                    setActivePanel(panel.id);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                    activePanel === panel.id
                      ? 'bg-teal-50 text-teal-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  )}
                >
                  <span className="flex-shrink-0">{panel.icon}</span>
                  <span className="flex-1 text-sm font-medium">{panel.title}</span>
                  <span className="text-xs text-gray-500">
                    {index + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4">
            {currentPanel?.content}
          </div>
        </div>

        {/* Mobile Footer - Premium glass */}
        {footer && (
          <div className="border-t border-gray-200/50 bg-white/50 backdrop-blur-sm px-4 py-3">
            {footer}
          </div>
        )}
      </ModalContainer>
    );
  }

  // Desktop layout - Side-by-side panels
  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size={size}
      className={className}
      noPadding
    >
      <div className="flex h-[70vh]">
        {panels.map((panel, index) => (
          <div
            key={panel.id}
            className={cn(
              'flex flex-col',
              panel.width || 'flex-1',
              index > 0 && 'border-l border-gray-200'
            )}
          >
            {/* Panel Header - Premium */}
            <div className="px-6 py-3 border-b border-gray-200/50 bg-surface-secondary">
              <div className="flex items-center gap-2">
                {panel.icon}
                <h3 className="font-semibold text-gray-900">{panel.title}</h3>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {panel.content}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Footer - Premium glass */}
      {footer && (
        <div className="border-t border-gray-200/50 bg-white/50 backdrop-blur-sm px-6 py-4 flex justify-end">
          {footer}
        </div>
      )}
    </ModalContainer>
  );
}

/**
 * Mobile-optimized action button
 * Expands to full width on mobile
 */
export function MobileActionButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}) {
  const { isMobile } = useBreakpoint();

  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-gray-300',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'flex items-center justify-center gap-2',
        isMobile && 'w-full',
        variants[variant],
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

/**
 * Responsive grid layout for forms
 * Stacks on mobile, grid on desktop
 */
export function ResponsiveFormGrid({
  children,
  columns = 2,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const columnClasses = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  };

  return (
    <div className={cn(
      'grid grid-cols-1 gap-4',
      columnClasses[columns],
      className
    )}>
      {children}
    </div>
  );
}