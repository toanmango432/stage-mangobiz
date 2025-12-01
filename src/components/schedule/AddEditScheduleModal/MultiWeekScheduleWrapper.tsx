/**
 * MultiWeekScheduleWrapper
 *
 * Wraps the RegularScheduleTab component to support multi-week rotating patterns (1-4 weeks).
 * Provides:
 * - Pattern type selector (Fixed vs Rotating)
 * - Week count selector (1-4 weeks)
 * - Week tabs for editing each week's schedule
 * - Copy week functionality
 */

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Copy, RefreshCw, Calendar, HelpCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RegularScheduleTab } from './RegularScheduleTab';
import type { ScheduleData } from '../AddEditScheduleModal';

export type PatternType = 'fixed' | 'rotating';

interface MultiWeekScheduleWrapperProps {
  /** Array of schedule data for each week (1-4 weeks) */
  weekSchedules: ScheduleData[];
  /** Current pattern type */
  patternType: PatternType;
  /** Number of weeks in the pattern (1-4) */
  patternWeeks: number;
  /** Called when pattern type changes */
  onPatternTypeChange: (type: PatternType) => void;
  /** Called when pattern weeks count changes */
  onPatternWeeksChange: (weeks: number) => void;
  /** Called when a specific week's schedule is updated */
  onWeekUpdate: (weekIndex: number, updates: Partial<ScheduleData>) => void;
  /** Called when switching to day view */
  onSwitchToDay?: (day: string) => void;
  /** Currently selected week (0-indexed) */
  selectedWeek?: number;
  /** Called when selected week changes */
  onSelectedWeekChange?: (weekIndex: number) => void;
}

