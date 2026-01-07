# Marketing Display Settings API Tests

## Test Suite Overview

These tests verify the marketing display settings API endpoints work correctly.

## Test Cases

### 1. GET /v1/store/marketing-settings - Returns default settings

**Request:**
```http
GET /v1/store/marketing-settings
```

**Expected Response (200):**
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

---

### 2. PUT /v1/store/marketing-settings - Update global toggles

**Request:**
```http
PUT /v1/store/marketing-settings
Content-Type: application/json

{
  "enablePromotions": false,
  "defaults": {
    "announcements": {
      "globalBarEnabled": false
    }
  }
}
```

**Expected Response (200):**
```json
{
  "settings": {
    "enablePromotions": false,
    "enableAnnouncements": true,
    "defaults": {
      "promotions": {
        "homeBannerEnabled": true,
        "homeStripEnabled": true,
        "cartHintEnabled": false
      },
      "announcements": {
        "globalBarEnabled": false,
        "homeBannerEnabled": false
      }
    },
    "promotions": [],
    "announcements": []
  }
}
```

**Verification:**
- Settings persist in memory
- Subsequent GET requests return updated values

---

### 3. PUT /v1/store/marketing-settings/promotion/:id - Upsert promotion placement

**Request:**
```http
PUT /v1/store/marketing-settings/promotion/promo_001
Content-Type: application/json

{
  "placement": "home_banner",
  "rank": 1,
  "limitCountdown": true
}
```

**Expected Response (200):**
```json
{
  "settings": {
    "enablePromotions": true,
    "enableAnnouncements": true,
    "defaults": { ... },
    "promotions": [
      {
        "id": "promo_001",
        "placement": "home_banner",
        "rank": 1,
        "limitCountdown": true
      }
    ],
    "announcements": []
  }
}
```

**Verification:**
- New promotion config is added to promotions array
- Updating existing promotion replaces the config (not duplicates)

---

### 4. PUT /v1/store/marketing-settings/promotion/:id - Invalid placement enum

**Request:**
```http
PUT /v1/store/marketing-settings/promotion/promo_002
Content-Type: application/json

{
  "placement": "invalid_placement"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid placement. Must be one of: hidden, home_banner, home_strip, promotions_page_only, cart_hint"
}
```

---

### 5. PUT /v1/store/marketing-settings/announcement/:id - Upsert announcement placement

**Request:**
```http
PUT /v1/store/marketing-settings/announcement/ann_001
Content-Type: application/json

{
  "placement": "global_bar",
  "pinned": true
}
```

**Expected Response (200):**
```json
{
  "settings": {
    "enablePromotions": true,
    "enableAnnouncements": true,
    "defaults": { ... },
    "promotions": [],
    "announcements": [
      {
        "id": "ann_001",
        "placement": "global_bar",
        "pinned": true
      }
    ]
  }
}
```

---

### 6. PUT /v1/store/marketing-settings/announcement/:id - Invalid placement enum

**Request:**
```http
PUT /v1/store/marketing-settings/announcement/ann_002
Content-Type: application/json

{
  "placement": "sidebar"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid placement. Must be one of: hidden, global_bar, home_banner, updates_page_only"
}
```

---

### 7. POST /v1/cart/:sessionId/apply-promo - Apply promotion to cart

**Request:**
```http
POST /v1/cart/sess_guest_1/apply-promo
Content-Type: application/json

{
  "promotionId": "promo_001"
}
```

**Expected Response (200):**
```json
{
  "cart": {
    "id": "cart_sess_guest_1",
    "sessionId": "sess_guest_1",
    "items": [],
    "currency": "USD",
    "promo": {
      "promotionId": "promo_001",
      "appliedAt": "2025-10-19T..."
    },
    "updatedAt": "2025-10-19T..."
  }
}
```

---

### 8. POST /v1/cart/:sessionId/apply-promo - Missing promotionId

**Request:**
```http
POST /v1/cart/sess_guest_1/apply-promo
Content-Type: application/json

{}
```

**Expected Response (400):**
```json
{
  "error": "promotionId is required"
}
```

---

## Success Criteria

✅ GET /v1/store/marketing-settings returns defaults from seed
✅ PUT /v1/store/marketing-settings updates toggles and persists in memory
✅ PUT /v1/store/marketing-settings/promotion/:id upserts per-promo placement and rank
✅ PUT /v1/store/marketing-settings/announcement/:id upserts per-announcement placement and pinned flag
✅ Invalid placement enums return 400 with clear error message
✅ POST /v1/cart/:sessionId/apply-promo applies promotion to cart
✅ All endpoints return proper JSON responses
✅ Settings persist in memory across requests (same session)

## Integration Points

### Frontend Usage

```typescript
import { useMarketingSettings } from '@/hooks/useMarketingSettings';

function MyComponent() {
  const { data: settings, isLoading } = useMarketingSettings();
  
  // Check if promotions are enabled globally
  if (settings?.enablePromotions) {
    // Show promotions UI
  }
  
  // Check default placement for home banner
  if (settings?.defaults.promotions.homeBannerEnabled) {
    // Render promotion banner on home
  }
  
  // Check per-item override
  const promoConfig = settings?.promotions.find(p => p.id === 'promo_001');
  if (promoConfig?.placement === 'home_banner') {
    // Render this specific promo as home banner
  }
}
```

### Admin Usage

```typescript
import { 
  useUpdateMarketingSettings,
  useUpdatePromotionPlacement 
} from '@/hooks/useMarketingSettings';

function AdminSettings() {
  const updateSettings = useUpdateMarketingSettings();
  const updatePromoPlacement = useUpdatePromotionPlacement();
  
  // Toggle global announcement bar
  const handleToggleBar = async () => {
    await updateSettings.mutateAsync({
      defaults: {
        announcements: {
          globalBarEnabled: false
        }
      }
    });
  };
  
  // Set promotion placement
  const handleSetPlacement = async (promoId: string) => {
    await updatePromoPlacement.mutateAsync({
      promotionId: promoId,
      update: {
        placement: 'home_banner',
        rank: 1
      }
    });
  };
}
```

## Notes

- All settings are stored in-memory and reset on server restart
- No database persistence needed for this mock implementation
- Frontend will call these endpoints to determine where/how to show marketing content
- Per-item overrides take precedence over global defaults
- The `rank` field determines order within the same placement type
- The `pinned` field forces an announcement to appear at the top when enabled
