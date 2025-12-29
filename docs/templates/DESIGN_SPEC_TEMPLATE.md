# Design Specification: [Module Name]

**Version:** 1.0
**Last Updated:** [YYYY-MM-DD]
**Status:** Draft | In Review | Approved
**Related PRD:** PRD-[Module]-Module.md

---

## 1. Overview

<!-- Brief description of the module's visual design goals -->

[2-3 sentences describing the visual and interaction design goals for this module]

### 1.1 Design Goals

| Goal | Description |
|------|-------------|
| [Goal 1] | [How this goal manifests in the design] |
| [Goal 2] | [How this goal manifests in the design] |
| [Goal 3] | [How this goal manifests in the design] |

### 1.2 Key Design Principles

- **[Principle 1]**: [How it applies to this module]
- **[Principle 2]**: [How it applies to this module]
- **[Principle 3]**: [How it applies to this module]

---

## 2. Color System

### 2.1 Module-Specific Colors

| Element | Color Name | Hex | Usage |
|---------|------------|-----|-------|
| Primary | [Name] | `#XXXXXX` | [Where used] |
| Secondary | [Name] | `#XXXXXX` | [Where used] |
| Accent | [Name] | `#XXXXXX` | [Where used] |
| Success | [Name] | `#XXXXXX` | [Where used] |
| Warning | [Name] | `#XXXXXX` | [Where used] |
| Error | [Name] | `#XXXXXX` | [Where used] |

### 2.2 Status Colors

| Status | Background | Text/Icon | Border |
|--------|------------|-----------|--------|
| [Status 1] | `#XXXXXX` | `#XXXXXX` | `#XXXXXX` |
| [Status 2] | `#XXXXXX` | `#XXXXXX` | `#XXXXXX` |
| [Status 3] | `#XXXXXX` | `#XXXXXX` | `#XXXXXX` |

---

## 3. Typography

### 3.1 Text Styles

| Element | Size | Weight | Color | Line Height |
|---------|------|--------|-------|-------------|
| Page Title | 24px | 700 | `#111827` | 1.2 |
| Section Title | 18px | 600 | `#111827` | 1.3 |
| Card Title | 16px | 600 | `#111827` | 1.4 |
| Body Text | 14px | 400 | `#374151` | 1.5 |
| Label | 14px | 500 | `#6B7280` | 1.4 |
| Small/Caption | 12px | 400 | `#9CA3AF` | 1.4 |
| Button | 14px | 500 | Varies | 1.0 |

---

## 4. Layout Architecture

### 4.1 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [HEADER]                                                   │
│  Height: XXpx | Background: #XXXXXX                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [MAIN CONTENT AREA]                                        │
│  Padding: XXpx                                              │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────────────────┐  │
│  │ [Section A]       │  │ [Section B]                   │  │
│  │ Width: XXpx       │  │ Width: flex                   │  │
│  └───────────────────┘  └───────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [FOOTER / ACTION BAR]                                      │
│  Height: XXpx | Position: sticky/fixed                      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Grid & Spacing

| Property | Value |
|----------|-------|
| Grid Columns | 12 |
| Gutter | 16px (sm), 24px (md), 32px (lg) |
| Section Spacing | 24px |
| Card Spacing | 16px |
| Element Spacing | 8px |

---

## 5. Visual Components

### 5.1 [Component Name 1]