export function MultiWeekScheduleWrapper({
  weekSchedules,
  patternType,
  patternWeeks,
  onPatternTypeChange,
  onPatternWeeksChange,
  onWeekUpdate,
  onSwitchToDay,
  selectedWeek = 0,
  onSelectedWeekChange,
}: MultiWeekScheduleWrapperProps) {
  const [activeWeekIndex, setActiveWeekIndex] = useState(selectedWeek);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copySourceWeek, setCopySourceWeek] = useState<number | null>(null);

  // Ensure we have the right number of week schedules
  const currentWeekSchedule = weekSchedules[activeWeekIndex] || weekSchedules[0];

  const handleWeekChange = useCallback(
    (weekIndex: number) => {
      setActiveWeekIndex(weekIndex);
      onSelectedWeekChange?.(weekIndex);
    },
    [onSelectedWeekChange]
  );

  const handlePatternTypeChange = useCallback(
    (type: PatternType) => {
      onPatternTypeChange(type);
      // Reset to week 1 when changing pattern type
      if (type === 'fixed') {
        handleWeekChange(0);
      }
    },
    [onPatternTypeChange, handleWeekChange]
  );

  const handlePatternWeeksChange = useCallback(
    (weeks: number) => {
      onPatternWeeksChange(weeks);
      // Reset to week 1 if current week is beyond new count
      if (activeWeekIndex >= weeks) {
        handleWeekChange(0);
      }
    },
    [onPatternWeeksChange, activeWeekIndex, handleWeekChange]
  );

  const handleScheduleUpdate = useCallback(
    (updates: Partial<ScheduleData>) => {
      onWeekUpdate(activeWeekIndex, updates);
    },
    [onWeekUpdate, activeWeekIndex]
  );

  const handleCopyWeek = useCallback(
    (targetWeek: number) => {
      if (copySourceWeek === null) return;
      const sourceSchedule = weekSchedules[copySourceWeek];
      if (sourceSchedule) {
        onWeekUpdate(targetWeek, {
          schedule: { ...sourceSchedule.schedule },
          repeatRules: { ...sourceSchedule.repeatRules },
          notes: { ...sourceSchedule.notes },
        });
      }
      setShowCopyDialog(false);
      setCopySourceWeek(null);
    },
    [copySourceWeek, weekSchedules, onWeekUpdate]
  );

  const openCopyDialog = useCallback((sourceWeek: number) => {
    setCopySourceWeek(sourceWeek);
    setShowCopyDialog(true);
  }, []);

  // Calculate if any week has scheduled days
  const weekHasSchedule = useMemo(() => {
    return weekSchedules.map((schedule) => {
      if (!schedule?.schedule) return false;
      return Object.values(schedule.schedule).some(
        (slots) => slots && slots.length > 0 && slots.some((slot) => slot.type !== 'off')
      );
    });
  }, [weekSchedules]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Pattern Configuration Header */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-4">
          {/* Pattern Type Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-foreground">Schedule Pattern</label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">
                      <strong>Fixed:</strong> Same schedule every week.
                      <br />
                      <strong>Rotating:</strong> Schedule rotates over 2-4 weeks (e.g., alternating weekends).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose how the schedule repeats
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={patternType} onValueChange={(v) => handlePatternTypeChange(v as PatternType)}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Fixed</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="rotating">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <span>Rotating</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Week Count Selector (only for rotating) */}
          {patternType === 'rotating' && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-border/50">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Rotation Period</label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  How many weeks before the pattern repeats
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={patternWeeks.toString()}
                  onValueChange={(v) => handlePatternWeeksChange(parseInt(v, 10))}
                >
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 weeks</SelectItem>
                    <SelectItem value="3">3 weeks</SelectItem>
                    <SelectItem value="4">4 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Pattern Preview */}
          {patternType === 'rotating' && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
              <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-xs text-blue-700 dark:text-blue-300">
                This schedule will rotate every {patternWeeks} weeks. Edit each week below.
              </span>
            </div>
          )}
        </div>

        {/* Week Tabs (only for rotating patterns) */}
        {patternType === 'rotating' && patternWeeks > 1 && (
          <div className="space-y-3">
            {/* Week Tab Navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from({ length: patternWeeks }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleWeekChange(i)}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                    'text-sm font-medium',
                    activeWeekIndex === i
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>Week {i + 1}</span>
                  {weekHasSchedule[i] && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      Set
                    </Badge>
                  )}
                  {activeWeekIndex === i && (
                    <ChevronRight className="w-4 h-4 absolute -right-1 text-primary" />
                  )}
                </button>
              ))}

              {/* Copy Week Button */}
              {weekHasSchedule[activeWeekIndex] && patternWeeks > 1 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCopyDialog(activeWeekIndex)}
                      className="ml-2 h-9"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Week {activeWeekIndex + 1}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Copy this week's schedule to another week</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Week Description */}
            <div className="text-sm text-muted-foreground">
              Editing <span className="font-medium text-foreground">Week {activeWeekIndex + 1}</span> of{' '}
              {patternWeeks}
            </div>
          </div>
        )}

        {/* Regular Schedule Tab */}
        <div className={cn(patternType === 'rotating' && patternWeeks > 1 && 'pt-2')}>
          <RegularScheduleTab
            scheduleData={currentWeekSchedule}
            onUpdate={handleScheduleUpdate}
            onSwitchToDay={onSwitchToDay}
          />
        </div>

        {/* Copy Week Dialog */}
        <AlertDialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Copy Week {(copySourceWeek ?? 0) + 1} to...</AlertDialogTitle>
              <AlertDialogDescription>
                Select which week you want to copy this schedule to. This will overwrite the existing
                schedule for that week.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-wrap gap-2 py-4">
              {Array.from({ length: patternWeeks }, (_, i) => i)
                .filter((i) => i !== copySourceWeek)
                .map((weekIndex) => (
                  <Button
                    key={weekIndex}
                    variant={weekHasSchedule[weekIndex] ? 'outline' : 'secondary'}
                    onClick={() => handleCopyWeek(weekIndex)}
                    className="flex-1 min-w-[100px]"
                  >
                    Week {weekIndex + 1}
                    {weekHasSchedule[weekIndex] && (
                      <span className="ml-1 text-xs text-muted-foreground">(has schedule)</span>
                    )}
                  </Button>
                ))}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  // Copy to all other weeks
                  Array.from({ length: patternWeeks }, (_, i) => i)
                    .filter((i) => i !== copySourceWeek)
                    .forEach((weekIndex) => handleCopyWeek(weekIndex));
                }}
              >
                Copy to All Weeks
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

export default MultiWeekScheduleWrapper;
