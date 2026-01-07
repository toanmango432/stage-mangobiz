import { z } from 'zod';

// Placement enums (fixed, supported by frontstore)
export const PromotionPlacementSchema = z.enum([
  "hidden",                 // do not render on storefront
  "home_banner",            // large banner under Hero (ATF)
  "home_strip",             // card in the horizontal strip
  "promotions_page_only",   // only visible on /promotions
  "cart_hint"               // (optional) show "Apply offer" hint in cart sheet
]);
export type PromotionPlacement = z.infer<typeof PromotionPlacementSchema>;

export const AnnouncementPlacementSchema = z.enum([
  "hidden",                 // do not render on storefront
  "global_bar",             // AnnouncementBar above header, all pages
  "home_banner",            // banner block on Home
  "updates_page_only"       // only visible on /updates
]);
export type AnnouncementPlacement = z.infer<typeof AnnouncementPlacementSchema>;

// Per-item display configs
export const PromoDisplayConfigSchema = z.object({
  id: z.string(),                        // promotion id
  placement: PromotionPlacementSchema,   // chosen placement
  rank: z.number().default(0),           // local rank among same placement
  limitCountdown: z.boolean().default(true) // show countdown if endsAt exists
});
export type PromoDisplayConfig = z.infer<typeof PromoDisplayConfigSchema>;

export const AnnouncementDisplayConfigSchema = z.object({
  id: z.string(),                         // announcement id
  placement: AnnouncementPlacementSchema, // chosen placement
  pinned: z.boolean().default(false)      // force top on Home if home_banner
});
export type AnnouncementDisplayConfig = z.infer<typeof AnnouncementDisplayConfigSchema>;

// Global marketing display settings
export const MarketingDisplaySettingsSchema = z.object({
  // Master toggles
  enablePromotions: z.boolean().default(true),
  enableAnnouncements: z.boolean().default(true),

  // Global defaults when a promo/announcement has no per-item override
  defaults: z.object({
    promotions: z.object({
      homeBannerEnabled: z.boolean().default(true),
      homeStripEnabled: z.boolean().default(true),
      cartHintEnabled: z.boolean().default(false)
    }),
    announcements: z.object({
      globalBarEnabled: z.boolean().default(true),
      homeBannerEnabled: z.boolean().default(false)
    })
  }),

  // Per-item overrides (optional)
  promotions: z.array(PromoDisplayConfigSchema).default([]),
  announcements: z.array(AnnouncementDisplayConfigSchema).default([])
});
export type MarketingDisplaySettings = z.infer<typeof MarketingDisplaySettingsSchema>;

// Partial update schema for PUT requests
export const MarketingDisplaySettingsPatchSchema = MarketingDisplaySettingsSchema.partial();
export type MarketingDisplaySettingsPatch = z.infer<typeof MarketingDisplaySettingsPatchSchema>;

// Per-promotion placement update schema
export const PromoPlacementUpdateSchema = z.object({
  placement: PromotionPlacementSchema,
  rank: z.number().optional(),
  limitCountdown: z.boolean().optional()
});
export type PromoPlacementUpdate = z.infer<typeof PromoPlacementUpdateSchema>;

// Per-announcement placement update schema
export const AnnouncementPlacementUpdateSchema = z.object({
  placement: AnnouncementPlacementSchema,
  pinned: z.boolean().optional()
});
export type AnnouncementPlacementUpdate = z.infer<typeof AnnouncementPlacementUpdateSchema>;
