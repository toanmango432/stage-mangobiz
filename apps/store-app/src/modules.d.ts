/**
 * Module declarations for third-party packages that don't have type definitions.
 * These declarations allow TypeScript to recognize these modules.
 */

// Radix UI components
declare module '@radix-ui/react-aspect-ratio' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export default Root;
}

declare module '@radix-ui/react-accordion' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export const Item: React.ForwardRefExoticComponent<any>;
  export const Header: React.ForwardRefExoticComponent<any>;
  export const Trigger: React.ForwardRefExoticComponent<any>;
  export const Content: React.ForwardRefExoticComponent<any>;
}

declare module '@radix-ui/react-context-menu' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export const Trigger: React.ForwardRefExoticComponent<any>;
  export const Portal: React.ForwardRefExoticComponent<any>;
  export const Content: React.ForwardRefExoticComponent<any>;
  export const Item: React.ForwardRefExoticComponent<any>;
  export const Group: React.ForwardRefExoticComponent<any>;
  export const CheckboxItem: React.ForwardRefExoticComponent<any>;
  export const RadioItem: React.ForwardRefExoticComponent<any>;
  export const RadioGroup: React.ForwardRefExoticComponent<any>;
  export const ItemIndicator: React.ForwardRefExoticComponent<any>;
  export const Label: React.ForwardRefExoticComponent<any>;
  export const Separator: React.ForwardRefExoticComponent<any>;
  export const Sub: React.ForwardRefExoticComponent<any>;
  export const SubTrigger: React.ForwardRefExoticComponent<any>;
  export const SubContent: React.ForwardRefExoticComponent<any>;
}

declare module '@radix-ui/react-hover-card' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export const Trigger: React.ForwardRefExoticComponent<any>;
  export const Portal: React.ForwardRefExoticComponent<any>;
  export const Content: React.ForwardRefExoticComponent<any>;
}

declare module '@radix-ui/react-menubar' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export const Menu: React.ForwardRefExoticComponent<any>;
  export const Trigger: React.ForwardRefExoticComponent<any>;
  export const Portal: React.ForwardRefExoticComponent<any>;
  export const Content: React.ForwardRefExoticComponent<any>;
  export const Item: React.ForwardRefExoticComponent<any>;
  export const Group: React.ForwardRefExoticComponent<any>;
  export const CheckboxItem: React.ForwardRefExoticComponent<any>;
  export const RadioItem: React.ForwardRefExoticComponent<any>;
  export const RadioGroup: React.ForwardRefExoticComponent<any>;
  export const ItemIndicator: React.ForwardRefExoticComponent<any>;
  export const Label: React.ForwardRefExoticComponent<any>;
  export const Separator: React.ForwardRefExoticComponent<any>;
  export const Sub: React.ForwardRefExoticComponent<any>;
  export const SubTrigger: React.ForwardRefExoticComponent<any>;
  export const SubContent: React.ForwardRefExoticComponent<any>;
}

declare module '@radix-ui/react-navigation-menu' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export const List: React.ForwardRefExoticComponent<any>;
  export const Item: React.ForwardRefExoticComponent<any>;
  export const Trigger: React.ForwardRefExoticComponent<any>;
  export const Content: React.ForwardRefExoticComponent<any>;
  export const Link: React.ForwardRefExoticComponent<any>;
  export const Viewport: React.ForwardRefExoticComponent<any>;
  export const Indicator: React.ForwardRefExoticComponent<any>;
}

declare module '@radix-ui/react-toggle' {
  export const Root: React.ForwardRefExoticComponent<any>;
}

declare module '@radix-ui/react-toggle-group' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export const Item: React.ForwardRefExoticComponent<any>;
}

// Carousel library
declare module 'embla-carousel-react' {
  import type { EmblaOptionsType, EmblaCarouselType, EmblaPluginType } from 'embla-carousel';

  export type UseEmblaCarouselType = [
    (node: HTMLElement | null) => void,
    EmblaCarouselType | undefined
  ];

