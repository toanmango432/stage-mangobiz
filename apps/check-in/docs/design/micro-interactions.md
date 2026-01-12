# Micro-Interactions & Transitions

> Animation guidelines for the Mango Check-In App to create a delightful, responsive user experience.

---

## Animation Philosophy

**High-impact moments > scattered micro-interactions**

Focus animation budget on key moments that matter:
1. **Feedback** — Confirm user actions immediately
2. **Progress** — Show system state and transitions
3. **Delight** — Celebrate completion moments
4. **Guidance** — Draw attention to next actions

---

## Core Animation Tokens

### Durations

| Token | Value | Usage |
|-------|-------|-------|
| `instant` | 0ms | Immediate state changes |
| `fast` | 100ms | Button press, micro-feedback |
| `normal` | 200ms | Most transitions |
| `slow` | 300ms | Page transitions, modals |
| `emphasis` | 400-500ms | Important celebrations |

### Easing Functions

| Name | CSS | Usage |
|------|-----|-------|
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering view |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving view |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Element state changes |
| `bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful emphasis |
| `spring` | `cubic-bezier(0.5, 1.5, 0.5, 1)` | Snappy, energetic |

---

## Button Interactions

### Primary Button Press

```css
/* Rest state */
.btn-primary {
  transform: scale(1);
  box-shadow: 0 4px 14px rgba(26, 95, 74, 0.25);
  transition: all 150ms ease-out;
}

/* Hover (tablet touch start) */
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(26, 95, 74, 0.30);
}

/* Active (pressed) */
.btn-primary:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(26, 95, 74, 0.20);
}
```

**Tailwind:**
```jsx
<button className="
  transition-all duration-150 ease-out
  hover:shadow-xl hover:-translate-y-0.5
  active:scale-[0.98]
">
```

### Keypad Key Press

Tactile feedback with scale and color change:

```css
/* Key press feedback */
.keypad-key:active {
  transform: scale(0.95);
  background-color: #e8f5f0;
  border-color: rgba(26, 95, 74, 0.3);
  transition: all 100ms ease-out;
}
```

**Implementation:**
```jsx
const [pressedKey, setPressedKey] = useState<string | null>(null);

const handleKey = (key: string) => {
  setPressedKey(key);
  setTimeout(() => setPressedKey(null), 150);
  // ... handle input
};

<button
  className={`
    transition-all duration-150 ease-out
    ${pressedKey === key ? 'scale-95 bg-[#e8f5f0]' : ''}
  `}
>
```

---

## Selection Interactions

### Service Card Selection

Smooth border and background transition with scale:

```css
/* Unselected */
.service-card {
  background: white;
  border: 2px solid #e5e7eb;
  transition: all 200ms ease;
}

/* Selected */
.service-card.selected {
  background: #e8f5f0;
  border-color: #1a5f4a;
  box-shadow: 0 4px 12px rgba(26, 95, 74, 0.15);
}
```

### Checkbox Animation

Check mark draws in with scale:

```css
/* Checkbox check animation */
@keyframes check-draw {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.checkbox-check {
  animation: check-draw 200ms ease-out;
}
```

**Alternative with Tailwind:**
```jsx
<div className={`
  transition-all duration-200
  ${checked 
    ? 'bg-[#1a5f4a] scale-100' 
    : 'bg-white scale-95'
  }
`}>
  {checked && (
    <Check className="animate-in zoom-in duration-200" />
  )}
</div>
```

---

## Page Transitions

### Slide Between Pages

Pages slide horizontally with fade:

```css
/* Page enter from right */
@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Page exit to left */
@keyframes page-exit {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-20px);
  }
}

.page-transition-enter {
  animation: page-enter 300ms ease-out;
}
```

### Fade In for Content

Staggered fade-in for lists:

```css
/* Staggered list appearance */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-item {
  animation: fade-in-up 300ms ease-out both;
}

/* Stagger with nth-child or style attribute */
.fade-in-item:nth-child(1) { animation-delay: 0ms; }
.fade-in-item:nth-child(2) { animation-delay: 50ms; }
.fade-in-item:nth-child(3) { animation-delay: 100ms; }
```

**Implementation:**
```jsx
{services.map((service, index) => (
  <div
    key={service.id}
    className="animate-fade-in-up"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <ServiceCard service={service} />
  </div>
))}
```

---

## Modal Interactions

### Modal Entry (Slide Up)

```css
/* Backdrop */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-backdrop {
  animation: fade-in 200ms ease-out;
}

