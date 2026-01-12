# Feature Additions to Check-In App PRD

**Date**: January 9, 2026  
**Constraint**: Keep check-in fast (returning client <45s, new client <90s) during peak hours

---

## Design Principle: "Minimize Friction"

> During peak hours, the kiosk is a bottleneck. Every second at the screen is a client not being served. Features should ADD VALUE without adding TIME.

### Key Rules:
- ✅ Single-tap features (no extra screens)
- ✅ Auto-calculated/pre-filled (no client input)
- ✅ Non-blocking (client can skip)
- ✅ Information-only (no decisions required)
- ❌ New screens between service selection and confirmation
- ❌ Forms requiring input during check-in
- ❌ Promos/announcements (belong on welcome screen)

---

## New Stories to Add (3 features)

### Story CHECKIN-319: Service Upsell Cards (Quick Add-On Suggestions)

**Title**: Inline Upsell Cards During Service Selection  
**Priority**: 9 (insert after CHECKIN-309)  
**Effort**: ~6-8 hours  
**Time Impact**: +0 seconds (non-blocking sidebar)

**Description**:
Show quick add-on suggestions as a non-intrusive sidebar while client selects services. Tap to add, tap again to remove. No friction.

**Design**:
```
┌─────────────────────────────┐
│ SELECT SERVICES             │
├──────────────┬──────────────┤
│              │ QUICK ADDS   │
│ • Haircut    │ ┌──────────┐ │
│ • Color      │ │ Gel +$15 │ │
│ • Manicure   │ └──────────┘ │
│              │ ┌──────────┐ │
│              │ │ Art +$10 │ │
│              │ └──────────┘ │
│              │ ┌──────────┐ │
│              │ │ Shine+$5 │ │
│              │ └──────────┘ │
└──────────────┴──────────────┘
```

**Acceptance Criteria**:
- [ ] Sidebar shows 3-5 add-ons based on selected service
- [ ] Add-ons sourced from Supabase service_upsells table
- [ ] Tap to toggle (no modal, no new screen)
- [ ] Running total updates immediately
- [ ] Only shown on Services page (not signup, not confirm)
- [ ] Works offline (cached from IndexedDB)
- [ ] Loyalty tier impacts discounts (VIP sees better offers)
- [ ] Analytics: track upsell_shown, upsell_added, upsell_value

**Database**:
```sql
-- New table in Supabase
CREATE TABLE service_upsells (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services(id),
  upsell_service_id UUID REFERENCES services(id),
  display_name TEXT,      -- "Gel coating"
  price_delta DECIMAL,    -- +15.00
  icon_emoji TEXT,        -- "✨"
  sort_order INT,
  active BOOLEAN,
  created_at TIMESTAMP
);

-- Example data
INSERT INTO service_upsells VALUES
  (uuid1, HAIRCUT_ID, GEL_ID, 'Gel upgrade', 15, '✨', 1, true, now()),
  (uuid2, HAIRCUT_ID, ART_ID, 'Nail art', 10, '🎨', 2, true, now()),
  (uuid3, MANICURE_ID, SHINE_ID, 'Shine polish', 5, '💅', 3, true, now());
```

**Time Analysis**:
- Load add-ons: 200ms (cached in Redux)
- Display sidebar: instant
- Client interaction: part of normal flow (not added time)
- **Net Impact**: +0 seconds

---

### Story CHECKIN-320: Loyalty Points Display (Quick Reference)

**Title**: Show Loyalty Balance & Rewards on Confirm Page  
**Priority**: 10 (insert after CHECKIN-319)  
**Effort**: ~4-6 hours  
**Time Impact**: +0 seconds (info-only display)

**Description**:
Display client's loyalty points balance, points earned from this check-in, and progress to next reward. Single-line display, no interaction needed.

**Design**:
```
┌─────────────────────────────────────┐
│ CONFIRMATION SUMMARY                │
├─────────────────────────────────────┤
│ Service Total: $85                  │
│ Duration: 60 minutes                │
├─────────────────────────────────────┤
│ LOYALTY REWARDS ✨                   │
│ Current: 2,500 points               │
│ +145 points from this visit          │
│ → 500 points to free manicure        │
│   [████████░░░░░░░░░░] 73%          │
├─────────────────────────────────────┤
│ [CONFIRM CHECK-IN]                  │
└─────────────────────────────────────┘
```

