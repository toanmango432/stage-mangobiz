/**
 * useResponsive Hook Unit Tests
 * US-016: Tests for responsive utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsive, useMediaQuery, useOrientation } from './useResponsive';

describe('useResponsive', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true });
  });

  it('should return responsive state', () => {
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.width).toBeDefined();
    expect(result.current.height).toBeDefined();
    expect(result.current.deviceType).toBeDefined();
    expect(result.current.orientation).toBeDefined();
    expect(result.current.isTouch).toBeDefined();
  });

  it('should detect tablet device type', () => {
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.deviceType).toBe('tablet');
  });

  it('should detect mobile device type', () => {
    Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.deviceType).toBe('mobile');
  });

  it('should detect tablet-sm device type', () => {
    Object.defineProperty(window, 'innerWidth', { value: 650, writable: true });
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.deviceType).toBe('tablet-sm');
  });

  it('should detect tablet-lg device type', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1100, writable: true });
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.deviceType).toBe('tablet-lg');
  });

  it('should detect desktop device type', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1400, writable: true });
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.deviceType).toBe('desktop');
  });

  it('should detect portrait orientation', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true });
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.orientation).toBe('portrait');
  });

  it('should detect landscape orientation', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.orientation).toBe('landscape');
  });

  it('should detect short screen', () => {
    Object.defineProperty(window, 'innerHeight', { value: 500, writable: true });
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isShortScreen).toBe(true);
  });

  it('should detect tall screen', () => {
    Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true });
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isTallScreen).toBe(true);
  });

  it('should detect small screen', () => {
    Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isSmallScreen).toBe(true);
    expect(result.current.isMediumScreen).toBe(false);
    expect(result.current.isLargeScreen).toBe(false);
  });

  it('should detect medium screen', () => {
    Object.defineProperty(window, 'innerWidth', { value: 900, writable: true });
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isSmallScreen).toBe(false);
    expect(result.current.isMediumScreen).toBe(true);
    expect(result.current.isLargeScreen).toBe(false);
  });

  it('should detect large screen', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    const { result } = renderHook(() => useResponsive());
    
    expect(result.current.isSmallScreen).toBe(false);
    expect(result.current.isMediumScreen).toBe(false);
    expect(result.current.isLargeScreen).toBe(true);
  });

  it('should update on resize', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(result.current.width).toBe(400);
    expect(result.current.deviceType).toBe('mobile');
  });

  it('should update on orientation change', () => {
    const { result } = renderHook(() => useResponsive());
    
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
      window.dispatchEvent(new Event('orientationchange'));
    });
    
    expect(result.current.orientation).toBe('landscape');
  });
});

describe('useMediaQuery', () => {
  it('should return boolean for media query', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(typeof result.current).toBe('boolean');
  });
});

describe('useOrientation', () => {
  it('should return orientation string', () => {
    const { result } = renderHook(() => useOrientation());
    expect(['portrait', 'landscape']).toContain(result.current);
  });
});