/* Modal panel */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-panel {
  animation: slide-up 300ms ease-out;
}
```

### Modal Exit (Slide Down)

```css
@keyframes slide-down {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(24px);
  }
}

.modal-exit {
  animation: slide-down 200ms ease-in;
}
```

---

## Loading States

### Spinner

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

### Skeleton Shimmer

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f3f4f6 25%,
    #e5e7eb 50%,
    #f3f4f6 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### Pulse for Loading Content

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading-pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

---

## Success & Celebration

### Success Checkmark

Large checkmark with bounce:

```css
@keyframes success-check {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-check {
  animation: success-check 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Subtle Bounce (Post-Success)

```css
@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}
```

### Confetti Animation

```css
@keyframes confetti-fall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.confetti-piece {
  position: absolute;
  animation: confetti-fall 3s linear forwards;
}
```

**Implementation:**
```jsx
{showConfetti && (
  <div className="fixed inset-0 pointer-events-none z-50">
    {Array.from({ length: 50 }).map((_, i) => (
      <div
        key={i}
        className="absolute animate-fall"
        style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
        }}
      >
        <div
          className="w-3 h-3 rounded-sm"
          style={{
            backgroundColor: ['#1a5f4a', '#d4a853', '#22c55e', '#f59e0b'][
              Math.floor(Math.random() * 4)
            ],
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      </div>
    ))}
  </div>
)}
```

### Pulsing Glow (Sparkle)

```css
@keyframes ping-slow {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  75%, 100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.animate-ping-slow {
  animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
```

---

## Focus & Attention

### Focus Ring

```css
*:focus-visible {
  outline: 2px solid #1a5f4a;
  outline-offset: 2px;
  transition: outline-offset 100ms ease;
}
```

### Attention Pulse (Help Button)

```css
@keyframes attention-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(26, 95, 74, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(26, 95, 74, 0);
  }
}

.attention-pulse {
  animation: attention-pulse 2s ease-in-out infinite;
}
```

---

## Idle Warning

### Gentle Shake

```css
@keyframes gentle-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.gentle-shake {
  animation: gentle-shake 500ms ease-in-out;
}
```

### Countdown Urgency

Progress bar shrinks as idle timer counts down:

```jsx
<div className="h-1 bg-gray-200 rounded-full overflow-hidden">
  <div
    className="h-full bg-warning transition-all duration-1000 ease-linear"
    style={{ width: `${(remainingTime / totalTime) * 100}%` }}
  />
</div>
```

---

## Performance Guidelines

### Animate Only Transform & Opacity

For best performance, only animate:
- `transform` (translate, scale, rotate)
- `opacity`

Avoid animating:
- `width`, `height`
- `padding`, `margin`
- `top`, `left`, `right`, `bottom`
- `border-radius`
- `box-shadow` (use pseudo-elements)

### Use `will-change` Sparingly

```css
/* Only for elements about to animate */
.modal-panel {
  will-change: transform, opacity;
}

/* Remove after animation */
.modal-panel.visible {
  will-change: auto;
}
```

### Reduce Motion Preference

Always respect user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**React implementation:**
```jsx
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// Skip animations if reduced motion preferred
const animationDuration = prefersReducedMotion ? 0 : 300;
```

---

## Animation Inventory

### High Priority (Must Have)

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Button press | Scale + shadow | 150ms |
| Card selection | Border + bg transition | 200ms |
| Modal open | Slide up + fade | 300ms |
| Success check | Scale bounce | 400ms |
| Page transition | Fade + slide | 300ms |
| Loading spinner | Rotate | 1s loop |

### Medium Priority (Should Have)

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| List item stagger | Fade up | 50ms each |
| Skeleton shimmer | Background slide | 1.5s loop |
| Idle warning | Fade in | 200ms |
| Checkbox check | Scale | 200ms |

### Low Priority (Nice to Have)

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Confetti | Fall + rotate | 3s |
| Success bounce | Subtle up/down | 2s loop |
| Sparkle ping | Scale + fade | 2s loop |
| Help button pulse | Box shadow | 2s loop |

---

## Implementation Checklist

- [ ] All buttons have press feedback (scale 0.98)
- [ ] Cards transition smoothly on selection
- [ ] Modals slide up on open, slide down on close
- [ ] Success screen has celebration animation
- [ ] Loading states use spinner or skeleton
- [ ] Page transitions are smooth (not jarring)
- [ ] Focus states are visible for accessibility
- [ ] Reduced motion is respected
- [ ] Animations use transform/opacity only
- [ ] No animation lasts longer than 500ms (except loops)

---

*Last updated: January 2026*
