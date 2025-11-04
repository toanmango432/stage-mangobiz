# Ticket Card Restructure - Implementation Summary

## Date: November 1, 2025

## Overview
Complete restructure of all ticket views to match new cleaner, more vertical layout design.

## New Structure (All Views)

```
┌─────────────────────────────────────────┐
│ [#91]  Emily Chen  ›  📄     ⋮         │ ← Header: Badge + Name + Icons
│        2 weeks ago                      │ ← Subheader: Last visit
│                                         │
│ Gel Manicure                           │ ← Service (prominent, own row)
│                                         │
│ [Sophia] [Madison]                     │ ← Staff badges (below service)
│                                         │
│ ⏰ 30m remaining            67%        │ ← Footer: Time + Progress %
│ ═══════════════════════════════        │ ← Progress bar (full width)
└─────────────────────────────────────────┘
```

## Files to Update

### ServiceTicketCard.tsx
- [x] Grid Normal (lines 670-950)
- [ ] Grid Compact (lines 950-1100)
- [ ] Line Normal (lines 418-640)
- [ ] Line Compact (lines 158-370)

### WaitListTicketCard.tsx
- [ ] Grid Normal 
- [ ] Grid Compact
- [ ] Line Normal
- [ ] Line Compact

## Key Changes

### 1. Header Section
- Badge + Client Name + Chevron + Note icon in one row
- More Menu button subtle (opacity: 40%)
- Last visit on its own row below

### 2. Service Section
- **Much more prominent**
- Gets own row with generous spacing
- Larger font, better visual weight
- 2-line clamp for long names

### 3. Staff Section
- **Moved below service** (not in header)
- Pill-style badges, horizontal layout
- Show up to 4 staff + counter
- Separated by subtle border line

### 4. Footer Section
- Left: Clock icon + time remaining text
- Right: Progress percentage (colored)
- Below: Full-width progress bar

### 5. Spacing & Hierarchy
- More vertical padding between sections
- Clear visual separation
- Better breathing room
- Service is the star of the show

## Color Differences
- **In Service**: Blue badge/progress (#0D8BF0)
- **Wait Queue**: Amber badge (#FCD34D, #F59E0B)

## Status
- In Progress: Starting with ServiceTicketCard Grid Normal as template
- Then replicate to other 7 view modes

## Implementation Notes
- Maintain responsive behavior (clamp() for all fonts)
- Keep paper texture and hover effects
- Preserve accessibility (aria labels, keyboard nav)
- Ensure BOTH files stay in sync
