# Template System Documentation

## Overview

The Mango Salon storefront now renders dynamically from **template data**, giving you flexible design and flow control. Admins can switch between different templates to change the homepage layout instantly.

---

## Architecture

### 1. **Type System** (`src/types/template.ts`)

Zod schemas define the structure:

- **SectionKind**: `Hero`, `ServiceGrid`, `ProductGrid`, `MembershipRail`, `PromoBanner`, `CTA`, `Footer`, etc.
- **Section**: `{ id, kind, order, props }`
- **Template**: `{ id, name, description, sections[], flowStyle }`
- **FlowStyle**: `BookingFirst`, `RetailFirst`, `MembershipForward`

### 2. **Seed Templates** (`src/lib/seeds/templates/`)

Three pre-built templates:

- **booking-first.json** - Service booking focused (Hero → Services → Promo → Membership → Footer)
- **retail-first.json** - E-commerce focused (Hero → Products → Promo → CTA → Footer)
- **membership-forward.json** - Membership sign-up focused (Hero → Membership → Services → Products → Footer)

### 3. **Mock API** (`src/lib/api/templates.ts`)

In-memory API simulation using localStorage:

- `fetchTemplatesList()` - Get all available templates
- `fetchPublishedTemplate()` - Get the currently active template
- `publishTemplate(id)` - Set a template as active

**Note**: This is a client-side mock. Can be replaced with real Fastify API later.

### 4. **Client Loader** (`src/lib/template.ts`)

Public API for components:

- `getPublishedTemplate()` - Load active template with fallback
- `getTemplatesList()` - Get available templates
- `publishTemplate(id)` - Admin function to switch templates
- `getCurrentTemplateId()` - Get active template ID

### 5. **Section Renderer** (`src/components/sections/SectionRenderer.tsx`)

Maps section kinds to existing components:

- `Hero` → `PersonalizedHero`
- `ServiceGrid` → `AIRecommendations` (services)
- `ProductGrid` → `AIRecommendations` (products)
- `MembershipRail` → Membership CTA
- `PromoBanner` → Banner component
- `CTA` → Call-to-action block
- `Footer` → `Footer` component

Sections render in ascending `order`. Unknown kinds are skipped with a console warning.

---

## Usage

### Frontend: Load and Render Template

```tsx
import { useTemplate } from '@/hooks/useTemplate';
import { SectionRenderer } from '@/components/sections/SectionRenderer';

function HomePage() {
  const { template, isLoading, error } = useTemplate();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorFallback />;

  return <SectionRenderer sections={template.sections} />;
}
```

### Admin: Switch Active Template

```tsx
import { publishTemplate, getTemplatesList } from '@/lib/template';

async function switchTemplate(templateId: string) {
  const result = await publishTemplate(templateId);
  
  if (result.success) {
    toast.success('Template published!');
    window.location.reload(); // Reload to show new template
  }
}

// Get available templates
const templates = await getTemplatesList();
// [{ id: 'booking-first', name: 'Booking First', flowStyle: 'BookingFirst', ... }]
```

---

## Admin UI Integration

The **Templates** admin page (`/admin/templates`) now includes:

1. **Active Template Selector** - Shows all available templates with radio-style selection
2. **Visual indicator** - Active template shows checkmark and highlighted border
3. **One-click switching** - Click any template to publish it instantly
4. **Automatic reload** - Page reloads after publishing to show the new layout

---

## Adding New Templates

### Step 1: Create JSON file

Create `src/lib/seeds/templates/my-template.json`:

```json
{
  "id": "my-template",
  "name": "My Custom Template",
  "description": "Custom layout for special campaigns",
  "flowStyle": "BookingFirst",
  "sections": [
    {
      "id": "hero-1",
      "kind": "Hero",
      "order": 1,
      "props": {
        "title": "Welcome!",
        "ctaText": "Get Started"
      }
    },
    {
      "id": "services-1",
      "kind": "ServiceGrid",
      "order": 2,
      "props": {
        "limit": 6
      }
    }
  ]
}
```

### Step 2: Register in API

Edit `src/lib/api/templates.ts`:

```ts
import myTemplate from '@/lib/seeds/templates/my-template.json';

const templates: Record<string, Template> = {
  'booking-first': bookingFirstTemplate,
  'retail-first': retailFirstTemplate,
  'membership-forward': membershipForwardTemplate,
  'my-template': myTemplate as Template, // Add here
};
```

### Step 3: Use it

Now it will appear in the admin template selector and can be published.

---

## Adding New Section Types

### Step 1: Add to schema

Edit `src/types/template.ts`:

```ts
export const SectionKindSchema = z.enum([
  'Hero',
  'ServiceGrid',
  // ...existing kinds...
  'Newsletter', // Add new kind
]);
```

### Step 2: Add renderer

Edit `src/components/sections/SectionRenderer.tsx`:

```tsx
function renderSection(section: Section) {
  switch (section.kind) {
    // ...existing cases...
    
    case 'Newsletter':
      return (
        <section key={section.id} className="py-12 px-4">
          <NewsletterSignup {...section.props} />
        </section>
      );
    
    default:
      console.warn('Unknown section kind:', section.kind);
      return null;
  }
}
```

### Step 3: Use in templates

Add to any template JSON:

```json
{
  "id": "newsletter-1",
  "kind": "Newsletter",
  "order": 5,
  "props": {
    "title": "Stay Updated",
    "placeholder": "Enter your email"
  }
}
```

---

## Current Limitations

1. **No drag-and-drop reordering** (yet) - Edit JSON to change section order
2. **No visual preview** in admin - Must visit homepage to see changes
3. **Client-side only** - Uses localStorage instead of real database
4. **No version history** - Can't revert to previous template state
5. **Global templates only** - All pages share the same template system

---

## Future Enhancements

### Phase 2: Page-Specific Templates

Extend to support different templates per page:

```ts
// Load template for specific route
const { template } = useTemplate('/shop');
```

### Phase 3: Real Backend API

Replace mock with Fastify API:

```bash
POST /v1/templates/publish
GET  /v1/templates/list
GET  /v1/templates/:id
```

### Phase 4: Visual Builder

Drag-and-drop section reordering in admin UI with live preview.

### Phase 5: Theme Tokens

Apply template-level theme overrides:

```json
{
  "themeTokens": {
    "colors": {
      "primary": "350 89% 60%"
    },
    "radii": "0.5rem"
  }
}
```

---

## Testing

### Test template switching:

1. Go to `/admin/templates`
2. Click on "Retail First" template
3. Wait for success toast
4. Go to homepage - should see products-first layout
5. Switch to "Membership Forward"
6. Homepage now shows membership-first layout

### Verify fallback behavior:

```js
// In browser console
localStorage.removeItem('mango-published-template-id');
window.location.reload();
// Should load default "booking-first" template
```

---

## Developer Notes

- All existing visuals remain unchanged - sections map to existing components
- Section props are type-safe through Zod validation
- Unknown section kinds log warnings but don't break the page
- Template loading errors fall back to default template
- Current template ID stored in localStorage for persistence

---

## Credits

Built following a mobile-first, data-driven architecture with zero breaking changes to existing components.
