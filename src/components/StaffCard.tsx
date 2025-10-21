import React, { useEffect, useState, useRef } from 'react';
import { MoreVertical, Clock, DollarSign, Ticket, Star, Award, Sparkles, Coffee, UserCheck, ChevronRight, GripVertical, RefreshCw, Check, Circle, CircleDot } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
interface StaffCardProps {
  staff: {
    id: number;
    name: string;
    time: string;
    image: string;
    status: string;
    color: string;
    count: number;
    revenue: {
      transactions: number;
      tickets: number;
      amount: number;
    } | null;
    nextAppointmentTime?: string;
    nextAppointmentEta?: string;
    nextClientName?: string;
    nextServiceType?: string;
    lastServiceTime?: string;
    lastServiceAgo?: string;
    turnCount?: number;
    ticketsServicedCount?: number;
    totalSalesAmount?: number;
    specialty?: 'neutral' | 'nails' | 'hair' | 'massage' | 'skincare' | 'waxing' | 'combo' | 'support';
    activeTickets?: Array<{
      id: number;
      clientName: string;
      serviceName: string;
      status: 'in-service' | 'pending';
    }>;
  };
  viewMode?: 'ultra-compact' | 'compact' | 'normal';
  isDraggable?: boolean;
  isSelected?: boolean;
  displayConfig?: {
    showName?: boolean;
    showQueueNumber?: boolean;
    showAvatar?: boolean;
    showTurnCount?: boolean;
    showStatus?: boolean;
    showClockedInTime?: boolean;
    showNextAppointment?: boolean;
    showSalesAmount?: boolean;
    showTickets?: boolean;
    showLastService?: boolean;
    enhancedSeparator?: boolean;
    notchOverlapsAvatar?: boolean;
  };
}
// SVG Icons for data zone with classic metaphors
const ClassicIcons = {
  TicketStubClassic: ({
    color = '#4A5568',
    size = 18,
    strokeWidth = 2
  }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{
    shapeRendering: 'geometricPrecision'
  }}>
      <path d="M4 4h16a0 0 0 0 1 0 0v16a0 0 0 0 1 0 0H4a0 0 0 0 1 0 0V4a0 0 0 0 1 0 0z" />
      <path d="M4 4v16h16V4H4z" />
      <path d="M16 2v20M9 2v2M9 20v2M9 12h7M9 8h4M9 16h5" />
    </svg>,
  TicketStubPerf: ({
    color = '#4A5568',
    size = 18,
    strokeWidth = 2
  }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{
    shapeRendering: 'geometricPrecision'
  }}>
      <path d="M2 7v10a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z" />
      <path d="M16 6v12M6 6v.5M6 9.5v.5M6 13.5v.5M6 17.5v.5M22 10.5v3" />
    </svg>,
  MoneyBagClassic: ({
    color = '#4A5568',
    size = 18,
    strokeWidth = 2
  }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{
    shapeRendering: 'geometricPrecision'
  }}>
      <path d="M12 7v10M8 11h8M17.8 14c0 3.3-2.7 6-6 6-3.3 0-6-2.7-6-6V8h12v6z" />
      <path d="M10 4h4l2 4H8l2-4z" />
    </svg>,
  ClockAnalog: ({
    color = '#4A5568',
    size = 18,
    strokeWidth = 2
  }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{
    shapeRendering: 'geometricPrecision'
  }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>,
  CalendarRingTabs: ({
    color = '#4A5568',
    size = 18,
    strokeWidth = 2,
    className = ''
  }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={{
    shapeRendering: 'geometricPrecision'
  }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
      <rect x="12" y="1" width="1" height="2" />
      <rect x="12" y="21" width="1" height="2" />
      <rect x="21" y="12" width="2" height="1" />
      <rect x="1" y="12" width="2" height="1" />
    </svg>,
  NextAppointment: ({
    color = '#4A5568',
    size = 18,
    strokeWidth = 2,
    className = ''
  }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={{
    shapeRendering: 'geometricPrecision'
  }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M12 14l3 3m0 0l-3 3m3-3H8" />
    </svg>,
  RepeatArrows: ({
    color = '#4A5568',
    size = 18,
    strokeWidth = 2
  }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{
    shapeRendering: 'geometricPrecision'
  }}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>,
  ClockAnalog3OClock: ({
    color = '#4A5568',
    size = 18,
    strokeWidth = 2
  }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{
    shapeRendering: 'geometricPrecision'
  }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,12 16,12" />
      <polyline points="12,6 12,12" />
    </svg>
};
export function StaffCard({
  staff,
  viewMode = 'normal',
  isDraggable = false,
  isSelected = false,
  displayConfig
}: StaffCardProps) {
  // Default display config - follow content priority rules
  const defaultDisplayConfig = {
    showName: true,
    showQueueNumber: true,
    showAvatar: true,
    showTurnCount: true,
    showStatus: true,
    showClockedInTime: true,
    showNextAppointment: true,
    showSalesAmount: true,
    showTickets: true,
    showLastService: true,
    enhancedSeparator: true,
    notchOverlapsAvatar: false
  };
  // Merge provided config with defaults
  const config = {
    ...defaultDisplayConfig,
    ...(displayConfig || {})
  };
  // Add ref and state for card width measurement
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Function to format staff name according to new rules
  const formatStaffName = (fullName: string, isDuplicate = false): string => {
    // Extract first name (everything before the first space)
    const nameParts = fullName.trim().split(' ');
    let firstName = nameParts[0];
    // If duplicate first name and we have a last name, append last initial
    if (isDuplicate && nameParts.length > 1) {
      const lastInitial = nameParts[nameParts.length - 1][0];
      return `${firstName} ${lastInitial}.`;
    }
    return firstName;
  };
  // Check if this staff member has a duplicate first name (would be determined by parent)
  // This is a mock implementation since we don't have access to the full staff list
  // In a real implementation, this would be passed as a prop from the parent component
  const hasDuplicateFirstName = () => {
    // For demonstration, let's assume staff with IDs 2, 5 have duplicate first names
    return [2, 5].includes(staff.id);
  };
  // Get formatted name for display
  const displayName = formatStaffName(staff.name, hasDuplicateFirstName());
  // Measure card width on mount and resize with debounce
  useEffect(() => {
    const updateWidth = () => {
      if (cardRef.current) {
        const newWidth = cardRef.current.offsetWidth;
        // Only trigger transition state if width actually changes
        if (newWidth !== cardWidth) {
          setIsTransitioning(true);
          setCardWidth(newWidth);
          // Reset transition state after animation completes
          const timer = setTimeout(() => setIsTransitioning(false), 300);
          return () => clearTimeout(timer);
        }
      }
    };
    // Initial measurement
    updateWidth();
    // Set up resize observer with debounce
    let debounceTimer: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateWidth, 100);
    });
    if (cardRef.current) {
      resizeObserver.observe(cardRef.current);
    }
    // Clean up
    return () => {
      clearTimeout(debounceTimer);
      if (cardRef.current) {
        resizeObserver.disconnect();
      }
    };
  }, [cardWidth]);
  // Override status to always show as "ready"
  const statusColors = {
    ready: {
      bg: 'bg-emerald-500',
      lightBg: 'bg-emerald-100',
      pulseColor: 'bg-emerald-400',
      glowColor: 'shadow-emerald-300/0',
      text: 'text-emerald-700',
      lightText: 'text-emerald-50',
      chipBg: 'bg-emerald-100',
      chipBorder: 'border-emerald-200',
      icon: <Check size={viewMode === 'ultra-compact' ? 10 : 12} strokeWidth={2.5} className="mr-1" style={{
        shapeRendering: 'geometricPrecision'
      }} />,
      label: 'Ready',
      desaturateHeader: false,
      cardShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
      grayOutOverlay: false
    },
    busy: {
      bg: 'bg-rose-500',
      lightBg: 'bg-rose-100',
      pulseColor: 'bg-rose-400',
      glowColor: 'shadow-rose-300/70',
      text: 'text-rose-700',
      lightText: 'text-rose-50',
      chipBg: 'bg-rose-100',
      chipBorder: 'border-rose-200',
      icon: <CircleDot size={viewMode === 'ultra-compact' ? 10 : 12} strokeWidth={2.5} className="mr-1" style={{
        shapeRendering: 'geometricPrecision'
      }} />,
      label: 'Busy',
      desaturateHeader: true,
      cardShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
      grayOutOverlay: true,
      busyBorderColor: 'rgba(225, 29, 72, 0.5)'
    },
    off: {
      bg: 'bg-gray-400',
      lightBg: 'bg-gray-100',
      pulseColor: 'bg-gray-300',
      glowColor: 'shadow-gray-200/40',
      text: 'text-gray-600',
      lightText: 'text-gray-50',
      chipBg: 'bg-gray-100',
      chipBorder: 'border-gray-200',
      icon: <Circle size={viewMode === 'ultra-compact' ? 10 : 12} strokeWidth={2.5} className="mr-1" style={{
        shapeRendering: 'geometricPrecision'
      }} />,
      label: 'Clocked Out',
      desaturateHeader: true,
      cardShadow: '0px 1px 2px rgba(0, 0, 0, 0.03)',
      grayOutOverlay: true
    }
  };
  // Use the staff's actual status instead of always using 'ready'
  const status = statusColors[staff.status] || statusColors['ready'];
  // Specialty color mapping
  const specialtyColors: Record<string, {
    base: string;
    header: string;
    headerDesaturated: string;
    data: string;
    dataDesaturated: string;
    description: string;
    textColor: string;
    darkText: boolean;
    borderColor: string;
    darkBorderColor: string;
    bgTint: string;
    headerBg: string;
    dataBg: string;
    busyHeaderBg: string;
    busyDataBg: string;
    // Metallic gradient colors
    metalGradientFrom: string;
    metalGradientTo: string;
    metalGradientFromDark: string;
    metalGradientToDark: string;
  }> = {
    neutral: {
      base: '#FFEEF1',
      header: '#FFFFFF',
      headerDesaturated: '#FCFCFC',
      data: '#F8F8F8',
      dataDesaturated: '#FAFAFA',
      description: 'General staff with no specialty',
      textColor: '#333333',
      darkText: true,
      borderColor: '#E0E0E0',
      darkBorderColor: '#C0C0C0',
      bgTint: 'rgba(240, 240, 240, 0.03)',
      headerBg: 'rgba(250, 250, 250, 0.08)',
      dataBg: 'rgba(245, 245, 245, 0.04)',
      busyHeaderBg: 'rgba(245, 245, 245, 0.06)',
      busyDataBg: 'rgba(240, 240, 240, 0.02)',
      // Metallic gradient colors
      metalGradientFrom: '#FFFFFF',
      metalGradientTo: '#F0F0F0',
      metalGradientFromDark: '#F8F8F8',
      metalGradientToDark: '#E8E8E8'
    },
    nails: {
      base: '#F43F5E',
      header: '#FFF1F3',
      headerDesaturated: '#FFF1F3',
      data: '#FFFFFF',
      dataDesaturated: '#FFFAFA',
      description: 'Nail services specialists',
      textColor: '#BE123C',
      darkText: true,
      borderColor: '#F43F5E',
      darkBorderColor: '#D41C44',
      bgTint: 'rgba(244, 63, 94, 0.07)',
      headerBg: 'rgba(244, 63, 94, 0.25)',
      dataBg: 'rgba(244, 63, 94, 0.12)',
      busyHeaderBg: 'rgba(244, 63, 94, 0.15)',
      busyDataBg: 'rgba(244, 63, 94, 0.07)',
      // Metallic gradient colors
      metalGradientFrom: '#FFF1F3',
      metalGradientTo: '#FFE4E8',
      metalGradientFromDark: '#FFE4E8',
      metalGradientToDark: '#FFD8DE'
    },
    hair: {
      base: '#2563EB',
      header: '#F0F7FF',
      headerDesaturated: '#F0F7FF',
      data: '#FFFFFF',
      dataDesaturated: '#FAFCFF',
      description: 'Hair styling and cutting specialists',
      textColor: '#1E40AF',
      darkText: true,
      borderColor: '#2563EB',
      darkBorderColor: '#1D4ED8',
      bgTint: 'rgba(37, 99, 235, 0.07)',
      headerBg: 'rgba(37, 99, 235, 0.25)',
      dataBg: 'rgba(37, 99, 235, 0.12)',
      busyHeaderBg: 'rgba(37, 99, 235, 0.15)',
      busyDataBg: 'rgba(37, 99, 235, 0.07)',
      // Metallic gradient colors
      metalGradientFrom: '#F0F7FF',
      metalGradientTo: '#E1EFFE',
      metalGradientFromDark: '#E1EFFE',
      metalGradientToDark: '#D1E5FE'
    },
    massage: {
      base: '#16A34A',
      header: '#F0FFF4',
      headerDesaturated: '#F0FFF4',
      data: '#FFFFFF',
      dataDesaturated: '#FAFFFC',
      description: 'Massage therapy specialists',
      textColor: '#166534',
      darkText: true,
      borderColor: '#16A34A',
      darkBorderColor: '#15803D',
      bgTint: 'rgba(22, 163, 74, 0.07)',
      headerBg: 'rgba(22, 163, 74, 0.25)',
      dataBg: 'rgba(22, 163, 74, 0.12)',
      busyHeaderBg: 'rgba(22, 163, 74, 0.15)',
      busyDataBg: 'rgba(22, 163, 74, 0.07)',
      // Metallic gradient colors
      metalGradientFrom: '#F0FFF4',
      metalGradientTo: '#DCFCE7',
      metalGradientFromDark: '#DCFCE7',
      metalGradientToDark: '#BBF7D0'
    },
    skincare: {
      base: '#A855F7',
      header: '#F8F5FF',
      headerDesaturated: '#F8F5FF',
      data: '#FFFFFF',
      dataDesaturated: '#FCFAFF',
      description: 'Facial and skin treatment specialists',
      textColor: '#7E22CE',
      darkText: true,
      borderColor: '#A855F7',
      darkBorderColor: '#9333EA',
      bgTint: 'rgba(168, 85, 247, 0.07)',
      headerBg: 'rgba(168, 85, 247, 0.25)',
      dataBg: 'rgba(168, 85, 247, 0.12)',
      busyHeaderBg: 'rgba(168, 85, 247, 0.15)',
      busyDataBg: 'rgba(168, 85, 247, 0.07)',
      // Metallic gradient colors
      metalGradientFrom: '#F8F5FF',
      metalGradientTo: '#F3E8FF',
      metalGradientFromDark: '#F3E8FF',
      metalGradientToDark: '#E9D5FF'
    },
    waxing: {
      base: '#06B6D4',
      header: '#F0FCFF',
      headerDesaturated: '#F0FCFF',
      data: '#FFFFFF',
      dataDesaturated: '#FAFEFF',
      description: 'Waxing service specialists',
      textColor: '#0E7490',
      darkText: true,
      borderColor: '#06B6D4',
      darkBorderColor: '#0891B2',
      bgTint: 'rgba(6, 182, 212, 0.07)',
      headerBg: 'rgba(6, 182, 212, 0.25)',
      dataBg: 'rgba(6, 182, 212, 0.12)',
      busyHeaderBg: 'rgba(6, 182, 212, 0.15)',
      busyDataBg: 'rgba(6, 182, 212, 0.07)',
      // Metallic gradient colors
      metalGradientFrom: '#F0FCFF',
      metalGradientTo: '#CFFAFE',
      metalGradientFromDark: '#CFFAFE',
      metalGradientToDark: '#A5F3FC'
    },
    combo: {
      base: '#EAB308',
      header: '#FFFBEB',
      headerDesaturated: '#FFFBEB',
      data: '#FFFFFF',
      dataDesaturated: '#FFFDF7',
      description: 'Staff providing multiple service types',
      textColor: '#A16207',
      darkText: true,
      borderColor: '#EAB308',
      darkBorderColor: '#CA8A04',
      bgTint: 'rgba(234, 179, 8, 0.07)',
      headerBg: 'rgba(234, 179, 8, 0.25)',
      dataBg: 'rgba(234, 179, 8, 0.12)',
      busyHeaderBg: 'rgba(234, 179, 8, 0.15)',
      busyDataBg: 'rgba(234, 179, 8, 0.07)',
      // Metallic gradient colors
      metalGradientFrom: '#FFFBEB',
      metalGradientTo: '#FEF3C7',
      metalGradientFromDark: '#FEF3C7',
      metalGradientToDark: '#FDE68A'
    },
    support: {
      base: '#F97316',
      header: '#FFF7ED',
      headerDesaturated: '#FFF7ED',
      data: '#FFFFFF',
      dataDesaturated: '#FFFCFA',
      description: 'Support and training personnel',
      textColor: '#C2410C',
      darkText: true,
      borderColor: '#F97316',
      darkBorderColor: '#EA580C',
      bgTint: 'rgba(249, 115, 22, 0.07)',
      headerBg: 'rgba(249, 115, 22, 0.25)',
      dataBg: 'rgba(249, 115, 22, 0.12)',
      busyHeaderBg: 'rgba(249, 115, 22, 0.15)',
      busyDataBg: 'rgba(249, 115, 22, 0.07)',
      // Metallic gradient colors
      metalGradientFrom: '#FFF7ED',
      metalGradientTo: '#FFEDD5',
      metalGradientFromDark: '#FFEDD5',
      metalGradientToDark: '#FED7AA'
    }
  };
  // Get specialty colors or default to neutral
  const specialty = staff.specialty || 'neutral';
  const specialtyColor = specialtyColors[specialty];
  // Generate a unique gradient based on staff color
  const getStaffGradient = () => {
    const baseColor = staff.color.replace('bg-', '');
    // Enhanced color mappings for more vibrant colors
    const colorMap: Record<string, {
      main: string;
      light: string;
      dark: string;
      glow: string;
      accent: string;
      border: string;
      stripeBg: string;
      badgeBg: string;
      badgeText: string;
      shadowColor: string;
      innerBorder: string;
      highlightColor: string;
    }> = {
      white: {
        main: 'bg-white',
        light: 'from-gray-50 to-white',
        dark: 'bg-gray-200',
        glow: 'shadow-gray-300/40',
        accent: 'bg-gray-400',
        border: 'border-gray-200',
        stripeBg: 'bg-gradient-to-b from-gray-200 to-gray-300',
        badgeBg: 'bg-gray-100',
        badgeText: 'text-gray-700',
        shadowColor: 'rgba(0,0,0,0.05)',
        innerBorder: 'border-gray-200/60',
        highlightColor: 'rgba(255,255,255,0.8)'
      },
      '[#9B5DE5]': {
        main: 'bg-white',
        light: 'from-purple-50 to-white',
        dark: 'bg-[#7A3DBE]',
        glow: 'shadow-purple-300/40',
        accent: 'bg-[#9B5DE5]',
        border: 'border-purple-200',
        stripeBg: 'bg-gradient-to-b from-[#9B5DE5] to-[#7A3DBE]',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-700',
        shadowColor: 'rgba(0,0,0,0.05)',
        innerBorder: 'border-purple-200/60',
        highlightColor: 'rgba(233,213,255,0.8)'
      },
      '[#E5565B]': {
        main: 'bg-white',
        light: 'from-red-50 to-white',
        dark: 'bg-[#C23A3F]',
        glow: 'shadow-red-300/40',
        accent: 'bg-[#E5565B]',
        border: 'border-red-200',
        stripeBg: 'bg-gradient-to-b from-[#E5565B] to-[#C23A3F]',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-700',
        shadowColor: 'rgba(0,0,0,0.05)',
        innerBorder: 'border-red-200/60',
        highlightColor: 'rgba(254,226,226,0.8)'
      },
      '[#3F83F8]': {
        main: 'bg-white',
        light: 'from-blue-50 to-white',
        dark: 'bg-[#2A5EC8]',
        glow: 'shadow-blue-300/40',
        accent: 'bg-[#3F83F8]',
        border: 'border-blue-200',
        stripeBg: 'bg-gradient-to-b from-[#3F83F8] to-[#2A5EC8]',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-700',
        shadowColor: 'rgba(0,0,0,0.05)',
        innerBorder: 'border-blue-200/60',
        highlightColor: 'rgba(219,234,254,0.8)'
      },
      '[#4CC2A9]': {
        main: 'bg-white',
        light: 'from-teal-50 to-white',
        dark: 'bg-[#2D9C87]',
        glow: 'shadow-teal-300/40',
        accent: 'bg-[#4CC2A9]',
        border: 'border-teal-200',
        stripeBg: 'bg-gradient-to-b from-[#4CC2A9] to-[#2D9C87]',
        badgeBg: 'bg-teal-100',
        badgeText: 'text-teal-700',
        shadowColor: 'rgba(0,0,0,0.05)',
        innerBorder: 'border-teal-200/60',
        highlightColor: 'rgba(204,251,241,0.8)'
      },
      '[#3C78D8]': {
        main: 'bg-white',
        light: 'from-blue-50 to-white',
        dark: 'bg-[#2559B0]',
        glow: 'shadow-blue-300/40',
        accent: 'bg-[#3C78D8]',
        border: 'border-blue-200',
        stripeBg: 'bg-gradient-to-b from-[#3C78D8] to-[#2559B0]',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-700',
        shadowColor: 'rgba(0,0,0,0.05)',
        innerBorder: 'border-blue-200/60',
        highlightColor: 'rgba(219,234,254,0.8)'
      }
    };
    return colorMap[baseColor] || colorMap['white'];
  };
  const colors = getStaffGradient();
  // Format time to h:mma without leading zero (e.g., 9:45a, 1:05p)
  const formatTime = (timeString?: string): string => {
    if (!timeString) return '-';
    // Parse the time string
    const match = timeString.match(/(\d+):(\d+)\s*([AP]M)?/i);
    if (!match) return timeString;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3]?.toLowerCase() || '';
    // Remove leading zero from hours
    if (hours === 0) hours = 12;
    // Format as h:mma
    const period = ampm.includes('p') ? 'p' : 'a';
    return `${hours}:${minutes}${period}`;
  };
  // Format currency in compact form without cents unless needed
  const formatCurrency = (amount?: number): string => {
    if (amount === undefined) return '-';
    if (amount >= 1000) {
      const thousands = amount / 1000;
      return `$${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`;
    }
    return `$${amount % 1 === 0 ? amount : amount.toFixed(2)}`;
  };
  // Determine header and data background colors based on status
  const getHeaderColor = () => {
    return status.desaturateHeader ? specialtyColor.busyHeaderBg : specialtyColor.headerBg;
  };
  const getDataColor = () => {
    return status.desaturateHeader ? specialtyColor.busyDataBg : specialtyColor.dataBg;
  };
  // Get transition class based on state
  const getTransitionClass = () => {
    return isTransitioning ? 'transition-all duration-300 ease-in-out' : '';
  };
  // Helper functions for active tickets - modified to prioritize in-service tickets
  const hasActiveTickets = () => {
    // Check if staff has active tickets array with items
    return staff.activeTickets && staff.activeTickets.length > 0;
  };
  const getPrimaryActiveTicket = () => {
    // First check if there are any active tickets
    if (staff.activeTickets && staff.activeTickets.length > 0) {
      // Prioritize in-service tickets over pending ones
      const inServiceTicket = staff.activeTickets.find(ticket => ticket.status === 'in-service');
      // If an in-service ticket exists, return it
      if (inServiceTicket) {
        return inServiceTicket;
      }
      // Otherwise, return the first ticket in the array
      return staff.activeTickets[0];
    }
    return null;
  };
  const getAdditionalTicketsCount = () => {
    // Return count of additional tickets beyond the primary one
    return staff.activeTickets && staff.activeTickets.length > 1 ? staff.activeTickets.length - 1 : 0;
  };
  // Get current ticket information
  const getCurrentTicketTimeInfo = () => {
    const primaryTicket = getPrimaryActiveTicket();
    if (!primaryTicket || staff.status !== 'busy') return null;
    // Simulate ticket timing information
    // This would normally come from the ticket data
    return {
      timeLeft: 15,
      totalTime: 45,
      progress: 0.67,
      startTime: '10:15AM'
    };
  };
  // Define currentTicketInfo as a variable to prevent reference errors
  const currentTicketInfo = getCurrentTicketTimeInfo();
  // Check if we have the various time elements
  const hasLastService = config.showLastService && staff.lastServiceTime;
  const hasNextAppointment = config.showNextAppointment && staff.nextAppointmentTime;
  const hasCurrentTicket = currentTicketInfo !== null && staff.status === 'busy';
  // Skip rendering current ticket info if it's shown in the notch
  const showingTicketInNotch = hasCurrentTicket;
  // Calculate if a timestamp element would fit in available space - IMPROVED CALCULATION
  const wouldFit = (content: string, mode: string, type: 'last' | 'current' | 'next') => {
    let textContent = content;
    let fontSize = 10; // Default font size in pixels
    let extraSpace = 0; // Extra space for icon and padding
    if (mode === 'ultra-compact') {
      fontSize = 8;
      extraSpace = type === 'current' ? 20 : 14; // Icon + padding
    } else if (mode === 'compact') {
      fontSize = 10;
      extraSpace = type === 'current' ? 24 : 28; // Increased padding for next appointment chip
    } else {
      // normal
      fontSize = 12;
      extraSpace = type === 'current' ? 35 : 30; // Icon + padding + button padding
    }
    // More accurate estimation based on content
    const estimatedWidth = estimateTextWidth(textContent, fontSize, type === 'current') + extraSpace;
    // Add buffer space to ensure it fits completely
    return estimatedWidth + 4 <= availableWidth / (type === 'next' ? 1 : 2);
  };
  // Helper function to estimate text width more accurately
  const estimateTextWidth = (text: string, fontSize: number, isBold: boolean = false) => {
    // More accurate character widths based on font characteristics
    const charWidthMap: {
      [key: string]: number;
    } = {
      i: 0.3,
      l: 0.3,
      t: 0.4,
      f: 0.4,
      j: 0.4,
      r: 0.4,
      I: 0.4,
      ' ': 0.3,
      m: 0.9,
      w: 0.9,
      W: 1.0,
      M: 1.0,
      G: 0.8,
      O: 0.8,
      Q: 0.8,
      C: 0.8,
      D: 0.8,
      ':': 0.3,
      '.': 0.3,
      ',': 0.3,
      '(': 0.4,
      ')': 0.4
    };
    // Base width calculation
    const baseWidth = fontSize * (isBold ? 0.65 : 0.55);
    // Calculate width based on individual characters
    let totalWidth = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charWidth = charWidthMap[char] || 0.6; // Default to 0.6 if not in map
      totalWidth += charWidth * fontSize * (isBold ? 1.1 : 1);
    }
    return totalWidth;
  };
  // Render the bottom time indicators row based on view mode
  const renderTimeIndicators = () => {
    // Hide for clocked out staff
    if (staff.status === 'off') {
      return null;
    }
    // Get available width for calculations (account for padding)
    const availableWidth = cardWidth - (viewMode === 'ultra-compact' ? 4 : viewMode === 'compact' ? 8 : 16);
    // Calculate if a timestamp element would fit in available space
    const wouldFit = (content: string, mode: string, type: 'last' | 'current' | 'next') => {
      let textContent = content;
      let fontSize = 10; // Default font size in pixels
      let extraSpace = 0; // Extra space for icon and padding
      if (mode === 'ultra-compact') {
        fontSize = 8;
        extraSpace = type === 'current' ? 20 : 14; // Icon + padding
      } else if (mode === 'compact') {
        fontSize = 10;
        extraSpace = type === 'current' ? 24 : 28; // Increased padding for next appointment chip
      } else {
        // normal
        fontSize = 12;
        extraSpace = type === 'current' ? 35 : 30; // Icon + padding + button padding
      }
      // More accurate estimation based on content
      const estimatedWidth = estimateTextWidth(textContent, fontSize, type === 'current') + extraSpace;
      // Add buffer space to ensure it fits completely
      return estimatedWidth + 4 <= availableWidth / (type === 'next' ? 1 : 2);
    };
    // Check if we have the various time elements
    const hasLastService = config.showLastService && staff.lastServiceTime;
    const hasNextAppointment = config.showNextAppointment && staff.nextAppointmentTime;
    const hasCurrentTicket = currentTicketInfo !== null && staff.status === 'busy';
    // Skip rendering current ticket info if it's shown in the notch
    const showingTicketInNotch = hasCurrentTicket;
    // Ultra-compact view
    if (viewMode === 'ultra-compact') {
      // If we have a current ticket, it takes highest priority
      if (hasCurrentTicket) {
        // Calculate space requirements
        const remainingWidth = availableWidth; // Use all available width for last/next
        // Check if next and last would fit in the remaining space
        const lastWidth = hasLastService ? wouldFit(formatTime(staff.lastServiceTime), 'ultra-compact', 'last') : 0;
        const nextWidth = hasNextAppointment ? wouldFit(formatTime(staff.nextAppointmentTime), 'ultra-compact', 'next') : 0;
        // Show Last and Next only if they fit completely (no truncation)
        const showLast = hasLastService && lastWidth <= remainingWidth / 2;
        const showNext = hasNextAppointment && nextWidth <= remainingWidth / 2;
        // If neither fits or none exists, return null
        if (!showLast && !showNext) return null;
        // Show last and/or next
        return <div className="flex justify-between items-center w-full mt-0.5 px-0.5">
            {/* Last Service - Past */}
            {showLast ? <Tippy content={`Last Service: ${staff.lastServiceTime}${staff.lastServiceAgo ? ` (${staff.lastServiceAgo})` : ''}`}>
                <button className={`flex items-center ${status.grayOutOverlay ? 'bg-amber-900/40 text-amber-100/80' : 'bg-amber-50 text-amber-700/80'} hover:bg-amber-100 text-[7.5px] font-medium px-1.5 py-0.5 rounded-full shadow-sm transition-colors duration-200`}>
                  <ClassicIcons.ClockAnalog size={6} color={status.grayOutOverlay ? '#FCD34D' : '#B45309'} className="mr-0.5 opacity-80" />
                  <span className="truncate">
                    {formatTime(staff.lastServiceTime)}
                  </span>
                </button>
              </Tippy> : <div></div>}
            {/* No Current Ticket - we're removing this */}
            <div className={`mx-0.5 ${!showLast && !showNext ? 'flex justify-center w-full' : 'flex-initial'}`}></div>
            {/* Next Appointment - Future */}
            {showNext ? <Tippy content={`Next Appointment: ${staff.nextAppointmentTime}${staff.nextAppointmentEta ? ` (${staff.nextAppointmentEta})` : ''}`}>
                <button className={`flex items-center ${status.grayOutOverlay ? 'bg-blue-900/40 text-blue-100/80' : 'bg-blue-50 text-blue-700/80'} hover:bg-blue-100 text-[7.5px] font-medium px-1.5 py-0.5 rounded-full shadow-sm transition-colors duration-200`}>
                  <ClassicIcons.NextAppointment size={6} color={status.grayOutOverlay ? '#93C5FD' : '#1E40AF'} className="mr-0.5 opacity-80" />
                  <span className="truncate">
                    {formatTime(staff.nextAppointmentTime)}
                  </span>
                </button>
              </Tippy> : <div></div>}
          </div>;
      } else {
        // No current ticket - check if next or last fits
        // Higher priority to Next Appointment over Last Service
        const lastWidth = hasLastService ? wouldFit(formatTime(staff.lastServiceTime), 'ultra-compact', 'last') : 0;
        const nextWidth = hasNextAppointment ? wouldFit(formatTime(staff.nextAppointmentTime), 'ultra-compact', 'next') : 0;
        // Show Next if it fits completely
        const showNext = hasNextAppointment && nextWidth <= availableWidth / 2;
        // Show Last only if Next doesn't exist or if both fit
        const showLast = hasLastService && (!showNext && lastWidth <= availableWidth / 2 || showNext && lastWidth <= availableWidth / 2);
        // If neither fits or none exists, return null
        if (!showLast && !showNext) return null;
        // If only Next exists or fits, center it
        if (!showLast && showNext) {
          return <div className="flex justify-center items-center w-full mt-0.5 px-0.5">
              <Tippy content={`Next Appointment: ${staff.nextAppointmentTime}${staff.nextAppointmentEta ? ` (${staff.nextAppointmentEta})` : ''}`}>
                <button className={`flex items-center ${status.grayOutOverlay ? 'bg-blue-900/40 text-blue-100/80' : 'bg-blue-50 text-blue-700/80'} hover:bg-blue-100 text-[7.5px] font-medium px-1.5 py-0.5 rounded-full shadow-sm transition-colors duration-200`}>
                  <ClassicIcons.NextAppointment size={6} color={status.grayOutOverlay ? '#93C5FD' : '#1E40AF'} className="mr-0.5 opacity-80" />
                  <span className="truncate">
                    {formatTime(staff.nextAppointmentTime)}
                  </span>
                </button>
              </Tippy>
            </div>;
        }
        // If only Last exists or fits, center it
        if (showLast && !showNext) {
          return <div className="flex justify-center items-center w-full mt-0.5 px-0.5">
              <Tippy content={`Last Service: ${staff.lastServiceTime}${staff.lastServiceAgo ? ` (${staff.lastServiceAgo})` : ''}`}>
                <button className={`flex items-center ${status.grayOutOverlay ? 'bg-amber-900/40 text-amber-100/80' : 'bg-amber-50 text-amber-700/80'} hover:bg-amber-100 text-[7.5px] font-medium px-1.5 py-0.5 rounded-full shadow-sm transition-colors duration-200`}>
                  <ClassicIcons.ClockAnalog size={6} color={status.grayOutOverlay ? '#FCD34D' : '#B45309'} className="mr-0.5 opacity-80" />
                  <span className="truncate">
                    {formatTime(staff.lastServiceTime)}
                  </span>
                </button>
              </Tippy>
            </div>;
        }
        // Both fit, show them
        return <div className="flex justify-between items-center w-full mt-0.5 px-0.5">
            {/* Last Service - Past */}
            <Tippy content={`Last Service: ${staff.lastServiceTime}${staff.lastServiceAgo ? ` (${staff.lastServiceAgo})` : ''}`}>
              <button className={`flex items-center ${status.grayOutOverlay ? 'bg-amber-900/40 text-amber-100/80' : 'bg-amber-50 text-amber-700/80'} hover:bg-amber-100 text-[7.5px] font-medium px-1.5 py-0.5 rounded-full shadow-sm transition-colors duration-200`}>
                <ClassicIcons.ClockAnalog size={6} color={status.grayOutOverlay ? '#FCD34D' : '#B45309'} className="mr-0.5 opacity-80" />
                <span className="truncate">
                  {formatTime(staff.lastServiceTime)}
                </span>
              </button>
            </Tippy>
            {/* Next Appointment - Future */}
            <Tippy content={`Next Appointment: ${staff.nextAppointmentTime}${staff.nextAppointmentEta ? ` (${staff.nextAppointmentEta})` : ''}`}>
              <button className={`flex items-center ${status.grayOutOverlay ? 'bg-blue-900/40 text-blue-100/80' : 'bg-blue-50 text-blue-700/80'} hover:bg-blue-100 text-[7.5px] font-medium px-1.5 py-0.5 rounded-full shadow-sm transition-colors duration-200`}>
                <ClassicIcons.NextAppointment size={6} color={status.grayOutOverlay ? '#93C5FD' : '#1E40AF'} className="mr-0.5 opacity-80" />
                <span className="truncate">
                  {formatTime(staff.nextAppointmentTime)}
                </span>
              </button>
            </Tippy>
          </div>;
      }
    }
    // Compact view
    if (viewMode === 'compact') {
      // If we have a current ticket, it takes highest priority
      if (hasCurrentTicket) {
        // Calculate space requirements
        const remainingWidth = availableWidth; // Use all available width for last/next
        // Check if last and next would fit in remaining space
        const lastWidth = hasLastService ? wouldFit(formatTime(staff.lastServiceTime), 'compact', 'last') : 0;
        const nextWidth = hasNextAppointment ? wouldFit(formatTime(staff.nextAppointmentTime), 'compact', 'next') : 0;
        // Show Last and Next only if they fit completely (no truncation)
        // Priority to Next Appointment over Last Service
        const showNext = hasNextAppointment && nextWidth <= remainingWidth / 2;
        const showLast = hasLastService && lastWidth <= remainingWidth / 2;
        // If we're showing the ticket in the notch, don't show current ticket info in bottom
        if (showingTicketInNotch) {
          return <div className="flex justify-between items-center mt-1">
              {/* Last Service - Past */}
              {showLast ? <Tippy content={`Last Service: ${staff.lastServiceTime}${staff.lastServiceAgo ? ` (${staff.lastServiceAgo})` : ''}`}>
                  <button className={`flex items-center ${status.grayOutOverlay ? 'bg-amber-900/40 text-amber-100/80' : 'bg-amber-50 text-amber-700/80'} hover:bg-amber-100 text-[9px] font-medium px-2 py-0.5 rounded-full shadow-sm transition-colors duration-200`}>
                    <ClassicIcons.ClockAnalog size={8} color={status.grayOutOverlay ? '#FCD34D' : '#B45309'} className="mr-0.5 opacity-80" />
                    <span className="truncate">
                      {formatTime(staff.lastServiceTime)}
                    </span>
                  </button>
                </Tippy> : !showLast && !showNext ? <div></div> : <div className="flex-1"></div>}
              {/* Next Appointment - Future */}
              {showNext ? <Tippy content={`Next Appointment: ${staff.nextAppointmentTime}${staff.nextAppointmentEta ? ` (${staff.nextAppointmentEta})` : ''}`}>
                  <button className={`flex items-center ${status.grayOutOverlay ? 'bg-blue-900/40 text-blue-100/80' : 'bg-blue-50 text-blue-700/80'} hover:bg-blue-100 text-[9px] font-medium px-2 py-0.5 rounded-full shadow-sm transition-colors duration-200`}>
                    <ClassicIcons.NextAppointment size={8} color={status.grayOutOverlay ? '#93C5FD' : '#1E40AF'} className="mr-0.5 opacity-80" />
                    <span className="truncate">
                      {formatTime(staff.nextAppointmentTime)}
                    </span>
                  </button>
                </Tippy> : !showLast && !showNext ? <div></div> : <div className="flex-1"></div>}
            </div>;
        }
      } else {
        // No current ticket - prioritize Next over Last
        const lastWidth = hasLastService ? wouldFit(formatTime(staff.lastServiceTime), 'compact', 'last') : 0;
        const nextWidth = hasNextAppointment ? wouldFit(formatTime(staff.nextAppointmentTime), 'compact', 'next') : 0;
        // Show Next if it fits completely
        const showNext = hasNextAppointment && nextWidth <= availableWidth / 2;
        // Show Last only if Next doesn't exist or if both fit
        const showLast = hasLastService && (!showNext && lastWidth <= availableWidth / 2 || showNext && lastWidth <= availableWidth / 2);
        // If neither fits or none exists, return null
        if (!showLast && !showNext) return null;
        // If only Next exists or fits, center it
        if (!showLast && showNext) {
          return <div className="flex justify-center items-center mt-1">
              <Tippy content={`Next Appointment: ${staff.nextAppointmentTime}${staff.nextAppointmentEta ? ` (${staff.nextAppointmentEta})` : ''}`}>
                <button className={`flex items-center ${status.grayOutOverlay ? 'bg-blue-900/40 text-blue-100/80' : 'bg-blue-50 text-blue-700/80'} hover:bg-blue-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
                  <ClassicIcons.NextAppointment size={10} color={status.grayOutOverlay ? '#93C5FD' : '#1E40AF'} className="mr-1 opacity-80" />
                  <span className="truncate">
                    {formatTime(staff.nextAppointmentTime)}
                  </span>
                </button>
              </Tippy>
            </div>;
        }
        // If only Last exists or fits, center it
        if (showLast && !showNext) {
          return <div className="flex justify-center items-center mt-1">
              <Tippy content={`Last Service: ${staff.lastServiceTime}${staff.lastServiceAgo ? ` (${staff.lastServiceAgo})` : ''}`}>
                <button className={`flex items-center ${status.grayOutOverlay ? 'bg-amber-900/40 text-amber-100/80' : 'bg-amber-50 text-amber-700/80'} hover:bg-amber-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
                  <ClassicIcons.ClockAnalog size={10} color={status.grayOutOverlay ? '#FCD34D' : '#B45309'} className="mr-1 opacity-80" />
                  <span className="truncate">
                    {formatTime(staff.lastServiceTime)}
                  </span>
                </button>
              </Tippy>
            </div>;
        }
        // Both fit, show them
        return <div className="flex justify-between items-center space-x-2 mt-1">
            {/* Last Service - Past */}
            <Tippy content={`Last Service: ${staff.lastServiceTime}${staff.lastServiceAgo ? ` (${staff.lastServiceAgo})` : ''}`}>
              <button className={`flex items-center ${status.grayOutOverlay ? 'bg-amber-900/40 text-amber-100/80' : 'bg-amber-50 text-amber-700/80'} hover:bg-amber-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
                <ClassicIcons.ClockAnalog size={10} color={status.grayOutOverlay ? '#FCD34D' : '#B45309'} className="mr-1 opacity-80" />
                <span className="truncate">
                  {formatTime(staff.lastServiceTime)}
                </span>
              </button>
            </Tippy>
            {/* Next Appointment - Future */}
            <Tippy content={`Next Appointment: ${staff.nextAppointmentTime}${staff.nextAppointmentEta ? ` (${staff.nextAppointmentEta})` : ''}`}>
              <button className={`flex items-center ${status.grayOutOverlay ? 'bg-blue-900/40 text-blue-100/80' : 'bg-blue-50 text-blue-700/80'} hover:bg-blue-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
                <ClassicIcons.NextAppointment size={10} color={status.grayOutOverlay ? '#93C5FD' : '#1E40AF'} className="mr-1 opacity-80" />
                <span className="truncate">
                  {formatTime(staff.nextAppointmentTime)}
                </span>
              </button>
            </Tippy>
          </div>;
      }
    }
    // Normal view
    // If we have a current ticket, show Last and Next appointments only
    if (hasCurrentTicket) {
      // Skip rendering current ticket info if it's shown in the notch
      if (showingTicketInNotch) {
        // Only show Last and Next appointments
        const lastWidth = hasLastService ? wouldFit(`Last: ${formatTime(staff.lastServiceTime)}`, 'normal', 'last') : 0;
        const nextWidth = hasNextAppointment ? wouldFit(`Next: ${formatTime(staff.nextAppointmentTime)}`, 'normal', 'next') : 0;
        // Show Last and Next only if they fit
        const showNext = hasNextAppointment && nextWidth <= availableWidth / 2;
        const showLast = hasLastService && lastWidth <= availableWidth / 2;
        if (!showLast && !showNext) return null;
        if (showLast && showNext) {
          return <div className="flex justify-between items-center space-x-2 mt-2">
              {/* Last Service - Past */}
              <Tippy content={`Last Service: ${staff.lastServiceTime}${staff.lastServiceAgo ? ` (${staff.lastServiceAgo})` : ''}`}>
                <button className={`flex items-center ${status.grayOutOverlay ? 'bg-amber-900/40 text-amber-100/80' : 'bg-amber-50 text-amber-700/80'} hover:bg-amber-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
                  <ClassicIcons.ClockAnalog size={10} color={status.grayOutOverlay ? '#FCD34D' : '#B45309'} className="mr-1 opacity-80" />
                  <span className="truncate">
                    Last: {formatTime(staff.lastServiceTime)}
                    {staff.lastServiceAgo && !hasNextAppointment && <span className={`ml-1 ${status.grayOutOverlay ? 'text-amber-200' : 'text-amber-800'} font-medium`}>
                        ({staff.lastServiceAgo})
                      </span>}
                  </span>
                </button>
              </Tippy>
              {/* Next Appointment - Future */}
              <Tippy content={`Next Appointment: ${staff.nextAppointmentTime}${staff.nextAppointmentEta ? ` (${staff.nextAppointmentEta})` : ''}`}>
                <button className={`flex items-center ${status.grayOutOverlay ? 'bg-blue-900/40 text-blue-100/80' : 'bg-blue-50 text-blue-700/80'} hover:bg-blue-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
                  <ClassicIcons.NextAppointment size={10} color={status.grayOutOverlay ? '#93C5FD' : '#1E40AF'} className="mr-1 opacity-80" />
                  <span className="truncate">
                    Next: {formatTime(staff.nextAppointmentTime)}
                    {staff.nextAppointmentEta && !hasLastService && <span className={`ml-1 ${status.grayOutOverlay ? 'text-blue-200' : 'text-blue-800'} font-medium`}>
                        (In {staff.nextAppointmentEta})
                      </span>}
                  </span>
                </button>
              </Tippy>
            </div>;
        }
        // If only one is shown, center it
        return <div className="flex justify-center mt-2">
            {showLast ? <Tippy content={`Last Service: ${staff.lastServiceTime}${staff.lastServiceAgo ? ` (${staff.lastServiceAgo})` : ''}`}>
                <button className={`flex items-center ${status.grayOutOverlay ? 'bg-amber-900/40 text-amber-100/80' : 'bg-amber-50 text-amber-700/80'} hover:bg-amber-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
                  <ClassicIcons.ClockAnalog size={10} color={status.grayOutOverlay ? '#FCD34D' : '#B45309'} className="mr-1 opacity-80" />
                  <span className="truncate">
                    Last: {formatTime(staff.lastServiceTime)}
                    {staff.lastServiceAgo && <span className={`ml-1 ${status.grayOutOverlay ? 'text-amber-200' : 'text-amber-800'} font-medium`}>
                        ({staff.lastServiceAgo})
                      </span>}
                  </span>
                </button>
              </Tippy> : showNext ? <Tippy content={`Next Appointment: ${staff.nextAppointmentTime}${staff.nextAppointmentEta ? ` (${staff.nextAppointmentEta})` : ''}`}>
                <button className={`flex items-center ${status.grayOutOverlay ? 'bg-blue-900/40 text-blue-100/80' : 'bg-blue-50 text-blue-700/80'} hover:bg-blue-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
                  <ClassicIcons.NextAppointment size={10} color={status.grayOutOverlay ? '#93C5FD' : '#1E40AF'} className="mr-1 opacity-80" />
                  <span className="truncate">
                    Next: {formatTime(staff.nextAppointmentTime)}
                    {staff.nextAppointmentEta && <span className={`ml-1 ${status.grayOutOverlay ? 'text-blue-200' : 'text-blue-800'} font-medium`}>
                        (In {staff.nextAppointmentEta})
                      </span>}
                  </span>
                </button>
              </Tippy> : null}
          </div>;
      }
    } else {
      // No current ticket - prioritize Next over Last
      const lastWidth = hasLastService ? wouldFit(`Last: ${formatTime(staff.lastServiceTime)}`, 'normal', 'last') : 0;
      const nextWidth = hasNextAppointment ? wouldFit(`Next: ${formatTime(staff.nextAppointmentTime)}`, 'normal', 'next') : 0;
      // For minimized views (compact and ultra-compact), return null
      if (viewMode === 'compact' || viewMode === 'ultra-compact') {
        return null;
      }
      // Show Next if it fits completely
      const showNext = hasNextAppointment && nextWidth <= availableWidth / 2;
      // Show Last only if Next doesn't exist or if both fit
      const showLast = hasLastService && (!showNext && lastWidth <= availableWidth / 2 || showNext && lastWidth <= availableWidth / 2);
      // If neither fits or none exists, return null
      if (!showLast && !showNext) return null;
      // If only Next exists or fits, center it
      if (!showLast && showNext) {
        return <div className="flex justify-center mt-2">
            <Tippy content={`Next Appointment: ${staff.nextAppointmentTime}${staff.nextAppointmentEta ? ` (${staff.nextAppointmentEta})` : ''}`}>
              <button className={`flex items-center ${status.grayOutOverlay ? 'bg-blue-900/40 text-blue-100/80' : 'bg-blue-50 text-blue-700/80'} hover:bg-blue-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
                <ClassicIcons.NextAppointment size={10} color={status.grayOutOverlay ? '#93C5FD' : '#1E40AF'} className="mr-1 opacity-80" />
                <span className="truncate">
                  Next: {formatTime(staff.nextAppointmentTime)}
                  {staff.nextAppointmentEta && <span className={`ml-1 ${status.grayOutOverlay ? 'text-blue-200' : 'text-blue-800'} font-medium`}>
                      (In {staff.nextAppointmentEta})
                    </span>}
                </span>
              </button>
            </Tippy>
          </div>;
      }
      // If only Last exists or fits, center it
      if (showLast && !showNext) {
        return <div className="flex justify-center mt-2">
            <Tippy content={`Last Service: ${staff.lastServiceTime}${staff.lastServiceAgo ? ` (${staff.lastServiceAgo})` : ''}`}>
              <button className={`flex items-center ${status.grayOutOverlay ? 'bg-amber-900/40 text-amber-100/80' : 'bg-amber-50 text-amber-700/80'} hover:bg-amber-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
                <ClassicIcons.ClockAnalog size={10} color={status.grayOutOverlay ? '#FCD34D' : '#B45309'} className="mr-1 opacity-80" />
                <span className="truncate">
                  Last: {formatTime(staff.lastServiceTime)}
                  {staff.lastServiceAgo && <span className={`ml-1 ${status.grayOutOverlay ? 'text-amber-200' : 'text-amber-800'} font-medium`}>
                      ({staff.lastServiceAgo})
                    </span>}
                </span>
              </button>
            </Tippy>
          </div>;
      }
      // Both fit, show them side by side
      return <div className="flex justify-between items-center space-x-2 mt-2">
          {/* Last Service - Past */}
          <Tippy content={`Last Service: ${staff.lastServiceTime}${staff.lastServiceAgo ? ` (${staff.lastServiceAgo})` : ''}`}>
            <button className={`flex items-center ${status.grayOutOverlay ? 'bg-amber-900/40 text-amber-100/80' : 'bg-amber-50 text-amber-700/80'} hover:bg-amber-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
              <ClassicIcons.ClockAnalog size={10} color={status.grayOutOverlay ? '#FCD34D' : '#B45309'} className="mr-1 opacity-80" />
              <span className="truncate">
                Last: {formatTime(staff.lastServiceTime)}
                {staff.lastServiceAgo && !hasNextAppointment && <span className={`ml-1 ${status.grayOutOverlay ? 'text-amber-200' : 'text-amber-800'} font-medium`}>
                    ({staff.lastServiceAgo})
                  </span>}
              </span>
            </button>
          </Tippy>
          {/* Next Appointment - Future */}
          <Tippy content={`Next Appointment: ${staff.nextAppointmentTime}${staff.nextAppointmentEta ? ` (${staff.nextAppointmentEta})` : ''}`}>
            <button className={`flex items-center ${status.grayOutOverlay ? 'bg-blue-900/40 text-blue-100/80' : 'bg-blue-50 text-blue-700/80'} hover:bg-blue-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
              <ClassicIcons.NextAppointment size={10} color={status.grayOutOverlay ? '#93C5FD' : '#1E40AF'} className="mr-1 opacity-80" />
              <span className="truncate">
                Next: {formatTime(staff.nextAppointmentTime)}
                {staff.nextAppointmentEta && !hasLastService && <span className={`ml-1 ${status.grayOutOverlay ? 'text-blue-200' : 'text-blue-800'} font-medium`}>
                    (In {staff.nextAppointmentEta})
                  </span>}
              </span>
            </button>
          </Tippy>
        </div>;
    }
    return null;
  };
  // Render active ticket row for normal view
  const renderActiveTicketRow = () => {
    if (!hasActiveTickets()) return null;
    const primaryTicket = getPrimaryActiveTicket();
    const additionalCount = getAdditionalTicketsCount();
    if (!primaryTicket) return null;
    // Log for debugging
    console.log(`Rendering active ticket for ${staff.name}:`, primaryTicket);
    return <div className="flex items-center justify-center space-x-2 my-2">
        {/* Primary ticket chip */}
        <Tippy content={`${primaryTicket.clientName} - ${primaryTicket.serviceName}`}>
          <div className="flex items-center px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer" style={{
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          maxWidth: cardWidth < 400 ? '180px' : '240px',
          zIndex: status.grayOutOverlay ? 30 : 20
        }}>
            {/* Status dot */}
            {primaryTicket.status === 'in-service' ? <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div> : <div className="w-2 h-2 rounded-full border-2 border-amber-400 mr-2"></div>}
            {/* Ticket icon */}
            <Ticket size={14} className="text-gray-500 mr-2" strokeWidth={1.5} />
            {/* Client name and service */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <span className="font-semibold text-gray-900 truncate mr-1">
                  {primaryTicket.clientName}
                </span>
                {cardWidth >= 300 && <>
                    <span className="text-gray-400 mx-1">—</span>
                    <span className="text-gray-600 truncate">
                      {primaryTicket.serviceName}
                    </span>
                  </>}
              </div>
            </div>
          </div>
        </Tippy>
        {/* Additional tickets chip */}
        {additionalCount > 0 && <Tippy content={`${additionalCount} more active ${additionalCount === 1 ? 'ticket' : 'tickets'}`}>
            <div className="flex items-center px-2.5 py-1.5 bg-gray-50 rounded-full shadow-sm border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-all cursor-pointer" style={{
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          zIndex: status.grayOutOverlay ? 30 : 20
        }}>
              <span className="text-gray-600 font-medium text-sm">
                +{additionalCount}
              </span>
            </div>
          </Tippy>}
      </div>;
  };
  // Render active ticket row for compact view
  const renderCompactActiveTicketRow = () => {
    if (!hasActiveTickets()) return null;
    const primaryTicket = getPrimaryActiveTicket();
    const additionalCount = getAdditionalTicketsCount();
    if (!primaryTicket) return null;
    return <div className="flex items-center justify-center space-x-1.5 my-1.5">
        {/* Primary ticket chip */}
        <Tippy content={`${primaryTicket.clientName} - ${primaryTicket.serviceName}`}>
          <div className="flex items-center px-2.5 py-1 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer" style={{
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          maxWidth: '140px',
          zIndex: status.grayOutOverlay ? 30 : 20
        }}>
            {/* Status dot */}
            {primaryTicket.status === 'in-service' ? <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div> : <div className="w-1.5 h-1.5 rounded-full border-1.5 border-amber-400 mr-1.5"></div>}
            {/* Ticket icon */}
            <Ticket size={10} className="text-gray-500 mr-1.5" strokeWidth={1.5} />
            {/* Client name and service */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <span className="font-semibold text-xs text-gray-900 truncate mr-0.5">
                  {primaryTicket.clientName}
                </span>
                {cardWidth >= 200 && <>
                    <span className="text-gray-400 text-xs mx-0.5">—</span>
                    <span className="text-gray-600 text-xs truncate">
                      {primaryTicket.serviceName}
                    </span>
                  </>}
              </div>
            </div>
          </div>
        </Tippy>
        {/* Additional tickets chip */}
        {additionalCount > 0 && <Tippy content={`${additionalCount} more active ${additionalCount === 1 ? 'ticket' : 'tickets'}`}>
            <div className="flex items-center px-2 py-1 bg-gray-50 rounded-full shadow-sm border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-all cursor-pointer" style={{
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          zIndex: status.grayOutOverlay ? 30 : 20
        }}>
              <span className="text-gray-600 font-medium text-xs">
                +{additionalCount}
              </span>
            </div>
          </Tippy>}
      </div>;
  };
  // Render active ticket row for ultra-compact view
  const renderUltraCompactActiveTicketRow = () => {
    if (!hasActiveTickets()) return null;
    const primaryTicket = getPrimaryActiveTicket();
    const additionalCount = getAdditionalTicketsCount();
    if (!primaryTicket) return null;
    return <div className="flex items-center justify-center space-x-1 my-1">
        {/* Primary ticket chip */}
        <Tippy content={`${primaryTicket.clientName} - ${primaryTicket.serviceName}`}>
          <div className="flex items-center px-1.5 py-0.5 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer" style={{
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          maxWidth: '70px',
          zIndex: status.grayOutOverlay ? 30 : 20
        }}>
            {/* Status dot */}
            {primaryTicket.status === 'in-service' ? <div className="w-1 h-1 bg-emerald-500 rounded-full mr-1"></div> : <div className="w-1 h-1 rounded-full border border-amber-400 mr-1"></div>}
            {/* Client name only */}
            <div className="flex-1 min-w-0">
              <span className="font-medium text-[8px] text-gray-900 truncate">
                {primaryTicket.clientName}
              </span>
            </div>
          </div>
        </Tippy>
        {/* Additional tickets chip - ultra minimal */}
        {additionalCount > 0 && <Tippy content={`${additionalCount} more active ${additionalCount === 1 ? 'ticket' : 'tickets'}`}>
            <div className="flex items-center justify-center w-4 h-4 bg-gray-50 rounded-full shadow-sm border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-all cursor-pointer" style={{
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          zIndex: status.grayOutOverlay ? 30 : 20
        }}>
              <span className="text-gray-600 font-medium text-[6px]">
                +{additionalCount}
              </span>
            </div>
          </Tippy>}
      </div>;
  };
  // COMPACT VIEW - Optimized for minimized staff card view
  if (viewMode === 'compact') {
    // Calculate available width for name and adjust font size if needed
    const availableNameWidth = cardWidth * 0.6 - 24; // 60% of card width minus padding
    const nameLength = displayName.length;
    const baseFontSize = 0.9625; // Base font size in rem
    // Calculate font size reduction (up to 10%) based on name length
    const calculateNameFontSize = () => {
      if (nameLength <= 8 || availableNameWidth > nameLength * 10) {
        return baseFontSize; // Default size for short names or plenty of space
      } else if (nameLength <= 12) {
        return Math.max(baseFontSize * 0.95, baseFontSize * 0.9); // 5% reduction
      } else {
        return baseFontSize * 0.9; // 10% reduction for long names
      }
    };
    // Calculate right padding adjustment based on name length
    const calculateRightPadding = () => {
      if (nameLength <= 8) return '1.5rem'; // Default padding
      if (nameLength <= 12) return '1rem'; // Slightly reduced
      return '0.75rem'; // Minimum padding for very long names
    };
    // Determine if notch should be minimized
    const useMinimalNotch = cardWidth < 160;
    return <div ref={cardRef} className={`group flex items-center p-2 w-full ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''} ${getTransitionClass()}`} style={{
      borderRadius: '14px',
      boxShadow: status.grayOutOverlay ? '0 4px 8px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.2)' // Enhanced heavier shadow for busy
      : '0 2px 5px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
      border: status.grayOutOverlay ? `2px solid ${specialtyColor.darkBorderColor}` // Darker border for busy
      : `2px solid ${specialtyColor.darkBorderColor}`,
      position: 'relative',
      overflow: 'hidden',
      transformStyle: 'preserve-3d',
      cursor: isDraggable ? 'grab' : 'pointer',
      filter: status.grayOutOverlay ? 'contrast(0.85) grayscale(0.35) brightness(0.95)' // Enhanced desaturation
      : 'none',
      transform: status.grayOutOverlay ? 'translateY(1px)' : 'none' // Subtle pressed effect for busy cards
    }} tabIndex={0} role="button" aria-label={`${staff.name}, ${status.label}, Queue position: ${staff.count}`}>
        {/* Metallic gradient background */}
        <div className="absolute inset-0 z-0" style={{
        background: status.grayOutOverlay ? `linear-gradient(to bottom, ${specialtyColor.metalGradientFromDark}, ${specialtyColor.metalGradientToDark})` : `linear-gradient(to bottom, ${specialtyColor.metalGradientFrom}, ${specialtyColor.metalGradientTo})`,
        opacity: status.grayOutOverlay ? 0.7 : 0.85 // Reduced opacity for busy status
      }}></div>
        {/* Inner shadow/bevel effect */}
        <div className="absolute inset-0 z-0 rounded-[12px] pointer-events-none" style={{
        boxShadow: status.grayOutOverlay ? 'inset 0 1px 3px rgba(0, 0, 0, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' // Deeper inner shadow for busy
        : 'inset 0 1px 2px rgba(255, 255, 255, 0.6), inset 0 -1px 2px rgba(0, 0, 0, 0.1)'
      }}></div>
        {/* Enhanced Semi-circle notch at top border - IMPROVED RESPONSIVE SIZING */}
        <div className="absolute top-0 left-1/2 z-20 transform -translate-x-1/2 translate-y-0" style={{
        width: useMinimalNotch ? '2.1rem' : '2.7rem',
        height: useMinimalNotch ? '1.2rem' : '1.5rem' // Reduced by 40% from original sizes
      }}>
          {/* Notch shadow/depth effect */}
          <div className={`absolute inset-0 bg-black opacity-10 ${staff.status === 'ready' ? 'rounded-b-[5px]' : 'rounded-b-[6px]'}`} style={{
          transform: 'translateY(1px)',
          boxShadow: '0 1.5px 2px rgba(0, 0, 0, 0.08)',
          height: staff.status === 'ready' ? '2.5px' : undefined
        }}></div>
          {/* Notch main shape */}
          <div className={`absolute inset-0 bg-white ${staff.status === 'ready' ? 'rounded-b-[5px]' : 'rounded-b-[6px]'}`} style={{
          borderTop: 'none',
          borderLeft: `1px solid ${specialtyColor.darkBorderColor}`,
          borderRight: `1px solid ${specialtyColor.darkBorderColor}`,
          borderBottom: `1px solid ${specialtyColor.darkBorderColor}`,
          boxShadow: 'inset 0 -1.5px 2px rgba(0, 0, 0, 0.04)',
          opacity: status.grayOutOverlay ? 0.85 : 1,
          height: staff.status === 'ready' ? '2.5px' : undefined
        }}></div>
          {/* Percentage display for minimal notch */}
          {useMinimalNotch && currentTicketInfo && staff.status === 'busy' && <div className="absolute bottom-0 left-0 right-0 flex justify-center">
              <span className="text-[8px] font-bold" style={{
            color: currentTicketInfo.progress <= 0.25 ? '#22C55E' // Green for on-track
            : currentTicketInfo.progress <= 0.75 ? '#F59E0B' // Amber for mid-progress
            : '#EF4444' // Red for critical or overtime
          }}>
                {Math.round(currentTicketInfo.progress * 100)}%
              </span>
            </div>}
        </div>
        {/* Enhanced separation line - visible even in compact view */}
        <div className="absolute top-0 bottom-0 left-[25%] w-[1px] h-full z-10" style={{
        background: status.grayOutOverlay ? 'rgba(180, 40, 60, 0.12)' : specialtyColor.darkText ? 'rgba(0,0,0,0.1)' // Darker line for lighter colors
        : 'rgba(255,255,255,0.2)',
        boxShadow: specialtyColor.darkText ? '1px 0 1px rgba(255, 255, 255, 0.15)' // Subtle highlight for embossed effect
        : '1px 0 1px rgba(255, 255, 255, 0.25)' // More pronounced highlight for darker colors
      }}></div>
        {/* Gray out overlay for busy status - ENHANCED with striped pattern and increased contrast */}
        {status.grayOutOverlay && <>
            {/* Dark base overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none rounded-[13.5px]" style={{
          backgroundColor: 'rgba(40, 45, 60, 0.35)',
          mixBlendMode: 'multiply'
        }}></div>
            {/* Secondary desaturation overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none rounded-[13.5px]" style={{
          backgroundColor: 'rgba(220, 225, 235, 0.45)',
          mixBlendMode: 'saturation'
        }}></div>
            {/* Subtle inset shadow to create pressed effect */}
            <div className="absolute inset-0 z-11 pointer-events-none rounded-[13.5px]" style={{
          boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.2)',
          opacity: 0.7
        }}></div>
            {/* Progress bar for busy cards - ADDED FOR WIDE VIEW */}
            {viewMode === 'compact' && currentTicketInfo && <>
                {/* Progress percentage indicator */}
                <div className="absolute bottom-2 right-2 z-20">
                  <span className="text-[10px] font-bold px-1 py-0.5 rounded-sm" style={{
              color: currentTicketInfo.progress <= 0.25 ? '#22C55E' // Green for on-track
              : currentTicketInfo.progress <= 0.75 ? '#F59E0B' // Amber for mid-progress
              : '#EF4444',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
                    {Math.round(currentTicketInfo.progress * 100)}%
                  </span>
                </div>
                {/* Progress bar at bottom of card */}
                <div className="absolute bottom-0 left-0 right-0 h-1 z-20 overflow-hidden rounded-b-[13.5px]" style={{
            backgroundColor: 'rgba(236, 236, 236, 0.8)'
          }}>
                  <div className="h-full transition-all duration-500 ease-out" style={{
              width: `${Math.min(100, Math.round(currentTicketInfo.progress * 100))}%`,
              background: currentTicketInfo.progress <= 0.25 ? 'linear-gradient(90deg, #22C55E, #10B981)' // Green for on-track
              : currentTicketInfo.progress <= 0.75 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' // Amber for mid-progress
              : 'linear-gradient(90deg, #EF4444, #F87171)',
              boxShadow: currentTicketInfo.progress > 1 ? 'inset 0px 1px 1px rgba(255, 255, 255, 0.3), 0 0 5px rgba(239, 68, 68, 0.5)' // Red glow for overtime
              : 'inset 0px 1px 1px rgba(255, 255, 255, 0.3)'
            }}></div>
                </div>
              </>}
          </>}
        {/* More Options Button - positioned at middle right */}
        <button className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-all duration-300 p-1 flex-shrink-0 z-30" aria-label="More options for staff member" style={{
        right: nameLength > 10 ? '0.5rem' : '0.75rem',
        padding: nameLength > 12 ? '0.15rem' : '0.25rem' // Reduce padding for very long names
      }}>
          <MoreVertical size={14} strokeWidth={2} />
        </button>
        {isDraggable && <div className="absolute top-\\1/2 left-\\1 -transform -\\translate-y-\\1/2 opacity-0 group-hover:opacity-70 cursor-grab active:cursor-grabbing z-10 transition-opacity">
            <GripVertical size={16} className="text-gray-600" strokeWidth={2} />
          </div>}
        {/* Staff avatar with accent border - INCREASED SIZE BY 12% */}
        {config.showAvatar && <div className={`relative flex-shrink-0 z-10 ml-1 ${config.notchOverlapsAvatar ? 'mt-[-20px]' : ''}`}>
            {/* Time left indicator positioned to the left of avatar - ONLY SHOW IF NOT IN NOTCH */}
            {currentTicketInfo !== null && staff.status === 'busy' && !showingTicketInNotch && <div className="absolute top-1/2 -left-32 transform -translate-y-1/2 z-30">
                  <div className="flex items-center justify-center text-gray-800 font-medium bg-white px-2.5 py-1 rounded-full shadow-md border border-gray-200 whitespace-nowrap" style={{
            fontSize: cardWidth < 300 ? '12px' : '13px',
            lineHeight: '18px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
          }}>
                    <Clock size={cardWidth < 300 ? 11 : 12} className="mr-1 opacity-80" strokeWidth={2.5} />
                    <span>
                      {currentTicketInfo.timeLeft}m
                      {cardWidth >= 300 ? `/${currentTicketInfo.totalTime}m` : ''}{' '}
                      left
                    </span>
                  </div>
                </div>}
            <img src={staff.image} alt={`${staff.name} profile`} className={`w-[80px] h-[80px] rounded-full object-cover shadow-sm transition-all duration-300 group-hover:brightness-105 ${getTransitionClass()} ${status.grayOutOverlay ? 'grayscale-[30%] brightness-90' : ''}`} style={{
          boxShadow: status.grayOutOverlay ? '0 2px 4px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.15)' // Heavier shadow for busy
          : '0 2px 4px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
          border: status.grayOutOverlay ? `4.4px solid ${specialtyColor.darkBorderColor}` : `4.4px solid ${specialtyColor.borderColor}`,
          minWidth: '80px',
          minHeight: '80px',
          objectFit: 'cover',
          objectPosition: 'center'
        }} />
            {/* Queue Order Number - INCREASED SIZE */}
            {config.showQueueNumber && <div className="absolute -top-1 -left-1">
                <Tippy content={`Queue Position: ${staff.count}`}>
                  <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold text-gray-700 border border-white shadow-sm" aria-label={`Queue position: ${staff.count}`} style={{
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              opacity: status.grayOutOverlay ? 0.9 : 1 // Slightly dim for busy
            }}>
                    {staff.count}
                  </div>
                </Tippy>
              </div>}
            {/* Status indicator - ALWAYS VISIBLE (Tier 1) */}
            {config.showStatus && <div className="absolute -bottom-0.5 -right-0.5">
                <Tippy content={`Status: ${status.label}`}>
                  <div className={`${status.bg} w-7 h-7 rounded-full flex items-center justify-center shadow-sm border-2 border-white ${status.grayOutOverlay ? 'shadow-rose-500/30' : status.glowColor}`} style={{
              boxShadow: status.grayOutOverlay ? '0 2px 4px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(225, 29, 72, 0.3)' // Enhanced shadow with rose tint for busy
              : '0 2px 4px rgba(0, 0, 0, 0.2)' // Normal shadow
            }} aria-label={`Status: ${status.label}`}>
                    <div className={`w-2.5 h-2.5 rounded-full bg-white animate-pulse ${status.grayOutOverlay ? 'opacity-90' : 'opacity-80'}`}></div>
                  </div>
                </Tippy>
              </div>}
            {/* Busy status indicator at bottom of avatar - Only shown for busy staff */}
            {status.label === 'Busy' && <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-20">
                <Tippy content="Status: Busy">
                  <div className="bg-rose-600 text-white flex items-center px-3 py-1 rounded-full shadow-md" style={{
              boxShadow: '0 3px 5px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
            }} aria-label="Status: Busy">
                    <CircleDot size={12} className="mr-1.5 animate-pulse" strokeWidth={2.5} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Busy
                    </span>
                  </div>
                </Tippy>
              </div>}
          </div>}
        {/* Staff info - Name and status - IMPROVED RESPONSIVE HANDLING */}
        <div className="ml-4 flex-1 min-w-0 z-10" style={{
        marginLeft: nameLength > 12 ? '0.75rem' : '1rem' // Adjust left margin for very long names
      }}>
          {/* Staff name - IMPROVED TO NEVER TRUNCATE */}
          {config.showName && <Tippy content={staff.name}>
              <div className={`font-bold tracking-wide pr-1.5 mb-1.5 ${getTransitionClass()}`} style={{
            color: status.grayOutOverlay ? 'rgba(240, 240, 250, 0.95)' : 'rgba(40, 47, 60, 0.95)',
            fontSize: `${calculateNameFontSize()}rem`,
            fontWeight: '700',
            lineHeight: '1.1',
            letterSpacing: '0.01em',
            minWidth: '5ch',
            maxWidth: '100%',
            display: 'block',
            whiteSpace: 'normal',
            wordBreak: 'keep-all',
            textShadow: status.grayOutOverlay ? '0px 1px 2px rgba(0, 0, 0, 0.5)' : '0px 1px 0px rgba(255, 255, 255, 0.7)',
            paddingTop: staff.status === 'ready' ? '0px' : '2px',
            marginBottom: '6px',
            textTransform: 'uppercase',
            paddingRight: calculateRightPadding()
          }} title={staff.name} // Show full name on hover
          >
                {displayName}
              </div>
            </Tippy>}
          {/* Status text */}
          {config.showStatus && <div className="flex items-center mt-1"></div>}
          {/* Clock-in Time */}
          {config.showClockedInTime && <Tippy content={`Clocked In: ${staff.time}`}>
              <div className={`flex items-center text-xs ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-700'} mt-1`} style={{
            textShadow: status.grayOutOverlay ? '0px 1px 1px rgba(0, 0, 0, 0.3)' // Enhanced shadow for busy
            : '0px 1px 0px rgba(255, 255, 255, 0.5)' // Text shadow for etched effect
          }}>
                <Clock size={10} className={`mr-0.5 ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-700'}`} strokeWidth={2} />
                <span className="font-medium">{formatTime(staff.time)}</span>
              </div>
            </Tippy>}
          {/* Turn Count - ENHANCED PROMINENCE */}
          {config.showTurnCount && <Tippy content={`Turn Count: ${staff.turnCount ?? staff.count}`}>
              <div className={`flex items-center text-sm ${status.grayOutOverlay ? 'text-gray-200' : 'text-gray-800'} mt-1.5`} aria-label={`Turn count: ${staff.turnCount ?? staff.count}`} style={{
            textShadow: status.grayOutOverlay ? '0px 1px 1px rgba(0, 0, 0, 0.3)' // Enhanced shadow for busy
            : '0px 1px 0px rgba(255, 255, 255, 0.5)' // Text shadow for etched effect
          }}>
                <ClassicIcons.RepeatArrows size={16} color={status.grayOutOverlay ? '#F3F4F6' : '#374151'} className="mr-1.5 flex-shrink-0" strokeWidth={2.5} />
                <span className="font-semibold" style={{
              fontSize: cardWidth < 300 ? '15px' : '16px'
            }}>
                  {staff.turnCount ?? staff.count}
                </span>
              </div>
            </Tippy>}
          {/* Conditionally render either Active Ticket row or Tickets/Sales row */}
          {hasActiveTickets() ? renderCompactActiveTicketRow() : <>
              {/* Combined Tickets and Sales - ONLY VISIBLE IN NORMAL VIEW, HIDDEN IN COMPACT/ULTRA-COMPACT */}
              {(config.showTickets || config.showSalesAmount) && viewMode === 'normal' && <div className="flex items-center mt-2 mb-2">
                    {config.showTickets && <div className="flex items-center" aria-label={`Tickets: ${staff.ticketsServicedCount ?? staff.count ?? 0}`} style={{
              textShadow: status.grayOutOverlay ? '0px 1px 1px rgba(0, 0, 0, 0.3)' // Enhanced shadow for busy
              : '0px 1px 0px rgba(255, 255, 255, 0.5)' // Text shadow for etched effect
            }}>
                        <Ticket size={cardWidth < 360 ? 12 : 14} className={`mr-1 ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-600'} opacity-80`} strokeWidth={2} />
                        <span className={`${cardWidth < 360 ? 'text-xs' : 'text-sm'} font-normal ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-600'}`}>
                          {staff.ticketsServicedCount ?? staff.count ?? 0}
                        </span>
                      </div>}
                    {config.showTickets && config.showSalesAmount && <span className="mx-2 text-gray-400">•</span>}
                    {config.showSalesAmount && <div className="flex items-center" aria-label={`Total serviced: ${formatCurrency(staff.totalSalesAmount ?? staff.revenue?.amount ?? 0)}`} style={{
              textShadow: status.grayOutOverlay ? '0px 1px 1px rgba(0, 0, 0, 0.3)' // Enhanced shadow for busy
              : '0px 1px 0px rgba(255, 255, 255, 0.5)' // Text shadow for etched effect
            }}>
                        <DollarSign size={cardWidth < 360 ? 12 : 14} className={`mr-1 ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-600'} opacity-80`} strokeWidth={2} />
                        <span className={`${cardWidth < 360 ? 'text-xs' : 'text-sm'} font-normal ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-600'}`}>
                          {formatCurrency(staff.totalSalesAmount ?? staff.revenue?.amount ?? 0).replace('$', '')}
                        </span>
                      </div>}
                  </div>}
              {/* Next Appointment Time - IMPROVED VISIBILITY CHECK */}
              {config.showNextAppointment && staff.nextAppointmentTime && viewMode === 'compact' && <div className="flex justify-center items-center mt-1 mb-2">
                    {/* Only show if we have enough space for the full time + ETA */}
                    {(() => {
              // Calculate required width for the appointment chip
              const timeText = formatTime(staff.nextAppointmentTime);
              const etaText = staff.nextAppointmentEta ? ` (${staff.nextAppointmentEta})` : '';
              const fullText = cardWidth >= 200 ? `${timeText}${etaText}` : timeText;
              // Calculate if the chip would fit
              const chipWidth = estimateTextWidth(fullText, 12, true) + 30; // text + icon + padding
              // Only render if it fits completely
              if (chipWidth <= cardWidth * 0.85) {
                return <Tippy content={`Next Appointment: ${staff.nextAppointmentTime}${staff.nextAppointmentEta ? ` (${staff.nextAppointmentEta})` : ''}`}>
                            <button className={`flex items-center ${status.grayOutOverlay ? 'bg-blue-900/40 text-blue-100/80' : 'bg-blue-50 text-blue-700/80'} hover:bg-blue-100 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-colors duration-200`}>
                              <ClassicIcons.NextAppointment size={12} color={status.grayOutOverlay ? '#93C5FD' : '#1E40AF'} className="mr-1 opacity-80" />
                              <span className="whitespace-nowrap">
                                {timeText}
                                {cardWidth >= 200 && staff.nextAppointmentEta && <span className={`ml-1 ${status.grayOutOverlay ? 'text-blue-200' : 'text-blue-800'} font-medium text-xs`}>
                                      ({staff.nextAppointmentEta})
                                    </span>}
                              </span>
                            </button>
                          </Tippy>;
              }
              return null; // Don't render if it won't fit
            })()}
                  </div>}
            </>}
        </div>
        {/* Hover/active/drag state styling */}
        <style jsx>{`
          .group {
            transform-origin: center center;
            transform: translateZ(0);
            backface-visibility: hidden;
            will-change: transform, box-shadow;
          }
          .group:hover {
            transform: translateY(-2px);
            box-shadow:
              0 5px 10px rgba(0, 0, 0, 0.12),
              0 3px 6px rgba(0, 0, 0, 0.08);
          }
          .group:active {
            transform: translateY(1px);
            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.15);
            cursor: grabbing;
          }
          .group:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.35);
          }
        `}</style>
      </div>;
  }
  // ULTRA-COMPACT VIEW - Optimized for very narrow sidebars
  if (viewMode === 'ultra-compact') {
    return <div ref={cardRef} className={`group flex flex-col items-center p-2 w-full ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500' : ''} ${getTransitionClass()}`} style={{
      borderRadius: '12px',
      boxShadow: status.grayOutOverlay ? '0 4px 8px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.2)' // Enhanced heavier shadow for busy
      : '0 2px 5px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
      border: status.grayOutOverlay ? `2px solid rgba(100, 100, 110, 0.8)` // More neutral border for busy
      : `2px solid ${specialtyColor.darkBorderColor}`,
      position: 'relative',
      overflow: 'hidden',
      transformStyle: 'preserve-3d',
      cursor: isDraggable ? 'grab' : 'pointer',
      filter: status.grayOutOverlay ? 'contrast(0.85) grayscale(0.35) brightness(0.95)' // Enhanced desaturation
      : 'none',
      transform: status.grayOutOverlay ? 'translateY(1px)' : 'none',
      minHeight: '76px' // Increased minimum height for better spacing
    }} tabIndex={0} role="button" aria-label={`${staff.name}, ${status.label}, Queue position: ${staff.count}`}>
        {/* Metallic gradient background */}
        <div className="absolute inset-0 z-0" style={{
        background: status.grayOutOverlay ? `linear-gradient(to bottom, ${specialtyColor.metalGradientFromDark}, ${specialtyColor.metalGradientToDark})` : `linear-gradient(to bottom, ${specialtyColor.metalGradientFrom}, ${specialtyColor.metalGradientTo})`,
        opacity: status.grayOutOverlay ? 0.7 : 0.85 // Reduced opacity for busy status
      }}></div>
        {/* Inner shadow/bevel effect */}
        <div className="absolute inset-0 z-0 rounded-[10px] pointer-events-none" style={{
        boxShadow: status.grayOutOverlay ? 'inset 0 1px 3px rgba(0, 0, 0, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.2)' // Deeper inner shadow for busy
        : 'inset 0 1px 2px rgba(255, 255, 255, 0.6), inset 0 -1px 2px rgba(0, 0, 0, 0.1)'
      }}></div>
        {/* Enhanced Semi-circle notch at top border - INCREASED SIZE with added outline and sharper edges */}
        <div className="absolute top-0 left-1/2 z-20 w-4 h-2 transform -translate-x-1/2 translate-y-0">
          {/* Notch shadow/depth effect */}
          <div className={`absolute inset-0 bg-black opacity-10 ${staff.status === 'ready' ? 'rounded-b-[5px]' : 'rounded-b-[6px]'}`} style={{
          transform: 'translateY(0.5px)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
          height: staff.status === 'ready' ? '2px' : undefined // Reduced from 2.7px
        }}></div>
          {/* Notch main shape */}
          <div className={`absolute inset-0 bg-white ${staff.status === 'ready' ? 'rounded-b-[5px]' : 'rounded-b-[6px]'}`} style={{
          borderTop: 'none',
          borderLeft: `1px solid ${specialtyColor.darkBorderColor}`,
          borderRight: `1px solid ${specialtyColor.darkBorderColor}`,
          borderBottom: `1px solid ${specialtyColor.darkBorderColor}`,
          boxShadow: 'inset 0 -1px 2px rgba(0, 0, 0, 0.04)',
          opacity: status.grayOutOverlay ? 0.85 : 1,
          height: staff.status === 'ready' ? '2px' : undefined // Reduced from 2.7px
        }}></div>
        </div>
        {/* Gray out overlay for busy status */}
        {status.grayOutOverlay && <>
            {/* Dark base overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none rounded-[11.5px]" style={{
          backgroundColor: 'rgba(40, 45, 60, 0.35)',
          mixBlendMode: 'multiply'
        }}></div>
            {/* Secondary desaturation overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none rounded-[11.5px]" style={{
          backgroundColor: 'rgba(220, 225, 235, 0.45)',
          mixBlendMode: 'saturation'
        }}></div>
            {/* Subtle inset shadow to create pressed effect */}
            <div className="absolute inset-0 z-11 pointer-events-none rounded-[11.5px]" style={{
          boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.2)',
          opacity: 0.7
        }}></div>
          </>}
        {/* Restructured layout with avatar at top and name centered below */}
        <div className="flex flex-col items-center justify-between w-full z-10 h-full py-2">
          {/* Staff avatar with accent border - INCREASED TO 36px */}
          {config.showAvatar && <div className={`relative flex-shrink-0 mb-2.5 ${config.notchOverlapsAvatar ? 'mt-[-15px]' : ''}`}>
              <img src={staff.image} alt={`${staff.name} profile`} className={`w-[36px] h-[36px] rounded-full object-cover shadow-sm transition-all duration-300 group-hover:brightness-105 ${getTransitionClass()} ${status.grayOutOverlay ? 'grayscale-[30%] brightness-90' : ''}`} style={{
            boxShadow: status.grayOutOverlay ? '0 2px 4px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.15)' // Heavier shadow for busy
            : '0 2px 4px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
            border: status.grayOutOverlay ? `2.5px solid rgba(100, 100, 110, 0.8)` // More neutral border for busy
            : `3px solid ${specialtyColor.darkBorderColor}`,
            minWidth: '36px',
            minHeight: '36px',
            objectFit: 'cover',
            objectPosition: 'center',
            // Move avatar up for busy status cards only
            transform: status.grayOutOverlay ? 'translateY(-8px)' : 'none',
            // Optional soft top highlight
            backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.08), transparent 40%)'
          }} />
              {/* Queue Order Number - ALWAYS VISIBLE (Tier 1) - ADJUSTED POSITION */}
              {config.showQueueNumber && <div className="absolute -top-0.5 -left-0.5">
                  <Tippy content={`Queue Position: ${staff.count}`}>
                    <div className="bg-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold text-gray-700 border border-white shadow-sm" aria-label={`Queue position: ${staff.count}`} style={{
                width: '20px',
                height: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                opacity: status.grayOutOverlay ? 0.9 : 1 // Slightly dim for busy
              }}>
                      {staff.count}
                    </div>
                  </Tippy>
                </div>}
              {/* Status indicator positioned at bottom right of avatar */}
              {config.showStatus && <div className="absolute -bottom-0.5 -right-0.5">
                  <Tippy content={`Status: ${status.label}`}>
                    <div className={`${status.bg} rounded-full flex items-center justify-center shadow-sm border-2 border-white ${status.grayOutOverlay ? 'shadow-rose-500/30' : status.glowColor}`} style={{
                width: '17px',
                height: '17px',
                boxShadow: status.grayOutOverlay ? '0 2px 4px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(225, 29, 72, 0.3)' // Enhanced shadow with rose tint for busy
                : '0 2px 4px rgba(0, 0, 0, 0.2)' // Normal shadow
              }} aria-label={`Status: ${status.label}`}>
                      <div className={`w-1.5 h-1.5 rounded-full bg-white animate-pulse ${status.grayOutOverlay ? 'opacity-90' : 'opacity-80'}`} style={{
                  width: '6px',
                  height: '6px'
                }}></div>
                    </div>
                  </Tippy>
                </div>}
              {/* Busy status indicator at bottom of avatar - Only shown for busy staff */}
              {status.label === 'Busy' && <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-20">
                  <Tippy content="Status: Busy">
                    <div className="bg-rose-600 text-white flex items-center px-3 py-1 rounded-full shadow-md" style={{
                boxShadow: '0 3px 5px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
              }} aria-label="Status: Busy">
                      <CircleDot size={12} className="mr-1.5 animate-pulse" strokeWidth={2.5} />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Busy
                      </span>
                    </div>
                  </Tippy>
                </div>}
            </div>}
          {/* Staff name - ALWAYS VISIBLE (Tier 1) - CENTERED UNDER AVATAR - UPDATED TO SHOW FIRST NAME ONLY */}
          {config.showName && <div className="text-center px-1 w-full mb-1.5">
              <Tippy content={staff.name}>
                <div className={`font-bold tracking-wide overflow-hidden text-ellipsis ${getTransitionClass()}`} style={{
              color: status.grayOutOverlay ? 'rgba(240, 240, 250, 0.95)' : 'rgba(40, 47, 60, 0.95)',
              fontSize: viewMode === 'ultra-compact' ? '0.8rem' : '0.9625rem',
              fontWeight: '700',
              lineHeight: '1.1',
              letterSpacing: '0.01em',
              maxWidth: '100%',
              display: 'block',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textShadow: status.grayOutOverlay ? '0px 1px 2px rgba(0, 0, 0, 0.5)' : '0px 1px 0px rgba(255, 255, 255, 0.7)',
              textTransform: 'uppercase' // Display name in all caps
            }} title={staff.name} // Show full name on hover
            >
                  {displayName}
                </div>
              </Tippy>
              {/* Conditionally render either Active Ticket row or Tickets/Sales row */}
              {hasActiveTickets() ? renderUltraCompactActiveTicketRow() : <>
                  {/* Tickets and Sales - COMBINED AND REDUCED PROMINENCE */}
                  {(config.showTickets || config.showSalesAmount) && cardWidth >= 60 && <div className="flex items-center justify-center mt-1">
                        {config.showTickets && <Tippy content={`Tickets: ${staff.ticketsServicedCount ?? staff.count}`}>
                            <div className="flex items-center" aria-label={`Tickets: ${staff.ticketsServicedCount ?? staff.count}`}>
                              <Ticket size={8} className={`mr-0.5 ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-500'} opacity-80`} strokeWidth={2} />
                              <span className="text-[8px] font-normal ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-500'}">
                                {staff.ticketsServicedCount ?? staff.count}
                              </span>
                            </div>
                          </Tippy>}
                        {config.showTickets && config.showSalesAmount && <span className="mx-1 text-[8px] text-gray-400">
                            •
                          </span>}
                        {config.showSalesAmount && <Tippy content={`Total Serviced: ${formatCurrency(staff.totalSalesAmount ?? staff.revenue?.amount ?? 0)}`}>
                            <div className="flex items-center" aria-label={`Total serviced: ${formatCurrency(staff.totalSalesAmount ?? staff.revenue?.amount ?? 0)}`}>
                              <DollarSign size={8} className={`mr-0.5 ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-500'} opacity-80`} strokeWidth={2} />
                              <span className="text-[8px] font-normal ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-500'}">
                                {formatCurrency(staff.totalSalesAmount ?? staff.revenue?.amount ?? 0).replace('$', '')}
                              </span>
                            </div>
                          </Tippy>}
                      </div>}
                </>}
            </div>}
          {/* UPDATED: Time indicators row - Past → Present → Future */}
          {renderTimeIndicators()}
        </div>
        {/* More Options Button - positioned at bottom right */}
        <button className="absolute bottom-1 right-1 text-gray-500 hover:text-gray-700 transition-all duration-300 p-0.5 flex-shrink-0 z-30" aria-label="More options for staff member">
          <MoreVertical size={10} strokeWidth={2} />
        </button>
        {/* Hover/active/drag state styling */}
        <style jsx>{`
          .group {
            transform-origin: center center;
            transform: translateZ(0);
            backface-visibility: hidden;
            will-change: transform, box-shadow;
          }
          .group:hover {
            transform: translateY(-2px);
            box-shadow:
              0 5px 10px rgba(0, 0, 0, 0.12),
              0 3px 6px rgba(0, 0, 0, 0.08);
          }
          .group:active {
            transform: translateY(1px);
            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.15);
            cursor: grabbing;
          }
          .group:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.35);
          }
        `}</style>
      </div>;
  }
  // NORMAL VIEW - Full card with all information
  if (viewMode === 'normal') {
    return <div ref={cardRef} className={`group flex flex-col w-full ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500' : ''} ${getTransitionClass()}`} style={{
      borderRadius: '16px',
      boxShadow: status.grayOutOverlay ? '0 5px 10px rgba(0, 0, 0, 0.3), 0 3px 6px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05) inset' // Enhanced heavier shadow for busy
      : '0 3px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
      border: status.grayOutOverlay ? `2px solid rgba(100, 100, 110, 0.8)` // More neutral border for busy
      : `2px solid ${specialtyColor.darkBorderColor}`,
      transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
      position: 'relative',
      overflow: 'hidden',
      transformStyle: 'preserve-3d',
      cursor: isDraggable ? 'grab' : 'pointer',
      minHeight: '180px',
      filter: status.grayOutOverlay ? 'contrast(0.85) grayscale(0.35) brightness(0.95)' // Enhanced desaturation
      : 'none',
      transform: status.grayOutOverlay ? 'translateY(1px)' : 'none' // Subtle pressed effect for busy cards
    }} tabIndex={0} role="button" aria-label={`${staff.name}, ${status.label}, Queue position: ${staff.count}`}>
        {/* Functional notch for busy staff with current ticket info */}
        {currentTicketInfo !== null && staff.status === 'busy' ? <div className="absolute top-0 left-1/2 z-30" style={{
        width: viewMode === 'compact' || viewMode === 'ultra-compact' ? '50%' // Further reduced from 57% for leaner appearance
        : '36%',
        minWidth: viewMode === 'compact' ? '155px' // Further reduced from 170px
        : viewMode === 'ultra-compact' ? '120px' // Further reduced from 135px
        : '140px',
        maxWidth: viewMode === 'compact' || viewMode === 'ultra-compact' ? '225px' // Further reduced from 250px
        : '190px',
        height: 'auto',
        minHeight: viewMode === 'compact' || viewMode === 'ultra-compact' ? '32px' // Reduced from 36px for shorter appearance
        : '28px',
        maxHeight: viewMode === 'compact' || viewMode === 'ultra-compact' ? '36px' // Reduced from 40px for shorter appearance
        : '32px',
        borderTop: 'none',
        borderLeft: `1px solid rgba(0,0,0,0.15)`,
        borderRight: `1px solid rgba(0,0,0,0.15)`,
        borderBottom: `1px solid rgba(0,0,0,0.15)`,
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
        background: 'linear-gradient(180deg, #fff 0%, #f8f8f8 100%)',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08), inset 0 -2px 0 rgba(0, 0, 0, 0.03)',
        transform: viewMode === 'compact' || viewMode === 'ultra-compact' ? 'translate(-50%, -3px)' // Adjusted from -4px for better positioning with shorter height
        : 'translate(-50%, -4px)',
        position: 'relative',
        zIndex: 30,
        overflow: 'hidden' // Ensure progress bar doesn't spill over
      }}>
            {/* Inner content container with proper spacing */}
            <div className="relative flex flex-col justify-between w-full h-full pb-[5px]">
              {/* Top row with time info - refined positioning and hierarchy */}
              <div className="flex items-center justify-between w-full px-3 pt-1 pb-0.5">
                {' '}
                {/* Reduced top padding from pt-1.5 to pt-1 */}
                {/* Time information with responsive behavior and smart truncation */}
                <div className="flex items-center text-[10px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[72%]">
                  {' '}
                  {/* Reduced font size from 11px to 10px */}
                  <Clock size={viewMode === 'ultra-compact' ? 8 : 9} className="mr-0.5 text-gray-700 flex-shrink-0" strokeWidth={2.5} />
                  <span className="overflow-hidden text-ellipsis">
                    <span className="font-semibold text-gray-900">
                      {currentTicketInfo.timeLeft}m
                    </span>
                    {/* Responsive text handling with smart truncation */}
                    <span className={`text-gray-500 ${viewMode === 'ultra-compact' ? 'text-[7px]' : 'text-[8px]'}`}>
                      {currentTicketInfo.progress > 1 ? ' over' : ' left'}
                      {(viewMode === 'normal' || cardWidth >= 210) && <>
                          {' / '}
                          <span className="whitespace-nowrap">
                            {currentTicketInfo.totalTime >= 60 ? `${Math.floor(currentTicketInfo.totalTime / 60)}h${currentTicketInfo.totalTime % 60 > 0 ? `${currentTicketInfo.totalTime % 60}` : ''}` : `${currentTicketInfo.totalTime}m`}
                          </span>
                        </>}
                    </span>
                  </span>
                </div>
                {/* Percentage with dynamic color based on progress - always right-aligned */}
                <span className={`${viewMode === 'ultra-compact' ? 'text-[7px]' : 'text-[8px]'} font-bold whitespace-nowrap`} style={{
              color: currentTicketInfo.progress <= 0.25 ? '#22C55E' // Green for on-track
              : currentTicketInfo.progress <= 0.75 ? '#F59E0B' // Amber for mid-progress
              : '#EF4444' // Red for critical or overtime
            }}>
                  {Math.round(currentTicketInfo.progress * 100)}%
                </span>
              </div>
              {/* Bottom row with progress bar - perfectly flush with bottom edge */}
              <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{
            height: '2px',
            backgroundColor: 'rgba(236, 236, 236, 0.8)'
          }}>
                <div className="h-full transition-all duration-500 ease-out" style={{
              width: `${Math.min(100, Math.round(currentTicketInfo.progress * 100))}%`,
              background: currentTicketInfo.progress <= 0.25 ? 'linear-gradient(90deg, #22C55E, #10B981)' // Green for on-track
              : currentTicketInfo.progress <= 0.75 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' // Amber for mid-progress
              : 'linear-gradient(90deg, #EF4444, #F87171)',
              boxShadow: currentTicketInfo.progress > 1 ? 'inset 0px 1px 1px rgba(255, 255, 255, 0.3), 0 0 5px rgba(239, 68, 68, 0.5)' // Red glow for overtime
              : 'inset 0px 1px 1px rgba(255, 255, 255, 0.3)'
            }}></div>
              </div>
            </div>
          </div> :
      // Original notch for non-busy staff - updated to be more rounded, leaner and shorter
      <div className={`absolute top-0 left-1/2 z-20 transform -translate-x-1/2 translate-y-0 ${staff.status === 'ready' ? 'w-7' : 'w-7 h-3.5'}`} // Reduced width from w-8 to w-7, height from h-4 to h-3.5
      style={{
        height: staff.status === 'ready' ? '0.55rem' : undefined // Further reduced from 0.6075rem
      }}>
            {/* Notch shadow/depth effect */}
            <div className={`absolute inset-0 bg-black opacity-10 ${staff.status === 'ready' ? 'rounded-b-[5px]' : 'rounded-b-[8px]'}`} // Increased radius for more rounded corners
        style={{
          transform: 'translateY(1px)',
          boxShadow: '0 2px 3px rgba(0, 0, 0, 0.1)' // Reduced from 0 3px 4px
        }}></div>
            {/* Notch main shape */}
            <div className={`absolute inset-0 bg-white ${staff.status === 'ready' ? 'rounded-b-[5px]' : 'rounded-b-[8px]'}`} // Increased radius for more rounded corners
        style={{
          borderTop: 'none',
          borderLeft: `1px solid ${specialtyColor.darkBorderColor}`,
          borderRight: `1px solid ${specialtyColor.darkBorderColor}`,
          borderBottom: `1px solid ${specialtyColor.darkBorderColor}`,
          boxShadow: 'inset 0 -2px 3px rgba(0, 0, 0, 0.04)',
          opacity: status.grayOutOverlay ? 0.85 : 1 // Slightly dim the notch for busy status
        }}></div>
          </div>}
        {/* Metallic gradient background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 right-0 h-[60%] rounded-t-[14px]" style={{
          background: status.grayOutOverlay ? `linear-gradient(to bottom, ${specialtyColor.metalGradientFromDark}, ${specialtyColor.metalGradientToDark})` : `linear-gradient(to bottom, ${specialtyColor.metalGradientFrom}, ${specialtyColor.metalGradientTo})`,
          opacity: status.grayOutOverlay ? 0.7 : 0.9 // Reduced opacity for busy status
        }}></div>
          <div className="absolute bottom-0 left-0 right-0 h-[40%] rounded-b-[14px]" style={{
          background: status.grayOutOverlay ? `linear-gradient(to bottom, ${specialtyColor.metalGradientFromDark}, ${specialtyColor.metalGradientToDark})` : `linear-gradient(to bottom, ${specialtyColor.metalGradientFrom}, ${specialtyColor.metalGradientTo})`,
          opacity: status.grayOutOverlay ? 0.7 : 0.95 // Reduced opacity for busy status
        }}></div>
        </div>
        {/* Inner shadow/bevel effect */}
        <div className="absolute inset-0 z-0 rounded-[14px] pointer-events-none" style={{
        boxShadow: status.grayOutOverlay ? 'inset 0 1px 4px rgba(0, 0, 0, 0.3), inset 0 -1px 3px rgba(0, 0, 0, 0.2)' // Deeper inner shadow for busy
        : 'inset 0 1px 3px rgba(255, 255, 255, 0.6), inset 0 -1px 3px rgba(0, 0, 0, 0.15)'
      }}></div>
        {/* Enhanced overlay for busy status */}
        {status.grayOutOverlay && <>
            {/* Dark base overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none rounded-[13.5px]" style={{
          backgroundColor: 'rgba(40, 45, 60, 0.35)',
          mixBlendMode: 'multiply'
        }}></div>
            {/* Secondary desaturation overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none rounded-[13.5px]" style={{
          backgroundColor: 'rgba(220, 225, 235, 0.45)',
          mixBlendMode: 'saturation'
        }}></div>
            {/* Subtle inset shadow to create pressed effect */}
            <div className="absolute inset-0 z-11 pointer-events-none rounded-[13.5px]" style={{
          boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.2)',
          opacity: 0.7
        }}></div>
          </>}
        {isDraggable && <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-80 cursor-grab active:cursor-grabbing z-30 transition-opacity">
            <GripVertical size={18} className={`${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-600'}`} strokeWidth={2} />
          </div>}
        {/* More Options Button - positioned at middle right */}
        <button className={`absolute top-1/2 right-2 transform -translate-y-1/2 ${status.grayOutOverlay ? 'text-gray-300 hover:text-white hover:bg-gray-700/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/80'} transition-all duration-300 p-1 rounded-full flex-shrink-0 z-30`} // Reduced padding from p-1.5 to p-1
      aria-label="More options for staff member">
          <MoreVertical size={viewMode === 'ultra-compact' ? 12 : 14} strokeWidth={2} />
        </button>
        {/* Top section with staff info - 60% height */}
        <div className="relative z-10 p-3 pt-0.75 h-[60%]">
          {/* Improved top padding for better vertical alignment */}
          <div className="flex items-start mt-0.75">
            {/* Staff avatar with accent border */}
            {config.showAvatar && <div className={`relative flex-shrink-0 ${config.notchOverlapsAvatar ? staff.status === 'ready' ? 'mt-[-10px]' : 'mt-[-14px]' : ''}`} style={{
            marginTop: config.notchOverlapsAvatar ? staff.status === 'ready' ? '-10px' // Adjusted offset for ready status to improve balance
            : '-14px' : '',
            paddingBottom: staff.status === 'ready' ? '4px' : '0',
            display: 'flex',
            justifyContent: 'center'
          }}>
                <img src={staff.image} alt={`${staff.name} profile`} className={`rounded-full object-cover shadow-md relative z-10 transition-all duration-300 group-hover:brightness-105 ${getTransitionClass()} ${status.grayOutOverlay ? 'grayscale-[25%] brightness-90' : ''}`} style={{
              width: '90px',
              height: '90px',
              boxShadow: status.grayOutOverlay ? '0 3px 6px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.15)' // Heavier shadow for busy
              : '0 3px 6px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
              border: status.grayOutOverlay ? `3.5px solid rgba(100, 100, 110, 0.8)` // Adjusted to 3.5px
              : `3.5px solid ${specialtyColor.darkBorderColor}`,
              outline: status.grayOutOverlay ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid white',
              objectFit: 'cover',
              objectPosition: 'center',
              // Move avatar up for busy status cards only
              transform: status.grayOutOverlay ? 'translateY(-8px)' : 'none',
              // Optional soft top highlight
              backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.08), transparent 40%)'
            }} />
                {/* Queue Order Number - Enhanced visibility with improved positioning and styling */}
                {config.showQueueNumber && <div className="absolute -top-1 -left-1 z-40">
                    <Tippy content={`Queue Position: ${staff.count}`}>
                      <div className="bg-white rounded-full flex items-center justify-center text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer" aria-label={`Queue position: ${staff.count}`} style={{
                  width: '28px',
                  height: '28px',
                  boxShadow: '0 3px 5px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1)',
                  border: '2px solid white',
                  outline: `1px solid ${status.grayOutOverlay ? 'rgba(180,180,190,0.3)' : 'rgba(220,220,230,0.5)'}`,
                  opacity: status.grayOutOverlay ? 0.95 : 1,
                  transform: 'translate(0, 0)',
                  background: 'linear-gradient(to bottom, #ffffff, #f8f8f8)'
                }}>
                        {staff.count}
                      </div>
                    </Tippy>
                  </div>}
                {/* Status indicators at bottom of avatar - For both Ready and Busy states */}
                {status.label === 'Ready' && <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 z-20">
                    <Tippy content="Status: Ready">
                      <div className="bg-emerald-500 text-white flex items-center px-2 py-0.5 rounded-full shadow-sm" style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1)',
                  transform: 'scale(0.95)' // Slightly increased scale for better visibility
                }} aria-label="Status: Ready">
                        <Check size={10} className="mr-1" strokeWidth={2.5} />
                        <span className="text-[10px] font-medium uppercase tracking-tight">
                          Ready
                        </span>
                      </div>
                    </Tippy>
                  </div>}
                {/* Busy status indicator at bottom of avatar - Only shown for busy staff */}
                {status.label === 'Busy' && <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 z-20">
                    <Tippy content="Status: Busy">
                      <div className="bg-rose-600 text-white flex items-center px-2 py-0.5 rounded-full shadow-sm" style={{
                  boxShadow: '0 3px 5px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
                }} aria-label="Status: Busy">
                        <CircleDot size={11} className="mr-1.5 animate-pulse" strokeWidth={2.5} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Busy
                        </span>
                      </div>
                    </Tippy>
                  </div>}
                {/* Clocked Out status indicator - Only shown for off staff */}
                {status.label === 'Clocked Out' && <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 z-20">
                    <Tippy content="Status: Clocked Out">
                      <div className="bg-gray-500 text-white flex items-center px-2 py-0.5 rounded-full shadow-sm" style={{
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)'
                }} aria-label="Status: Clocked Out">
                        <Circle size={11} className="mr-1.5" strokeWidth={2.5} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Off
                        </span>
                      </div>
                    </Tippy>
                  </div>}
              </div>}
            <div className={`ml-2 flex-1 min-w-0 flex flex-col justify-center h-full ${staff.status === 'ready' ? 'pt-1' : ''}`} style={{
            paddingLeft: '8px',
            // Apply negative margin-top only for busy status cards
            marginTop: status.grayOutOverlay ? '-8px' : '0',
            transition: 'margin-top 0.2s ease'
          }}>
              {/* Staff name - ALWAYS VISIBLE (Tier 1) - UPDATED TO SHOW FIRST NAME ONLY */}
              {config.showName && <Tippy content={staff.name}>
                  <div className={`font-bold tracking-wide overflow-hidden text-ellipsis pr-1.5 mb-1.5 ${getTransitionClass()}`} style={{
                color: status.grayOutOverlay ? 'rgba(240, 240, 250, 0.95)' : 'rgba(40, 47, 60, 0.95)',
                fontSize: '0.9625rem',
                fontWeight: '700',
                lineHeight: '1.1',
                letterSpacing: '0.01em',
                minWidth: '5ch',
                maxWidth: '100%',
                display: 'block',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textShadow: status.grayOutOverlay ? '0px 1px 2px rgba(0, 0, 0, 0.5)' : '0px 1px 0px rgba(255, 255, 255, 0.7)',
                paddingTop: staff.status === 'ready' ? '0px' : '2px',
                marginBottom: '6px',
                textTransform: 'uppercase' // Display name in all caps
              }} title={staff.name} // Show full name on hover
              >
                    {displayName}
                  </div>
                </Tippy>}
              {/* Status and time information */}
              <div className="flex flex-col space-y-1.5">
                {/* Status - Only show for non-busy statuses */}
                {config.showStatus && cardWidth >= 160 && status.label !== 'Busy'}
                {/* Clocked in time - TIER 2 OPERATIONAL TIMING */}
                {config.showClockedInTime && cardWidth >= 180 && <div className={`text-xs ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-700'} flex items-center ${getTransitionClass()}`} style={{
                textShadow: status.grayOutOverlay ? '0px 1px 1px rgba(0, 0, 0, 0.4)' : '0px 1px 0px rgba(255, 255, 255, 0.5)',
                marginBottom: '6px' // Consistent 6px spacing
              }}>
                    <Tippy content={`Clocked In: ${staff.time}`}>
                      <div className="flex items-center">
                        <ClassicIcons.ClockAnalog size={16} color={status.grayOutOverlay ? '#E5E7EB' : '#4B5563'} strokeWidth={2} className="mr-1.5 flex-shrink-0" style={{
                      marginRight: '6px'
                    }} // Consistent 6px icon-text gap
                    />
                        <span className="font-medium">{staff.time}</span>
                      </div>
                    </Tippy>
                  </div>}
                {/* Turn Count - ENHANCED PROMINENCE */}
                {config.showTurnCount && <Tippy content={`Turn Count: ${staff.turnCount ?? staff.count ?? 0}`}>
                    <div className={`text-sm ${status.grayOutOverlay ? 'text-gray-200' : 'text-gray-800'} flex items-center ${getTransitionClass()}`} style={{
                  textShadow: status.grayOutOverlay ? '0px 1px 1px rgba(0, 0, 0, 0.4)' : '0px 1px 0px rgba(255, 255, 255, 0.5)'
                }}>
                      <ClassicIcons.RepeatArrows size={16} color={status.grayOutOverlay ? '#F3F4F6' : '#374151'} className="mr-1.5 flex-shrink-0" style={{
                    marginRight: '6px'
                  }} // Consistent 6px icon-text gap
                  />
                      {cardWidth >= 160 ? <span className="font-medium">
                          Turns:{' '}
                          <span className="font-semibold">
                            {staff.turnCount ?? staff.count ?? 0}
                          </span>
                        </span> : <span className="font-semibold">
                          {staff.turnCount ?? staff.count ?? 0}
                        </span>}
                    </div>
                  </Tippy>}
              </div>
            </div>
          </div>
        </div>
        {/* Enhanced separation between header and data sections */}
        <div className="absolute inset-x-0 top-[60%] z-20">
          {/* Improved separator with conditional styling based on specialty color */}
          <div className="h-[1px] w-full" style={{
          background: status.grayOutOverlay ? 'rgba(255, 255, 255, 0.15)' // Lighter separator for better visibility on dark overlay
          : 'rgba(0, 0, 0, 0.12)' // Darker line for metal effect
        }}></div>
          <div className="h-[1px] w-full" // Reduced from 2px to 1px
        style={{
          background: `linear-gradient(to bottom, 
                ${status.grayOutOverlay ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)' // Lighter gradient for metallic highlight
          }, 
                transparent)`,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' // Shadow for embossed effect
        }}></div>
        </div>
        {/* Data section with metrics */}
        <div className={`relative z-10 h-[40%] flex flex-col justify-center p-2.5 ${getTransitionClass()}`} // Reduced padding from p-3
      style={{
        borderBottomLeftRadius: '14px',
        borderBottomRightRadius: '14px'
      }}>
          {/* METRICS ROW - conditionally render either Active Ticket row or Tickets/Sales row */}
          {hasActiveTickets() ? renderActiveTicketRow() : <div className="flex justify-between items-center mb-2">
              {' '}
              {/* Reduced from mb-3 */}
              {/* Combined Tickets and Sales - REDUCED PROMINENCE */}
              <div className="flex items-center space-x-2 mx-auto">
                {/* Tickets serviced - TIER 3 PERFORMANCE METRIC */}
                {config.showTickets && cardWidth >= 180 && <Tippy content={`Tickets: ${staff.ticketsServicedCount ?? staff.count ?? 0}`}>
                    <div className="flex items-center" aria-label={`Tickets: ${staff.ticketsServicedCount ?? staff.count ?? 0}`} style={{
                textShadow: status.grayOutOverlay ? '0px 1px 1px rgba(0, 0, 0, 0.3)' // Enhanced shadow for busy
                : '0px 1px 0px rgba(255, 255, 255, 0.5)' // Text shadow for etched effect
              }}>
                      <Ticket size={10} className={`mr-1 ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-600'}`} strokeWidth={2} />
                      <span className={`text-xs font-medium ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-600'}`}>
                        {staff.ticketsServicedCount ?? staff.count ?? 0}
                      </span>
                    </div>
                  </Tippy>}
                {config.showTickets && config.showSalesAmount && cardWidth >= 180 && <span className="text-xs text-gray-400 mx-1">•</span>}
                {/* Sales amount - TIER 3 PERFORMANCE METRIC */}
                {config.showSalesAmount && cardWidth >= 160 && <Tippy content={`Total Serviced: ${formatCurrency(staff.totalSalesAmount ?? staff.revenue?.amount ?? 0)}`}>
                    <div className="flex items-center" aria-label={`Total serviced: ${formatCurrency(staff.totalSalesAmount ?? staff.revenue?.amount ?? 0)}`} style={{
                textShadow: status.grayOutOverlay ? '0px 1px 1px rgba(0, 0, 0, 0.3)' // Enhanced shadow for busy
                : '0px 1px 0px rgba(255, 255, 255, 0.5)' // Text shadow for etched effect
              }}>
                      <DollarSign size={10} className={`mr-1 ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-600'}`} strokeWidth={2} />
                      <span className={`text-xs font-medium ${status.grayOutOverlay ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formatCurrency(staff.totalSalesAmount ?? staff.revenue?.amount ?? 0).replace('$', '')}
                      </span>
                    </div>
                  </Tippy>}
              </div>
            </div>}
          {/* UPDATED: TIMELINE ROW - Past → Present → Future */}
          {renderTimeIndicators()}
        </div>
        {/* Selected indicator */}
        {isSelected && <div className="absolute top-0 right-0 m-2 z-30"></div>}
        {/* Hover/active/drag state styling */}
        <style jsx>{`
          .group {
            transform-origin: center center;
            transform: translateZ(0);
            backface-visibility: hidden;
            will-change: transform, box-shadow;
          }
          .group:hover {
            transform: ${status.grayOutOverlay ? 'translateY(-1px)' : 'translateY(-3px)'};
            box-shadow: ${status.grayOutOverlay ? '0 6px 12px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15)' : '0 8px 16px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)'};
          }
          .group:active {
            transform: translateY(1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            cursor: grabbing;
          }
          .group:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.35);
          }
        `}</style>
      </div>;
  }
}