**Purpose:** [What this component does]

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Width | [value] |
| Height | [value] |
| Background | `#XXXXXX` |
| Border | [Xpx solid #XXXXXX] |
| Border Radius | [value] |
| Padding | [value] |
| Shadow | [value] |

**Layout:**

```
┌──────────────────────────────────┐
│  [Element A]                     │
│  ────────────                    │
│  [Element B]       [Element C]   │
│  [Element D]                     │
└──────────────────────────────────┘
```

**States:**

| State | Visual Changes |
|-------|----------------|
| Default | [Description] |
| Hover | [Description] |
| Active/Pressed | [Description] |
| Disabled | [Description] |
| Loading | [Description] |
| Selected | [Description] |
| Error | [Description] |

---

### 5.2 [Component Name 2]

**Purpose:** [What this component does]

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Width | [value] |
| Height | [value] |
| Background | `#XXXXXX` |
| Border | [Xpx solid #XXXXXX] |
| Border Radius | [value] |
| Padding | [value] |

**States:**

| State | Visual Changes |
|-------|----------------|
| Default | [Description] |
| Hover | [Description] |
| Active | [Description] |
| Disabled | [Description] |

---

### 5.3 [Component Name 3]

<!-- Repeat pattern for each major component -->

---

## 6. Interaction Patterns

### 6.1 Click/Tap Actions

| Element | Action | Result |
|---------|--------|--------|
| [Element 1] | Click/Tap | [What happens] |
| [Element 2] | Click/Tap | [What happens] |
| [Element 3] | Click/Tap | [What happens] |

### 6.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | [Navigation behavior] |
| Enter | [Action behavior] |
| Escape | [Dismiss/Cancel behavior] |
| Arrow Keys | [Navigation behavior] |

### 6.3 Touch Gestures (Mobile)

| Gesture | Target | Action |
|---------|--------|--------|
| Swipe Left | [Element] | [Action] |
| Swipe Right | [Element] | [Action] |
| Long Press | [Element] | [Action] |
| Pull to Refresh | [Container] | [Action] |
| Pinch to Zoom | [Element] | [Action] |

### 6.4 Drag & Drop

| Draggable | Drop Target | Visual Feedback |
|-----------|-------------|-----------------|
| [Item] | [Target] | [What user sees] |

---

## 7. Loading & Empty States

### 7.1 Loading State

**Skeleton Layout:**

```
┌──────────────────────────────────┐
│  ▢▢▢▢▢▢▢▢▢  [shimmer]           │
│  ▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢                │
│  ▢▢▢▢▢▢▢                        │
└──────────────────────────────────┘
```

**Skeleton Specifications:**

| Element | Dimensions | Color | Animation |
|---------|------------|-------|-----------|
| [Element 1] | [WxH] | `#E5E7EB` | shimmer 1.5s |
| [Element 2] | [WxH] | `#F3F4F6` | shimmer 1.5s |

### 7.2 Empty State

**Visual:**

```
┌──────────────────────────────────┐
│                                  │
│         [Illustration]          │
│            64x64px               │
│                                  │
│     [Primary Message]            │
│     18px, 600 weight             │
│                                  │
│     [Secondary Message]          │
│     14px, gray-500               │
│                                  │
│     ┌────────────────┐          │
│     │  [CTA Button]  │          │
│     └────────────────┘          │
│                                  │
└──────────────────────────────────┘
```

**Empty State Content:**

| Scenario | Icon | Primary Text | Secondary Text | CTA |
|----------|------|--------------|----------------|-----|
| No data | [Icon] | [Message] | [Helper text] | [Button text] |
| No results | [Icon] | [Message] | [Helper text] | [Button text] |
| Error | [Icon] | [Message] | [Helper text] | [Button text] |

### 7.3 Error State

**Visual Specifications:**

| Element | Style |
|---------|-------|
| Icon | 48px, `#EF4444` |
| Title | 18px, 600 weight, `#DC2626` |
| Message | 14px, `#6B7280` |
| Retry Button | Primary style |

---

## 8. Responsive Behavior

### 8.1 Breakpoints

| Breakpoint | Width | Key Changes |
|------------|-------|-------------|
| Mobile | < 768px | [Layout changes] |
| Tablet | 768-1024px | [Layout changes] |
| Desktop | > 1024px | [Layout changes] |

### 8.2 Mobile Layout (< 768px)

```
┌─────────────────────┐
│  [Mobile Header]    │
│  Height: 56px       │
├─────────────────────┤
│                     │
│  [Stacked Content]  │
│  Full width         │
│  Padding: 16px      │
│                     │
├─────────────────────┤
│  [Bottom Actions]   │
│  Sticky, 64px       │
└─────────────────────┘
```

### 8.3 Tablet Layout (768-1024px)

```
┌──────────────────────────────┐
│  [Header]                    │
├──────────────────────────────┤
│                              │
│  [2-Column Layout]           │
│  Sidebar: 280px | Main: flex │
│                              │
└──────────────────────────────┘
```

### 8.4 Desktop Layout (> 1024px)

```
┌─────────────────────────────────────────┐
│  [Header]                               │
├─────────────────────────────────────────┤
│                                         │
│  [Multi-Column Layout]                  │
│  Max-width: 1440px | Centered           │
│                                         │
└─────────────────────────────────────────┘
```

---

## 9. Accessibility

### 9.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Color Contrast | 4.5:1 minimum for text, 3:1 for large text |
| Focus Indicators | 2px solid outline, visible on all focusable elements |
| Touch Targets | 44x44px minimum |
| Screen Reader | aria-labels on all interactive elements |
| Keyboard Navigation | Full functionality without mouse |
| Motion | Respect prefers-reduced-motion |

### 9.2 ARIA Attributes

| Element | Attribute | Value |
|---------|-----------|-------|
| [Element 1] | role | [value] |
| [Element 1] | aria-label | [value] |
| [Element 2] | aria-expanded | true/false |
| [Element 3] | aria-selected | true/false |

### 9.3 Focus Management

| Scenario | Focus Target |
|----------|--------------|
| Modal opens | First focusable element |
| Modal closes | Trigger element |
| Form error | First error field |
| Action complete | Success message or next element |

---

## 10. Animation Specifications

### 10.1 Transitions

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Button hover | background | 150ms | ease-out |
| Card hover | shadow, transform | 200ms | ease-out |
| Modal open | opacity, scale | 200ms | ease-out |
| Modal close | opacity | 150ms | ease-in |

### 10.2 Keyframe Animations

**[Animation Name]:**

```css
@keyframes [animationName] {
  0% {
    /* Initial state */
  }
  100% {
    /* Final state */
  }
}
```

| Usage | Duration | Iteration |
|-------|----------|-----------|
| [Where used] | [Xms] | [once/infinite] |

### 10.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Iconography

### 11.1 Icon Library

**Source:** Lucide React

### 11.2 Icon Sizes

| Context | Size |
|---------|------|
| Navigation | 24px |
| Button | 16px-20px |
| Inline | 14px-16px |
| Status indicator | 12px |

### 11.3 Module-Specific Icons

| Icon | Name | Usage |
|------|------|-------|
| [Visual] | [icon-name] | [Where used] |
| [Visual] | [icon-name] | [Where used] |

---

## 12. Badges & Indicators

### 12.1 Status Badges

| Badge | Background | Text Color | Icon | Border |
|-------|------------|------------|------|--------|
| [Status 1] | `#XXXXXX` | `#XXXXXX` | [Icon] | none |
| [Status 2] | `#XXXXXX` | `#XXXXXX` | [Icon] | none |
| [Status 3] | `#XXXXXX` | `#XXXXXX` | [Icon] | none |

**Badge Specifications:**

| Property | Value |
|----------|-------|
| Padding | 4px 8px |
| Border Radius | 9999px (pill) or 4px |
| Font Size | 12px |
| Font Weight | 500 |

### 12.2 Notification Indicators

| Type | Size | Color | Position |
|------|------|-------|----------|
| Count badge | 18px min | `#EF4444` | top-right, offset -4px |
| Dot indicator | 8px | `#EF4444` | top-right, offset -2px |

---

## 13. Mockups & References

### 13.1 Design Files

| Type | Link |
|------|------|
| Figma | [Link to Figma file] |
| Prototype | [Link to interactive prototype] |

### 13.2 Reference Screenshots

<!-- Add actual screenshots when available -->

| View | Description |
|------|-------------|
| Desktop - Default | [Description or image link] |
| Mobile - Default | [Description or image link] |
| Loading State | [Description or image link] |
| Empty State | [Description or image link] |

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [Date] | [Author] | Initial design specification |

---

*Design Specification Template v1.0 - Mango Biz*
