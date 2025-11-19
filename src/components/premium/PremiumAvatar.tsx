/**
 * PremiumAvatar Component
 * Beautiful avatars with gradient fallbacks and status indicators
 */

import { forwardRef, HTMLAttributes, useState } from 'react';
import { cn } from '../../lib/utils';
import { getStaffColor } from '../../constants/premiumDesignSystem';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface PremiumAvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;  // Used to generate initials if no src
  size?: AvatarSize;
  status?: 'online' | 'busy' | 'offline' | 'away';
  showStatus?: boolean;
  gradient?: boolean;  // Use gradient background
  colorIndex?: number;  // Index for staff color
}

export const PremiumAvatar = forwardRef<HTMLDivElement, PremiumAvatarProps>(
  (
    {
      src,
      alt,
      name,
      size = 'md',
      status,
      showStatus = false,
      gradient = true,
      colorIndex = 0,
      className,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    // Size classes
    const sizeClasses = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg',
      '2xl': 'w-20 h-20 text-xl',
    };

    // Status indicator size
    const statusSizeClasses = {
      xs: 'w-1.5 h-1.5 -bottom-0 -right-0',
      sm: 'w-2 h-2 -bottom-0 -right-0',
      md: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
      lg: 'w-3 h-3 -bottom-0.5 -right-0.5',
      xl: 'w-4 h-4 -bottom-1 -right-1',
      '2xl': 'w-5 h-5 -bottom-1 -right-1',
    };

    // Status colors
    const statusColors = {
      online: 'bg-green-500',
      busy: 'bg-amber-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500',
    };

    // Get initials from name
    const getInitials = (name?: string): string => {
      if (!name) return '?';
      const parts = name.trim().split(' ');
      if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Get gradient color
    const staffColor = getStaffColor(colorIndex);

    // Should show image
    const showImage = src && !imageError;

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex-shrink-0',
          'inline-flex items-center justify-center',
          'rounded-full',
          'font-semibold',
          'overflow-hidden',
          sizeClasses[size],
          className
        )}
        style={{
          background: !showImage && gradient
            ? `linear-gradient(135deg, ${staffColor}, ${adjustColor(staffColor, 20)})`
            : undefined,
          backgroundColor: !showImage && !gradient ? staffColor : undefined,
        }}
        {...props}
      >
        {/* Image */}
        {showImage ? (
          <img
            src={src}
            alt={alt || name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          /* Initials */
          <span className="text-white select-none">
            {getInitials(name)}
          </span>
        )}

        {/* Status indicator */}
        {showStatus && status && (
          <span
            className={cn(
              'absolute rounded-full',
              'border-2 border-white',
              'ring-1 ring-white',
              statusSizeClasses[size],
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);

PremiumAvatar.displayName = 'PremiumAvatar';

// ============================================================================
// AVATAR GROUP (Multiple avatars with overlap)
// ============================================================================

export interface PremiumAvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  avatars: Array<{
    src?: string;
    name?: string;
    colorIndex?: number;
  }>;
  max?: number;  // Maximum avatars to show
  size?: AvatarSize;
}

export const PremiumAvatarGroup = forwardRef<HTMLDivElement, PremiumAvatarGroupProps>(
  ({ avatars, max = 5, size = 'md', className, ...props }, ref) => {
    const displayAvatars = avatars.slice(0, max);
    const remainingCount = Math.max(0, avatars.length - max);

    return (
      <div
        ref={ref}
        className={cn('flex items-center -space-x-2', className)}
        {...props}
      >
        {displayAvatars.map((avatar, index) => (
          <PremiumAvatar
            key={index}
            src={avatar.src}
            name={avatar.name}
            colorIndex={avatar.colorIndex || index}
            size={size}
            className="ring-2 ring-white"
          />
        ))}

        {remainingCount > 0 && (
          <div
            className={cn(
              'flex items-center justify-center',
              'rounded-full',
              'bg-gray-200 text-gray-700',
              'font-semibold',
              'ring-2 ring-white',
              size === 'xs' && 'w-6 h-6 text-xs',
              size === 'sm' && 'w-8 h-8 text-xs',
              size === 'md' && 'w-10 h-10 text-sm',
              size === 'lg' && 'w-12 h-12 text-base',
              size === 'xl' && 'w-16 h-16 text-lg',
              size === '2xl' && 'w-20 h-20 text-xl'
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

PremiumAvatarGroup.displayName = 'PremiumAvatarGroup';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Adjust color brightness (for gradient)
 */
function adjustColor(color: string, percent: number): string {
  // Simple color adjustment - could be more sophisticated
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
