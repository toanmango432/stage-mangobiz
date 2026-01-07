import { z } from 'zod';
import {
  TenantSchema,
  ServiceSchema,
  ProductSchema,
  MembershipTierSchema,
  GiftCardSchema,
  TeamMemberSchema,
  ReviewSchema,
  GalleryItemSchema,
  PromotionSchema,
  AnnouncementSchema,
} from '@/types/api/schemas';

// Seed file schemas
const TenantSeedSchema = TenantSchema;
const ServicesSeedSchema = z.array(ServiceSchema);
const ProductsSeedSchema = z.array(ProductSchema);
const MembershipsSeedSchema = z.array(MembershipTierSchema);
const GiftCardsSeedSchema = z.array(GiftCardSchema);
const TeamSeedSchema = z.array(TeamMemberSchema);
const ReviewsSeedSchema = z.array(ReviewSchema);
const GallerySeedSchema = z.array(GalleryItemSchema);
const PromotionsSeedSchema = z.array(PromotionSchema);
const AnnouncementsSeedSchema = z.array(AnnouncementSchema);

// AI suggestions schema
const AISuggestionsSchema = z.object({
  chat: z.array(z.string()),
  recommendations: z.array(z.string()),
  copywriting: z.object({
    promotions: z.array(z.string()),
    announcements: z.array(z.string()),
    services: z.array(z.string()),
  }),
});

// Seed file paths and their corresponding schemas
const SEED_FILES = {
  'tenant.json': TenantSeedSchema,
  'services.json': ServicesSeedSchema,
  'products.json': ProductsSeedSchema,
  'memberships.json': MembershipsSeedSchema,
  'gift-cards.json': GiftCardsSeedSchema,
  'team.json': TeamSeedSchema,
  'reviews.json': ReviewsSeedSchema,
  'gallery.json': GallerySeedSchema,
  'promotions.json': PromotionsSeedSchema,
  'announcements.json': AnnouncementsSeedSchema,
  'ai-suggestions.json': AISuggestionsSchema,
} as const;

type SeedFileName = keyof typeof SEED_FILES;

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a single seed file against its schema
 */
async function validateSeedFile(filename: SeedFileName): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
  };

  try {
    // Fetch the seed file
    const response = await fetch(`/seed/${filename}`);
    if (!response.ok) {
      result.success = false;
      result.errors.push(`Failed to load seed file: ${filename}`);
      return result;
    }

    const data = await response.json();
    const schema = SEED_FILES[filename];

    // Validate against schema
    const validationResult = schema.safeParse(data);
    
    if (!validationResult.success) {
      result.success = false;
      result.errors.push(`Validation failed for ${filename}:`);
      validationResult.error.errors.forEach((error) => {
        result.errors.push(`  - ${error.path.join('.')}: ${error.message}`);
      });
    } else {
      // Additional business logic validations
      if (filename === 'services.json') {
        const services = data as any[];
        const duplicateIds = new Set();
        const duplicatePublicIds = new Set();
        
        services.forEach((service, index) => {
          if (duplicateIds.has(service.id)) {
            result.warnings.push(`Duplicate service ID found: ${service.id} at index ${index}`);
          }
          if (duplicatePublicIds.has(service.publicId)) {
            result.warnings.push(`Duplicate service publicId found: ${service.publicId} at index ${index}`);
          }
          duplicateIds.add(service.id);
          duplicatePublicIds.add(service.publicId);
        });
      }

      if (filename === 'products.json') {
        const products = data as any[];
        const duplicateSkus = new Set();
        
        products.forEach((product, index) => {
          if (product.sku && duplicateSkus.has(product.sku)) {
            result.warnings.push(`Duplicate product SKU found: ${product.sku} at index ${index}`);
          }
          if (product.sku) {
            duplicateSkus.add(product.sku);
          }
        });
      }

      if (filename === 'promotions.json') {
        const promotions = data as any[];
        const duplicateCodes = new Set();
        
        promotions.forEach((promotion, index) => {
          if (promotion.code && duplicateCodes.has(promotion.code)) {
            result.warnings.push(`Duplicate promotion code found: ${promotion.code} at index ${index}`);
          }
          if (promotion.code) {
            duplicateCodes.add(promotion.code);
          }
        });
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(`Error validating ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Validates all seed files
 */
export async function validateAllSeedFiles(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
  };

  console.log('🔍 Validating seed files...');

  // Validate each seed file
  for (const filename of Object.keys(SEED_FILES) as SeedFileName[]) {
    const fileResult = await validateSeedFile(filename);
    
    if (!fileResult.success) {
      result.success = false;
      result.errors.push(...fileResult.errors);
    }
    
    result.warnings.push(...fileResult.warnings);
  }

  // Log results
  if (result.success) {
    console.log('✅ All seed files validated successfully');
    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
  } else {
    console.error('❌ Seed file validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
  }

  return result;
}

/**
 * Validates a specific seed file by name
 */
export async function validateSeedFileByName(filename: string): Promise<ValidationResult> {
  if (!(filename in SEED_FILES)) {
    return {
      success: false,
      errors: [`Unknown seed file: ${filename}`],
      warnings: [],
    };
  }

  return validateSeedFile(filename as SeedFileName);
}

/**
 * Gets the list of available seed files
 */
export function getSeedFileNames(): SeedFileName[] {
  return Object.keys(SEED_FILES) as SeedFileName[];
}

/**
 * Validates seed files in development mode
 * Fails fast if validation fails
 */
export async function validateSeedFilesInDevelopment(): Promise<void> {
  if (import.meta.env.DEV) {
    const result = await validateAllSeedFiles();
    if (!result.success) {
      throw new Error(`Seed file validation failed: ${result.errors.join(', ')}`);
    }
  }
}




