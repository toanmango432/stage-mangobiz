# Configuration

Mango Pad is configured through the Settings screen, accessible via 4-finger long press (2 seconds) on the idle screen.

All settings are persisted to localStorage under the key `mango-pad-config`.

## Settings Categories

### Connection Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Salon ID | string | `''` | Your salon's unique identifier. Used in MQTT topic paths. |
| MQTT Broker URL | string | `ws://localhost:1883` | WebSocket URL to your MQTT broker. |

**Test Connection** button verifies MQTT connectivity.

---

### Payment Flow Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Enable Tip Screen | boolean | `true` | Show tip selection after order review. |
| Tip Type | `'percentage'` \| `'dollar'` | `'percentage'` | Display tips as percentages or fixed dollar amounts. |
| Tip Suggestions | number[] | `[18, 20, 25, 30]` | Suggested tip values (% or $). |
| Require Signature | boolean | `true` | Require signature before payment. |
| Show Receipt Options | boolean | `true` | Show receipt preference screen. |
| Payment Timeout | number | `60` | Seconds to wait for terminal response. |

---

### Idle Screen Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Logo URL | string | `undefined` | URL to salon logo image (PNG/JPG). |
| Slide Duration | number | `8` | Seconds between promotional slides. |
| Primary Color | string | `#6366F1` | Brand primary color (hex). |
| Secondary Color | string | `#818CF8` | Brand secondary color (hex). |

#### Promotional Slides

Slides appear on the idle screen carousel. Each slide has:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (auto-generated). |
| type | `'promotion'` \| `'announcement'` \| `'staff-spotlight'` \| `'testimonial'` \| `'social-qr'` | Slide category for styling. |
| title | string | Headline text. |
| subtitle | string | Secondary text. |
| imageUrl | string | Optional background image URL. |
| backgroundColor | string | Optional background color (hex). |

---

### Display Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Thank You Delay | number | `5` | Seconds on thank you screen before returning to idle. |
| High Contrast Mode | boolean | `false` | WCAG AA high contrast colors. |
| Large Text Mode | boolean | `false` | Scale all text by 1.25x. |

---

### Split Payment Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Enable Split Payments | boolean | `true` | Allow splitting bill across multiple cards. |
| Max Splits | number | `4` | Maximum number of ways to split (2-4). |

---

### Advanced Settings

| Action | Description |
|--------|-------------|
| Export Settings | Download current configuration as JSON file. |
| Import Settings | Upload JSON file to restore configuration. |
| Reset to Defaults | Clear all settings and restore factory defaults. |

---

## Configuration Types

```typescript
interface PadConfig {
  // Connection
  salonId: string;
  mqttBrokerUrl: string;
  
  // Payment Flow
  tipEnabled: boolean;
  tipType: 'percentage' | 'dollar';
  tipSuggestions: number[];
  signatureRequired: boolean;
  showReceiptOptions: boolean;
  paymentTimeout: number;
  
  // Display
  thankYouDelay: number;
  highContrastMode: boolean;
  largeTextMode: boolean;
  
  // Split Payments
  splitPaymentEnabled: boolean;
  maxSplits: number;
  
  // Idle Screen / Branding
  logoUrl?: string;
  promoSlides: PromoSlide[];
  slideDuration: number;
  brandColors: { 
    primary: string; 
    secondary: string; 
  };
}

interface PromoSlide {
  id: string;
  type: 'promotion' | 'announcement' | 'staff-spotlight' | 'testimonial' | 'social-qr';
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  backgroundColor?: string;
}
```

---

## Programmatic Access

Settings are managed via Redux:

```typescript
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setConfig, resetConfig, importConfig } from '@/store/slices/configSlice';

// Read config
const config = useAppSelector((state) => state.config.config);

// Update settings
dispatch(setConfig({ tipEnabled: false }));

// Reset to defaults
dispatch(resetConfig());

// Import from JSON
dispatch(importConfig(jsonConfig));
```

---

## Multi-Device Setup

To configure multiple Pads with the same settings:

1. Configure one Pad completely
2. Go to **Settings → Advanced → Export Settings**
3. On each additional Pad, go to **Settings → Advanced → Import Settings**
4. Upload the exported JSON file

This ensures consistent branding, tip settings, and behavior across all devices.

---

## Environment Variables

Mango Pad supports optional environment variables for deployment:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_DEFAULT_SALON_ID` | Pre-configure salon ID | `''` |
| `VITE_DEFAULT_MQTT_URL` | Pre-configure broker URL | `ws://localhost:1883` |
| `VITE_SKIP_SETTINGS_ON_START` | Skip settings if configured | `false` |

Create a `.env` file in the project root:

```env
VITE_DEFAULT_SALON_ID=salon-123
VITE_DEFAULT_MQTT_URL=wss://mqtt.yoursalon.com:8884
```

**Note:** Settings from localStorage take precedence over environment variables.

---

## Defaults

```json
{
  "salonId": "",
  "mqttBrokerUrl": "ws://localhost:1883",
  "tipEnabled": true,
  "tipType": "percentage",
  "tipSuggestions": [18, 20, 25, 30],
  "signatureRequired": true,
  "showReceiptOptions": true,
  "paymentTimeout": 60,
  "thankYouDelay": 5,
  "splitPaymentEnabled": true,
  "maxSplits": 4,
  "promoSlides": [],
  "slideDuration": 8,
  "brandColors": {
    "primary": "#6366F1",
    "secondary": "#818CF8"
  },
  "highContrastMode": false,
  "largeTextMode": false
}
```
