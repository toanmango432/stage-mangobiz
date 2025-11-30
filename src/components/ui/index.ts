/**
 * Standardized UI Component Library
 *
 * This library provides consistent, reusable components that use design tokens
 * from tailwind.config.js (brand colors, premium shadows, animations, etc.)
 *
 * Usage:
 * import { Button, Card, Input, Badge, Select } from '@/components/ui';
 */

export { Button, buttonVariants } from './Button';
export type { ButtonProps } from './Button';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './Card';

export { Input } from './Input';

export { Badge, badgeVariants } from './Badge';
export type { BadgeProps } from './Badge';

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from './Select';

// New shadcn/Radix UI Tabs components
export { Tabs as RadixTabs, TabsList, TabsTrigger, TabsContent } from './Tabs';

// Legacy Tab/Tabs components for backward compatibility
// The old Tabs has onChange prop, Tab has value/label/badge
export { Tab, LegacyTabs as Tabs } from './TabCompat';
export type { TabProps } from './TabCompat';
