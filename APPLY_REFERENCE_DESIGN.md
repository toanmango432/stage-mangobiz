# 🎯 Apply Full Reference Design - Action Plan

## Current Status
- ✅ Reference file copied: `ServiceTicketCard_REF.tsx` (751 lines from Downloads)
- ✅ Current file has helpers: `ServiceTicketCard.tsx` (1,188 lines with helpers)
- ❌ Reference design not yet applied

---

## The Challenge
The reference design file (`InServiceCard.tsx`) uses a different interface:
- Uses `card` prop with `ticketNumber`, `customerName`, `serviceName`, `percentage`, `staff[]`
- Uses `layout` ('grid'/'list') + `size` ('normal'/'compact')
- No event handlers (onComplete, onPause, onDelete)
- No real-time progress tracking

Our file needs:
- Uses `ticket` prop with different property names
- Uses `viewMode` ('compact'/'normal'/'grid-normal'/'grid-compact')
- Has event handlers and business logic
- Has useEffect for progress tracking

---

## Solution: Manual Adaptation Required

Since the files are too large for automated merging (token limits), I recommend **MANUAL IMPLEMENTATION**:

### Step 1: Open Both Files Side-by-Side
```bash
# In VS Code, open both:
# - src/components/tickets/ServiceTicketCard.tsx (current)
# - src/components/tickets/ServiceTicketCard_REF.tsx (reference)
```

### Step 2: Replace Each View Mode One at a Time

#### A. List Compact View (lines 167-270 in current file)
**Reference:** Lines 81-150 in `ServiceTicketCard_REF.tsx`  
**Map properties:**
- `card.ticketNumber` → `ticket.number`
- `card.customerName` → `ticket.clientName`
- `card.serviceName` → `ticket.service`
- `card.percentage` → `progress`
- `card.isFirstVisit` → `isFirstVisit` (already defined)
- `card.staff` → `staffList` (already defined)

#### B. List Normal View (lines 344-454 in current file)
**Reference:** Lines 151-300 in `ServiceTicketCard_REF.tsx`  
**Same property mappings as above**

#### C. Grid Normal View (lines 567-836 in current file)
**Reference:** Lines 301-600 in `ServiceTicketCard_REF.tsx`  
**This is the MAIN view with all decorative elements:**
- Perforation dots (20 across top)
- Left & right notches
- Paper thickness edge
- Wrap-around ticket number badge
- Progress bar with dynamic colors
- Staff badges with gradients
- Done button with CheckCircle
- 3-layer paper textures

#### D. Grid Compact View (lines 999-1161 in current file)
**Reference:** Lines 601-750 in `ServiceTicketCard_REF.tsx`  
**Same mappings, condensed version**

---

## Faster Alternative: Use My Pre-Built Version

I attempted to create a clean merged file but hit token limits. However, the **principle is simple**:

1. Keep all your current code EXCEPT the 4 view mode sections
2. Replace ONLY the JSX inside each `if (viewMode === ...)` block
3. Keep ALL business logic (useEffect, handlers, helpers)

---

## Recommended Action: Let Me Do It In Smaller Chunks

Would you like me to:
1. **Replace Grid Normal first** (the most important view with full design)
2. **Test that one view**
3. **Then replace the other 3 views**

This way we can verify each step works before proceeding!

---

## Or: I Can Create a Python/Node Script

I can write a script that:
1. Reads the reference file
2. Adapts property names
3. Merges with your business logic
4. Outputs the final file

Would take 5-10 minutes to write and run.

---

**What would you prefer?**
1. Manual step-by-step (I guide you through each view)
2. Automated script (I write a merge script)
3. One view at a time (Grid Normal first, test, then continue)
