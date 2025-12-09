# Checkout Panel Restructure - Implementation Plan

## Overview
Restructure the checkout panel's left side to support multiple item types (Services, Products, Packages, Gift Cards) with a "View Staff" button, matching the reference design.

---

## Phase 1: Create Supporting Components & Data

### 1.1 Create placeholder data files
- [ ] Create `src/data/mockProducts.ts` - Product catalog with categories
- [ ] Create `src/data/mockPackages.ts` - Package deals with pricing
- [ ] Create `src/data/mockGiftCards.ts` - Gift card denominations

### 1.2 Create new components
- [ ] Create `src/components/checkout/ItemTabBar.tsx` - Top tabs (Services, Products, Packages, Gift Cards)
- [ ] Create `src/components/checkout/ProductGrid.tsx` - Product cards with image placeholder
- [ ] Create `src/components/checkout/PackageGrid.tsx` - Package cards with gradient backgrounds
- [ ] Create `src/components/checkout/GiftCardGrid.tsx` - Gift card selection

---

## Phase 2: Update CategoryList Component

### 2.1 Enhance CategoryList to support multiple item types
- [ ] Add `itemType` prop to CategoryList
- [ ] Different categories based on itemType:
  - Services: All Services, Popular, Hair, Nails, Spa & Body, Waxing, Makeup, Add-ons
  - Products: All Products, Shampoo, Styling, Color, Skincare
  - Packages: All Packages, Bridal, Spa Day, Group
  - Gift Cards: All Gift Cards (simple list)
- [ ] Add icons to each category item
- [ ] Add "View Staff" button at bottom of sidebar

---

## Phase 3: Update TicketPanel Full Mode Layout

### 3.1 Replace current Services/Staff tabs with new structure
- [ ] Add new state: `itemType` (services | products | packages | giftcards)
- [ ] Add new state: `showStaffView` (boolean) - triggered by "View Staff" button
- [ ] Replace tab bar with ItemTabBar component
- [ ] Update layout structure:
  ```
  [Close Button] | [ItemTabBar: Services | Products | Packages | Gift Cards]
                 | [CategorySidebar + "View Staff" btn] | [Item Grid]
  ```

### 3.2 Conditional rendering based on itemType
- [ ] Services: Show FullPageServiceSelector (existing)
- [ ] Products: Show ProductGrid (new)
- [ ] Packages: Show PackageGrid (new)
- [ ] Gift Cards: Show GiftCardGrid (new)

### 3.3 Staff View toggle
- [ ] When "View Staff" clicked, show StaffGridView overlay/modal
- [ ] Add close button to return to item selection

---

## Phase 4: Update Service Cards Design (match reference)

### 4.1 Clean service card design
- [ ] White background with subtle border
- [ ] Service name (bold)
- [ ] Duration (muted text)
- [ ] Price (right-aligned, bold)
- [ ] Optional "Popular" badge (yellow pill)
- [ ] Remove colored backgrounds

---

## Files to Modify
1. `src/components/checkout/TicketPanel.tsx` - Main layout changes
2. `src/components/checkout/CategoryList.tsx` - Enhanced with icons, "View Staff" button
3. `src/components/checkout/FullPageServiceSelector.tsx` - Update card design

## Files to Create
1. `src/data/mockProducts.ts`
2. `src/data/mockPackages.ts`
3. `src/data/mockGiftCards.ts`
4. `src/components/checkout/ItemTabBar.tsx`
5. `src/components/checkout/ProductGrid.tsx`
6. `src/components/checkout/PackageGrid.tsx`
7. `src/components/checkout/GiftCardGrid.tsx`

---

## Design Reference Notes
- Top tabs: Rounded pills, active tab has dark background
- Sidebar: Clean list with icons, search at top, "View Staff" button at bottom
- Service cards: White, minimal, name + duration + price layout
- Product cards: Image placeholder area + name + size + price
- Package cards: Gradient background (cyan/purple), save badge, crossed-out original price
- Gift Cards: Simple denomination buttons

---

## Questions Answered
1. "View Staff" opens same staff grid view (as overlay)
2. Create placeholder data for Products, Packages, Gift Cards
3. Categories are different per item type (best practice)
4. No subcategories/chevrons for this implementation

---

Ready for approval before implementation.