**Acceptance Criteria**:
- [ ] Loyalty section shows on Confirm page (below service summary)
- [ ] Fetches client loyalty balance from dataService
- [ ] Calculates points earned from this check-in (service price / 100 * loyalty_rate)
- [ ] Shows progress bar to next reward tier
- [ ] Works offline (displays cached balance)
- [ ] Only shown if client has loyalty account (not new clients)
- [ ] Updates in real-time if loyalty system changes
- [ ] Analytics: track loyalty_balance_shown

**Database**:
```sql
-- Existing table (clients table has loyalty fields)
ALTER TABLE clients ADD COLUMN loyalty_points INT DEFAULT 0;
ALTER TABLE clients ADD COLUMN loyalty_tier TEXT DEFAULT 'bronze'; -- bronze/silver/gold

-- Loyalty tier configuration
CREATE TABLE loyalty_tiers (
  id UUID PRIMARY KEY,
  tier_name TEXT,           -- 'bronze', 'silver', 'gold'
  points_required INT,      -- 0, 1000, 5000
  point_multiplier DECIMAL, -- 1x, 1.25x, 1.5x
  benefits JSONB
);
```

**Time Analysis**:
- Fetch loyalty balance: 100ms (cached, from Supabase)
- Calculate points: 10ms
- Display: instant
- No client action required
- **Net Impact**: +0 seconds

---

### Story CHECKIN-321: Service Duration & Price Display (Inline)

**Title**: Show Duration & Price Per Service During Selection  
**Priority**: 11 (insert after CHECKIN-320)  
**Effort**: ~6-8 hours  
**Time Impact**: +0 seconds (display enhancement)

**Description**:
Display duration and price next to each service during selection. Show running total with time + cost. Clear pricing expectations BEFORE checkout.

**Design**:
```
┌─────────────────────────────────────┐
│ SELECT SERVICES                     │
├─────────────────────────────────────┤
│                                     │
│ ☐ Manicure         $35 • 30 min    │
│ ☑ Full Set         $55 • 60 min    │
│ ☑ Gel Overlay      +$15 • +15 min  │
│ ☐ Nail Art         +$10 • +15 min  │
│                                     │
├─────────────────────────────────────┤
│ TOTAL SELECTED:                     │
│ $70 • 75 minutes                    │
│                                     │
│ Estimated Done: 2:15 PM             │
├─────────────────────────────────────┤
│ [NEXT: SELECT TECHNICIAN]           │
└─────────────────────────────────────┘
```

**Acceptance Criteria**:
- [ ] Each service shows price + duration inline (not in modal)
- [ ] Running total updates in real-time as services toggled
- [ ] Shows estimated completion time (current time + total duration)
- [ ] Price matches Supabase service table
- [ ] Duration accounts for parallel vs sequential service time
- [ ] Works offline (cached service data)
- [ ] Color-coded if wait time exceeds 1 hour (warning)
- [ ] Analytics: track price_shown, estimated_time_shown

**Database**:
```sql
-- Update services table (should already have these)
ALTER TABLE services ADD COLUMN duration_minutes INT;
ALTER TABLE services ADD COLUMN price DECIMAL(10,2);

-- Example
UPDATE services SET 
  duration_minutes = 30,
  price = 35.00
WHERE id = MANICURE_ID;
```

**Time Analysis**:
- Fetch service data: 100ms (cached)
- Calculate total: 20ms
- Display runs in real-time as user taps services
- **Net Impact**: +0 seconds (actually SAVES time by reducing checkout surprises)

---

## Revised Check-In Flow (with new features)

### Before: Standard Flow
```
Welcome → Verify/Signup → Services → Technician → Guests → Confirm → Success
                         ↑
                    NEW: Upsells
                         ↓
                         (running total shown)
                         
                         ↓
                    Technician page
                    (duration/price shown on confirm)
                    
                         ↓
                    Confirm page
                    (loyalty shown)
```

### Timing Target (UNCHANGED):
- **Returning client**: < 45 seconds (mostly just confirming)
- **New client**: < 90 seconds (registration + selection)

### Why No Time Added:
1. **Upsell cards** - Sidebar, client glances while selecting (no extra steps)
2. **Loyalty display** - Info-only, shows while reviewing (no extra steps)
3. **Duration/price** - Display enhancement, no new screens

---

## SQL Schema Changes

