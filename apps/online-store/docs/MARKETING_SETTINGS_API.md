# Marketing Display Settings API

## Overview

The Marketing Display Settings API provides complete control over where and how Promotions and Announcements are displayed in the storefront. This is a backend settings layer that exposes configuration without directly modifying frontend rendering logic.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Marketing Settings API                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Schemas (Zod + TypeScript)                                 │
│  └─ src/types/marketing-settings.ts                         │
│                                                               │
│  API Layer (Edge Function)                                   │
│  └─ supabase/functions/store/index.ts                       │
│     ├─ GET  /v1/store/marketing-settings                    │
│     ├─ PUT  /v1/store/marketing-settings                    │
│     ├─ PUT  /v1/store/marketing-settings/promotion/:id      │
│     ├─ PUT  /v1/store/marketing-settings/announcement/:id   │
│     └─ POST /v1/cart/:sessionId/apply-promo                 │
│                                                               │
│  Client Library                                              │
│  ├─ src/lib/api/marketing-settings.ts                       │
│  └─ src/hooks/useMarketingSettings.ts                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### Promotion Placement

Fixed enum of supported placements:
- `hidden` - Do not render on storefront
- `home_banner` - Large banner under Hero (ATF)
- `home_strip` - Card in the horizontal strip
- `promotions_page_only` - Only visible on /promotions
- `cart_hint` - Show "Apply offer" hint in cart sheet

### Announcement Placement

Fixed enum of supported placements:
- `hidden` - Do not render on storefront
- `global_bar` - AnnouncementBar above header, all pages
- `home_banner` - Banner block on Home
- `updates_page_only` - Only visible on /updates

### Marketing Display Settings

```typescript
{
  // Master toggles
  enablePromotions: boolean,
  enableAnnouncements: boolean,
  
  // Global defaults (used when no per-item override exists)
  defaults: {
    promotions: {
      homeBannerEnabled: boolean,
      homeStripEnabled: boolean,
      cartHintEnabled: boolean
    },
    announcements: {
      globalBarEnabled: boolean,
      homeBannerEnabled: boolean
    }
  },
  
  // Per-item overrides
  promotions: Array<{
    id: string,
    placement: PromotionPlacement,
    rank: number,
    limitCountdown: boolean
  }>,
  announcements: Array<{
    id: string,
    placement: AnnouncementPlacement,
    pinned: boolean
  }>
}
```

## API Endpoints

### GET /v1/store/marketing-settings

Get current marketing display settings.

**Response:**
```json
{
  "settings": {
    "enablePromotions": true,
    "enableAnnouncements": true,
    "defaults": {
      "promotions": {
        "homeBannerEnabled": true,
        "homeStripEnabled": true,
        "cartHintEnabled": false
      },
      "announcements": {
        "globalBarEnabled": true,
        "homeBannerEnabled": false
      }
    },
    "promotions": [],
    "announcements": []
  }
}
```

### PUT /v1/store/marketing-settings

Update global marketing settings (partial update supported).

**Request Body:**
```json
{
  "enablePromotions": false,
  "defaults": {
    "announcements": {
      "globalBarEnabled": false
    }
  }
}
```

**Response:**
```json
{
  "settings": { /* updated settings */ }
}
```

### PUT /v1/store/marketing-settings/promotion/:id

Upsert placement settings for a specific promotion.

**Parameters:**
- `:id` - Promotion ID

**Request Body:**
```json
{
  "placement": "home_banner",
  "rank": 1,
  "limitCountdown": true
}
```

**Response:**
```json
{
  "settings": { /* updated settings */ }
}
```

**Errors:**
- `400` - Invalid placement enum

### PUT /v1/store/marketing-settings/announcement/:id

Upsert placement settings for a specific announcement.

**Parameters:**
- `:id` - Announcement ID

**Request Body:**
```json
{
  "placement": "global_bar",
  "pinned": true
}
```

**Response:**
```json
{
  "settings": { /* updated settings */ }
}
```

**Errors:**
- `400` - Invalid placement enum

### POST /v1/cart/:sessionId/apply-promo

Apply a promotion to a cart session.

**Parameters:**
- `:sessionId` - Cart session ID

