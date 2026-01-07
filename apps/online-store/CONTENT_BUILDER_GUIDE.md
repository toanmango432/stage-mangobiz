# Content Builder - Quick Start Guide

## 🎯 Overview

The Content Builder is a drag-and-drop page builder that allows you to create custom storefront pages by combining different section types. No coding required!

**Access:** http://localhost:8080/admin/storefront/content-builder

---

## 🚀 Getting Started

### Step 1: Open the Content Builder
1. Navigate to the admin dashboard
2. Go to **Storefront** → **Content Builder**
3. You'll see two main panels:
   - **Left Panel:** Section management (drag & drop)
   - **Right Panel:** Live preview and editor

### Step 2: Add Your First Section
1. Click the **"Add Section"** button in the left panel
2. A new section will be added (default: Hero)
3. The section appears in both the list and the preview

### Step 3: Customize the Section
1. Click the **Settings** icon (⚙️) on any section
2. The editor panel opens on the right
3. Fill in the section details
4. Click **"Save Changes"** when done

### Step 4: Reorder Sections
1. Click and hold the **drag handle** (⋮⋮) on any section
2. Drag it up or down to reorder
3. Release to drop in the new position
4. Order is automatically saved

### Step 5: Preview Your Design
1. Click the **"Preview"** tab in the right panel
2. Use viewport controls to test responsiveness:
   - 📱 Mobile
   - 📱 Tablet
   - 🖥️ Desktop
3. Click the fullscreen icon for a larger view

### Step 6: Save Your Template
1. Click **"Save Template"** in the top-right corner
2. Your design is saved to localStorage
3. It will reload automatically next time you visit

---

## 📦 Available Section Types

### 1. Hero Section 🎨
**Best for:** Homepage banners, landing pages

**Settings:**
- Headline (main text)
- Subheadline (supporting text)
- Background image URL
- CTA button text and link
- Height (small/medium/large)

**Example Use:**
```
Headline: "Welcome to Mango Salon"
Subheadline: "Experience luxury beauty services"
CTA: "Book Now" → /book
```

---

### 2. Services Grid 💅
**Best for:** Showcasing salon services

**Settings:**
- Section title
- Description
- Number of columns (2-4)
- Number of services to display (1-20)
- Show/hide prices

**Example Use:**
```
Title: "Our Services"
Description: "Professional beauty and wellness services"
Columns: 3
Limit: 6 services
Show Prices: Yes
```

---

### 3. Products Grid 🛍️
**Best for:** E-commerce product listings

**Settings:**
- Section title
- Description
- Number of columns (2-4)
- Number of products (1-20)

**Example Use:**
```
Title: "Shop Products"
Description: "Premium beauty products"
Columns: 4
Limit: 8 products
```

---

### 4. Gallery 📸
**Best for:** Portfolio, before/after photos

**Settings:**
- Section title
- Number of columns (2-5)
- Number of images (1-24)

**Example Use:**
```
Title: "Our Work"
Columns: 4
Limit: 12 images
```

---

### 5. Call to Action (CTA) 📢
**Best for:** Conversion-focused sections

**Settings:**
- Headline
- Description
- Button text and link
- Background color (with color picker)

**Example Use:**
```
Headline: "Ready to transform your look?"
Description: "Book your appointment today"
Button: "Get Started" → /book
Background: #8b5cf6 (purple)
```

---

### 6. Team 👥
**Best for:** Staff showcase, about us page

**Settings:**
- Section title
- Description
- Layout (grid or list)

**Example Use:**
```
Title: "Meet Our Team"
Description: "Our talented professionals"
Layout: Grid
```

---

### 7. Testimonials ⭐
**Best for:** Social proof, customer reviews

**Settings:**
- Section title
- Layout (carousel or grid)
- Number of reviews (1-12)
- Show/hide star ratings

**Example Use:**
```
Title: "What Our Clients Say"
Layout: Carousel
Limit: 6 reviews
Show Ratings: Yes
```

---

## 🎛️ Section Controls

Each section has these controls:

| Icon | Action | Description |
|------|--------|-------------|
| ⋮⋮ | Drag Handle | Click and drag to reorder |
| 👁️ | Toggle Visibility | Show/hide section |
| ⚙️ | Settings | Open editor panel |
| 🗑️ | Delete | Remove section |

---

## 💡 Best Practices

### Page Structure
1. **Start with Hero** - Grab attention with a hero section
2. **Add Services/Products** - Showcase your offerings
3. **Include Social Proof** - Add testimonials
4. **End with CTA** - Drive conversions

