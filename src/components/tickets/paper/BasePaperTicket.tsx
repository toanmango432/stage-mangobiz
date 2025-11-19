import React, { CSSProperties, ReactNode, useMemo } from 'react';
import {
  paperColors,
  paperShadows,
  paperGradients,
  paperAnimations,
  stateBorderStyles,
  getViewModeStyles,
  getHoverStyles,
  paperKeyframes,
} from './PaperTicketStyles';

export type TicketState = 'waiting' | 'inService' | 'pending' | 'completed' | 'cancelled';
export type ViewMode = 'compact' | 'normal' | 'gridNormal' | 'gridCompact';

interface BasePaperTicketProps {
  children: ReactNode;
  state: TicketState;
  viewMode: ViewMode;
  ticketNumber?: string | number;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  showPerforations?: boolean;
  showNotches?: boolean;
  showNumberBadge?: boolean;
  showTexture?: boolean;
  showEdgeShadow?: boolean;
  style?: CSSProperties;
}

export const BasePaperTicket: React.FC<BasePaperTicketProps> = ({
  children,
  state,
  viewMode,
  ticketNumber,
  onClick,
  onKeyDown,
  className = '',
  showPerforations = true,
  showNotches = true,
  showNumberBadge = true,
  showTexture = true,
  showEdgeShadow = true,
  style = {},
}) => {
  // Get view mode specific styles
  const viewStyles = useMemo(() => getViewModeStyles(viewMode), [viewMode]);
  const hoverStyles = useMemo(() => getHoverStyles(viewMode), [viewMode]);

  // Get state-based border styles
  const borderStyles = useMemo(() => stateBorderStyles[state], [state]);

  // Combine base paper style with state border
  const paperStyle: CSSProperties = useMemo(() => ({
    background: paperGradients.background,
    boxShadow: `${viewStyles.shadow}, ${borderStyles.boxShadow || ''}`.trim(),
    border: borderStyles.border,
    borderRadius: viewStyles.borderRadius,
    padding: viewStyles.padding,
    animation: borderStyles.animation,
    opacity: borderStyles.opacity || 1,
    ...style,
  }), [viewStyles, borderStyles, style]);

  // Perforation dots
  const renderPerforations = () => {
    if (!showPerforations) return null;

    const config = viewStyles.perforation;
    return (
      <div
        className="absolute top-0 left-0 w-full flex justify-between items-center px-3 z-10"
        style={{
          height: `${parseInt(config.size) * 2}px`,
          opacity: config.opacity
        }}
      >
        {[...Array(config.count)].map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: config.size,
              height: config.size,
              backgroundColor: paperColors.perforation,
            }}
          />
        ))}
      </div>
    );
  };

  // Notch effects
  const renderNotches = () => {
    if (!showNotches) return null;

    const config = viewStyles.notch;
    const notchStyle: CSSProperties = {
      width: config.size,
      height: config.size,
      borderRadius: '50%',
      boxShadow: config.shadow,
    };

    return (
      <>
        {/* Left notch */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            left: `-${config.position}`,
            ...notchStyle,
            background: paperGradients.notchLeft,
            borderRight: `1px solid ${paperColors.borderDusty}50`,
          }}
        />
        {/* Right notch */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            right: `-${config.position}`,
            ...notchStyle,
            background: paperGradients.notchRight,
            borderLeft: `1px solid ${paperColors.borderDusty}50`,
          }}
        />
      </>
    );
  };

  // Wrap-around ticket number badge
  const renderNumberBadge = () => {
    if (!showNumberBadge || !ticketNumber) return null;

    const isCompact = viewMode === 'compact' || viewMode === 'gridCompact';
    const fontSize = isCompact ? '12px' : viewMode === 'gridNormal' ? '18px' : '14px';
    const badgeWidth = isCompact ? '32px' : viewMode === 'gridNormal' ? '48px' : '36px';
    const badgeHeight = isCompact ? '28px' : viewMode === 'gridNormal' ? '36px' : '32px';

    return (
      <>
        <div
          className="absolute left-0 flex items-center justify-center font-black z-20"
          style={{
            top: '10px',
            width: badgeWidth,
            height: badgeHeight,
            color: paperColors.primaryText,
            fontSize: fontSize,
            background: paperGradients.wrapBadge,
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
            borderTop: `1.5px solid ${paperColors.borderDusty}80`,
            borderRight: `1.5px solid ${paperColors.borderDusty}80`,
            borderBottom: `1.5px solid ${paperColors.borderDusty}80`,
            boxShadow: paperShadows.wrapBadge,
            letterSpacing: '-0.02em',
            transform: 'translateX(-3px)',
          }}
        >
          {ticketNumber}
        </div>
        {/* Vertical accent line */}
        <div
          className="absolute"
          style={{
            left: badgeWidth,
            top: '10px',
            width: '1px',
            height: badgeHeight,
            background: 'linear-gradient(to bottom, rgba(212, 184, 150, 0.6), rgba(212, 184, 150, 0.2))',
            transform: 'translateX(-3px)',
          }}
        />
      </>
    );
  };

  // Paper texture overlays
  const renderTexture = () => {
    if (!showTexture) return null;

    const isGrid = viewMode.includes('grid');
    const textureSize = isGrid ? '200px' : viewMode === 'normal' ? '180px' : '150px';
    const textureOpacity = isGrid ? 0.25 : viewMode === 'normal' ? 0.25 : 0.2;

    return (
      <>
        {/* Paper fiber texture */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
            backgroundSize: `${textureSize} ${textureSize}`,
            opacity: textureOpacity,
            borderRadius: viewStyles.borderRadius,
          }}
        />
        {/* Line grain texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: isGrid ? paperGradients.crossTexture : paperGradients.lineTexture,
            backgroundSize: isGrid ? '3px 3px' : '2px 2px',
            opacity: isGrid ? 0.15 : 0.12,
            borderRadius: viewStyles.borderRadius,
          }}
        />
        {/* Inset highlight for normal view */}
        {viewMode === 'normal' && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
              borderRadius: viewStyles.borderRadius,
            }}
          />
        )}
      </>
    );
  };

  // Edge shadow for paper thickness
  const renderEdgeShadow = () => {
    if (!showEdgeShadow) return null;

    return (
      <>
        {/* Left edge shadow */}
        <div
          className="absolute top-0 left-0 h-full"
          style={{
            width: '2px',
            boxShadow: paperShadows.edgeThickness,
          }}
        />
        {/* Paper edge gradient */}
        <div
          className="absolute top-0 left-0 h-full"
          style={{
            width: '0.5px',
            background: 'linear-gradient(to right, rgba(139, 92, 46, 0.15) 0%, transparent 100%)',
            boxShadow: 'inset 1px 0 1px rgba(139, 92, 46, 0.15)',
            borderTopLeftRadius: viewStyles.borderRadius,
            borderBottomLeftRadius: viewStyles.borderRadius,
          }}
        />
      </>
    );
  };

  // Handle hover state
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    Object.assign(target.style, hoverStyles);

    // Intensify border on hover
    if (state === 'waiting') {
      target.style.borderColor = '#D97706'; // Darker amber
    } else if (state === 'inService') {
      target.style.borderColor = '#059669'; // Darker green
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.style.transform = '';
    target.style.borderColor = '';
  };

  // Handle active/pressed state
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.style.transform = 'scale(0.99)';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.style.transform = '';
  };

  return (
    <>
      {/* Inject keyframe animations */}
      <style dangerouslySetInnerHTML={{ __html: paperKeyframes }} />

      <div
        role="button"
        tabIndex={0}
        className={`relative overflow-visible cursor-pointer transition-all ${paperAnimations.duration.normal} ${paperAnimations.easing.out} ${className}`}
        style={paperStyle}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        aria-label={`Ticket ${ticketNumber} - ${state}`}
      >
        {/* Paper effects layers */}
        {renderPerforations()}
        {renderNotches()}
        {renderNumberBadge()}
        {renderEdgeShadow()}
        {renderTexture()}

        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </>
  );
};