**Request Body:**
```json
{
  "promotionId": "promo_001"
}
```

**Response:**
```json
{
  "cart": {
    "id": "cart_sess_123",
    "sessionId": "sess_123",
    "items": [...],
    "promo": {
      "promotionId": "promo_001",
      "appliedAt": "2025-10-19T12:00:00Z"
    },
    "updatedAt": "2025-10-19T12:00:00Z"
  }
}
```

**Errors:**
- `400` - Missing promotionId

## Client Usage

### React Hooks

```typescript
import { 
  useMarketingSettings,
  useUpdateMarketingSettings,
  useUpdatePromotionPlacement,
  useUpdateAnnouncementPlacement 
} from '@/hooks/useMarketingSettings';

// Fetch settings
const { data: settings, isLoading } = useMarketingSettings();

// Update global settings
const updateSettings = useUpdateMarketingSettings();
updateSettings.mutate({
  defaults: {
    promotions: {
      homeBannerEnabled: false
    }
  }
});

// Update promotion placement
const updatePromoPlacement = useUpdatePromotionPlacement();
updatePromoPlacement.mutate({
  promotionId: 'promo_001',
  update: {
    placement: 'home_banner',
    rank: 1
  }
});

// Update announcement placement
const updateAnnouncementPlacement = useUpdateAnnouncementPlacement();
updateAnnouncementPlacement.mutate({
  announcementId: 'ann_001',
  update: {
    placement: 'global_bar',
    pinned: true
  }
});
```

### Direct API Calls

```typescript
import { 
  getMarketingSettings,
  updateMarketingSettings,
  updatePromotionPlacement,
  applyPromotionToCart 
} from '@/lib/api/marketing-settings';

// Get settings
const settings = await getMarketingSettings();

// Update settings
const updated = await updateMarketingSettings({
  enablePromotions: false
});

// Update promotion placement
await updatePromotionPlacement('promo_001', {
  placement: 'home_banner',
  rank: 1,
  limitCountdown: true
});

// Apply promotion to cart
const cart = await applyPromotionToCart('sess_123', 'promo_001');
```

## Frontend Integration

The frontend uses these settings to determine where/how to display marketing content:

### 1. Check Global Toggles

```typescript
if (!settings.enablePromotions) {
  // Don't render any promotions
  return null;
}
```

### 2. Check Default Placements

```typescript
// Should we show the promotion banner on home?
if (settings.defaults.promotions.homeBannerEnabled) {
  return <PromotionBanner />;
}
```

### 3. Check Per-Item Overrides

```typescript
// Get placement for specific promotion
const promoConfig = settings.promotions.find(p => p.id === promotion.id);

if (promoConfig?.placement === 'home_banner') {
  return <PromotionBanner promotion={promotion} />;
} else if (promoConfig?.placement === 'hidden') {
  return null;
}

// If no override, fall back to default behavior
if (settings.defaults.promotions.homeBannerEnabled) {
  return <PromotionBanner promotion={promotion} />;
}
```

### 4. Respect Ranking

```typescript
// Sort promotions by rank for display order
const sortedPromos = settings.promotions
  .filter(p => p.placement === 'home_strip')
  .sort((a, b) => a.rank - b.rank);
```

## Design Principles

1. **Separation of Concerns**: Settings control *where* content appears, not *what* content is displayed
2. **Override Model**: Per-item configs override global defaults
3. **Explicit Enums**: Fixed placement types prevent typos and ensure frontend support
4. **Flexible Defaults**: Global defaults allow batch control without individual configs
5. **In-Memory Storage**: Mock implementation uses memory; production can persist to DB
6. **Validation**: Zod schemas ensure type safety; API validates enums before accepting

## Future Enhancements

Potential additions (not implemented):
- A/B testing configs per placement
- Time-based scheduling for placements
- Device-specific placements (mobile vs desktop)
- Geo-targeting rules
- Analytics tracking per placement
- Preview mode for testing placements

## Security Considerations

- Settings endpoints should be admin-only (add auth middleware)
- Validate all enum values server-side
- Rate limit settings update endpoints
- Audit log for settings changes
- Sanitize IDs to prevent injection attacks
