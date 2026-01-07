import { z } from 'zod';

// Section kinds
export const SectionKindSchema = z.enum([
  'Hero',
  'ServiceGrid',
  'ProductGrid',
  'MembershipRail',
  'PromoBanner',
  'CTA',
  'Footer',
  'AnnouncementBar',
  'Testimonials',
  'Stats',
  'FAQ',
  'GiftCardShowcase',
  'AboutSalon',
  'TeamGallery',
  'ReviewsShowcase',
  'WorkGallery',
  'LocationHours',
  'SocialFeed',
]);

export type SectionKind = z.infer<typeof SectionKindSchema>;

// Section definition
export const SectionSchema = z.object({
  id: z.string(),
  kind: SectionKindSchema,
  order: z.number(),
  props: z.record(z.unknown()).optional().default({}),
});

export type Section = z.infer<typeof SectionSchema>;

// Flow styles
export const FlowStyleSchema = z.enum([
  'BookingFirst',
  'RetailFirst',
  'MembershipForward',
]);

export type FlowStyle = z.infer<typeof FlowStyleSchema>;

// Template definition
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  themeTokens: z
    .object({
      colors: z.record(z.string()).optional(),
      radii: z.string().optional(),
      font: z.string().optional(),
    })
    .optional(),
  sections: z.array(SectionSchema),
  flowStyle: FlowStyleSchema,
});

export type Template = z.infer<typeof TemplateSchema>;

// Template list item (minimal info)
export const TemplateListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  flowStyle: FlowStyleSchema,
});

export type TemplateListItem = z.infer<typeof TemplateListItemSchema>;