  export default function useEmblaCarousel(
    options?: EmblaOptionsType,
    plugins?: EmblaPluginType[]
  ): UseEmblaCarouselType;

  export type { EmblaOptionsType, EmblaCarouselType, EmblaPluginType };
}

declare module 'embla-carousel' {
  export interface EmblaOptionsType {
    axis?: 'x' | 'y';
    container?: string;
    slides?: string;
    align?: 'start' | 'center' | 'end' | number;
    containScroll?: false | 'trimSnaps' | 'keepSnaps';
    slidesToScroll?: number | 'auto';
    dragFree?: boolean;
    draggable?: boolean;
    inViewThreshold?: number;
    loop?: boolean;
    skipSnaps?: boolean;
    startIndex?: number;
    duration?: number;
    watchDrag?: boolean;
    watchResize?: boolean;
    watchSlides?: boolean;
  }

  export interface EmblaCarouselType {
    canScrollNext(): boolean;
    canScrollPrev(): boolean;
    scrollNext(): void;
    scrollPrev(): void;
    scrollTo(index: number): void;
    selectedScrollSnap(): number;
    scrollSnapList(): number[];
    on(event: string, callback: () => void): EmblaCarouselType;
    off(event: string, callback: () => void): EmblaCarouselType;
    destroy(): void;
    reInit(): void;
  }

  export interface EmblaPluginType {
    name: string;
    options?: Record<string, any>;
  }
}

// Charting library
declare module 'recharts' {
  import * as React from 'react';

  export interface ChartConfig {
    [key: string]: {
      label?: React.ReactNode;
      icon?: React.ComponentType;
      color?: string;
    };
  }

  export const ResponsiveContainer: React.FC<{
    width?: string | number;
    height?: string | number;
    aspect?: number;
    minWidth?: number;
    minHeight?: number;
    children?: React.ReactNode;
  }>;

  export const AreaChart: React.FC<any>;
  export const BarChart: React.FC<any>;
  export const LineChart: React.FC<any>;
  export const PieChart: React.FC<any>;
  export const RadarChart: React.FC<any>;
  export const RadialBarChart: React.FC<any>;
  export const ComposedChart: React.FC<any>;
  export const ScatterChart: React.FC<any>;

  export const Area: React.FC<any>;
  export const Bar: React.FC<any>;
  export const Line: React.FC<any>;
  export const Pie: React.FC<any>;
  export const Radar: React.FC<any>;
  export const RadialBar: React.FC<any>;
  export const Scatter: React.FC<any>;

  export const XAxis: React.FC<any>;
  export const YAxis: React.FC<any>;
  export const CartesianGrid: React.FC<any>;
  export const Tooltip: React.FC<any>;
  export const Legend: React.FC<any>;
  export const Cell: React.FC<any>;
  export const ReferenceLine: React.FC<any>;
  export const ReferenceArea: React.FC<any>;
  export const Brush: React.FC<any>;
  export const PolarGrid: React.FC<any>;
  export const PolarAngleAxis: React.FC<any>;
  export const PolarRadiusAxis: React.FC<any>;
}

// Drawer library
declare module 'vaul' {
  import * as React from 'react';

  export interface DrawerProps {
    shouldScaleBackground?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    modal?: boolean;
    direction?: 'top' | 'bottom' | 'left' | 'right';
    dismissible?: boolean;
    onClose?: () => void;
    children?: React.ReactNode;
  }

  export interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
    forceMount?: true;
    asChild?: boolean;
    [key: string]: unknown;
  }

  export const Drawer: {
    Root: React.FC<DrawerProps>;
    Trigger: React.ForwardRefExoticComponent<any>;
    Portal: React.FC<{ children?: React.ReactNode }>;
    Overlay: React.ForwardRefExoticComponent<any>;
    Content: React.ForwardRefExoticComponent<DrawerContentProps>;
    Title: React.ForwardRefExoticComponent<any>;
    Description: React.ForwardRefExoticComponent<any>;
    Close: React.ForwardRefExoticComponent<any>;
    Handle: React.ForwardRefExoticComponent<any>;
  };

  export default Drawer;
}

