# Unified Ticket Design System

## Overview
This document defines the refined visual design system for both **Waiting Queue** and **In Service** tickets, achieving visual harmony while maintaining the tactile "paper-ticket" feel that Mango users love.

## Design Goals ✓
- ✅ Maintain paper-like aesthetic with soft texture, natural tone, and shadow depth
- ✅ Visual consistency between ticket types for calmer, easier-to-scan interface
- ✅ Reduce contrast fatigue from separate background tones
- ✅ Keep each state clearly identifiable through subtle status indicators

---

## Unified Base Palette

### Background Color
- **Base**: `#FFF9F4` (soft ivory/off-white)
- **Hover**: `#FFFCF9` (2% lighter for subtle lift effect)
- **Rationale**: Neutral tone works for all ticket states while preserving warmth

### Paper Texture
```css
backgroundImage: url("data:image/svg+xml,...")
opacity: 0.04 (minimal and modern, not harsh)
```
- Fractal noise pattern for authentic paper feel
- Low opacity (4%) to avoid visual clutter
- Consistent across all ticket types

### Shadow & Depth
```css
boxShadow: 
  0 1px 2px rgba(0, 0, 0, 0.06),
  0 2px 4px rgba(0, 0, 0, 0.04),
  inset 0 0 0 1px rgba(255, 255, 255, 0.8),
  inset 0 1px 1px rgba(255, 255, 255, 0.9)
```
- **Default**: 1-2px blur, low opacity (6-4%)
- **Hover**: Increases to 2-4px blur (8-6%) with slight elevation
- Mimics layered paper with soft light reflection

### Border
- **Base**: `1px solid rgba(0, 0, 0, 0.06)` (clean neutral)
- No harsh color-specific borders on main edges

---

## Status Indicator System

### Left Border Accent Strip (4-6px wide)

#### 🟡 Waiting Status
- **Color**: `#FFE7B3` (light amber, pastel)
- **Hover**: `#FFD280` (slightly darker amber)
- **Usage**: WaitListTicketCard
- **Border**: `borderLeft: '5px solid #FFE7B3'`

#### 🟢 In Service Status
- **Color**: `#C9F3D1` (soft mint green, pastel)
- **Hover**: `#A5E8B0` (slightly darker mint)
- **Usage**: ServiceTicketCard
- **Border**: `borderLeft: '5px solid #C9F3D1'`

#### ⚫ Pending Status (Future)
- **Color**: `#EAEAEA` at 60% opacity (light gray)
- **Hover**: `#D4D4D4` (slightly darker gray)
- **Usage**: PendingTicketCard (when implemented)
- **Border**: `borderLeft: '5px solid rgba(234, 234, 234, 0.6)'`

### Visual Characteristics
- **Width**: 5px (4-6px range)
- **Saturation**: Low (pastel tones)
- **Purpose**: Quick visual scanning without overwhelming the interface
- **Position**: Left edge only (consistent with Western reading patterns)

---

## Typography & Layout

### Consistency Rules
- ✅ Same font families across both ticket types
- ✅ Matching font weights and sizes for equivalent elements
- ✅ Identical spacing (padding, margins, gaps)
- ✅ Consistent line heights and letter spacing

### Client Type Badges
```javascript
VIP:      { bg: '#FFF9E6', text: '#8B6914', icon: '⭐' }
Priority: { bg: '#FFF1F0', text: '#B91C1C', icon: '🔥' }
New:      { bg: '#EEF2FF', text: '#4338CA', icon: '✨' }
Regular:  { bg: '#F9FAFB', text: '#4B5563', icon: '👤' }
```
- Apple-style subtle colors
- Low saturation for visual harmony
- Icons slightly smaller but high contrast for quick scan

### Separators
- **Subtle dotted lines**: For internal ticket sections
- **Opacity**: 0.25-0.3 for perforations
- **Purpose**: Enhance paper-ticket vibe without adding noise

---

## Interaction States

