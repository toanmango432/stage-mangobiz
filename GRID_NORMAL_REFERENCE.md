# Grid Normal View - Code Sections Needed

## Current Progress
✅ Card outer structure replaced (lines 585-610)
⏳ Need to add remaining content

## Sections to Add (in order):

### 1. Perforation Dots (PARTIALLY DONE - line 611+)
```jsx
{[...Array(20)].map((_, i) => (
  <div key={i} className="w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full bg-[#c4b5a0]" />
))}
```

### 2. Notches (Left & Right)
```jsx
{/* Left Notch */}
<div className="absolute left-[-6px] sm:left-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-r border-[#d4b896]/50"
  style={{
    background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)',
    boxShadow: 'inset -2px 0 3px rgba(139, 92, 46, 0.10), 1px 0 3px rgba(0,0,0,0.08)'
  }}
/>
```

### 3. Paper Thickness Edge
```jsx
<div className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
  style={{
    background: `linear-gradient(to right, rgba(139, 92, 46, 0.20) 0%, rgba(139, 92, 46, 0.12) 30%, rgba(180, 150, 110, 0.08) 60%, transparent 100%)`,
    boxShadow: `inset 2px 0 3px rgba(139, 92, 46, 0.25), inset 1px 0 2px rgba(0, 0, 0, 0.15), -2px 0 4px rgba(139, 92, 46, 0.12), -1px 0 2px rgba(139, 92, 46, 0.10)`
  }}
/>
```

### 4. Ticket Number Wrap-Around Badge  
```jsx
<div className="absolute left-0 top-4 sm:top-5 w-11 sm:w-14 text-[#1a1614] flex items-center justify-center font-black text-lg sm:text-2xl z-20"
  style={{
    height: isFirstVisit ? 'clamp(2.25rem, 5vw, 2.75rem)' : 'clamp(2rem, 4.5vw, 2.5rem)',
    ...
  }}
>
  {ticket.number}
</div>
```

### 5. Card Header (Customer Info)
```jsx
<div className="flex items-start justify-between px-3 sm:px-4 pt-4 sm:pt-5 pb-1 pl-12 sm:pl-14">
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
      <span className="text-base sm:text-lg md:text-xl font-bold text-[#1a1614] truncate tracking-tight">
        {ticket.clientName}
      </span>
      {hasStar && <span className="text-sm sm:text-base md:text-lg flex-shrink-0">⭐</span>}
      {hasNote && <span className="text-sm sm:text-base md:text-lg flex-shrink-0">📋</span>}
    </div>
    {isFirstVisit && (
      <div className="text-[10px] sm:text-xs text-[#8b7968] font-medium tracking-wide">
        FIRST VISIT
      </div>
    )}
  </div>
  {/* More button with Tippy */}
</div>
```

### 6. Service Name
```jsx
<div className="px-3 sm:px-4 pb-3 sm:pb-4 text-sm sm:text-base text-[#1a1614] font-semibold leading-snug tracking-tight line-clamp-2">
  {ticket.service}
</div>
```

### 7. Time & Progress
```jsx
<div className="px-3 sm:px-4 pb-1.5 sm:pb-2 flex items-center justify-between">
  <div className="text-xs sm:text-sm text-[#6b5d52] font-medium">{formatTime(timeRemaining)} left</div>
  <div className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: currentStatus.text }}>
    {progress}%
  </div>
</div>
```

### 8. Progress Bar
```jsx
<div className="px-3 sm:px-4 pb-4 sm:pb-5">
  <div className="h-2 sm:h-2.5 bg-[#f5f0e8] rounded-full border border-[#e8dcc8]/40 overflow-hidden"
    style={{ boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08)' }}
  >
    <div className="h-full transition-all duration-300 rounded-full"
      style={{
        width: `${Math.min(progress, 100)}%`,
        background: currentStatus.progress,
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)'
      }}
    />
  </div>
</div>
```

### 9. Staff Section with Gradients
```jsx
<div className="mt-auto mx-2 sm:mx-3 mb-2 sm:mb-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg relative"
  style={{
    background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
    boxShadow: `inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)`,
    border: '1px solid rgba(212, 184, 150, 0.15)'
  }}
>
  <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 pr-11 sm:pr-12">
    {staffList.map((staff, index) => (
      <div key={index} className="text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-white/30 cursor-pointer hover:scale-105 transition-transform tracking-wide"
        style={{
          background: getStaffGradient(staff),
          boxShadow: `0 3px 6px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5)`,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)'
        }}
      >
        {staff.name.toUpperCase()}
      </div>
    ))}
  </div>
  
  {/* Done Button */}
  <button onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
    className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all"
    title="Mark as Done"
  >
    <CheckCircle size={20} className="sm:w-5 sm:h-5" strokeWidth={2} />
  </button>
</div>
```

### 10. Paper Texture Layers
```jsx
{/* Paper fibers texture */}
<div className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay rounded-xl"
  style={{
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
    backgroundSize: '200px 200px'
  }}
/>

{/* Grain pattern */}
<div className="absolute inset-0 pointer-events-none opacity-15 rounded-xl"
  style={{
    backgroundImage: `
      repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px),
      repeating-linear-gradient(0deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px)
    `,
    backgroundSize: '3px 3px'
  }}
/>

{/* Edge highlight */}
<div className="absolute inset-0 pointer-events-none rounded-xl"
  style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.4)' }}
/>
```

### 11. Close Tags & Modal
```jsx
    </div>
    
    {/* TicketDetailsModal */}
    <TicketDetailsModal
      ticket={{
        ...ticket,
        status: 'in-service' as const,
        priority: ticket.priority || 'normal'
      }}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
    />
  </>
  );
}
```

---

## Next: Apply these sections to the file
