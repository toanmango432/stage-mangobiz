import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isPortrait: boolean;
  isDesktop: boolean;
}

/**
 * Hook for detecting device type and orientation
 * Handles mobile (<768px), tablet (768-1023px), desktop (1024px+)
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    // Initial detection
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isPortrait: false,
        isDesktop: true,
      };
    }

    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const portraitQuery = window.matchMedia('(orientation: portrait)');

    return {
      isMobile: mobileQuery.matches,
      isTablet: tabletQuery.matches,
      isPortrait: portraitQuery.matches,
      isDesktop: desktopQuery.matches,
    };
  });

  useEffect(() => {
    const checkDeviceInfo = () => {
      const mobileQuery = window.matchMedia('(max-width: 767px)');
      const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
      const desktopQuery = window.matchMedia('(min-width: 1024px)');
      const portraitQuery = window.matchMedia('(orientation: portrait)');

      setDeviceInfo({
        isMobile: mobileQuery.matches,
        isTablet: tabletQuery.matches,
        isPortrait: portraitQuery.matches,
        isDesktop: desktopQuery.matches,
      });
    };

    // Add event listeners
    window.addEventListener('resize', checkDeviceInfo);
    window.addEventListener('orientationchange', checkDeviceInfo);

    return () => {
      window.removeEventListener('resize', checkDeviceInfo);
      window.removeEventListener('orientationchange', checkDeviceInfo);
    };
  }, []);

  return deviceInfo;
}
