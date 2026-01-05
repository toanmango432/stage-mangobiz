/**
 * BlockTimeModal Component
 * Modal for creating blocked time entries on the calendar
 */

import { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Save, X, CalendarIcon, Clock, Repeat, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, addDays, addWeeks, addMonths } from 'date-fns';
import {
  useBlockedTimeTypes,
  useBlockedTimeEntryMutations,
  type ScheduleContext,
} from '@/hooks/useSchedule';
import type { BlockedTimeFrequency } from '@/types/schedule';

// Time options for dropdowns (every 15 minutes)
const TIME_OPTIONS: string[] = [];
for (let hour = 0; hour < 24; hour++) {
  for (let min = 0; min < 60; min += 15) {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const m = min.toString().padStart(2, '0');
    TIME_OPTIONS.push(`${h}:${m} ${ampm}`);
  }
}

// Duration options in minutes
const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: 'Full day (8 hours)' },
];

// Frequency options
const FREQUENCY_OPTIONS: { value: BlockedTimeFrequency; label: string }[] = [
  { value: 'once', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

interface BlockTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: ScheduleContext;
  staffId: string;
  staffName: string;
  initialDate?: string;
  initialStartTime?: string;
  onSuccess?: () => void;
}

export function BlockTimeModal({
  open,
  onOpenChange,
  context,
  staffId,
  staffName,
  initialDate,
  initialStartTime,
  onSuccess,
}: BlockTimeModalProps) {
  const { types, loading: typesLoading } = useBlockedTimeTypes(context.storeId);
  const { create, loading: creating } = useBlockedTimeEntryMutations(context);

  // Form state
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(initialDate ? parseISO(initialDate) : new Date());
  const [startTime, setStartTime] = useState<string>(initialStartTime || '9:00 AM');
  const [duration, setDuration] = useState<number>(60);
  const [frequency, setFrequency] = useState<BlockedTimeFrequency>('once');
  const [repeatEndType, setRepeatEndType] = useState<'date' | 'count'>('date');
  const [repeatEndDate, setRepeatEndDate] = useState<Date | undefined>(undefined);
  const [repeatCount, setRepeatCount] = useState<number>(10);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);

  // Get selected type details
  const selectedType = useMemo(() => {
    return types.find(t => t.id === selectedTypeId);
  }, [types, selectedTypeId]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTypeId(types[0]?.id || '');
      setDate(initialDate ? parseISO(initialDate) : new Date());
      setStartTime(initialStartTime || '9:00 AM');
      setDuration(selectedType?.defaultDurationMinutes || 60);
      setFrequency('once');
      setRepeatEndType('date');
      setRepeatEndDate(undefined);
      setRepeatCount(10);
      setNotes('');
      setError(null);
    }
  }, [open, initialDate, initialStartTime, types]);

  // Update duration when type changes
  useEffect(() => {
    if (selectedType?.defaultDurationMinutes) {
      setDuration(selectedType.defaultDurationMinutes);
    }
  }, [selectedType]);

  // Calculate end time based on start time and duration
  const calculateEndDateTime = (startTimeStr: string, durationMins: number, dateVal: Date): string => {
    const [time, period] = startTimeStr.split(' ');
    const [hours, mins] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;

    const startDate = new Date(dateVal);
    startDate.setHours(hour24, mins, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);
    return endDate.toISOString();
  };

  const calculateStartDateTime = (startTimeStr: string, dateVal: Date): string => {
    const [time, period] = startTimeStr.split(' ');
    const [hours, mins] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;

    const startDate = new Date(dateVal);
    startDate.setHours(hour24, mins, 0, 0);
    return startDate.toISOString();
  };

  // Format end time for display
  const endTimeDisplay = useMemo(() => {
    if (!date) return '';
    const endDateTime = calculateEndDateTime(startTime, duration, date);
    return format(parseISO(endDateTime), 'h:mm a');
  }, [startTime, duration, date]);

  // Calculate suggested repeat end date based on frequency
  const suggestedRepeatEndDate = useMemo(() => {
    if (!date) return undefined;
    switch (frequency) {
      case 'daily': return addDays(date, 30);
      case 'weekly': return addWeeks(date, 12);
      case 'biweekly': return addWeeks(date, 24);
      case 'monthly': return addMonths(date, 6);
      default: return undefined;
    }
  }, [date, frequency]);

  // Set suggested end date when frequency changes
  useEffect(() => {
    if (frequency !== 'once' && !repeatEndDate && suggestedRepeatEndDate) {
      setRepeatEndDate(suggestedRepeatEndDate);
    }
  }, [frequency, suggestedRepeatEndDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTypeId) {
      setError('Please select a blocked time type');
      return;
    }

    if (!date) {
      setError('Please select a date');
      return;
    }

    if (!selectedType) {
      setError('Invalid blocked time type');
      return;
    }

    if (frequency !== 'once' && repeatEndType === 'date' && !repeatEndDate) {
      setError('Please select an end date for recurring blocked time');
      return;
    }

    try {
      const startDateTime = calculateStartDateTime(startTime, date);
      const endDateTime = calculateEndDateTime(startTime, duration, date);

      await create({
        staffId,
        staffName,
        typeId: selectedTypeId,
        startDateTime,
        endDateTime,
        frequency,
        repeatEndDate: frequency !== 'once' && repeatEndType === 'date' && repeatEndDate
          ? repeatEndDate.toISOString().split('T')[0]
          : null,
        repeatCount: frequency !== 'once' && repeatEndType === 'count'
          ? repeatCount
          : null,
        notes: notes.trim() || null,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create blocked time');
    }
  };

  const loading = typesLoading || creating;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Block Time</SheetTitle>
          <SheetDescription>
            Block time on {staffName}'s calendar
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Block Type *</Label>
            {types.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No blocked time types available. Please configure types in settings first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {types.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedTypeId(type.id)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-colors',
                      selectedTypeId === type.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: `${type.color}20`, color: type.color }}
                    >
                      {type.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{type.name}</p>
                      {type.isPaid && (
                        <p className="text-xs text-muted-foreground">Paid</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration *</Label>
              <Select
                value={duration.toString()}
                onValueChange={(v) => setDuration(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* End Time Display */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Ends at <span className="font-medium">{endTimeDisplay}</span>
            </span>
          </div>

          {/* Recurrence */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Repeat
            </Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as BlockedTimeFrequency)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Repeat End Options */}
            {frequency !== 'once' && (
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                <RadioGroup
                  value={repeatEndType}
                  onValueChange={(v) => setRepeatEndType(v as 'date' | 'count')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="date" id="repeat-end-date" />
                    <Label htmlFor="repeat-end-date" className="font-normal">
                      End by date
                    </Label>
                  </div>
                  {repeatEndType === 'date' && (
                    <Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            'ml-6 justify-start text-left font-normal',
                            !repeatEndDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {repeatEndDate ? format(repeatEndDate, 'PPP') : 'Select end date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={repeatEndDate}
                          onSelect={(d) => {
                            setRepeatEndDate(d);
                            setEndDatePickerOpen(false);
                          }}
                          disabled={(d) => date ? d < date : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="count" id="repeat-end-count" />
                    <Label htmlFor="repeat-end-count" className="font-normal">
                      End after occurrences
                    </Label>
                  </div>
                  {repeatEndType === 'count' && (
                    <div className="ml-6 flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={repeatCount}
                        onChange={(e) => setRepeatCount(parseInt(e.target.value, 10) || 1)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">times</span>
                    </div>
                  )}
                </RadioGroup>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          {/* Preview */}
          {selectedType && date && (
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-sm font-medium mb-1">Preview</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: `${selectedType.color}20`, color: selectedType.color }}
                >
                  {selectedType.emoji}
                </div>
                <div className="text-sm">
                  <span className="font-medium">{selectedType.name}</span>
                  <span className="text-muted-foreground">
                    {' '}&bull; {format(date, 'MMM d')} &bull; {startTime} - {endTimeDisplay}
                  </span>
                </div>
              </div>
              {frequency !== 'once' && (
                <p className="text-xs text-muted-foreground mt-1 ml-8">
                  Repeats {FREQUENCY_OPTIONS.find(f => f.value === frequency)?.label.toLowerCase()}
                  {repeatEndType === 'date' && repeatEndDate && ` until ${format(repeatEndDate, 'MMM d, yyyy')}`}
                  {repeatEndType === 'count' && ` for ${repeatCount} occurrences`}
                </p>
              )}
            </div>
          )}

          <SheetFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading || types.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              {creating ? 'Blocking...' : 'Block Time'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default BlockTimeModal;
