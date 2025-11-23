
import { MoreVertical, Clock, RefreshCw, Check, Minus, Circle, CircleDot, ChevronRight } from 'lucide-react';
import 'tippy.js/dist/tippy.css';

// Helper function to format time with seconds and a/p
const formatClockedInTime = (_timeString: string): string => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const period = hours >= 12 ? 'p' : 'a';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}${period}`;
};

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
            ticketNumber?: string | number;
            clientName: string;
            serviceName: string;
            status: 'in-service' | 'pending';
        }>;
        currentTicketInfo?: {
            timeLeft: number;
            totalTime: number;
            progress: number;
            startTime: string;
            serviceName?: string;
            clientName?: string;
        };
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

export function StaffCard({
    staff,
    viewMode = 'normal',
    isDraggable = false,
    isSelected = false,
    displayConfig
}: StaffCardProps) {
    // Default display config
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

    const config = {
        ...defaultDisplayConfig,
        ...(displayConfig || {})
    };

    // Format staff name (first name only)
    const formatStaffName = (fullName: string): string => {
        const nameParts = fullName.trim().split(' ');
        return nameParts[0];
    };

    const displayName = formatStaffName(staff.name);

    // --- ORIGINAL DESIGN LANGUAGE (Colors & Styles) ---

    // Status colors (Reverted to original style + icon-only adaptation)
    const statusColors = {
        ready: {
            bg: 'bg-emerald-500',
            text: 'text-emerald-700',
            lightText: 'text-emerald-50',
            border: 'border-emerald-200',
            ring: 'ring-emerald-400',
            icon: <Check size={14} strokeWidth={3} />,
            label: 'Ready',
            isBusy: false
        },
        busy: {
            bg: 'bg-rose-500',
            text: 'text-rose-700',
            lightText: 'text-rose-50',
            border: 'border-rose-200',
            ring: 'ring-rose-400',
            icon: <CircleDot size={14} strokeWidth={3} />,
            label: 'Busy',
            isBusy: true
        },
        off: {
            bg: 'bg-gray-400',
            text: 'text-gray-600',
            lightText: 'text-gray-50',
            border: 'border-gray-200',
            ring: 'ring-gray-300',
            icon: <Circle size={14} strokeWidth={3} />,
            label: 'Off',
            isBusy: false
        }
    };

    const status = statusColors[staff.status as keyof typeof statusColors] || statusColors['ready'];

    // Specialty Colors (Original definitions)
    const specialtyColors: Record<string, {
        base: string;
        borderColor: string;
        darkBorderColor: string;
        bgGradientFrom: string;
        bgGradientTo: string;
    }> = {
        neutral: {
            base: '#F5F5F5',
            borderColor: '#E0E0E0',
            darkBorderColor: '#C0C0C0',
            bgGradientFrom: '#FFFFFF',
            bgGradientTo: '#F5F5F5'
        },
        nails: {
            base: '#F43F5E',
            borderColor: '#F43F5E',
            darkBorderColor: '#E11D48',
            bgGradientFrom: '#FFF1F3',
            bgGradientTo: '#FFE4E8'
        },
        hair: {
            base: '#2563EB',
            borderColor: '#2563EB',
            darkBorderColor: '#1D4ED8',
            bgGradientFrom: '#EFF6FF',
            bgGradientTo: '#DBEAFE'
        },
        massage: {
            base: '#16A34A',
            borderColor: '#16A34A',
            darkBorderColor: '#15803D',
            bgGradientFrom: '#F0FDF4',
            bgGradientTo: '#DCFCE7'
        },
        skincare: {
            base: '#A855F7',
            borderColor: '#A855F7',
            darkBorderColor: '#9333EA',
            bgGradientFrom: '#FAF5FF',
            bgGradientTo: '#F3E8FF'
        },
        waxing: {
            base: '#06B6D4',
            borderColor: '#06B6D4',
            darkBorderColor: '#0891B2',
            bgGradientFrom: '#ECFEFF',
            bgGradientTo: '#CFFAFE'
        },
        combo: {
            base: '#EAB308',
            borderColor: '#EAB308',
            darkBorderColor: '#CA8A04',
            bgGradientFrom: '#FEFCE8',
            bgGradientTo: '#FEF08A'
        },
        support: {
            base: '#F97316',
            borderColor: '#F97316',
            darkBorderColor: '#EA580C',
            bgGradientFrom: '#FFF7ED',
            bgGradientTo: '#FFEDD5'
        }
    };

    const specialty = staff.specialty || 'neutral';
    const specialtyColor = specialtyColors[specialty] || specialtyColors['neutral'];

    // Format time (No seconds for Last/Next)
    const formatTime = (timeString?: string): string => {
        if (!timeString) return '-';
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const period = hours >= 12 ? 'p' : 'a';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
    };

    // Card dimensions based on viewMode
    const getCardDimensions = () => {
        switch (viewMode) {
            case 'ultra-compact':
                return { width: '100%', height: '200px', avatarSize: '80px', borderRadius: '50%' };
            case 'compact':
                return { width: '100%', height: '280px', avatarSize: '100px', borderRadius: '50%' };
            default: // normal
                return { width: '100%', height: '340px', avatarSize: '140px', borderRadius: '50%' };
        }
    };

    const dimensions = getCardDimensions();

    // Active Ticket Logic
    const activeTicket = staff.activeTickets?.find(t => t.status === 'in-service') || staff.activeTickets?.[0];
    const ticketInfo = staff.currentTicketInfo;

    // Dynamic sizing based on viewMode
    const isUltra = viewMode === 'ultra-compact';
    const isCompact = viewMode === 'compact';

    const sizes = {
        badge: isUltra ? '24px' : isCompact ? '34px' : '42px',
        badgeFont: isUltra ? '12px' : isCompact ? '16px' : '20px',
        notchHeight: status.isBusy ? (isUltra ? '28px' : '32px') : (isUltra ? '18px' : '24px'),
        nameSize: isUltra ? 'text-sm' : isCompact ? 'text-lg' : 'text-xl',
        metaSize: isUltra ? 'text-[9px]' : 'text-xs',
        iconSize: isUltra ? 9 : 11,
        borderWidth: isUltra ? '2px' : '4px',
        timelineText: isUltra ? 'text-[9px]' : 'text-[10px]',
        timelineGap: isUltra ? 'gap-1' : 'gap-3'
    };

    return (
        <div
            className={`group relative flex flex-col transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
            style={{
                width: '100%',
                height: dimensions.height,
                borderRadius: isUltra ? '16px' : '24px',
                boxShadow: status.isBusy
                    ? '0 4px 20px rgba(225, 29, 72, 0.15), 0 1px 4px rgba(225, 29, 72, 0.1)' // Red shadow for busy
                    : '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
                border: status.isBusy
                    ? `2px solid rgba(225, 29, 72, 0.3)` // Red border for busy
                    : `1px solid ${specialtyColor.darkBorderColor}40`,
                background: `linear-gradient(to bottom, ${specialtyColor.bgGradientFrom}, ${specialtyColor.bgGradientTo})`,
                cursor: isDraggable ? 'grab' : 'pointer',
                overflow: 'hidden'
            }}
            tabIndex={0}
            role="button"
        >
            {/* Red Desaturation Overlay for Busy State - red indicates busy */}
            {status.isBusy && (
                <div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                        background: 'rgba(225, 29, 72, 0.35)',
                        mixBlendMode: 'multiply',
                        filter: 'saturate(0.3)'
                    }}
                />
            )}
            {/* NOTCH */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-30 transition-all duration-300" style={{
                width: status.isBusy ? (isUltra ? '72%' : '60%') : (isUltra ? '50%' : '35%'),
                height: sizes.notchHeight,
            }}>
                {/* Notch Shape */}
                <div className="absolute inset-0 bg-white rounded-b-xl shadow-sm border-b border-l border-r border-gray-200/50"></div>

                {/* Busy State Content - Refined Structure */}
                {status.isBusy && ticketInfo ? (
                    <div className="absolute inset-0 overflow-hidden rounded-b-xl">
                        {/* Subtle Background Gradient */}
                        <div
                            className="absolute inset-0 transition-all duration-700 ease-out"
                            style={{
                                background: `linear-gradient(135deg, 
                                    ${ticketInfo.progress <= 0.25 ? 'rgba(16, 185, 129, 0.03)' : ticketInfo.progress <= 0.75 ? 'rgba(245, 158, 11, 0.03)' : 'rgba(239, 68, 68, 0.03)'} 0%, 
                                    transparent 100%)`
                            }}
                        />

                        {/* Main Content Container */}
                        <div className="absolute inset-0 flex items-center justify-between px-2.5">
                            {/* LEFT: Time Information Group */}
                            {!isUltra && (
                                <div className="flex items-center gap-1.5">
                                    {/* Clock Icon */}
                                    <Clock size={9} className="text-gray-400 flex-shrink-0" strokeWidth={2.5} />

                                    {/* Time Stack */}
                                    <div className="flex flex-col items-end -space-y-0.5">
                                        <span className="text-[11px] font-bold text-gray-900 tabular-nums leading-none">15m</span>
                                        <span className="text-[7px] text-gray-400 font-medium leading-none">left</span>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-px h-3.5 bg-gray-300/60" />

                                    {/* Total Time */}
                                    <span className="text-[10px] text-gray-600 font-semibold tabular-nums">45m</span>
                                </div>
                            )}

                            {/* RIGHT: Progress Percentage */}
                            <div className="flex items-center">
                                <span className="text-[14px] font-black text-gray-900 font-mono tabular-nums tracking-tight">
                                    {Math.round(ticketInfo.progress * 100)}%
                                </span>
                            </div>
                        </div>

                        {/* Bottom Progress Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200/50">
                            <div
                                className="h-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${ticketInfo.progress * 100}%`,
                                    background: ticketInfo.progress <= 0.25 ? '#10B981' : ticketInfo.progress <= 0.75 ? '#F59E0B' : '#EF4444',
                                    opacity: 0.6
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    /* Ready/Off State Content - Icon Based */
                    <div className="absolute inset-0 flex items-center justify-center gap-1">
                        {status.label === 'Ready' ? (
                            <>
                                <Check size={12} className="text-emerald-500" strokeWidth={3} />
                                {!isUltra && <span className="text-[9px] font-semibold text-emerald-600">Ready</span>}
                            </>
                        ) : (
                            <>
                                <Minus size={12} className="text-gray-400" strokeWidth={3} />
                                {!isUltra && <span className="text-[9px] font-semibold text-gray-500">Off</span>}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* --- TOP SECTION (70%) --- */}
            <div className={`relative h-[70%] flex flex-col items-center ${isUltra ? 'pt-6 px-1' : 'pt-8 px-2'} z-20`}>

                {/* Queue Number - Top Left of Card */}
                {config.showQueueNumber && (
                    <div className="absolute top-3 left-3 z-30">
                        <div
                            className="flex items-center justify-center font-bold font-mono backdrop-blur-md border border-gray-300/30 transition-all duration-300"
                            style={{
                                width: sizes.badge,
                                height: sizes.badge,
                                fontSize: sizes.badgeFont,
                                borderRadius: isUltra ? '10px' : isCompact ? '12px' : '14px',
                                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                color: '#1f2937',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                            }}
                        >
                            {staff.count}
                        </div>
                    </div>
                )}

                {/* More Options (Top Right) - Balanced */}
                {!isUltra && (
                    <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition-colors z-30 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-sm backdrop-blur-sm">
                        <MoreVertical size={16} />
                    </button>
                )}

                {/* DOMINANT AVATAR */}
                <div className="relative mb-2 group-hover:scale-[1.02] transition-transform duration-300">
                    {/* Avatar Image - Circle */}
                    <img
                        src={staff.image}
                        alt={staff.name}
                        className={`object-cover shadow-lg bg-white relative z-10 ${status.isBusy ? 'grayscale' : ''}`}
                        style={{
                            width: dimensions.avatarSize,
                            height: dimensions.avatarSize,
                            borderRadius: dimensions.borderRadius,
                            border: `${sizes.borderWidth} solid white`,
                            boxShadow: '0 8px 24px -6px rgba(0,0,0,0.15)'
                        }}
                    />

                    {/* BUSY Badge - Below Avatar */}
                    {status.isBusy && !isUltra && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-20">
                            <div className="flex items-center gap-1 bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-md border-2 border-white">
                                <CircleDot size={10} className="animate-pulse" />
                                <span className="text-[9px] font-bold uppercase tracking-wide">Busy</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Name */}
                <div className="text-center w-full mb-1">
                    <h3 className={`${sizes.nameSize} font-extrabold tracking-tight truncate px-1 drop-shadow-sm uppercase ${status.isBusy ? 'text-white' : 'text-gray-900'}`}>
                        {displayName}
                    </h3>
                </div>

                {/* Merged Data Pill: Clock In | Turns */}
                <div className={`flex items-center justify-center bg-white/60 rounded-full border border-gray-200/50 shadow-sm px-3 py-1 mb-1 backdrop-blur-sm`}>
                    {config.showClockedInTime && (
                        <div className="flex items-center gap-1.5">
                            <Clock size={sizes.iconSize} className="text-gray-400" />
                            <span className={`${sizes.metaSize} font-mono tracking-tight text-gray-700 font-medium`}>
                                {formatClockedInTime(staff.time)}
                            </span>
                        </div>
                    )}

                    {config.showClockedInTime && config.showTurnCount && (
                        <div className="w-px h-3 bg-gray-300 mx-2.5" />
                    )}

                    {config.showTurnCount && (
                        <div className="flex items-center gap-1.5" title="Turns">
                            <RefreshCw size={sizes.iconSize} className="text-gray-400" />
                            <span className={`${sizes.metaSize} font-mono font-bold text-gray-700`}>
                                {staff.turnCount ?? 0}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Elegant Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent z-20" />

            {/* --- BOTTOM SECTION (30%) --- */}
            <div
                className={`relative h-[30%] flex flex-col justify-center ${isUltra ? 'p-1.5' : 'p-3'} z-20`}
                style={{
                    background: status.isBusy
                        ? 'transparent'
                        : 'linear-gradient(to top, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%)',
                    backdropFilter: status.isBusy ? 'none' : 'blur(4px)'
                }}
            >

                {/* 1. Active Ticket (Busy State) - Single Row Compact Design */}
                {status.isBusy && activeTicket ? (
                    <div className="w-full relative z-10 px-1 perspective-1000">
                        {/* Stack Effect (if > 1 ticket) */}
                        {staff.activeTickets && staff.activeTickets.length > 1 && (
                            <div
                                className="absolute inset-x-2 -bottom-1 h-3 bg-[#f8f5ed] border-2 border-dashed border-[#dcdcdc] rounded-lg z-0 shadow-sm"
                                style={{ transform: 'rotate(-1deg) translateZ(-8px)' }}
                            />
                        )}

                        {/* Main Ticket Card */}
                        <div
                            onClick={() => console.log('View ticket details')}
                            className="relative w-full h-[38px] bg-gradient-to-br from-[#FFFBF0] to-[#FFF8E7] border-2 border-dashed border-[#E5E7EB] rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md group z-10 flex items-center overflow-hidden"
                            style={{
                                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                                WebkitMaskImage: 'radial-gradient(circle at -4px 50%, transparent 5px, black 5.5px), radial-gradient(circle at calc(100% + 4px) 50%, transparent 5px, black 5.5px)',
                                maskImage: 'radial-gradient(circle at -4px 50%, transparent 5px, black 5.5px), radial-gradient(circle at calc(100% + 4px) 50%, transparent 5px, black 5.5px)'
                            }}
                        >
                            {/* Status Strip (Left Stub) - Absolute Edge */}
                            <div className="absolute left-0 top-0 bottom-0 w-[4px]">
                                <div
                                    className="absolute inset-0 opacity-80"
                                    style={{
                                        background: activeTicket.status === 'in-service'
                                            ? '#34D399' // Soft Emerald
                                            : '#FBBF24' // Soft Amber
                                    }}
                                />
                                {/* Perforation Line */}
                                <div className="absolute right-0 top-0 bottom-0 w-[1px] border-r border-dashed border-black/5" />
                            </div>

                            {/* Ticket Number - Top Left Corner Tag */}
                            <div className="absolute top-0 left-[4px] px-1.5 py-[1px] bg-[#F3F0E6]/80 backdrop-blur-[1px] rounded-br-md border-b border-r border-black/5 z-20">
                                <span className="text-[8px] font-mono font-bold text-gray-400 leading-none block">
                                    #{activeTicket.ticketNumber || activeTicket.id}
                                </span>
                            </div>

                            {/* Content Container - Single Row */}
                            <div className="flex-1 flex items-center justify-between pl-3.5 pr-2">
                                {/* Left: Info */}
                                <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                                    {/* Pulse Dot (In-Service only) */}
                                    {activeTicket.status === 'in-service' && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                                    )}

                                    {/* Text: First Name + Service */}
                                    <div className="flex items-baseline gap-1.5 truncate pt-1">
                                        <span className={`${isUltra ? 'text-[10px]' : 'text-[11px]'} font-bold text-gray-800 uppercase tracking-tight`}>
                                            {activeTicket.clientName.split(' ')[0]}
                                        </span>
                                        <span className={`${isUltra ? 'text-[9px]' : 'text-[10px]'} font-medium text-gray-500 truncate`}>
                                            {activeTicket.serviceName}
                                        </span>
                                    </div>

                                    {/* Ticket Count Badge (Inline) */}
                                    {staff.activeTickets && staff.activeTickets.length > 1 && (
                                        <span className="flex-shrink-0 bg-white text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-gray-200 shadow-sm mt-0.5">
                                            +{staff.activeTickets.length - 1}
                                        </span>
                                    )}
                                </div>

                                {/* Right: Chevron (pushed down slightly) */}
                                <div className="flex-shrink-0 ml-1 text-gray-300 group-hover:text-gray-500 transition-colors pt-2">
                                    <ChevronRight size={14} strokeWidth={2} />
                                </div>
                            </div>

                            {/* Paper Texture Overlay */}
                            <div
                                className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-multiply"
                                style={{
                                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")',
                                    backgroundSize: '100px 100px'
                                }}
                            />

                            {/* Highlight Overlay */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        {/* Last & Next - Compact Row for Busy State */}
                        {!isUltra && (
                            <div className="flex items-center justify-between w-full px-2 gap-2 mt-2.5">
                                {/* Last Service */}
                                {staff.lastServiceTime && (
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                                        <span className="text-[9px] font-mono font-medium text-gray-500">
                                            {formatTime(staff.lastServiceTime)}
                                        </span>
                                    </div>
                                )}

                                {/* Separator */}
                                {staff.lastServiceTime && staff.nextAppointmentTime && (
                                    <div className="flex-1 h-px bg-gray-200" />
                                )}

                                {/* Next Appointment */}
                                {staff.nextAppointmentTime && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-mono font-bold text-blue-600">
                                            {formatTime(staff.nextAppointmentTime)}
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* 1. Ready State - Single Row Timeline */
                    <div className="flex items-center justify-between w-full px-1">
                        {/* Last Service */}
                        {config.showLastService && staff.lastServiceTime && (
                            <div className="flex flex-col items-start gap-0.5">
                                <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                                    {!isUltra && 'Last'}
                                </div>
                                <span className={`${sizes.timelineText} font-mono font-medium text-gray-600`}>
                                    {formatTime(staff.lastServiceTime)}
                                </span>
                            </div>
                        )}

                        {/* Connector Line (Horizontal) */}
                        <div className="flex-1 h-px bg-gray-200 mx-2 mt-2" />

                        {/* Next Appointment */}
                        {config.showNextAppointment && staff.nextAppointmentTime && (
                            <div className="flex flex-col items-end gap-0.5">
                                <div className="flex items-center gap-1 text-[10px] text-blue-400 uppercase tracking-wider font-bold">
                                    {!isUltra && 'Next'}
                                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                                </div>
                                <span className={`${sizes.timelineText} font-mono font-bold text-blue-600 bg-blue-50 px-1.5 rounded-md`}>
                                    {formatTime(staff.nextAppointmentTime)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
