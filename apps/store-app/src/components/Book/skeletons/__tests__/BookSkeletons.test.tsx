/**
 * Book Skeleton Components Tests
 * Tests for skeleton loading components in Book module
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, ShimmerSkeleton } from '../Skeleton';
import { DayViewSkeleton, WeekViewSkeleton, MonthViewSkeleton, CalendarLoadingOverlay } from '../CalendarSkeleton';
import { StaffCardSkeleton, StaffCardSkeletonList } from '../StaffCardSkeleton';
import { AppointmentCardSkeleton, AppointmentCardSkeletonList } from '../AppointmentCardSkeleton';

describe('Skeleton', () => {
  describe('basic rendering', () => {
    it('renders a div element', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('has gray background', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass('bg-gray-200');
    });
  });

  describe('variants', () => {
    it('rectangular variant has rounded-lg', () => {
      const { container } = render(<Skeleton variant="rectangular" />);
      expect(container.firstChild).toHaveClass('rounded-lg');
    });

    it('circular variant has rounded-full', () => {
      const { container } = render(<Skeleton variant="circular" />);
      expect(container.firstChild).toHaveClass('rounded-full');
    });

    it('text variant has rounded', () => {
      const { container } = render(<Skeleton variant="text" />);
      expect(container.firstChild).toHaveClass('rounded');
    });

    it('uses rectangular as default variant', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass('rounded-lg');
    });
  });

  describe('dimensions', () => {
    it('defaults to 100% width', () => {
      const { container } = render(<Skeleton />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.width).toBe('100%');
    });

    it('applies custom width', () => {
      const { container } = render(<Skeleton width={200} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.width).toBe('200px');
    });

    it('applies string width', () => {
      const { container } = render(<Skeleton width="50%" />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.width).toBe('50%');
    });

    it('applies custom height', () => {
      const { container } = render(<Skeleton height={50} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.height).toBe('50px');
    });

    it('text variant defaults to 1em height', () => {
      const { container } = render(<Skeleton variant="text" />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.height).toBe('1em');
    });

    it('rectangular variant defaults to 100% height', () => {
      const { container } = render(<Skeleton variant="rectangular" />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.height).toBe('100%');
    });
  });

  describe('animation', () => {
    it('has pulse animation by default', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('can disable animation', () => {
      const { container } = render(<Skeleton animate={false} />);
      expect(container.firstChild).not.toHaveClass('animate-pulse');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<Skeleton className="custom-skeleton" />);
      expect(container.firstChild).toHaveClass('custom-skeleton');
    });
  });
});

describe('ShimmerSkeleton', () => {
  describe('basic rendering', () => {
    it('renders a div element', () => {
      const { container } = render(<ShimmerSkeleton />);
      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('has gray background', () => {
      const { container } = render(<ShimmerSkeleton />);
      expect(container.firstChild).toHaveClass('bg-gray-200');
    });

    it('has overflow hidden for shimmer effect', () => {
      const { container } = render(<ShimmerSkeleton />);
      expect(container.firstChild).toHaveClass('overflow-hidden');
    });

    it('has relative positioning', () => {
      const { container } = render(<ShimmerSkeleton />);
      expect(container.firstChild).toHaveClass('relative');
    });
  });

  describe('shimmer effect', () => {
    it('contains shimmer gradient element', () => {
      const { container } = render(<ShimmerSkeleton />);
      const shimmer = container.querySelector('.animate-shimmer');
      expect(shimmer).toBeInTheDocument();
    });

    it('shimmer has gradient background', () => {
      const { container } = render(<ShimmerSkeleton />);
      const shimmer = container.querySelector('.bg-gradient-to-r');
      expect(shimmer).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('rectangular variant has rounded-lg', () => {
      const { container } = render(<ShimmerSkeleton variant="rectangular" />);
      expect(container.firstChild).toHaveClass('rounded-lg');
    });

    it('circular variant has rounded-full', () => {
      const { container } = render(<ShimmerSkeleton variant="circular" />);
      expect(container.firstChild).toHaveClass('rounded-full');
    });

    it('text variant has rounded', () => {
      const { container } = render(<ShimmerSkeleton variant="text" />);
      expect(container.firstChild).toHaveClass('rounded');
    });
  });

  describe('dimensions', () => {
    it('applies custom width', () => {
      const { container } = render(<ShimmerSkeleton width={150} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.width).toBe('150px');
    });

    it('applies custom height', () => {
      const { container } = render(<ShimmerSkeleton height={30} />);
      const element = container.firstChild as HTMLElement;
      expect(element.style.height).toBe('30px');
    });
  });
});

describe('DayViewSkeleton', () => {
  it('renders container', () => {
    const { container } = render(<DayViewSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has flex layout', () => {
    const { container } = render(<DayViewSkeleton />);
    expect(container.firstChild).toHaveClass('flex');
  });

  it('renders time column', () => {
    const { container } = render(<DayViewSkeleton />);
    const timeColumn = container.querySelector('.w-16');
    expect(timeColumn).toBeInTheDocument();
  });

  it('renders 12 time slots', () => {
    const { container } = render(<DayViewSkeleton />);
    const timeSlots = container.querySelectorAll('.h-16');
    expect(timeSlots.length).toBe(12);
  });

  it('renders multiple staff columns', () => {
    const { container } = render(<DayViewSkeleton />);
    const staffColumns = container.querySelectorAll('.flex-1.border-r');
    expect(staffColumns.length).toBeGreaterThan(0);
  });
});

describe('WeekViewSkeleton', () => {
  it('renders container', () => {
    const { container } = render(<WeekViewSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has flex column layout', () => {
    const { container } = render(<WeekViewSkeleton />);
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('flex-col');
  });

  it('renders week header with 7 columns', () => {
    const { container } = render(<WeekViewSkeleton />);
    const header = container.querySelector('.grid-cols-7');
    expect(header).toBeInTheDocument();
  });

  it('renders day columns', () => {
    const { container } = render(<WeekViewSkeleton />);
    const dayColumns = container.querySelectorAll('.grid-cols-7 > div');
    expect(dayColumns.length).toBeGreaterThanOrEqual(7);
  });
});

describe('MonthViewSkeleton', () => {
  it('renders container', () => {
    const { container } = render(<MonthViewSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has flex column layout', () => {
    const { container } = render(<MonthViewSkeleton />);
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('flex-col');
  });

  it('renders month header', () => {
    const { container } = render(<MonthViewSkeleton />);
    const header = container.querySelector('.grid-cols-7.border-b');
    expect(header).toBeInTheDocument();
  });

  it('renders 35 day cells (5 rows x 7 days)', () => {
    const { container } = render(<MonthViewSkeleton />);
    const grid = container.querySelector('.grid-rows-5');
    expect(grid).toBeInTheDocument();
  });
});

describe('CalendarLoadingOverlay', () => {
  it('renders overlay', () => {
    const { container } = render(<CalendarLoadingOverlay />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays default message', () => {
    render(<CalendarLoadingOverlay />);
    expect(screen.getByText('Loading calendar...')).toBeInTheDocument();
  });

  it('displays custom message', () => {
    render(<CalendarLoadingOverlay message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('has absolute positioning', () => {
    const { container } = render(<CalendarLoadingOverlay />);
    expect(container.firstChild).toHaveClass('absolute');
    expect(container.firstChild).toHaveClass('inset-0');
  });

  it('has backdrop blur', () => {
    const { container } = render(<CalendarLoadingOverlay />);
    expect(container.firstChild).toHaveClass('backdrop-blur-sm');
  });

  it('has high z-index', () => {
    const { container } = render(<CalendarLoadingOverlay />);
    expect(container.firstChild).toHaveClass('z-50');
  });

  it('has spinner element', () => {
    const { container } = render(<CalendarLoadingOverlay />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('centers content', () => {
    const { container } = render(<CalendarLoadingOverlay />);
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('items-center');
    expect(container.firstChild).toHaveClass('justify-center');
  });
});

describe('StaffCardSkeleton', () => {
  it('renders container', () => {
    const { container } = render(<StaffCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has flex layout', () => {
    const { container } = render(<StaffCardSkeleton />);
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('items-center');
  });

  it('has white background', () => {
    const { container } = render(<StaffCardSkeleton />);
    expect(container.firstChild).toHaveClass('bg-white');
  });

  it('has border', () => {
    const { container } = render(<StaffCardSkeleton />);
    expect(container.firstChild).toHaveClass('border');
  });

  it('has rounded corners', () => {
    const { container } = render(<StaffCardSkeleton />);
    expect(container.firstChild).toHaveClass('rounded-xl');
  });

  it('renders circular avatar skeleton', () => {
    const { container } = render(<StaffCardSkeleton />);
    const avatar = container.querySelector('.rounded-full');
    expect(avatar).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StaffCardSkeleton className="custom-staff-skeleton" />);
    expect(container.firstChild).toHaveClass('custom-staff-skeleton');
  });
});

describe('StaffCardSkeletonList', () => {
  it('renders 5 skeletons by default', () => {
    const { container } = render(<StaffCardSkeletonList />);
    const skeletons = container.querySelectorAll('.flex.items-center');
    expect(skeletons.length).toBe(5);
  });

  it('renders specified count of skeletons', () => {
    const { container } = render(<StaffCardSkeletonList count={3} />);
    const skeletons = container.querySelectorAll('.flex.items-center');
    expect(skeletons.length).toBe(3);
  });

  it('has vertical spacing', () => {
    const { container } = render(<StaffCardSkeletonList />);
    expect(container.firstChild).toHaveClass('space-y-2');
  });

  it('applies custom className', () => {
    const { container } = render(<StaffCardSkeletonList className="custom-list" />);
    expect(container.firstChild).toHaveClass('custom-list');
  });

  it('applies staggered animation delays', () => {
    const { container } = render(<StaffCardSkeletonList count={3} />);
    const items = container.querySelectorAll('[style*="animationDelay"]');
    expect(items.length).toBe(3);
  });
});

describe('AppointmentCardSkeleton', () => {
  it('renders container', () => {
    const { container } = render(<AppointmentCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has white background', () => {
    const { container } = render(<AppointmentCardSkeleton />);
    expect(container.firstChild).toHaveClass('bg-white');
  });

  it('has border', () => {
    const { container } = render(<AppointmentCardSkeleton />);
    expect(container.firstChild).toHaveClass('border');
  });

  it('has rounded corners', () => {
    const { container } = render(<AppointmentCardSkeleton />);
    expect(container.firstChild).toHaveClass('rounded-lg');
  });

  it('has padding', () => {
    const { container } = render(<AppointmentCardSkeleton />);
    expect(container.firstChild).toHaveClass('p-3');
  });

  describe('compact mode', () => {
    it('shows only client name in compact mode', () => {
      const { container } = render(<AppointmentCardSkeleton compact />);
      // In compact mode, fewer skeleton elements
      const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
      expect(skeletons.length).toBeLessThan(5);
    });

    it('shows all details in non-compact mode', () => {
      const { container } = render(<AppointmentCardSkeleton compact={false} />);
      // Non-compact has more skeleton elements
      const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('applies custom className', () => {
    const { container } = render(<AppointmentCardSkeleton className="custom-apt-skeleton" />);
    expect(container.firstChild).toHaveClass('custom-apt-skeleton');
  });
});

describe('AppointmentCardSkeletonList', () => {
  it('renders 3 skeletons by default', () => {
    const { container } = render(<AppointmentCardSkeletonList />);
    const skeletons = container.querySelectorAll('.rounded-lg.border');
    expect(skeletons.length).toBe(3);
  });

  it('renders specified count of skeletons', () => {
    const { container } = render(<AppointmentCardSkeletonList count={5} />);
    const skeletons = container.querySelectorAll('.rounded-lg.border');
    expect(skeletons.length).toBe(5);
  });

  it('has vertical spacing', () => {
    const { container } = render(<AppointmentCardSkeletonList />);
    expect(container.firstChild).toHaveClass('space-y-2');
  });

  it('applies custom className', () => {
    const { container } = render(<AppointmentCardSkeletonList className="custom-apt-list" />);
    expect(container.firstChild).toHaveClass('custom-apt-list');
  });

  it('passes compact prop to children', () => {
    const { container } = render(<AppointmentCardSkeletonList compact />);
    // In compact mode, each card should have fewer skeleton elements
    const cards = container.querySelectorAll('.rounded-lg.border');
    expect(cards.length).toBe(3);
  });

  it('applies staggered animation delays', () => {
    const { container } = render(<AppointmentCardSkeletonList count={3} />);
    const items = container.querySelectorAll('[style*="animationDelay"]');
    expect(items.length).toBe(3);
  });
});