### Example Homepage Structure:
```
1. Hero Section (large)
2. Services Grid (3 columns, 6 services)
3. Gallery (4 columns, 12 images)
4. Testimonials (carousel, 6 reviews)
5. CTA Section (purple background)
```

### Design Tips
- **Keep it simple:** 4-6 sections per page is ideal
- **Use contrast:** Alternate light and dark sections
- **Mobile-first:** Always preview on mobile
- **Clear CTAs:** Make buttons stand out
- **Consistent colors:** Use your brand colors

### Performance Tips
- **Optimize images:** Use compressed images
- **Limit sections:** Don't add too many sections
- **Test loading:** Preview on different devices
- **Use lazy loading:** Images load as needed

---

## 🔧 Advanced Features

### Responsive Design
The Content Builder automatically handles responsive design:
- **Mobile:** Single column layout
- **Tablet:** 2-column layout
- **Desktop:** Full grid layout

### Keyboard Shortcuts
- **Ctrl/Cmd + S:** Save template
- **Esc:** Close editor panel
- **Arrow keys:** Navigate sections (when focused)

### Template Management
- **Auto-save:** Changes save automatically to localStorage
- **Manual save:** Click "Save Template" for explicit save
- **Load template:** Automatically loads on page visit

---

## 🐛 Troubleshooting

### Section not appearing in preview?
- Check if the section is enabled (eye icon should be visible)
- Verify the section has required fields filled
- Refresh the preview tab

### Can't drag sections?
- Make sure you're clicking the drag handle (⋮⋮)
- Try clicking and holding for a moment before dragging
- Check if another section is already being dragged

### Changes not saving?
- Look for the "unsaved changes" indicator
- Click "Save Changes" in the editor panel
- Click "Save Template" in the top bar

### Preview looks different from expected?
- Check the viewport setting (mobile/tablet/desktop)
- Verify section settings are correct
- Try toggling fullscreen mode

---

## 📚 Common Use Cases

### 1. Creating a Landing Page
```
Sections:
1. Hero (large, with CTA)
2. Services Grid (3 columns)
3. Testimonials (carousel)
4. CTA (conversion-focused)
```

### 2. Building a Portfolio Page
```
Sections:
1. Hero (medium, with tagline)
2. Gallery (4 columns, 16 images)
3. Team (grid layout)
4. CTA (contact us)
```

### 3. Designing a Product Page
```
Sections:
1. Hero (product showcase)
2. Products Grid (4 columns, 8 products)
3. Testimonials (grid, with ratings)
4. CTA (shop now)
```

### 4. Making an About Page
```
Sections:
1. Hero (company story)
2. Team (list layout)
3. Gallery (our space)
4. CTA (join us)
```

---

## 🎨 Customization Examples

### Hero Section - Homepage
```
Headline: "Transform Your Look Today"
Subheadline: "Expert stylists, premium products, exceptional service"
Image: /images/hero-salon.jpg
CTA Text: "Book Appointment"
CTA Link: /book
Height: Large
```

### Services Grid - Services Page
```
Title: "Our Signature Services"
Description: "From cuts to color, we've got you covered"
Columns: 3
Limit: 9
Show Prices: Yes
```

### CTA Section - Bottom of Page
```
Headline: "Ready for a New Look?"
Description: "Book your appointment today and get 20% off your first visit"
Button Text: "Claim Your Discount"
Button Link: /book?promo=FIRST20
Background Color: #8b5cf6
```

---

## 📊 Section Comparison

| Section | Best For | Complexity | Mobile-Friendly |
|---------|----------|------------|-----------------|
| Hero | Landing pages | Low | ✅ Yes |
| Services Grid | Service listings | Medium | ✅ Yes |
| Products Grid | E-commerce | Medium | ✅ Yes |
| Gallery | Portfolios | Low | ✅ Yes |
| CTA | Conversions | Low | ✅ Yes |
| Team | About pages | Medium | ✅ Yes |
| Testimonials | Social proof | Medium | ✅ Yes |

---

## 🚀 Next Steps

After building your page:

1. **Preview thoroughly** - Test on all viewports
2. **Save your template** - Click "Save Template"
3. **Publish** - Deploy your changes
4. **Monitor analytics** - Track performance in Analytics dashboard
5. **Iterate** - Use A/B testing (coming soon) to optimize

---

## 💬 Need Help?

- **Documentation:** See `BUILD_SUMMARY.md` for technical details
- **Implementation:** See `IMPLEMENTATION_PROGRESS.md` for feature status
- **API Docs:** See `docs/` folder for API specifications

---

**Happy Building! 🎉**

*Last Updated: October 24, 2025*