// Resizable panels
declare module 'react-resizable-panels' {
  import * as React from 'react';

  export interface PanelGroupProps {
    autoSaveId?: string;
    direction: 'horizontal' | 'vertical';
    onLayout?: (sizes: number[]) => void;
    children?: React.ReactNode;
    className?: string;
    id?: string;
  }

  export interface PanelProps {
    collapsedSize?: number;
    collapsible?: boolean;
    defaultSize?: number;
    id?: string;
    maxSize?: number;
    minSize?: number;
    onCollapse?: () => void;
    onExpand?: () => void;
    onResize?: (size: number) => void;
    order?: number;
    children?: React.ReactNode;
    className?: string;
  }

  export interface PanelResizeHandleProps {
    className?: string;
    disabled?: boolean;
    id?: string;
    onDragging?: (isDragging: boolean) => void;
    children?: React.ReactNode;
  }

  export const PanelGroup: React.FC<PanelGroupProps>;
  export const Panel: React.FC<PanelProps>;
  export const PanelResizeHandle: React.FC<PanelResizeHandleProps>;
}

// OTP Input
declare module 'input-otp' {
  import * as React from 'react';

  export interface OTPInputProps {
    maxLength?: number;
    value?: string;
    onChange?: (value: string) => void;
    onComplete?: (value: string) => void;
    render?: (props: { slots: any[]; isFocused: boolean; isHovering: boolean }) => React.ReactNode;
    containerClassName?: string;
    className?: string;
    children?: React.ReactNode;
  }

  export const OTPInput: React.ForwardRefExoticComponent<OTPInputProps & React.RefAttributes<HTMLInputElement>>;
  export const OTPInputContext: React.Context<any>;

  export const REGEXP_ONLY_DIGITS: RegExp;
  export const REGEXP_ONLY_CHARS: RegExp;
  export const REGEXP_ONLY_DIGITS_AND_CHARS: RegExp;
}

// Toast notifications
declare module 'sonner' {
  import * as React from 'react';

  export interface ToasterProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
    expand?: boolean;
    duration?: number;
    visibleToasts?: number;
    closeButton?: boolean;
    className?: string;
    toastOptions?: {
      style?: React.CSSProperties;
      className?: string;
      classNames?: {
        toast?: string;
        title?: string;
        description?: string;
        actionButton?: string;
        cancelButton?: string;
        closeButton?: string;
      };
      descriptionClassName?: string;
      duration?: number;
      unstyled?: boolean;
    };
    theme?: 'light' | 'dark' | 'system';
    richColors?: boolean;
    offset?: string;
    dir?: 'ltr' | 'rtl';
    hotkey?: string[];
    icons?: {
      success?: React.ReactNode;
      info?: React.ReactNode;
      warning?: React.ReactNode;
      error?: React.ReactNode;
      loading?: React.ReactNode;
    };
    [key: string]: unknown;
  }

  export const Toaster: React.FC<ToasterProps>;

  export const toast: {
    (message: string | React.ReactNode, data?: any): string | number;
    success: (message: string | React.ReactNode, data?: any) => string | number;
    error: (message: string | React.ReactNode, data?: any) => string | number;
    warning: (message: string | React.ReactNode, data?: any) => string | number;
    info: (message: string | React.ReactNode, data?: any) => string | number;
    loading: (message: string | React.ReactNode, data?: any) => string | number;
    promise: <T>(promise: Promise<T>, data: any) => Promise<T>;
    dismiss: (id?: string | number) => void;
    custom: (component: (id: string | number) => React.ReactNode, data?: any) => string | number;
  };
}

// Slider
declare module '@radix-ui/react-slider' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export const Track: React.ForwardRefExoticComponent<any>;
  export const Range: React.ForwardRefExoticComponent<any>;
  export const Thumb: React.ForwardRefExoticComponent<any>;
}
