/**
 * useResponsive Hook
 * US-015: Device detection and responsive utilities
 * Provides screen size, orientation, and device type information
 */

import { useState, useEffect, useCallback } from 'react';

export type DeviceType = 'mobile' | 'tablet-sm' | 'tablet' | 'tablet-lg' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

interface ResponsiveState {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: Orientation;
  isTouch: boolean;
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  isShortScreen: boolean;
  isTallScreen: boolean;
}

const BREAKPOINTS = {
  mobile: 480,
  tabletSm: 600,
  tablet: 768,
  tabletLg: 1024,
  desktop: 1280,
} as const;

function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.tabletSm) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet-sm';
  if (width < BREAKPOINTS.tabletLg) return 'tablet';
  if (width < BREAKPOINTS.desktop) return 'tablet-lg';
  return 'desktop';
}

function getOrientation(width: number, height: number): Orientation {
  return width > height ? 'landscape' : 'portrait';
}

function isTouch(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 768,
        height: 1024,
        deviceType: 'tablet',
        orientation: 'portrait',
        isTouch: true,
        isSmallScreen: false,
        isMediumScreen: true,
        isLargeScreen: false,
        isShortScreen: false,
        isTallScreen: false,
      };
    }
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      width,
      height,
      deviceType: getDeviceType(width),
      orientation: getOrientation(width, height),
      isTouch: isTouch(),
      isSmallScreen: width < BREAKPOINTS.tablet,
      isMediumScreen: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.tabletLg,
      isLargeScreen: width >= BREAKPOINTS.tabletLg,
      isShortScreen: height < 600,
      isTallScreen: height >= 900,
    };
  });

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setState({
      width,
      height,
      deviceType: getDeviceType(width),
      orientation: getOrientation(width, height),
      isTouch: isTouch(),
      isSmallScreen: width < BREAKPOINTS.tablet,
      isMediumScreen: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.tabletLg,
      isLargeScreen: width >= BREAKPOINTS.tabletLg,
      isShortScreen: height < 600,
      isTallScreen: height >= 900,
    });
  }, []);

  useEffect(() => {
    handleResize();
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);

  return state;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useOrientation(): Orientation {
  const isLandscape = useMediaQuery('(orientation: landscape)');
  return isLandscape ? 'landscape' : 'portrait';
}