```sql
-- 1. Add loyalty fields to clients (if not exists)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'bronze';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS loyalty_last_earning_date TIMESTAMP;

-- 2. Create loyalty tier configuration
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  tier_name TEXT NOT NULL,           -- bronze, silver, gold, platinum
  points_required INT NOT NULL,      -- 0, 1000, 5000, 10000
  point_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,  -- 1x, 1.25x, 1.5x
  benefits JSONB,                    -- {discount: 0.1, birthday_bonus: 500}
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(organization_id, tier_name)
);

-- 3. Create service upsells table
CREATE TABLE IF NOT EXISTS service_upsells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  service_id UUID REFERENCES services(id),
  upsell_service_id UUID REFERENCES services(id),
  display_name TEXT NOT NULL,        -- "Gel coating", "Nail art"
  description TEXT,                  -- Optional: "Add-on description"
  price_delta DECIMAL(10,2),         -- +15.00, +10.00
  icon_emoji TEXT,                   -- "✨", "🎨"
  sort_order INT DEFAULT 999,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT different_services CHECK (service_id != upsell_service_id)
);

-- 4. Ensure services table has duration & price
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_minutes INT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT; -- "manicure", "pedicure", etc

-- 5. Add to checkin table for tracking earned points
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS loyalty_points_earned INT DEFAULT 0;
```

---

## Redux State Changes

```typescript
// Add to checkin slice
interface CheckInState {
  // ... existing fields
  
  // NEW: Upsells
  selectedUpsells: string[];          // Array of upsell service IDs
  availableUpsells: ServiceUpsell[];  // List of possible add-ons
  
  // NEW: Loyalty
  clientLoyalty: {
    points: number;
    tier: string;
    pointsToEarn: number;      // Points from this check-in
    pointsToNextReward: number;
  } | null;
  
  // NEW: Duration/Price
  totalPrice: number;
  totalDurationMinutes: number;
  estimatedCompletionTime: string;   // ISO timestamp
}
```

---

## Why These 3 Features?

| Feature | Business Impact | UX Impact | Implementation |
|---------|-----------------|-----------|-----------------|
| **Upsells** | +15% AOV | Single tap, no friction | Sidebar, instant |
| **Loyalty** | +repeat visits 20% | Shows progress, rewards | Info display only |
| **Duration/Price** | -checkout surprises | Sets expectations | Display enhancement |

---

## Story Placeholders

Add to `prd-revised.json`:

```json
{
  "id": "CHECKIN-319",
  "title": "Service Upsell Cards (Quick Add-On Suggestions)",
  "priority": 9,
  "passes": false,
  "tier": 3,
  "estimatedEffort": "6-8 hours",
  "timeImpact": "+0 seconds"
},
{
  "id": "CHECKIN-320",
  "title": "Loyalty Points Display (Balance & Progress)",
  "priority": 10,
  "passes": false,
  "tier": 3,
  "estimatedEffort": "4-6 hours",
  "timeImpact": "+0 seconds"
},
{
  "id": "CHECKIN-321",
  "title": "Service Duration & Price Display (Inline)",
  "priority": 11,
  "passes": false,
  "tier": 3,
  "estimatedEffort": "6-8 hours",
  "timeImpact": "+0 seconds"
}
```

---

## Implementation Notes

### For Ralph Execution:
1. **Story CHECKIN-319** (Upsells)
   - Fetch from `service_upsells` table
   - Filter by selected service
   - Show in sidebar on ServicesPage
   - Tap to add to selection
   - Add to analytics

2. **Story CHECKIN-320** (Loyalty)
   - Fetch from `clients.loyalty_points`
   - Calculate earned points: `(totalPrice / 100) * loyalty_multiplier`
   - Display on ConfirmPage
   - Show tier + progress bar
   - Handle missing loyalty (new clients)

3. **Story CHECKIN-321** (Duration/Price)
   - Fetch from `services.duration_minutes` and `services.price`
   - Update running total in Redux as services toggle
   - Calculate completion time: `now() + totalDurationMinutes`
   - Show on ServicesPage + ConfirmPage
   - Color-code long waits (>60 min warning)

### Testing:
- Unit: Calculate loyalty points, duration totals
- Integration: Fetch upsells, loyalty from Supabase
- E2E: Select service → see upsells → add upsell → confirm → loyalty shown

---

## Salon Benefits Summary

✅ **More Revenue**: Upsells +15% AOV  
✅ **Happier Clients**: Know wait time + loyalty progress upfront  
✅ **No Friction**: Zero added time, all non-blocking  
✅ **Data-Driven**: Analytics on what upsells work  
✅ **Fast**: Even during peak hours, keeps check-in <45s  