### Hover Effect
```css
transform: translateY(-0.5px)
transition: 200ms ease-out
background: #FFFCF9 (2% lighter)
boxShadow: 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.06)
borderLeft: (darker accent color)
```
- **Elevation**: +2px visual lift
- **Background**: Lightens by ~2%
- **Shadow**: Stronger to reinforce elevation
- **Border**: Accent color darkens for emphasis

### Active/Selected
```css
transform: scale(0.99)
```
- Slight press-down effect for tactile feedback
- Returns to normal on release

### Focus States
- Maintained for accessibility
- 2px outline with appropriate color (blue-500)
- Offset by 2px for visibility

---

## Implementation Notes

### Components Updated
1. **WaitListTicketCard.tsx** ✓
   - All view modes: compact, normal, grid-normal, grid-compact
   - Unified paper style with amber accent
   
2. **ServiceTicketCard.tsx** ✓
   - All view modes: compact, normal, grid-normal, grid-compact
   - Unified paper style with mint green accent

### Hover Handler Pattern
```javascript
onMouseEnter={(e) => {
  e.currentTarget.style.boxShadow = paperHoverStyle.boxShadow;
  e.currentTarget.style.background = paperHoverStyle.background;
  e.currentTarget.style.borderLeft = paperHoverStyle.borderLeft;
}}
onMouseLeave={(e) => {
  e.currentTarget.style.boxShadow = paperStyle.boxShadow;
  e.currentTarget.style.background = paperStyle.background;
  e.currentTarget.style.borderLeft = paperStyle.borderLeft;
}}
```

### View Mode Coverage
All styles apply consistently across:
- **Compact**: High-density line view
- **Normal**: Standard responsive view
- **Grid Normal**: Large card view
- **Grid Compact**: Dense grid view

---

## Color Token Reference

### Base Palette
```javascript
const UNIFIED_TICKET_COLORS = {
  // Base
  background: '#FFF9F4',
  backgroundHover: '#FFFCF9',
  border: 'rgba(0, 0, 0, 0.06)',
  
  // Status Accents
  waiting: '#FFE7B3',
  waitingHover: '#FFD280',
  inService: '#C9F3D1',
  inServiceHover: '#A5E8B0',
  pending: 'rgba(234, 234, 234, 0.6)',
  pendingHover: '#D4D4D4',
  
  // Shadow
  shadowDefault: 'rgba(0, 0, 0, 0.06)',
  shadowSecondary: 'rgba(0, 0, 0, 0.04)',
  shadowHover: 'rgba(0, 0, 0, 0.08)',
  shadowHoverSecondary: 'rgba(0, 0, 0, 0.06)',
  
  // Inset highlights
  insetPrimary: 'rgba(255, 255, 255, 0.8)',
  insetSecondary: 'rgba(255, 255, 255, 0.9)',
  insetHover: 'rgba(255, 255, 255, 1)',
};
```

---

## Result Expectations

### Visual Cohesion ✓
- Both sections now share unified design language
- Feels modern, premium, and unmistakably Mango
- Screen is calmer and easier to scan

### Paper-Ticket Identity ✓
- Tactile feel preserved through texture and shadow
- Natural ivory tone maintains warmth
- Subtle elevation on hover enhances interactivity

### Status Clarity ✓
- Colored accent strips provide instant visual identification
- Pastel tones don't overwhelm
- Hover states reinforce interactivity

### Scalability
- Design system extends easily to future ticket types (Pending, etc.)
- Consistent token structure for maintainability
- All view modes covered

---

## Design Principles

1. **Minimalism**: Every element serves a purpose
2. **Harmony**: Reduce visual noise, increase scannability
3. **Tactility**: Maintain the beloved paper-ticket feel
4. **Clarity**: Status always identifiable at a glance
5. **Premium**: Refined, modern, professional aesthetic

---

*Last Updated: Oct 31, 2025*
*Components: WaitListTicketCard.tsx, ServiceTicketCard.tsx*
*Status: ✅ Implemented*
